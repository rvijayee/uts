import { Router } from "express";
import projectsRouter from "./projects.routes";
import scansRouter from "./scans.routes";
import filesRouter from "./files.routes";
import componentsRouter from "./components.routes";
import testsRouter from "./tests.routes";
import coverageRouter from "./coverage.routes";
import iterationRouter from "./iteration.routes";
import healthRouter from "./health.routes";

const router = Router();

router.use("/projects", projectsRouter);
router.use("/scans", scansRouter);
router.use("/files", filesRouter);
router.use("/components", componentsRouter);
router.use("/tests", testsRouter);
router.use("/coverage", coverageRouter);
router.use("/iterations", iterationRouter);
router.use("/", healthRouter);

export default router;