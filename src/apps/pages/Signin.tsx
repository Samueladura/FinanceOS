import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1e1b4b 50%, #2a1d5c 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite'
    }}>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      
      {/* Floating particles */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 4, height: 4, background: 'rgba(99, 102, 241, 0.6)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '15%',
          width: 6, height: 6, background: 'rgba(139, 92, 246, 0.5)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite 2s'
        }} />
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '25%',
          width: 3, height: 3, background: 'rgba(99, 102, 241, 0.4)',
          borderRadius: '50%',
          animation: 'float 5s ease-in-out infinite 4s'
        }} />
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 440,
        animation: 'slideIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}>
        {/* Glassmorphism card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: 48,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginBottom: 36
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#f1f5f9', letterSpacing: '-0.5px' }}>FinanceOS</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Welcome back</div>
            </div>
          </div>

          <h1 style={{ 
            margin: 0, marginBottom: 8, 
            fontSize: 32, fontWeight: 800, 
            color: '#f1f5f9', 
            letterSpacing: '-0.5px'
          }}>
            Sign in
          </h1>
          <p style={{ 
            margin: 0, marginBottom: 36, 
            color: '#94a3b8', 
            fontSize: 16,
            lineHeight: 1.6
          }}>
            Enter your details to continue to your dashboard
          </p>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: '#f43f5e',
            }}>
              {error}
            </div>
          )}

          {/* Email Field */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 13, fontWeight: 600,
              marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Mail size={16} />
              Email address
            </label>
            <div style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              transition: 'all 0.2s ease',
              overflow: 'hidden'
            }}>
              <input 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                type="email" 
                style={{ 
                  width: '100%', 
                  padding: '16px 20px 16px 52px', 
                  background: 'transparent', 
                  color: 'white', 
                  border: 'none', 
                  outline: 'none',
                  fontSize: 16
                }} 
                placeholder="your@email.com"
              />
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 13, fontWeight: 600,
              marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Lock size={16} />
              Password
            </label>
            <div style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              transition: 'all 0.2s ease',
              overflow: 'hidden'
            }}>
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                type="password" 
                style={{ 
                  width: '100%', 
                  padding: '16px 20px 16px 52px', 
                  background: 'transparent', 
                  color: 'white', 
                  border: 'none', 
                  outline: 'none',
                  fontSize: 16
                }} 
                placeholder="••••••••"
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: 16, 
              background: loading ? 'rgba(99, 102, 241, 0.6)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              color: 'white', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                Signing in...
              </>
              ) : (
                'Sign in'
              )}
          </button>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          <div style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Don't have an account? <Link to="/signup" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Signin;
