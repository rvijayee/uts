import { Request, Response } from "express";
import path from "path";
import { query, queryOne } from "../utils/db-utils";
import { scanService } from "../services/scan.service";
import { testRunner } from "../services/vitest-runner.service";
import { testFailureParser } from "../services/test-failure-parser.service";
import { llmRepair } from "../services/llm-repair.service";

export const listScansForProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const scans = await query(
    "SELECT * FROM scan_run WHERE project_id = ? ORDER BY scan_id DESC",
    [projectId]
  );
  res.json(scans);
};

export const createScanForProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { branch = "main" } = req.body;

  const project = await queryOne(
    "SELECT * FROM project WHERE project_id = ?",
    [projectId]
  );
  if (!project) return res.status(404).json({ error: "Project not found" });

  // START SCAN & CLONE REPO
  const scanId = await scanService.startScan(
    Number(projectId),
    project.git_url,
    branch
  );

  // 🔥 FIXED: Compute repoPath
  const repoPath = path.join(process.cwd(), "repos", String(projectId));

  console.log("Running tests in:", repoPath);

  // RUN TESTS
  const initialResults = testRunner.runTests(repoPath);
  const failures = await testFailureParser.extractFailures(initialResults);

  // FIX FAILING TESTS WITH LLM
  for (const failure of failures) {
    console.log("Fixing test:", failure.fullName);
    await llmRepair.fixTest(failure, repoPath);
  }

  // RE-RUN AFTER FIXES
  //const finalResults = testRunner.runTests(repoPath);

  res.json({
    scan_id: scanId,
    repaired_tests: failures.length,
    status: "SUCCESS"
  });
};

export const getScan = async (req: Request, res: Response) => {
  const scan = await queryOne("SELECT * FROM scan_run WHERE scan_id = ?", [
    req.params.scanId
  ]);

  if (!scan) return res.status(404).json({ error: "Scan not found" });
  res.json(scan);
};
