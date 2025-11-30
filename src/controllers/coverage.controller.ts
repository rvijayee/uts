import { Request, Response } from "express";
import { query, queryOne } from "../utils/db-utils";

export const getCoverageForTestRun = async (req: Request, res: Response) => {
  const rows = await query(
    "SELECT * FROM coverage_file WHERE test_run_id = ?",
    [req.params.testRunId]
  );
  res.json(rows);
};

export const getCoverageForFile = async (req: Request, res: Response) => {
  const row = await queryOne(
    "SELECT * FROM coverage_file WHERE file_id = ?",
    [req.params.fileId]
  );
  res.json(row || {});
};

export const getLineCoverageForFile = async (req: Request, res: Response) => {
  const rows = await query(
    "SELECT * FROM coverage_line WHERE cov_file_id IN (SELECT cov_file_id FROM coverage_file WHERE file_id = ?)",
    [req.params.fileId]
  );
  res.json(rows);
};
