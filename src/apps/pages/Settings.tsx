import { useState } from 'react';
import {
  User, Globe, Shield, Download,
  Trash2, Save, Database
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { exportToCSV } from '../utils/formatters';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso' },
];

const DATE_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (EU)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
  { value: 'MMM dd, yyyy', label: 'Jan 01, 2026' },
];


export function Settings() {
  const { settings, updateSettings, transactions, accounts, categories, clearAllData } = useFinance();
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);

  const handleSave = () => {
    const sel = CURRENCIES.find(c => c.code === currency);
    updateSettings({
      userName: userName.trim() || settings.userName,
      userEmail: userEmail.trim() || settings.userEmail,
      currency,
      currencySymbol: sel?.symbol || '$',
      dateFormat,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportAll = () => {
    const data = transactions.map(t => ({
      Date: t.date,
      Type: t.type,
      Description: t.description,
      Category: categories.find(c => c.id === t.category)?.name || t.category,
      Amount: t.amount,
      Account: accounts.find(a => a.id === t.accountId)?.name || t.accountId,
      Recurring: t.recurring ? 'Yes' : 'No',
      Tags: t.tags.join('; '),
      Notes: t.notes || '',
    }));
    exportToCSV(data as Record<string, unknown>[], 'finance-export-all');
  };

  const handleClearData = async () => {
    await clearAllData();
    setClearConfirm(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const cardStyle: React.CSSProperties = {
    background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '24px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4,
  };

  const sectionSubStyle: React.CSSProperties = {
    fontSize: 13, color: '#64748b', marginBottom: 20,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Settings</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Customize your FinanceOS experience</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, boxShadow: `0 4px 15px ${saved ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`,
            transition: 'all 0.3s',
          }}
        >
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Profile */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#818cf8" />
          </div>
          <div>
            <div style={sectionTitleStyle}>Profile</div>
            <div style={{ ...sectionSubStyle, marginBottom: 0 }}>Your personal information</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Avatar Preview */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'white',
          }}>
            {userName.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{userName || 'Your Name'}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{userEmail || 'your@email.com'}</div>
          </div>
        </div>
      </div>

      {/* Currency & Locale */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} color="#10b981" />
          </div>
          <div>
            <div style={sectionTitleStyle}>Currency & Locale</div>
            <div style={{ ...sectionSubStyle, marginBottom: 0 }}>Financial display preferences</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date Format</label>
            <select
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {DATE_FORMATS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="#fbbf24" />
          </div>
          <div>
            <div style={sectionTitleStyle}>Data Overview</div>
            <div style={{ ...sectionSubStyle, marginBottom: 0 }}>Your stored financial data</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Transactions', value: transactions.length, color: '#6366f1' },
            { label: 'Accounts', value: accounts.length, color: '#10b981' },
            { label: 'Categories', value: categories.length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: `${stat.color}10`, border: `1px solid ${stat.color}25`,
              borderRadius: 12, padding: '16px',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="#60a5fa" />
          </div>
          <div>
            <div style={sectionTitleStyle}>Data Management</div>
            <div style={{ ...sectionSubStyle, marginBottom: 0 }}>Export and manage your data</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Export */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={16} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9' }}>Export All Data</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Download all transactions as CSV</div>
              </div>
            </div>
            <button
              onClick={handleExportAll}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 9, color: '#10b981', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Clear All Data */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="#f43f5e" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9' }}>Clear All Data</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Permanently delete all transactions & accounts</div>
              </div>
            </div>
            <button
              onClick={() => setClearConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)',
                borderRadius: 9, color: '#f43f5e', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.2px' }}>Personal Finance Tracker</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Version 2.0.0</div>
          </div>
        </div>
      </div>

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0d1526', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Clear All Data?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: '#f43f5e' }}>all</strong> your transactions, accounts, budgets, and settings. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setClearConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleClearData} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#f43f5e', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
