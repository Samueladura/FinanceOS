import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  defaultCategories, defaultAccounts, defaultBudgets,
  defaultTransactions, defaultSettings
} from '../data/sampleData';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const seedUserData = async (userId: string, userName: string, userEmail: string) => {
    const generateId = () => crypto.randomUUID();
    const accountIdMap = new Map(defaultAccounts.map(a => [a.id, generateId()]));

    // Insert categories
    const { error: categoriesError } = await supabase.from('categories').insert(
      defaultCategories.map(c => ({
        id: generateId(),
        user_id: userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
      }))
    );
    if (categoriesError) throw categoriesError;

    // Insert accounts
    const { error: accountsError } = await supabase.from('accounts').insert(
      defaultAccounts.map(a => ({
        id: accountIdMap.get(a.id),
        user_id: userId,
        name: a.name,
        type: a.type,
        balance: a.balance,
        initial_balance: a.initialBalance,
        currency: a.currency || 'USD',
        color: a.color,
        is_default: a.isDefault,
        credit_limit: a.creditLimit ?? null,
      }))
    );
    if (accountsError) throw accountsError;

    // Insert transactions
    const { error: transactionsError } = await supabase.from('transactions').insert(
      defaultTransactions.map(t => ({
        id: generateId(),
        user_id: userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        account_id: accountIdMap.get(t.accountId),
        to_account_id: t.toAccountId ? accountIdMap.get(t.toAccountId) ?? null : null,
        recurring: t.recurring,
        recurring_interval: t.recurringInterval ?? null,
        tags: t.tags,
        notes: t.notes ?? null,
      }))
    );
    if (transactionsError) throw transactionsError;

    // Insert budgets
    const { error: budgetsError } = await supabase.from('budgets').insert(
      defaultBudgets.map(b => ({
        id: generateId(),
        user_id: userId,
        category: b.category,
        limit: b.limit,
        period: b.period,
        color: b.color,
        icon: b.icon,
      }))
    );
    if (budgetsError) throw budgetsError;

    // Insert settings
    const { error: settingsError } = await supabase.from('settings').insert({
      user_id: userId,
      currency: defaultSettings.currency,
      currency_symbol: defaultSettings.currencySymbol,
      locale: defaultSettings.locale,
      theme: defaultSettings.theme,
      date_format: defaultSettings.dateFormat,
      user_name: userName,
      user_email: userEmail,
    });
    if (settingsError) throw settingsError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userName = name.trim() || email.split('@')[0];

        const signUpPayload = {
          email,
          password,
          options: {
            data: {
              full_name: userName,
            },
          },
        };

        const { data, error: signUpError } = await supabase.auth.signUp(signUpPayload);
        console.log('Supabase signUp response', { data, signUpError, signUpPayload });

        if (signUpError) throw signUpError;
        if (!data.user) {
          setError('Signup request submitted. Please verify your email before signing in.');
          setLoading(false);
          return;
        }

        await seedUserData(data.user.id, userName, email);

        if (data.session) {
          navigate('/');
        } else {
          setError('Signup successful. Please verify your email before signing in.');
        }

        setLoading(false);
        return; // Success, exit the function
      } catch (err: unknown) {
        console.error(`Signup attempt ${attempt} failed:`, err);

        const isRetryable = err instanceof Error && (
          err.name === 'AuthRetryableFetchError' ||
          err.message?.toLowerCase().includes('timeout') ||
          err.message?.toLowerCase().includes('network') ||
          err.message?.toLowerCase().includes('fetch')
        );

        if (!isRetryable || attempt === maxRetries) {
          let message = 'Signup failed. Please try again.';
          if (err instanceof Error) {
            message = err.message || message;
            if (err.name === 'AuthRetryableFetchError' || message.toLowerCase().includes('timeout')) {
              message = 'Signup service is temporarily unavailable. Please try again in a few minutes.';
            }
          }
          setError(message);
          console.error('Signup error after all retries', err);
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying signup in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
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
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 24,
          padding: 48,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
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
              <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a', letterSpacing: '-0.5px' }}>FinanceOS</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Get started today</div>
            </div>
          </div>

          <h1 style={{ 
            margin: 0, marginBottom: 8, 
            fontSize: 32, fontWeight: 800, 
            color: '#0f172a', 
            letterSpacing: '-0.5px'
          }}>
            Create account
          </h1>
          <p style={{
            margin: 0, marginBottom: 36,
            color: '#64748b',
            fontSize: 16,
            lineHeight: 1.6
          }}>
            Create your account to start managing your finances
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
                color: '#64748b', fontSize: 13, fontWeight: 600,
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <User size={16} />
                Full name
              </label>
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 16,
                transition: 'all 0.2s ease',
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
                  color: '#0f172a',
                  border: 'none',
                  outline: 'none',
                  fontSize: 16
                }}
                placeholder="Your full name"
              />
              <User size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

            {/* Email Field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: '#64748b', fontSize: 13, fontWeight: 600,
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <Mail size={16} />
                Email address
              </label>
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
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
                  color: '#0f172a',
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
                color: '#64748b', fontSize: 13, fontWeight: 600,
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <Lock size={16} />
                Password
              </label>
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 16,
                transition: 'all 0.2s ease',
                overflow: 'hidden'
              }}>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                type={showPassword ? "text" : "password"}
                minLength={6}
                style={{
                  width: '100%',
                  padding: '16px 52px 16px 52px',
                  background: 'transparent',
                  color: '#0f172a',
                  border: 'none',
                  outline: 'none',
                  fontSize: 16
                }}
                placeholder="••••••••"
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <div
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
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
