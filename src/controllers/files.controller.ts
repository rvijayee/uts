import { Request, Response } from "express";
import { query, queryOne } from "../utils/db-utils";

export const listFilesForScan = async (req: Request, res: Response) => {
  const files = await query(
    "SELECT * FROM file WHERE scan_id = ? ORDER BY file_id ASC",
    [req.params.scanId]
  );
  res.json(files);
};

export const getFileDetails = async (req: Request, res: Response) => {
  const fileId = req.params.fileId;

  const file = await queryOne("SELECT * FROM file WHERE file_id = ?", [fileId]);
  if (!file) return res.status(404).json({ error: "File not found" });

  const imports = await query("SELECT * FROM import_record WHERE file_id = ?", [fileId]);
  const exports = await query("SELECT * FROM export_record WHERE file_id = ?", [fileId]);
  const components = await query("SELECT * FROM component WHERE file_id = ?", [fileId]);
  const functions = await query("SELECT * FROM function_record WHERE file_id = ?", [fileId]);
  const hooks = await query("SELECT * FROM hook_usage WHERE file_id = ?", [fileId]);
  const conditions = await query("SELECT * FROM condition_record WHERE file_id = ?", [fileId]);
  const jsx = await query("SELECT * FROM jsx_element WHERE file_id = ?", [fileId]);
  const graphql = await query("SELECT * FROM graphql_operation WHERE file_id = ?", [fileId]);
  const generated_tests = await query("SELECT * FROM generated_test WHERE file_id = ?", [fileId]);

  res.json({
    file,
    imports,
    exports,
    components,
    functions,
    hooks,
    jsx,
    conditions,
    graphql,
    generated_tests
  });
};
