import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { BudgetModal } from '../components/BudgetModel';
import type { Budget } from '../types/finance';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'BRL', symbol: 'R$', label: 'BRL (R$)' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN (MX$)' },
];

export function Budget() {
  const { budgets, categories, deleteBudget, getBudgetSpent, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sym = displayCurrencySymbol;

  const budgetData = useMemo(() => budgets.map(b => {
    const cat = categories.find(c => c.id === b.category);
    const spent = getBudgetSpent(b.id);
    const pct = Math.min((spent / b.limit) * 100, 100);
    const remaining = b.limit - spent;
    const isOver = spent > b.limit;
    const isWarning = pct >= 75 && !isOver;
    return { ...b, cat, spent, pct, remaining, isOver, isWarning };
  }), [budgets, categories, getBudgetSpent]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgetData.filter(b => b.isOver).length;
  const onTrackCount = budgetData.filter(b => !b.isOver && !b.isWarning).length;

  const handleEdit = (b: Budget) => { setEditBudget(b); setShowModal(true); };
  const handleDelete = (id: string) => setDeletingId(id);
  const confirmDelete = () => { if (deletingId) { deleteBudget(deletingId); setDeletingId(null); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Budget Planner</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Monitor and control your monthly spending</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedAccountCurrency}
            onChange={(e) => setSelectedAccountCurrency(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#f1f5f9',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {CURRENCY_OPTIONS.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button onClick={() => { setEditBudget(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
            <Plus size={16} /> New Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Budgeted</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', letterSpacing: '-0.5px' }}>{formatCurrency(totalBudgeted, sym)}</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{budgets.length} active budgets</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Spent</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: totalSpent > totalBudgeted ? '#f43f5e' : '#f59e0b', letterSpacing: '-0.5px' }}>{formatCurrency(totalSpent, sym)}</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget used</div>
        </div>
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Remaining</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: totalBudgeted - totalSpent >= 0 ? '#10b981' : '#f43f5e', letterSpacing: '-0.5px' }}>{formatCurrency(Math.max(totalBudgeted - totalSpent, 0), sym)}</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Left to spend</div>
        </div>
        <div style={{ background: overBudgetCount > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${overBudgetCount > 0 ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Status</div>
          {overBudgetCount > 0 ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f43f5e', letterSpacing: '-0.5px' }}>{overBudgetCount}</div>
              <div style={{ fontSize: 12, color: '#f43f5e', marginTop: 4 }}>Over budget categories</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', letterSpacing: '-0.5px' }}>{onTrackCount}</div>
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Categories on track</div>
            </>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Overall Budget Usage</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Monthly spending progress</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalSpent > totalBudgeted ? '#f43f5e' : '#f1f5f9' }}>
            {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%',
            width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
            background: totalSpent > totalBudgeted ? '#f43f5e' : totalSpent / totalBudgeted > 0.75 ? '#f59e0b' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 100, transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
          <span>Spent: {formatCurrency(totalSpent, sym)}</span>
          <span>Budget: {formatCurrency(totalBudgeted, sym)}</span>
        </div>
      </div>

      {/* Budget Cards */}
      {budgetData.length === 0 ? (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No budgets yet</div>
          <div style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>Create budgets to track your spending limits</div>
          <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <Plus size={16} /> Create First Budget
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {budgetData.map(b => (
            <div key={b.id} style={{
              border: `1px solid ${b.isOver ? 'rgba(244,63,94,0.25)' : b.isWarning ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 16, padding: '22px',
              background: b.isOver ? 'linear-gradient(135deg, rgba(244,63,94,0.05), #111827)' : b.isWarning ? 'linear-gradient(135deg, rgba(245,158,11,0.05), #111827)' : '#111827',
            } as React.CSSProperties}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${b.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {b.cat?.icon || b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{b.cat?.name || b.category}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{b.period} budget</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {b.isOver && <AlertTriangle size={16} color="#f43f5e" />}
                  {!b.isOver && !b.isWarning && <CheckCircle size={16} color="#10b981" />}
                  {b.isWarning && <TrendingUp size={16} color="#f59e0b" />}
                </div>
              </div>

              {/* Amounts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Spent</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: b.isOver ? '#f43f5e' : '#f1f5f9', letterSpacing: '-0.3px' }}>{formatCurrency(b.spent, sym)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Budget</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', letterSpacing: '-0.3px' }}>{formatCurrency(b.limit, sym)}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  height: '100%', width: `${b.pct}%`,
                  background: b.isOver ? '#f43f5e' : b.isWarning ? '#f59e0b' : b.color,
                  borderRadius: 100, transition: 'width 0.5s ease',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: b.isOver ? '#f43f5e' : b.isWarning ? '#f59e0b' : '#64748b' }}>
                  {b.pct.toFixed(1)}% used
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: b.isOver ? '#f43f5e' : '#10b981', fontWeight: 500 }}>
                    {b.isOver ? `${formatCurrency(b.spent - b.limit, sym)} over` : `${formatCurrency(b.remaining, sym)} left`}
                  </span>
                  <button onClick={() => handleEdit(b)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 7, padding: '5px', cursor: 'pointer', color: '#818cf8' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 7, padding: '5px', cursor: 'pointer', color: '#f43f5e' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BudgetModal open={showModal} onClose={() => { setShowModal(false); setEditBudget(null); }} initial={editBudget} />

      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Delete Budget?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>This budget will be permanently removed from your tracker.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeletingId(null)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: '#f43f5e', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
