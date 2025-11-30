import { Router } from "express";
import { listProjects, createProject, getProject, deleteProject } from "../../controllers/projects.controller";

const router = Router();

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:projectId", getProject);
router.delete("/:projectId", deleteProject);

export default router;