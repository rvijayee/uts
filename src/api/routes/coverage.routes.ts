import { Router } from "express";
import { getCoverageForTestRun, getCoverageForFile, getLineCoverageForFile } from "../../controllers/coverage.controller";

const router = Router();

router.get("/runs/:testRunId", getCoverageForTestRun);
router.get("/files/:fileId", getCoverageForFile);
router.get("/files/:fileId/lines", getLineCoverageForFile);

export default router;