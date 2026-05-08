import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2,
  RefreshCw, Download, X, Calendar, SlidersHorizontal,
  ShoppingCart, Car, Home, Utensils, Heart, Book, Gamepad2,
  Briefcase, DollarSign as DollarIcon, PiggyBank, CreditCard, Smartphone,
  Wifi, Zap, Droplets, Shirt, Baby, GraduationCap, Plane,
  Coffee, Music, Camera, Wrench, Pill, Stethoscope, Dumbbell,
  Palette, Film, Gift, TreePine, Fuel, Building2, Bus,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModel';
import type { Transaction, TransactionType } from '../types/finance';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const CURRENCY_OPTIONS = [
  { code: 'USD', label: '$ USD', symbol: '$' },
  { code: 'EUR', label: '€ EUR', symbol: '€' },
  { code: 'GBP', label: '£ GBP', symbol: '£' },
  { code: 'NGN', label: '₦ NGN', symbol: '₦' },
  { code: 'JPY', label: '¥ JPY', symbol: '¥' },
  { code: 'CAD', label: 'CA$ CAD', symbol: 'CA$' },
  { code: 'AUD', label: 'A$ AUD', symbol: 'A$' },
  { code: 'INR', label: '₹ INR', symbol: '₹' },
];

const CATEGORY_ICONS = [
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Shopping' },
  { name: 'Car',          icon: Car,          label: 'Transportation' },
  { name: 'Home',         icon: Home,         label: 'Housing' },
  { name: 'Utensils',     icon: Utensils,     label: 'Food' },
  { name: 'Heart',        icon: Heart,        label: 'Health' },
  { name: 'Book',         icon: Book,         label: 'Education' },
  { name: 'Gamepad2',     icon: Gamepad2,     label: 'Entertainment' },
  { name: 'Briefcase',    icon: Briefcase,    label: 'Work' },
  { name: 'DollarIcon',   icon: DollarIcon,   label: 'Income' },
  { name: 'PiggyBank',    icon: PiggyBank,    label: 'Savings' },
  { name: 'CreditCard',   icon: CreditCard,   label: 'Bills' },
  { name: 'Smartphone',   icon: Smartphone,   label: 'Phone' },
  { name: 'Wifi',         icon: Wifi,         label: 'Internet' },
  { name: 'Zap',          icon: Zap,          label: 'Utilities' },
  { name: 'Droplets',     icon: Droplets,     label: 'Water' },
  { name: 'Shirt',        icon: Shirt,        label: 'Clothing' },
  { name: 'Baby',         icon: Baby,         label: 'Family' },
  { name: 'GraduationCap',icon: GraduationCap,label: 'Education' },
  { name: 'Plane',        icon: Plane,        label: 'Travel' },
  { name: 'Coffee',       icon: Coffee,       label: 'Beverages' },
  { name: 'Music',        icon: Music,        label: 'Music' },
  { name: 'Camera',       icon: Camera,       label: 'Photography' },
  { name: 'Wrench',       icon: Wrench,       label: 'Maintenance' },
  { name: 'Pill',         icon: Pill,         label: 'Medical' },
  { name: 'Stethoscope',  icon: Stethoscope,  label: 'Healthcare' },
  { name: 'Dumbbell',     icon: Dumbbell,     label: 'Fitness' },
  { name: 'Palette',      icon: Palette,      label: 'Arts' },
  { name: 'Film',         icon: Film,         label: 'Movies' },
  { name: 'Gift',         icon: Gift,         label: 'Gifts' },
  { name: 'TreePine',     icon: TreePine,     label: 'Nature' },
  { name: 'Fuel',         icon: Fuel,         label: 'Fuel' },
  { name: 'Building2',    icon: Building2,    label: 'Business' },
  { name: 'Bus',          icon: Bus,          label: 'Public Transport' },
];

const typeColors: Record<TransactionType, string> = {
  income:   '#10b981',
  expense:  '#f43f5e',
  transfer: '#6366f1',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCategoryIcon = (iconName: string) => {
  const found = CATEGORY_ICONS.find(i => i.name === iconName);
  return found ? found.icon : ShoppingCart;
};

const inputStyle: React.CSSProperties = {
  background:    '#f8fafc',
  border:        '1px solid #e2e8f0',
  borderRadius:  8,
  color:         '#0f172a',
  fontSize:      13,
  outline:       'none',
  transition:    'all 0.2s',
  padding:       '0 10px',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Transactions() {
  const { transactions, categories, accounts, deleteTransaction, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();

  // ── Filter / sort state ──
  const [search,               setSearch]               = useState('');
  const [typeFilter,           setTypeFilter]           = useState<'all' | TransactionType>('all');
  const [categoryFilter,       setCategoryFilter]       = useState('all');
  const [accountFilter,        setAccountFilter]        = useState('all');
  const [dateFrom,             setDateFrom]             = useState('');
  const [dateTo,               setDateTo]               = useState('');
  const [sortBy,               setSortBy]               = useState<'date' | 'amount'>('date');
  const [sortDir,              setSortDir]              = useState<'asc' | 'desc'>('desc');
  const [showFilters,          setShowFilters]          = useState(false);

  // ── Pagination ──
  const [page, setPage] = useState(1);

  // ── Modal / delete state ──
  const [showModal,  setShowModal]  = useState(false);
  const [editTx,     setEditTx]     = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Currency ──
  const sym = displayCurrencySymbol;

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx => {
        const cat = categories.find(c => c.id === tx.category);
        const acc = accounts.find(a => a.id === tx.accountId);
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
          cat?.name.toLowerCase().includes(q) ||
          acc?.name.toLowerCase().includes(q) ||
          tx.notes?.toLowerCase().includes(q)
        );
      });
    }
    if (typeFilter !== 'all')     list = list.filter(tx => tx.type     === typeFilter);
    if (categoryFilter !== 'all') list = list.filter(tx => tx.category === categoryFilter);
    if (accountFilter  !== 'all') list = list.filter(tx => tx.accountId === accountFilter);
    if (dateFrom) list = list.filter(tx => tx.date >= dateFrom);
    if (dateTo)   list = list.filter(tx => tx.date <= dateTo);

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'amount') return (a.amount - b.amount) * dir;
      return a.date.localeCompare(b.date) * dir;
    });

    return list;
  }, [transactions, search, typeFilter, categoryFilter, accountFilter, dateFrom, dateTo, sortBy, sortDir, categories, accounts]);

  const totalIncome   = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),  [filtered]);
  const totalExpenses = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportToCSV(filtered.map(tx => ({ ...tx })), 'transactions');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Transactions</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{filtered.length} transactions found</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedAccountCurrency}
            onChange={e => setSelectedAccountCurrency(e.target.value)}
            style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 13, cursor: 'pointer', outline: 'none' }}
          >
            {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => { setEditTx(null); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
          >
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Income',   value: totalIncome,                   color: '#10b981', bg: 'rgba(16,185,129,', },
          { label: 'Total Expenses', value: totalExpenses,                  color: '#f43f5e', bg: 'rgba(244,63,94,',  },
          { label: 'Net Balance',    value: totalIncome - totalExpenses,    color: totalIncome - totalExpenses >= 0 ? '#10b981' : '#f43f5e', bg: 'rgba(99,102,241,', },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{ background: `${bg}0.08)`, border: `1px solid ${bg}0.2)`, borderRadius: 16, padding: 20, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = `${bg}0.12)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.background = `${bg}0.08)`; }}
          >
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{formatCurrency(value, sym)}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search input */}
          <div style={{ flex: 1, minWidth: 180, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 10 }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search transactions, categories, accounts, tags, notes..."
              style={{ ...inputStyle, width: '100%', paddingLeft: 34, height: 36 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}
            style={{ ...inputStyle, appearance: 'none', height: 36 }}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, appearance: 'none', height: 36 }}
          >
            <option value="all">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: showFilters ? '#eef2ff' : '#f8fafc', border: `1px solid ${showFilters ? '#c7d2fe' : '#e2e8f0'}`, borderRadius: 8, color: showFilters ? '#6366f1' : '#64748b', cursor: 'pointer', fontSize: 13 }}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#64748b" />
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ ...inputStyle, height: 34, padding: '6px 10px' }} />
              <span style={{ color: '#64748b', fontSize: 13 }}>to</span>
              <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} style={{ ...inputStyle, height: 34, padding: '6px 10px' }} />
            </div>

            <select value={accountFilter} onChange={e => { setAccountFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, appearance: 'none', height: 34 }}>
              <option value="all">All Accounts</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <select
              value={`${sortBy}-${sortDir}`}
              onChange={e => { const [s, d] = e.target.value.split('-'); setSortBy(s as 'date' | 'amount'); setSortDir(d as 'asc' | 'desc'); }}
              style={{ ...inputStyle, appearance: 'none', height: 34 }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            {(dateFrom || dateTo || accountFilter !== 'all') && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setAccountFilter('all'); setPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Transactions Table ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 120px 80px', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', minWidth: 700 }}>
            {['Description', 'Category', 'Account', 'Date', 'Amount', 'Actions'].map((h, i) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i >= 4 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {paged.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No transactions found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
            </div>
          ) : paged.map((tx, idx) => {
            const cat = categories.find((c: any) => c.id === tx.category);
            const acc = accounts.find((a: any)  => a.id === tx.accountId);
            const IconComponent = getCategoryIcon(cat?.icon || 'ShoppingCart');

            return (
              <div
                key={tx.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 120px 80px', gap: 12,
                  padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center', minWidth: 700,
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  transition: 'all 0.2s', cursor: 'pointer',
                  animation: `fadeIn 0.3s ease-out ${idx * 0.03}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc'; }}
              >
                {/* Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cat?.color || '#64748b'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComponent size={18} color={cat?.color || '#64748b'} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      {tx.recurring && (
                        <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <RefreshCw size={9} /> {tx.recurringInterval}
                        </span>
                      )}
                      {tx.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} style={{ fontSize: 10, color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.name || tx.category}</div>

                {/* Account */}
                <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc?.name || 'Unknown'}</div>

                {/* Date */}
                <div style={{ fontSize: 13, color: '#64748b' }}>{formatDate(tx.date)}</div>

                {/* Amount */}
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: typeColors[tx.type as TransactionType] ?? '#64748b' }}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount, sym)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleEdit(tx); }}
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#818cf8', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(tx.id); }}
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#f43f5e', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: page === 1 ? '#94a3b8' : '#0f172a', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>Previous</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid', borderColor: p === page ? '#6366f1' : '#e2e8f0', background: p === page ? 'rgba(99,102,241,0.1)' : '#f8fafc', color: p === page ? '#6366f1' : '#64748b', cursor: 'pointer', fontSize: 13 }}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: page === totalPages ? '#94a3b8' : '#0f172a', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13 }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction Modal ── */}
      <TransactionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTx(null); }}
        initial={editTx}
      />

      {/* ── Delete Confirm Modal ── */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Delete Transaction?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>This action cannot be undone. The transaction will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 8px 25px rgba(244,63,94,0.4)' }}
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