'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function RiderPage() {
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = useState<{ distanceKm: number; fareCents: number } | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', { auth: { token } });
    socket.on('connect', () => {});
    socket.on('ride:accepted', (payload: any) => {
      setStatus('Driver accepted. Trip ' + payload.tripId);
    });
    socketRef.current = socket;
    return () => {
      socket.close();
    };
  }, []);

  async function requestEstimate() {
    if (!pickup || !dropoff) return;
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/rides/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ pickup, dropoff }),
    });
    const data = await res.json();
    setEstimate(data);
  }

  function requestRide() {
    if (!pickup || !dropoff || !socketRef.current) return;
    socketRef.current.emit('ride:request', { pickup, dropoff });
    setStatus('Waiting for driver to accept...');
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Rider</h1>
      <p>Enter coordinates (for demo):</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <div>
          <h3>Pickup</h3>
          <input placeholder="lat" onChange={(e) => setPickup((p) => ({ lat: Number(e.target.value), lng: p?.lng || 0 }))} />
          <input placeholder="lng" onChange={(e) => setPickup((p) => ({ lat: p?.lat || 0, lng: Number(e.target.value) }))} />
        </div>
        <div>
          <h3>Dropoff</h3>
          <input placeholder="lat" onChange={(e) => setDropoff((p) => ({ lat: Number(e.target.value), lng: p?.lng || 0 }))} />
          <input placeholder="lng" onChange={(e) => setDropoff((p) => ({ lat: p?.lat || 0, lng: Number(e.target.value) }))} />
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <button onClick={requestEstimate}>Estimate</button>
        <button onClick={requestRide}>Request ride</button>
      </div>
      {estimate && (
        <p>
          Distance: {estimate.distanceKm.toFixed(2)} km | Fare: ${(estimate.fareCents / 100).toFixed(2)}
        </p>
      )}
      <p>{status}</p>
    </main>
  );
}