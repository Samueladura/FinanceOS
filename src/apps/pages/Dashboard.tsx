import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getRelativeTime, getMonthName } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModel';

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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', JPY: '¥',
  CAD: 'CA$', AUD: 'A$', CHF: 'CHF', INR: '₹', BRL: 'R$', MXN: 'MX$',
};

export function Dashboard() {
  const { transactions, accounts, budgets, categories, settings, getMonthlyIncome, getMonthlyExpenses, getTotalBalance, getBudgetSpent, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [showModal, setShowModal] = useState(false);

  const sym = displayCurrencySymbol;

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const netSavings = monthlyIncome - monthlyExpenses;

  // Previous month for comparison
  const prevMonthStr = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const prevIncome = getMonthlyIncome(prevMonthStr);
  const prevExpenses = getMonthlyExpenses(prevMonthStr);
  const prevNet = prevIncome - prevExpenses;

  const incomeChange = useMemo(() => {
    if (prevIncome <= 0) return { text: monthlyIncome > 0 ? 'New' : '0%', positive: true };
    const pct = ((monthlyIncome - prevIncome) / prevIncome) * 100;
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
  }, [monthlyIncome, prevIncome]);

  const expenseChange = useMemo(() => {
    if (prevExpenses <= 0) return { text: monthlyExpenses > 0 ? 'New' : '0%', positive: false };
    const pct = ((monthlyExpenses - prevExpenses) / prevExpenses) * 100;
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct <= 0 };
  }, [monthlyExpenses, prevExpenses]);

  const netChange = useMemo(() => {
    if (prevNet === 0) return { text: netSavings !== 0 ? 'New' : '0%', positive: netSavings >= 0 };
    const pct = ((netSavings - prevNet) / Math.abs(prevNet)) * 100;
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
  }, [netSavings, prevNet]);

  // Cash flow chart data (last 6 months)
  const cashFlowData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      return { month: getMonthName(d.getMonth()), income, expenses, net: income - expenses };
    });
  }, [transactions]);

  // Category breakdown (current month)
  const categoryData = useMemo(() => {
    const now = new Date();
    const my = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const spending: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(my)).forEach(t => {
      spending[t.category] = (spending[t.category] || 0) + t.amount;
    });
    return Object.entries(spending)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || '#94a3b8', icon: cat?.icon || '📦' };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, categories]);

  // Recent transactions (last 8)
  const recentTransactions = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
    [transactions]
  );

  // Top budgets at risk
  const budgetStatus = useMemo(() => budgets.slice(0, 4).map(b => {
    const spent = getBudgetSpent(b.id);
    const pct = Math.min((spent / b.limit) * 100, 100);
    return { ...b, spent, pct };
  }), [budgets, getBudgetSpent]);

  const statCards = [
    { label: 'Total Balance', value: formatCurrency(totalBalance, sym), icon: Wallet, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', change: 'Total across accounts', positive: true },
    { label: 'Monthly Income', value: formatCurrency(monthlyIncome, sym), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.12)', change: incomeChange.text, positive: incomeChange.positive },
    { label: 'Monthly Expenses', value: formatCurrency(monthlyExpenses, sym), icon: TrendingDown, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', change: expenseChange.text, positive: expenseChange.positive },
    { label: 'Net Savings', value: formatCurrency(netSavings, sym), icon: DollarSign, color: netSavings >= 0 ? '#10b981' : '#f43f5e', bg: netSavings >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', change: netChange.text, positive: netChange.positive },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {settings.userName.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Here's your financial overview for {getMonthName(new Date().getMonth())} {new Date().getFullYear()}</p>
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
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12,
            color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '20px 22px',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 10 }}>{card.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>{card.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {card.positive ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#f43f5e" />}
                  <span style={{ fontSize: 12, color: card.positive ? '#10b981' : '#f43f5e', fontWeight: 500 }}>{card.change}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>vs last month</span>
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gap: 20 }} className="grid-cols-1 xl:grid-cols-[1fr_340px]">
        {/* Cash Flow Chart */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Cash Flow</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Income vs Expenses — Last 6 months</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e' }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cashFlowData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Spending by Category</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>This month's breakdown</div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {categoryData.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{cat.icon} {cat.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 500 }}>{formatCurrency(cat.value, sym)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0', fontSize: 14 }}>No expenses this month</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Transactions + Budget */}
      <div style={{ display: 'grid', gap: 20 }} className="grid-cols-1 xl:grid-cols-[1fr_380px]">
        {/* Recent Transactions */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Recent Transactions</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Your latest activity</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentTransactions.map(tx => {
              const cat = categories.find(c => c.id === tx.category);
              const acc = accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 12, transition: 'background 0.15s',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: `${cat?.color || '#64748b'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {cat?.icon || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: '#475569' }}>{getRelativeTime(tx.date)}</span>
                      <span style={{ fontSize: 10, color: '#334155' }}>·</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{acc?.name || 'Unknown'}</span>
                      {tx.recurring && <RefreshCw size={11} color="#6366f1" />}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? '#10b981' : tx.type === 'expense' ? '#f43f5e' : '#6366f1' }}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, sym)}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{cat?.name || 'Other'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Overview */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Budget Overview</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Monthly spending limits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {budgetStatus.map(b => {
              const cat = categories.find(c => c.id === b.category);
              const isOver = b.pct >= 100;
              const isWarning = b.pct >= 75;
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{cat?.icon || b.icon}</span>
                      <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{cat?.name || b.category}</span>
                    </div>
                    <div style={{ fontSize: 12, color: isOver ? '#f43f5e' : isWarning ? '#f59e0b' : '#94a3b8' }}>
                      {formatCurrency(b.spent, sym)} / {formatCurrency(b.limit, sym)}
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${b.pct}%`,
                      background: isOver ? '#f43f5e' : isWarning ? '#f59e0b' : b.color,
                      borderRadius: 100, transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: isOver ? '#f43f5e' : '#475569', marginTop: 4, textAlign: 'right' }}>
                    {isOver ? `${formatCurrency(b.spent - b.limit, sym)} over budget!` : `${formatCurrency(b.limit - b.spent, sym)} remaining`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accounts Summary */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Accounts</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Your financial accounts</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {accounts.map(acc => {
            const accCurrency = CURRENCY_SYMBOLS[acc.currency as keyof typeof CURRENCY_SYMBOLS] || settings.currencySymbol;
            return (
              <div key={acc.id} style={{
                background: `linear-gradient(135deg, ${acc.color}18, ${acc.color}08)`,
                border: `1px solid ${acc.color}30`, borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{acc.type}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{acc.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: acc.balance < 0 ? '#f43f5e' : acc.color, letterSpacing: '-0.5px' }}>
                  {formatCurrency(acc.balance, accCurrency)}
                </div>
                {acc.creditLimit && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Limit: {formatCurrency(acc.creditLimit, accCurrency)}</div>
                )}
              </div>
              );
            })}
        </div>
      </div>

      <TransactionModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
