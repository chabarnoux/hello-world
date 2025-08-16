'use client';
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function DriverPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', { auth: { token } });
    socket.on('ride:offer', (offer: any) => {
      setOffers((prev) => [offer, ...prev]);
    });
    socketRef.current = socket;
    return () => {
      socket.close();
    };
  }, []);

  function accept(requestId: string) {
    socketRef.current?.emit('ride:accept', { requestId });
    setOffers((prev) => prev.filter((o) => o.requestId !== requestId));
  }

  function sendLocation() {
    const lat = 37 + Math.random();
    const lng = -122 + Math.random();
    socketRef.current?.emit('driver:location', { lat, lng });
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Driver</h1>
      <button onClick={sendLocation}>Send random location</button>
      <h3>Offers</h3>
      <ul>
        {offers.map((o) => (
          <li key={o.requestId}>
            {o.requestId} <button onClick={() => accept(o.requestId)}>Accept</button>
          </li>
        ))}
      </ul>
    </main>
  );
}