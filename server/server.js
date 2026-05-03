import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import { errorHandler } from './src/middleware/error.js';

import AuthRouter from './src/modules/auth/authRouter.js';
import BuildingsRouter from './src/modules/buildings/buildingsRouter.js';
import LockersRouter from './src/modules/lockers/lockersRouter.js';
import UserRouter from './src/modules/users/usersRouter.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', AuthRouter);
app.use('/api/users', UserRouter);
app.use('/api/lockers', LockersRouter);
app.use('/api/buildings', BuildingsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4173;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
