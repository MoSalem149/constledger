import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Side-effect imports — load every model so Mongoose registers their schemas
// before any controller calls .populate() on them. Order matters: referenced
// models (User, UploadJob) must register before the models that ref() them.
import "./models/User.model";
import "./models/UploadJob.model";
import "./models/Contract.model";
import "./models/ContractExtraction.model";

import contractRoutes from "./routes/contractRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { errorHandler, notFound } from "./middleware/errorMiddleware";

const app = express();

// CORS allow-list — localhost for dev, plus FRONTEND_URL in production.
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Security headers + request logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// credentials: true is required so the httpOnly auth cookie issued by
// backend-core actually travels with cross-origin requests.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// 50mb body limit — large enough for base64-encoded PDFs sent through the API.
// Direct uploads use S3 presigned URLs and never hit this limit.
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Liveness probe for Cloud Run / orchestrators
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "cpms-ai" });
});

// Feature routers
app.use("/api/contracts", contractRoutes);
app.use("/api/uploads", uploadRoutes);

// 404 + centralized error handler — must be last
app.use(notFound);
app.use(errorHandler);

export default app;
