import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import aiRouter from "./ai/index.js";
import incidentsRouter from "./incidents/index.js";
import venuesRouter from "./venues/index.js";
import dashboardRouter from "./dashboard/index.js";
import conversationsRouter from "./conversations/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(incidentsRouter);
router.use(venuesRouter);
router.use(dashboardRouter);
router.use(conversationsRouter);

export default router;
