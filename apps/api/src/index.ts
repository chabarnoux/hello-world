import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { registerRoutes } from './server';
import { registerSocketHandlers } from './sockets';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

registerRoutes(app);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
});
registerSocketHandlers(io);

const port = Number(process.env.PORT || 4000);
httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});