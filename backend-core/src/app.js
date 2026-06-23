import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

// CORS whitelist — localhost is always allowed for dev, production origin
// comes from FRONTEND_URL. .filter(Boolean) drops it if the env var is unset.
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Security headers and request logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS with credentials enabled so the httpOnly auth cookie is sent cross-origin
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Global rate limit — 200 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Body and cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Liveness probe for orchestrators / load balancers
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cpms-core' });
});

// Feature routers
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// 404 + centralized error handler must be registered last
app.use(notFound);
app.use(errorHandler);

export default app;
