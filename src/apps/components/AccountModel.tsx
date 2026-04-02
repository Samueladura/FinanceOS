import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Account, AccountType } from '../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Account | null;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#a855f7', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
];

const accountTypes: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Checking', icon: '🏦' },
  { value: 'savings', label: 'Savings', icon: '💰' },
  { value: 'credit', label: 'Credit Card', icon: '💳' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export function AccountModal({ open, onClose, initial }: Props) {
  const { settings, addAccount, updateAccount } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState(settings.currency);
  const [color, setColor] = useState(COLORS[0]);
  const [creditLimit, setCreditLimit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setBalance(String(initial.balance));
      setCurrency(initial.currency || settings.currency);
      setColor(initial.color);
      setCreditLimit(initial.creditLimit ? String(initial.creditLimit) : '');
      setIsDefault(initial.isDefault);
    } else {
      setName('');
      setType('checking');
      setBalance('');
      setCurrency(settings.currency);
      setColor(COLORS[0]);
      setCreditLimit('');
      setIsDefault(false);
      setErrors({});
    }
  }, [initial, open, settings.currency]);

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Account name is required';
    if (balance === '' || isNaN(Number(balance))) e.balance = 'Enter a valid balance';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const data: Omit<Account, 'id'> = {
      name: name.trim(), type, balance: Number(balance),
      initialBalance: Number(balance), currency: curr.code, color,
      isDefault, creditLimit: type === 'credit' && creditLimit ? Number(creditLimit) : undefined,
    };
    if (initial) {
      updateAccount({ ...data, id: initial.id, initialBalance: initial.initialBalance });
    } else {
      addAccount(data);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16,
    }}>
      <div style={{
        background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, width: '100%', maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{initial ? 'Edit Account' : 'New Account'}</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Track your financial accounts</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Account Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chase Checking" style={inputStyle} />
            {errors.name && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.name}</span>}
          </div>

          <div>
            <label style={labelStyle}>Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {accountTypes.map(at => (
                <button
                  key={at.value} type="button" onClick={() => setType(at.value)}
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: '1px solid',
                    borderColor: type === at.value ? color : 'rgba(255,255,255,0.08)',
                    background: type === at.value ? `${color}20` : 'rgba(255,255,255,0.03)',
                    color: type === at.value ? color : '#94a3b8', cursor: 'pointer',
                    fontSize: 12, fontWeight: type === at.value ? 600 : 400,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{at.icon}</span>
                  {at.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: type === 'credit' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{type === 'credit' ? 'Current Balance (Owed)' : 'Current Balance'}</label>
              <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" style={inputStyle} />
              {errors.balance && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.balance}</span>}
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
            {type === 'credit' && (
              <div>
                <label style={labelStyle}>Credit Limit</label>
                <input type="number" min="0" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="10000" style={inputStyle} />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid white` : 'none', outlineOffset: 2, transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setIsDefault(!isDefault)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: isDefault ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: isDefault ? 22 : 2 }} />
            </button>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>Set as default account</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} />
              {initial ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}