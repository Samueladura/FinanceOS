import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthName } from '../utils/formatters';

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

export function Analytics() {
  const { transactions, categories, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const sym = displayCurrencySymbol;

  const now = new Date();

  // Monthly data
  const monthlyData = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (period - 1 - i), 1);
      const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      return { month: `${getMonthName(d.getMonth())} '${String(d.getFullYear()).slice(2)}`, income, expenses, net: income - expenses };
    });
  }, [transactions, period]);

  // Net worth over time
  // (netWorthData removed — not used by UI)

  // Category spending (all time in period)
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    const cutoff = new Date(now.getFullYear(), now.getMonth() - period + 1, 1);
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= cutoff)
      .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
    return Object.entries(spending)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || '#94a3b8', icon: cat?.icon || '📦' };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, period]);

  // Income sources
  const incomeSources = useMemo(() => {
    const sources: Record<string, number> = {};
    const cutoff = new Date(now.getFullYear(), now.getMonth() - period + 1, 1);
    transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= cutoff)
      .forEach(t => { sources[t.category] = (sources[t.category] || 0) + t.amount; });
    return Object.entries(sources)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || '#6366f1' };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, period]);

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const avgMonthlyIncome = totalIncome / period;
  const avgMonthlyExpenses = totalExpenses / period;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.name}:</span>
            <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600 }}>{formatCurrency(p.value, sym)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Analytics</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Deep insights into your financial health</p>
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
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 4 }}>
            {([3, 6, 12] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: period === p ? '#6366f1' : 'transparent', color: period === p ? 'white' : '#64748b', transition: 'all 0.2s' }}>
                {p}M
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Income', value: formatCurrency(totalIncome, sym), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)', sub: `Avg ${formatCurrency(avgMonthlyIncome, sym)}/mo` },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses, sym), icon: TrendingDown, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', sub: `Avg ${formatCurrency(avgMonthlyExpenses, sym)}/mo` },
          { label: 'Net Savings', value: formatCurrency(totalIncome - totalExpenses, sym), icon: DollarSign, color: totalIncome > totalExpenses ? '#10b981' : '#f43f5e', bg: totalIncome > totalExpenses ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', sub: 'Total for period' },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, icon: Target, color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#f43f5e', bg: savingsRate >= 20 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', sub: savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good progress' : 'Needs improvement' },
        ].map(card => (
          <div key={card.label} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={18} color={card.color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color, letterSpacing: '-0.5px', marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Income vs Expenses Bar Chart */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Income vs Expenses</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Monthly comparison for the last {period} months</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 16 }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Savings Trend */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Net Savings Trend</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Monthly net gain/loss over time</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="net" name="Net Savings" stroke="#6366f1" strokeWidth={2.5} fill="url(#netGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category & Income Source Charts */}
      <div style={{ display: 'grid', gap: 20 }} className="grid-cols-1 lg:grid-cols-2">
        {/* Spending by Category */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Spending by Category</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Last {period} months</div>
          {categorySpending.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categorySpending.slice(0, 8)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {categorySpending.slice(0, 8).map((_, idx) => (
                      <Cell key={idx} fill={categorySpending[idx].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, sym), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {categorySpending.slice(0, 6).map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{cat.icon} {cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%</span>
                      <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{formatCurrency(cat.value, sym)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>No expense data available</div>
          )}
        </div>

        {/* Income Sources */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Income Sources</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Last {period} months</div>
          {incomeSources.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incomeSources} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {incomeSources.map((_, idx) => (
                      <Cell key={idx} fill={incomeSources[idx].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, sym), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {incomeSources.map((src, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: src.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{src.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{totalIncome > 0 ? ((src.value / totalIncome) * 100).toFixed(1) : 0}%</span>
                      <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{formatCurrency(src.value, sym)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>No income data available</div>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Monthly Breakdown</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Detailed month-by-month analysis</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Month', 'Income', 'Expenses', 'Net Savings', 'Savings Rate'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthlyData].reverse().map((m, i) => {
                const rate = m.income > 0 ? ((m.net / m.income) * 100) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '13px 20px', fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{m.month}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: 14, color: '#10b981', fontWeight: 500 }}>{formatCurrency(m.income, sym)}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: 14, color: '#f43f5e', fontWeight: 500 }}>{formatCurrency(m.expenses, sym)}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: 14, color: m.net >= 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>{formatCurrency(m.net, sym)}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: 14 }}>
                      <span style={{ color: rate >= 20 ? '#10b981' : rate >= 0 ? '#f59e0b' : '#f43f5e', fontWeight: 600 }}>{rate.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
