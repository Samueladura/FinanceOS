import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { FinanceProvider } from './apps/context/FinanceContext';
import { Layout } from './apps/components/Layout';
import { Dashboard } from './apps/pages/Dashboard';
import { Transactions } from './apps/pages/Transactions';
import { Budget } from './apps/pages/Budget';
import { Analytics } from './apps/pages/Analytics';
import { Accounts } from './apps/pages/Account';
import { Settings } from './apps/pages/Settings';
import { Signin } from './apps/pages/Signin';
import { Signup } from './apps/pages/Signup';

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Page Not Found</div>
      <div style={{ fontSize: 14, color: '#64748b' }}>The page you're looking for doesn't exist.</div>
      <a href="/" style={{ marginTop: 8, padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        Back to Dashboard
      </a>
    </div>
  );
}

function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

function ProtectedLayout() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0f1e',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Navigate to="/signin" replace />;

  const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '';
  const userEmail = session.user.email || '';

  return (
    <FinanceProvider userId={session.user.id} userName={userName} userEmail={userEmail}>
      <Layout />
    </FinanceProvider>
  );
}

export const router = createBrowserRouter([
  { path: '/signin', Component: Signin },
  { path: '/signup', Component: Signup },
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'transactions', Component: Transactions },
      { path: 'budget', Component: Budget },
      { path: 'analytics', Component: Analytics },
      { path: 'accounts', Component: Accounts },
      { path: 'settings', Component: Settings },
      { path: '*', Component: NotFound },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
