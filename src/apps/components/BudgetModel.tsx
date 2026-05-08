import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Budget, BudgetPeriod } from '../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Budget | null;
}

const BUDGET_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#a855f7', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export function BudgetModal({ open, onClose, initial }: Props) {
  const { categories, addBudget, updateBudget } = useFinance();
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [color, setColor] = useState(BUDGET_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  useEffect(() => {
    if (initial) {
      setCategory(initial.category);
      setLimit(String(initial.limit));
      setPeriod(initial.period);
      setColor(initial.color);
    } else {
      setCategory('');
      setLimit('');
      setPeriod('monthly');
      setColor(BUDGET_COLORS[0]);
      setErrors({});
    }
  }, [initial, open]);

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!category) e.category = 'Select a category';
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) e.limit = 'Enter a valid limit';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const cat = categories.find(c => c.id === category);
    const data: Omit<Budget, 'id'> = {
      category,
      limit: Number(limit),
      period,
      color,
      icon: cat?.icon || 'ShoppingCart',
    };
    if (initial) {
      updateBudget({ ...data, id: initial.id });
    } else {
      addBudget(data);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: 10, padding: '10px 14px', color: '#0f172a', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
    backdropFilter: 'blur(10px)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)', padding: 16,
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ 
          padding: '20px 20px 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{initial ? 'Edit Budget' : 'New Budget'}</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Set spending limits per category</p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'rgba(0, 0, 0, 0.05)', 
            border: 'none', 
            borderRadius: 8, 
            padding: 8, 
            cursor: 'pointer', 
            color: '#64748b' 
          }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="">Select category</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.category && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.category}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Budget Limit ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={limit} onChange={e => setLimit(e.target.value)}
                placeholder="500.00" style={inputStyle}
              />
              {errors.limit && <span style={{ fontSize: 12, color: '#f43f5e' }}>{errors.limit}</span>}
            </div>
            <div>
              <label style={labelStyle}>Period</label>
              <select value={period} onChange={e => setPeriod(e.target.value as BudgetPeriod)} style={{ ...inputStyle, appearance: 'none' as const }}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BUDGET_COLORS.map(c => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid #0f172a` : 'none',
                    outlineOffset: 2, transition: 'transform 0.15s',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} />
              {initial ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}