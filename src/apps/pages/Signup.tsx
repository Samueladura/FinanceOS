import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  defaultCategories, defaultAccounts, defaultBudgets,
  defaultTransactions, defaultSettings
} from '../data/sampleData';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const seedUserData = async (userId: string, userName: string, userEmail: string) => {
    // Insert categories
    await supabase.from('categories').insert(
      defaultCategories.map(c => ({ ...c, user_id: userId }))
    );

    // Insert accounts
    await supabase.from('accounts').insert(
      defaultAccounts.map(a => ({ ...a, user_id: userId, initial_balance: a.initialBalance, is_default: a.isDefault, credit_limit: a.creditLimit ?? null }))
    );

    // Insert transactions
    await supabase.from('transactions').insert(
      defaultTransactions.map(t => ({
        ...t,
        user_id: userId,
        account_id: t.accountId,
        to_account_id: t.toAccountId ?? null,
        recurring_interval: t.recurringInterval ?? null,
      }))
    );

    // Insert budgets
    await supabase.from('budgets').insert(
      defaultBudgets.map(b => ({ ...b, user_id: userId }))
    );

    // Insert settings
    await supabase.from('settings').insert({
      user_id: userId,
      currency: defaultSettings.currency,
      currency_symbol: defaultSettings.currencySymbol,
      locale: defaultSettings.locale,
      theme: defaultSettings.theme,
      date_format: defaultSettings.dateFormat,
      user_name: userName,
      user_email: userEmail,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userName = name || email.split('@')[0];

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: userName,
            email: email,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Seed user data
        await seedUserData(data.user.id, userName, email);

        // Auto sign in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        navigate('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
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
        maxWidth: 480,
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
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#f1f5f9', letterSpacing: '-0.5px' }}>FinanceOS</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Get started today</div>
            </div>
          </div>

          <h1 style={{ 
            margin: 0, marginBottom: 8, 
            fontSize: 32, fontWeight: 800, 
            color: '#f1f5f9', 
            letterSpacing: '-0.5px'
          }}>
            Create account
          </h1>
          <p style={{ 
            margin: 0, marginBottom: 36, 
            color: '#94a3b8', 
            fontSize: 16,
            lineHeight: 1.6
          }}>
            Start tracking your finances with a free account
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

          {/* Name Field */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 13, fontWeight: 600,
              marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <User size={16} />
              Full name
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
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                type="text" 
                style={{ 
                  width: '100%', 
                  padding: '16px 20px 16px 52px', 
                  background: 'transparent', 
                  color: 'white', 
                  border: 'none', 
                  outline: 'none',
                  fontSize: 16
                }} 
                placeholder="John Doe"
              />
              <User size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

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
                minLength={6}
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
              background: loading ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(135deg, #10b981, #34d399)', 
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
                Creating account...
              </>
              ) : (
                'Create account'
              )}
          </button>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          <div style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Already have an account? <Link to="/signin" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Signup;
