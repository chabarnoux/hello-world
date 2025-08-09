import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const userRouter = Router();

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

userRouter.get('/me', auth, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, email: true, name: true, role: true } });
  res.json({ user });
});