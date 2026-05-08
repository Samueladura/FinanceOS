import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, TrendingUp,
  // Category icons
  ShoppingCart, Car, Home, Utensils, Heart, Book, Gamepad2,
  Briefcase, DollarSign, PiggyBank, CreditCard, Smartphone,
  Wifi, Zap, Droplets, Shirt, Baby, GraduationCap, Plane,
  Coffee, Music, Camera, Wrench, Pill, Stethoscope, Dumbbell,
  Palette, Film, Gift, TreePine, Fuel, Building2, Bus } from 'lucide-react';
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

const CATEGORY_ICONS = [
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Shopping' },
  { name: 'Car', icon: Car, label: 'Transportation' },
  { name: 'Home', icon: Home, label: 'Housing' },
  { name: 'Utensils', icon: Utensils, label: 'Food' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'Book', icon: Book, label: 'Education' },
  { name: 'Gamepad2', icon: Gamepad2, label: 'Entertainment' },
  { name: 'Briefcase', icon: Briefcase, label: 'Work' },
  { name: 'DollarSign', icon: DollarSign, label: 'Income' },
  { name: 'PiggyBank', icon: PiggyBank, label: 'Savings' },
  { name: 'CreditCard', icon: CreditCard, label: 'Bills' },
  { name: 'Smartphone', icon: Smartphone, label: 'Phone' },
  { name: 'Wifi', icon: Wifi, label: 'Internet' },
  { name: 'Zap', icon: Zap, label: 'Utilities' },
  { name: 'Droplets', icon: Droplets, label: 'Water' },
  { name: 'Shirt', icon: Shirt, label: 'Clothing' },
  { name: 'Baby', icon: Baby, label: 'Family' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Education' },
  { name: 'Plane', icon: Plane, label: 'Travel' },
  { name: 'Coffee', icon: Coffee, label: 'Beverages' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Camera', icon: Camera, label: 'Photography' },
  { name: 'Wrench', icon: Wrench, label: 'Maintenance' },
  { name: 'Pill', icon: Pill, label: 'Medical' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Healthcare' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'Palette', icon: Palette, label: 'Arts' },
  { name: 'Film', icon: Film, label: 'Movies' },
  { name: 'Gift', icon: Gift, label: 'Gifts' },
  { name: 'TreePine', icon: TreePine, label: 'Nature' },
  { name: 'Fuel', icon: Fuel, label: 'Fuel' },
  { name: 'Building2', icon: Building2, label: 'Business' },
  { name: 'Bus', icon: Bus, label: 'Public Transport' },
];

export function Budget() {
  const { budgets, categories, deleteBudget, getBudgetSpent, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sym = displayCurrencySymbol;

  // Helper function to get icon component
  const getCategoryIcon = (iconName: string) => {
    const iconData = CATEGORY_ICONS.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : ShoppingCart; // Default to ShoppingCart if not found
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Budget Planner</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Monitor and control your monthly spending</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedAccountCurrency}
            onChange={(e) => setSelectedAccountCurrency(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              color: '#0f172a',
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
            <Plus size={16} /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          transition: 'all 0.3s',
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>Total Budgeted</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.03em' }}>{formatCurrency(totalBudgeted, sym)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{budgets.length} active budgets</div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          transition: 'all 0.3s',
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>Total Spent</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: totalSpent > totalBudgeted ? '#f43f5e' : '#f59e0b', letterSpacing: '-0.03em' }}>{formatCurrency(totalSpent, sym)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget used</div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          transition: 'all 0.3s',
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>Remaining</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: totalBudgeted - totalSpent >= 0 ? '#10b981' : '#f43f5e', letterSpacing: '-0.03em' }}>{formatCurrency(Math.max(totalBudgeted - totalSpent, 0), sym)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>Left to spend</div>
        </div>

        <div style={{
          background: overBudgetCount > 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${overBudgetCount > 0 ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 16,
          padding: '20px',
          transition: 'all 0.3s',
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = overBudgetCount > 0 ? '#fca5a5' : '#86efac';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = overBudgetCount > 0 ? '#fecaca' : '#bbf7d0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>Status</div>
          {overBudgetCount > 0 ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f43f5e', letterSpacing: '-0.03em' }}>{overBudgetCount}</div>
              <div style={{ fontSize: 12, color: '#f43f5e', marginTop: 6, fontWeight: 600 }}>Over budget categories</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>{onTrackCount}</div>
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 6, fontWeight: 600 }}>Categories on track</div>
            </>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '24px',
        transition: 'all 0.3s',
      }} onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
      }} onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Overall Budget Usage</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Monthly spending progress</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalSpent > totalBudgeted ? '#f43f5e' : '#0f172a' }}>
            {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div style={{
          height: 10,
          background: '#e2e8f0',
          borderRadius: 100,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
            background: totalSpent > totalBudgeted
              ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
              : totalSpent / totalBudgeted > 0.75
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 100,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
          <span>Spent: {formatCurrency(totalSpent, sym)}</span>
          <span>Budget: {formatCurrency(totalBudgeted, sym)}</span>
        </div>
      </div>

      {/* Budget Cards */}
      {budgetData.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No budgets yet</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
            Create budgets to track your spending limits and stay on top of your finances
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
            }}
          >
            <Plus size={16} /> Create First Budget
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {budgetData.map((b) => {
            const isOver = b.pct >= 100;
            const isWarning = b.pct >= 75 && !isOver;
            return (
              <div key={b.id} style={{
                border: `1px solid ${isOver ? '#fecaca' : isWarning ? '#fcd34d' : '#e2e8f0'}`,
                borderRadius: 12,
                padding: '16px',
                background: '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isOver ? '#fca5a5' : isWarning ? '#f59e0b' : '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isOver ? '#fecaca' : isWarning ? '#fcd34d' : '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>

                {/* Status Indicator */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: isOver
                    ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                    : isWarning
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : `linear-gradient(90deg, ${b.color}, ${b.color})`,
                }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `linear-gradient(135deg, ${b.color}20, ${b.color}10)`,
                      border: `1px solid ${b.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {(() => {
                        const IconComponent = getCategoryIcon(b.cat?.icon || b.icon);
                        return <IconComponent size={18} color={b.color} />;
                      })()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>{b.cat?.name || b.category}</div>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.period}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {b.isOver && <AlertTriangle size={14} color="#f43f5e" />}
                    {!b.isOver && !b.isWarning && <CheckCircle size={14} color="#10b981" />}
                    {b.isWarning && <TrendingUp size={14} color="#f59e0b" />}
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    height: 6,
                    background: '#f1f5f9',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${b.pct}%`,
                      background: isOver
                        ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                        : isWarning
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : `linear-gradient(90deg, ${b.color}, ${b.color}dd)`,
                      borderRadius: 3,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '0 3px 3px 0',
                      }} />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: b.isOver ? '#f43f5e' : '#0f172a', letterSpacing: '-0.02em' }}>{formatCurrency(b.spent, sym)}</div>
                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#64748b', letterSpacing: '-0.02em' }}>{formatCurrency(b.limit, sym)}</div>
                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: isOver ? '#f43f5e' : isWarning ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                    {b.pct.toFixed(1)}% used
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: isOver ? '#f43f5e' : '#10b981', fontWeight: 600 }}>
                      {isOver ? `${formatCurrency(b.spent - b.limit, sym)} over` : `${formatCurrency(b.remaining, sym)} left`}
                    </span>
                    <button
                      onClick={() => handleEdit(b)}
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 6,
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#6366f1',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      style={{
                        background: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.25)',
                        borderRadius: 6,
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#f43f5e',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(244,63,94,0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <BudgetModal open={showModal} onClose={() => { setShowModal(false); setEditBudget(null); }} initial={editBudget} />

      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: 16, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: 32,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Delete Budget?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>This budget will be permanently removed from your tracker.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}