import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import incidentsRouter from "./incidents";
import venuesRouter from "./venues";
import dashboardRouter from "./dashboard";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(incidentsRouter);
router.use(venuesRouter);
router.use(dashboardRouter);
router.use(conversationsRouter);

export default router;
