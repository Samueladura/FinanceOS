import { useState, useEffect } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, FileText, RefreshCw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType } from '../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Transaction | null;
}

const typeColors: Record<TransactionType, string> = {
  income: '#10b981',
  expense: '#f43f5e',
  transfer: '#6366f1',
};

export function TransactionModal({ open, onClose, initial }: Props) {
  const { categories, accounts, addTransaction, updateTransaction, loaded } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<Transaction['recurringInterval']>('monthly');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter(c =>
    type === 'transfer' ? true : c.type === type || c.type === 'both'
  );

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDescription(initial.description);
      setDate(initial.date);
      setAccountId(initial.accountId);
      setToAccountId(initial.toAccountId || '');
      setRecurring(initial.recurring);
      setRecurringInterval(initial.recurringInterval || 'monthly');
      setNotes(initial.notes || '');
      setTags(initial.tags.join(', '));
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
      setToAccountId('');
      setRecurring(false);
      setRecurringInterval('monthly');
      setNotes('');
      setTags('');
      setErrors({});
    }
  }, [initial, open, accounts]);

  if (!open) return null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid amount';
    if (!description.trim()) e.description = 'Description is required';
    if (!category && type !== 'transfer') e.category = 'Select a category';
    if (!accountId) e.accountId = 'Select an account';
    if (type === 'transfer' && !toAccountId) e.toAccountId = 'Select destination account';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data: Omit<Transaction, 'id'> = {
      type, amount: Number(amount), category,
      description: description.trim(), date, accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      recurring, recurringInterval: recurring ? recurringInterval : undefined,
      notes: notes.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (initial) {
      updateTransaction({ ...data, id: initial.id });
    } else {
      addTransaction(data);
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
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      padding: 16,
    }}>
      <div style={{
        background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
              {initial ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {initial ? 'Update transaction details' : 'Add a new transaction to your records'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Type Selector */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 4 }}>
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(''); }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  background: type === t ? typeColors[t] : 'transparent',
                  color: type === t ? 'white' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Amount */}
          <div>
            <label style={labelStyle}>Amount</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: 36, color: typeColors[type] }}
              />
            </div>
            {errors.amount && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.amount}</span>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <div style={{ position: 'relative' }}>
              <FileText size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What was this for?"
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
            {errors.description && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.description}</span>}
          </div>

          {/* Category + Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {type !== 'transfer' && (
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="">Select category</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.category && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.category}</span>}
              </div>
            )}
            <div>
              <label style={labelStyle}>Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
            </div>
          </div>

          {/* Account */}
          <div style={{ display: 'grid', gridTemplateColumns: type === 'transfer' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
              {!loaded ? (
                <div style={{ ...inputStyle, color: '#64748b' }}>Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div style={{ ...inputStyle, color: '#64748b' }}>No accounts found. Create one first.</div>
              ) : (
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
              {errors.accountId && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.accountId}</span>}
            </div>
            {type === 'transfer' && (
              <div>
                <label style={labelStyle}>To Account</label>
                {!loaded ? (
                  <div style={{ ...inputStyle, color: '#64748b' }}>Loading...</div>
                ) : (
                  <select
                    value={toAccountId}
                    onChange={e => setToAccountId(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' as const }}
                  >
                    <option value="">Select account</option>
                    {accounts.filter(a => a.id !== accountId).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
                {errors.toAccountId && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.toAccountId}</span>}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="groceries, work, fun..."
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Recurring */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={16} color="#6366f1" />
                <div>
                  <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>Recurring Transaction</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Repeats automatically</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecurring(!recurring)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: recurring ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  left: recurring ? 22 : 2,
                }} />
              </button>
            </div>
            {recurring && (
              <div style={{ marginTop: 12 }}>
                <select
                  value={recurringInterval}
                  onChange={e => setRecurringInterval(e.target.value as Transaction['recurringInterval'])}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: typeColors[type], color: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Plus size={16} />
              {initial ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}