export type UserRole = 'rider' | 'driver' | 'admin';

export interface RideRequestOffer {
  requestId: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}