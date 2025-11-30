import { Request, Response } from "express";
import { query, queryOne } from "../utils/db-utils";
import { scanService } from "../services/scan.service";

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

  const scanId = await scanService.startScan(
    Number(projectId),
    project.git_url,
    branch
  );

  res.json({ scan_id: scanId, status: "SUCCESS" });
};

export const getScan = async (req: Request, res: Response) => {
  const scan = await queryOne("SELECT * FROM scan_run WHERE scan_id = ?", [
    req.params.scanId
  ]);

  if (!scan) return res.status(404).json({ error: "Scan not found" });
  res.json(scan);
};
