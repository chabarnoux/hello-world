'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Sign up</h1>
      <form onSubmit={onSubmit}>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label>Role<select value={role} onChange={(e) => setRole(e.target.value as any)}><option value="rider">Rider</option><option value="driver">Driver</option></select></label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}