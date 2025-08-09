import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const rideRouter = Router();

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

rideRouter.post('/estimate', auth, async (req, res) => {
  const { pickup, dropoff } = req.body as { pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number } };
  const km = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const fare = Math.max(300, Math.round(100 + km * 120));
  res.json({ distanceKm: km, fareCents: fare });
});

rideRouter.get('/trips', auth, async (req: any, res) => {
  const trips = await prisma.trip.findMany({
    where: { OR: [{ riderId: req.user.userId }, { driverId: req.user.userId }] },
    orderBy: { startedAt: 'desc' },
  });
  res.json({ trips });
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}