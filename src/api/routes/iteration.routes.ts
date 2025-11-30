import { Router } from "express";
import { iterateFileTests, getIterationStatusForFile } from "../../controllers/iteration.controller";

const router = Router();

router.post("/files/:fileId", iterateFileTests);
router.get("/files/:fileId/status", getIterationStatusForFile);

export default router;