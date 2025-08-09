import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const driverRouter = Router();

function auth(req: any, res: any, next: any) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as any;
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

driverRouter.post('/profile', auth, async (req: any, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'forbidden' });
  const { vehicleMake, vehicleModel, vehiclePlate } = req.body as any;
  const profile = await prisma.driverProfile.upsert({
    where: { userId: req.user.userId },
    create: { userId: req.user.userId, vehicleMake, vehicleModel, vehiclePlate },
    update: { vehicleMake, vehicleModel, vehiclePlate },
  });
  res.json({ profile });
});

driverRouter.post('/location', auth, async (req: any, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'forbidden' });
  const { lat, lng } = req.body as any;
  const loc = await prisma.driverLocation.upsert({
    where: { userId: req.user.userId },
    create: { userId: req.user.userId, lat, lng },
    update: { lat, lng },
  });
  res.json({ location: loc });
});