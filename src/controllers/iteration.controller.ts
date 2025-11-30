import { Request, Response } from "express";
import { query } from "../utils/db-utils";

export const iterateFileTests = async (req: Request, res: Response) => {
  res.json({
    message: "Iteration triggered (implement logic)",
    file_id: req.params.fileId
  });
};

export const getIterationStatusForFile = async (req: Request, res: Response) => {
  const rows = await query(
    "SELECT iteration, test_id FROM generated_test WHERE file_id = ? ORDER BY iteration ASC",
    [req.params.fileId]
  );
  res.json(rows);
};
