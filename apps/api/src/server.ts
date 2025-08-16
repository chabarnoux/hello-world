import type { Express } from 'express';
import express from 'express';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { rideRouter } from './routes/rides';
import { driverRouter } from './routes/drivers';

export function registerRoutes(app: Express) {
  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/users', userRouter);
  api.use('/rides', rideRouter);
  api.use('/drivers', driverRouter);

  app.use('/api', api);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
}