/**
 * Express application setup.
 * Registers middleware, CORS, health check, business routes, and global error handlers.
 */
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// ⚠️  Import ALL models here so Mongoose registers their schemas before any
// controller runs populate(). Order matters: referenced models first.
import "./models/User.model";
import "./models/UploadJob.model";
import "./models/Contract.model";
import "./models/ContractExtraction.model";
import "./models/ActualReport.model";
import "./models/PlannedBudget.model";

import contractRoutes from "./routes/contractRoutes";
import financeRoutes from "./routes/financeRoutes";
import reportRoutes from "./routes/reportRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { errorHandler, notFound } from "./middleware/errorMiddleware";

const app = express();

// Allowed CORS origins — reads FRONTEND_URL from env at startup.
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Security & logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "cpms-ai" });
});

// Business routes
app.use("/api/contracts", contractRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/uploads", uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
