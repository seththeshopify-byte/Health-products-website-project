import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import servicesRouter from "./services.js";
import coursesRouter from "./courses.js";
import testimonialsRouter from "./testimonials.js";
import ordersRouter from "./orders.js";
import bookingsRouter from "./bookings.js";
import commissionRouter from "./commission.js";
import usersRouter from "./users.js";
import dashboardRouter from "./dashboard.js";
import shippingZonesRouter from "./shippingZones.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(servicesRouter);
router.use(coursesRouter);
router.use(testimonialsRouter);
router.use(ordersRouter);
router.use(bookingsRouter);
router.use(commissionRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(shippingZonesRouter);

export default router;
