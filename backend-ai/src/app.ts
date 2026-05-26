import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import contractAiRoutes from './routes/contractAiRoutes';
import financeAiRoutes from './routes/financeAiRoutes';
import performanceAiRoutes from './routes/performanceAiRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CORE_SERVICE_URL }));
app.use(express.json({ limit: '50mb' })); // large — contracts can be big

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'cpms-ai' });
});

app.use('/api/ai/contracts', contractAiRoutes);
app.use('/api/ai/finance', financeAiRoutes);
app.use('/api/ai/performance', performanceAiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
