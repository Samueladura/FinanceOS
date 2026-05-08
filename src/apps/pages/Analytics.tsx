import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target,
  // Category icons
  ShoppingCart, Car, Home, Utensils, Heart, Book, Gamepad2,
  Briefcase, DollarSign as DollarIcon, PiggyBank, CreditCard, Smartphone,
  Wifi, Zap, Droplets, Shirt, Baby, GraduationCap, Plane,
  Coffee, Music, Camera, Wrench, Pill, Stethoscope, Dumbbell,
  Palette, Film, Gift, TreePine, Fuel, Building2, Bus } from 'lucide-react';
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

const CATEGORY_ICONS = [
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Shopping' },
  { name: 'Car', icon: Car, label: 'Transportation' },
  { name: 'Home', icon: Home, label: 'Housing' },
  { name: 'Utensils', icon: Utensils, label: 'Food' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'Book', icon: Book, label: 'Education' },
  { name: 'Gamepad2', icon: Gamepad2, label: 'Entertainment' },
  { name: 'Briefcase', icon: Briefcase, label: 'Work' },
  { name: 'DollarIcon', icon: DollarIcon, label: 'Income' },
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

const CustomTooltip = ({ active, payload, label, sym }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; sym: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>{formatCurrency(p.value, sym)}</span>
        </div>
      ))}
    </div>
  );
};

export function Analytics() {
  const { transactions, categories, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const sym = displayCurrencySymbol;

  // Helper function to get icon component
  const getCategoryIcon = (iconName: string) => {
    const iconData = CATEGORY_ICONS.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : ShoppingCart; // Default to ShoppingCart if not found
  };

  // Monthly data
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: period }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (period - 1 - i), 1);
      const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
      return { month: `${getMonthName(d.getMonth())} '${String(d.getFullYear()).slice(2)}`, income, expenses, net: income - expenses };
    });
  }, [transactions, period]);

  // Cash flow data (cumulative net over time)
  const cashFlowData = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map(m => {
      cumulative += m.net;
      return { month: m.month, cashFlow: cumulative };
    });
  }, [monthlyData]);

  // Net worth over time
  // (netWorthData removed — not used by UI)

  // Category spending (all time in period)
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - period + 1, 1);
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= cutoff)
      .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
    return Object.entries(spending)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || '#94a3b8', icon: cat?.icon || 'ShoppingCart' };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, period]);

  // Income sources
  const incomeSources = useMemo(() => {
    const sources: Record<string, number> = {};
    const now = new Date();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Analytics</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Deep insights into your financial health</p>
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
          <div style={{ display: 'flex', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, gap: 4 }}>
            {([3, 6, 12] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: period === p ? '#6366f1' : 'transparent', color: period === p ? 'white' : '#64748b', transition: 'all 0.2s' }}>
                {p}M
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Income', value: formatCurrency(totalIncome, sym), icon: TrendingUp, color: '#10b981', bg: '#d1fae5', sub: `Avg ${formatCurrency(avgMonthlyIncome, sym)}/mo` },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses, sym), icon: TrendingDown, color: '#f43f5e', bg: '#fee2e2', sub: `Avg ${formatCurrency(avgMonthlyExpenses, sym)}/mo` },
          { label: 'Net Savings', value: formatCurrency(totalIncome - totalExpenses, sym), icon: DollarSign, color: totalIncome > totalExpenses ? '#10b981' : '#f43f5e', bg: totalIncome > totalExpenses ? '#d1fae5' : '#fee2e2', sub: 'Total for period' },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, icon: Target, color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#f43f5e', bg: savingsRate >= 20 ? '#d1fae5' : savingsRate >= 10 ? '#fef3c7' : '#fee2e2', sub: savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good progress' : 'Needs improvement' },
        ].map((card) => (
          <div key={card.label} style={{ 
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{card.label}</div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={18} color={card.color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, letterSpacing: '-0.02em', marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Income vs Expenses Bar Chart */}
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
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{period}-Month Performance</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${sym}${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip sym={sym} />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 16 }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Flow Over Time */}
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
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Cash Flow Over Time</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Cumulative net savings over {period} months</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cashFlowData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${sym}${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip sym={sym} />} />
            <Line type="monotone" dataKey="cashFlow" name="Cash Flow" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category & Income Sources Charts */}
      <div style={{ display: 'grid', gap: 24 }} className="grid-cols-1 lg:grid-cols-2">
        {/* Spending by Category */}
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
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Spending by Category</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Last {period} months</div>
          {categorySpending.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categorySpending.slice(0, 8)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categorySpending.slice(0, 8).map((_, idx) => (
                      <Cell key={idx} fill={categorySpending[idx].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0f172a' }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, sym), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {categorySpending.slice(0, 6).map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {(() => {
                          const IconComponent = getCategoryIcon(cat.icon);
                          return <IconComponent size={14} />;
                        })()}
                        {cat.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%</span>
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{formatCurrency(cat.value, sym)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No expense data available</div>
          )}
        </div>

        {/* Income Sources */}
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
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Income Sources</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Last {period} months</div>
          {incomeSources.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incomeSources} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {incomeSources.map((_, idx) => (
                      <Cell key={idx} fill={incomeSources[idx].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0f172a' }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, sym), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {incomeSources.map((src, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: src.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>{src.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{totalIncome > 0 ? ((src.value / totalIncome) * 100).toFixed(1) : 0}%</span>
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{formatCurrency(src.value, sym)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No income data available</div>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: 16, 
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>Monthly Breakdown</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Detailed month-by-month analysis</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Month', 'Income', 'Expenses', 'Net Savings', 'Savings Rate'].map(h => (
                  <th key={h} style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: 11,
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthlyData].reverse().map((m, i) => {
                const rate = m.income > 0 ? ((m.net / m.income) * 100) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{m.month}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, color: '#10b981', fontWeight: 600 }}>{formatCurrency(m.income, sym)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, color: '#f43f5e', fontWeight: 600 }}>{formatCurrency(m.expenses, sym)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, color: m.net >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{formatCurrency(m.net, sym)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14 }}>
                      <span style={{ 
                        color: rate >= 20 ? '#10b981' : rate >= 0 ? '#f59e0b' : '#f43f5e', 
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: rate >= 20 ? '#d1fae5' : rate >= 0 ? '#fef3c7' : '#fee2e2',
                        display: 'inline-block',
                        minWidth: 50,
                        textAlign: 'center',
                      }}>{rate.toFixed(1)}%</span>
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
