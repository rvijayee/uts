import * as fg from "fast-glob";
import * as path from "path";
import * as fs from "fs";
import { gitService } from "./git.service";
import { query, queryOne } from "../utils/db-utils";
import { astAnalyzer } from "./ast-analyzer.service";
import { computeFileChecksum, computeProjectChecksum } from "../utils/hash-utils";

export class ScanService {
    async startScan(projectId: number, gitUrl: string, branch: string) {

        // 1️⃣ Pull repo
        const repoPath = await gitService.cloneOrUpdate(projectId, gitUrl, branch);

        // 2️⃣ Collect all source files
        const files = await fg(["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"], {
            cwd: repoPath,
            absolute: true
        });

        // 3️⃣ Compute checksum for each file
        const fileChecksums: Record<string, string> = {};

        for (const file of files) {
            fileChecksums[file] = computeFileChecksum(file);
        }

        // 4️⃣ Compute project-level checksum
        const allChecksums = Object.values(fileChecksums);
        const projectChecksum = computeProjectChecksum(allChecksums);

        // 5️⃣ Check if this checksum was scanned before
        const previousScan = await queryOne(
            "SELECT scan_id FROM scan_run WHERE project_id=? AND project_checksum=? LIMIT 1",
            [projectId, projectChecksum]
        );

        if (previousScan) {
            return {
                scan_id: previousScan.scan_id,
                skipped: true,
                reason: "No changes detected in project"
            };
        }

        // 6️⃣ Insert new scan entry
        const scanResult = await query(
            `INSERT INTO scan_run (project_id, commit_hash, project_checksum, started_at, status)
       VALUES (?, 'pending', ?, NOW(), 'RUNNING')`,
            [projectId, projectChecksum]
        );

        const scanId = scanResult.insertId;

        // 7️⃣ Insert or update file entries
        for (const file of files) {
            const rel = path.relative(repoPath, file);
            const ext = path.extname(rel).replace(".", "");
            const language = ["js", "ts", "jsx", "tsx"].includes(ext) ? ext : "js";
            const checksum = fileChecksums[file];

            // Check if file already exists with same checksum
            const existing = await queryOne(
                `SELECT file_id FROM file WHERE project_id=? AND path=? AND checksum=? LIMIT 1`,
                [projectId, rel, checksum]
            );

            let fileId = existing?.file_id;

            if (!fileId) {
                // Insert new record
                const result = await query(
                    `INSERT INTO file (scan_id, project_id, path, language, checksum, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
                    [scanId, projectId, rel, language, checksum]
                );
                fileId = result.insertId;

                // Analyze ONLY NEW OR CHANGED FILES
                await astAnalyzer.analyzeAndSave(fileId, file);
            }
        }

        // 8️⃣ Mark scan as complete
        await query(
            "UPDATE scan_run SET status='SUCCESS', finished_at=NOW() WHERE scan_id=?",
            [scanId]
        );

        return {
            scan_id: scanId,
            skipped: false,
            checksum: projectChecksum
        };
    }
}

export const scanService = new ScanService();
