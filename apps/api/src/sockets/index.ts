import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

interface JwtPayload {
  userId: string;
  role: 'rider' | 'driver' | 'admin';
}

export function registerSocketHandlers(io: Server) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers['x-auth-token'];
      if (!token || typeof token !== 'string') return next(new Error('unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as JwtPayload;
      (socket.data as any).user = payload;
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', async (socket: Socket) => {
    const { userId, role } = (socket.data as any).user as JwtPayload;

    if (role === 'driver') {
      socket.join(`driver:${userId}`);
    } else if (role === 'rider') {
      socket.join(`rider:${userId}`);
    }

    socket.on('driver:location', async (payload: { lat: number; lng: number }) => {
      try {
        await prisma.driverLocation.upsert({
          where: { userId },
          create: { userId, lat: payload.lat, lng: payload.lng, updatedAt: new Date() },
          update: { lat: payload.lat, lng: payload.lng, updatedAt: new Date() },
        });
      } catch (e) {
        console.error('driver:location error', e);
      }
    });

    socket.on('ride:request', async (payload: { pickup: { lat: number; lng: number; address?: string }; dropoff: { lat: number; lng: number; address?: string } }) => {
      try {
        const rideRequest = await prisma.rideRequest.create({
          data: {
            riderId: userId,
            pickupLat: payload.pickup.lat,
            pickupLng: payload.pickup.lng,
            pickupAddress: payload.pickup.address || null,
            dropoffLat: payload.dropoff.lat,
            dropoffLng: payload.dropoff.lng,
            dropoffAddress: payload.dropoff.address || null,
            status: 'PENDING',
          },
        });

        const nearbyDrivers = await prisma.driverLocation.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
        });

        for (const driver of nearbyDrivers) {
          io.to(`driver:${driver.userId}`).emit('ride:offer', {
            requestId: rideRequest.id,
            pickup: { lat: payload.pickup.lat, lng: payload.pickup.lng },
            dropoff: { lat: payload.dropoff.lat, lng: payload.dropoff.lng },
          });
        }
      } catch (e) {
        console.error('ride:request error', e);
      }
    });

    socket.on('ride:accept', async (payload: { requestId: string }) => {
      try {
        const request = await prisma.rideRequest.update({
          where: { id: payload.requestId, status: 'PENDING' },
          data: { status: 'ACCEPTED', driverId: userId },
        });
        const trip = await prisma.trip.create({
          data: {
            riderId: request.riderId,
            driverId: userId,
            pickupLat: request.pickupLat,
            pickupLng: request.pickupLng,
            dropoffLat: request.dropoffLat,
            dropoffLng: request.dropoffLng,
            status: 'DRIVER_ASSIGNED',
          },
        });
        io.to(`rider:${request.riderId}`).emit('ride:accepted', { tripId: trip.id });
      } catch (e) {
        console.error('ride:accept error', e);
      }
    });

    socket.on('trip:update', async (payload: { tripId: string; status: 'ARRIVED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED' }) => {
      try {
        const trip = await prisma.trip.update({
          where: { id: payload.tripId },
          data: { status: payload.status },
        });
        io.to(`rider:${trip.riderId}`).emit('trip:updated', { status: payload.status });
      } catch (e) {
        console.error('trip:update error', e);
      }
    });
  });
}