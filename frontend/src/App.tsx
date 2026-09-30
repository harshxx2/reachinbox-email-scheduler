import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getMe } from './services/api';
import type { User } from './types/email';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((data) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbfbfc]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-ink" /></div>;

  return <><Toaster position="top-right" richColors />{user ? <Dashboard user={user} /> : <Login />}</>;
}
