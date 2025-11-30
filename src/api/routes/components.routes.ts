import { Router } from "express";
import { getComponentDependencies, getComponentDependents, getComponentGraphForProject } from "../../controllers/components.controller";

const router = Router();

router.get("/project/:projectId/graph", getComponentGraphForProject);
router.get("/:componentId/dependencies", getComponentDependencies);
router.get("/:componentId/dependents", getComponentDependents);

export default router;