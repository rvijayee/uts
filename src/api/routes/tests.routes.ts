import { Router } from "express";
import { generateTestsForFile, generateTestsForComponent, runTestsForProject, getTestRun } from "../../controllers/tests.controller";

const router = Router();

router.post("/files/:fileId/generate", generateTestsForFile);
router.post("/components/:componentId/generate", generateTestsForComponent);
router.post("/projects/:projectId/run", runTestsForProject);
router.get("/runs/:testRunId", getTestRun);

export default router;