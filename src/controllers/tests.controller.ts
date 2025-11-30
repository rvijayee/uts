import { Request, Response } from "express";

export const generateTestsForFile = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { engine = "llm", iteration = 1 } = req.body || {};
  res.status(201).json({
    test_id: 1,
    file_id: Number(fileId),
    component_id: null,
    iteration,
    engine,
    status: "generated",
    test_file_path: `tests/${fileId}.test.tsx`
  });
};

export const generateTestsForComponent = async (req: Request, res: Response) => {
  const { componentId } = req.params;
  const { engine = "llm", iteration = 1 } = req.body || {};
  res.status(201).json({
    test_id: 2,
    file_id: 1,
    component_id: Number(componentId),
    iteration,
    engine,
    status: "generated",
    test_file_path: `tests/component-${componentId}.test.tsx`
  });
};

export const runTestsForProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  res.status(201).json({
    test_run_id: 1,
    project_id: Number(projectId),
    status: "RUNNING",
    started_at: new Date().toISOString()
  });
};

export const getTestRun = async (req: Request, res: Response) => {
  const { testRunId } = req.params;
  res.json({
    test_run_id: Number(testRunId),
    project_id: 1,
    scan_id: 1,
    status: "SUCCESS",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    command: "npx vitest --coverage --runInBand"
  });
};