import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
const app: Express = express();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
const PAYSTACK_WEBHOOK_PATH = "/api/orders/webhook";
const STRIPE_WEBHOOK_PATH = "/api/orders/webhook/stripe";
// Raw body is required for webhook signature verification (both Paystack's
// HMAC-SHA512 check and Stripe's HMAC-SHA256 check need the exact raw bytes
// that were signed) and must be mounted before any JSON body parsing.
const RAW_BODY_PATHS = [PAYSTACK_WEBHOOK_PATH, STRIPE_WEBHOOK_PATH];
app.use(PAYSTACK_WEBHOOK_PATH, express.raw({ type: "application/json" }));
app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: "application/json" }));
// IMPORTANT: express.json() and express.urlencoded() below must SKIP both
// webhook paths entirely. app.use() with no path argument runs on every
// request regardless of what earlier path-scoped middleware already did —
// so without this guard, these parsers would run a second time on the
// webhook request, consuming/overwriting the Buffer that express.raw()
// already set on req.body, corrupting it before the route handler runs.
app.use((req, res, next) => {
  if (RAW_BODY_PATHS.includes(req.path)) {
    next();
    return;
  }
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (RAW_BODY_PATHS.includes(req.path)) {
    next();
    return;
  }
  express.urlencoded({ extended: true })(req, res, next);
});
app.use("/api", router);
export default app;
