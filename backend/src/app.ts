import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import casesRouter from './routes/cases';
import authRouter from './routes/auth';
import tpsRouter from './routes/tps';
import alertsRouter from './routes/alerts';
import stokRouter from './routes/stok';
import aiRouter from './routes/ai';
import logisticRouter from './routes/logistic';
import adminRouter from './routes/admin.ts';

dotenv.config();

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/tps', tpsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/stok', stokRouter);
app.use('/api/ai', aiRouter);
app.use('/api/logistic', logisticRouter);
app.use('/api/admin', adminRouter);

export default app;
