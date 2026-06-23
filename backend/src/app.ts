import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import casesRouter from './routes/cases';

dotenv.config();

const app = express();

// Configure CORS to allow origin of frontend client
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register cases aggregation router
app.use('/api/cases', casesRouter);

export default app;

