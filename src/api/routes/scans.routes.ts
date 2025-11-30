import { Router } from "express";
import {
    listScansForProject,
    createScanForProject,
    getScan
} from "../../controllers/scans.controller";

const router = Router();

router.get("/project/:projectId", listScansForProject);
router.post("/project/:projectId", createScanForProject);
router.get("/:scanId", getScan);

export default router;
