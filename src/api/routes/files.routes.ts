import { Router } from "express";
import { listFilesForScan, getFileDetails } from "../../controllers/files.controller";

const router = Router();

router.get("/scan/:scanId", listFilesForScan);
router.get("/:fileId", getFileDetails);

export default router;