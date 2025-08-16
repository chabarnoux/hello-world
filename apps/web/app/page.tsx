import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Ride App</h1>
      <p>Choose your role:</p>
      <ul>
        <li><Link href="/auth/login">Login</Link></li>
        <li><Link href="/auth/signup">Sign up</Link></li>
        <li><Link href="/rider">Rider Dashboard</Link></li>
        <li><Link href="/driver">Driver Dashboard</Link></li>
      </ul>
    </main>
  );
}