import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
// Required so req.ip reflects the real client IP behind Replit's reverse proxy.
// Without this, req.ip is the proxy IP and rate-limiting is useless.
app.set("trust proxy", 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
// helmet sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// Referrer-Policy, X-DNS-Prefetch-Control, and more in one call.
app.use((helmet as any)());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to the known frontend origin. Falls back to the dev domain env var.
// Using wildcard (*) would allow any website to read incident and AI response data.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? process.env.REPLIT_DEV_DOMAIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (origin is undefined for server-to-server / curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.some((o) => origin.includes(o))) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not permitted`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Hard cap at 16 KB. AI query fields (chat, translation, incidents) are text-only
// and should never need more. Without this, a malicious client can send a 100 KB
// body on every AI request, burning Gemini quota and slowing the server.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ─── Root & Favicon Handlers ──────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "StadiumAI API Server" });
});
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});
app.get("/favicon.png", (_req, res) => {
  res.status(204).end();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any unhandled errors thrown from route handlers.
// Returns a generic 500 so internal stack traces are never sent to clients.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err: err.message, stack: err.stack }, "Unhandled request error");
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
});

export default app;
