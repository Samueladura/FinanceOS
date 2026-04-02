import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2,
  RefreshCw, Download, X, Calendar, SlidersHorizontal
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModel';
import type { Transaction, TransactionType } from '../types/finance';

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

const PAGE_SIZE = 15;

export function Transactions() {
  const { transactions, categories, accounts, deleteTransaction, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  const sym = displayCurrencySymbol;

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search) list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);
    if (accountFilter !== 'all') list = list.filter(t => t.accountId === accountFilter);
    if (dateFrom) list = list.filter(t => t.date >= dateFrom);
    if (dateTo) list = list.filter(t => t.date <= dateTo);
    list.sort((a, b) => {
      if (sortBy === 'date') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDir === 'desc' ? -diff : diff;
      }
      return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
    return list;
  }, [transactions, search, typeFilter, categoryFilter, accountFilter, dateFrom, dateTo, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleEdit = (tx: Transaction) => { setEditTx(tx); setShowModal(true); };
  const handleDelete = (id: string) => { setDeletingId(id); };
  const confirmDelete = () => { if (deletingId) { deleteTransaction(deletingId); setDeletingId(null); } };
  const handleExport = () => {
    const data = filtered.map(t => ({
      Date: t.date, Type: t.type, Description: t.description,
      Category: categories.find(c => c.id === t.category)?.name || t.category,
      Amount: t.amount, Account: accounts.find(a => a.id === t.accountId)?.name || t.accountId,
      Tags: t.tags.join('; '), Notes: t.notes || '',
    }));
    exportToCSV(data as Record<string, unknown>[], 'transactions');
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '9px 14px', color: '#f1f5f9', fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Transactions</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{filtered.length} transactions found</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => { setEditTx(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gap: 14 }} className="grid-cols-1 sm:grid-cols-3">
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Income</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', letterSpacing: '-0.3px' }}>{formatCurrency(totalIncome, sym)}</div>
        </div>
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f43f5e', letterSpacing: '-0.3px' }}>{formatCurrency(totalExpenses, sym)}</div>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Balance</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalIncome - totalExpenses >= 0 ? '#10b981' : '#f43f5e', letterSpacing: '-0.3px' }}>{formatCurrency(totalIncome - totalExpenses, sym)}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search transactions, tags..."
              style={{ ...inputStyle, width: '100%', paddingLeft: 38 }}
            />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={14} /></button>}
          </div>

          {/* Type Filter */}
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }} style={{ ...inputStyle, appearance: 'none' as const }}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Category Filter */}
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, appearance: 'none' as const }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          {/* Toggle More Filters */}
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: showFilters ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showFilters ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: showFilters ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} color="#64748b" />
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={inputStyle} placeholder="From date" />
              <span style={{ color: '#475569', fontSize: 13 }}>to</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={inputStyle} placeholder="To date" />
            </div>
            <select value={accountFilter} onChange={e => { setAccountFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="all">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={`${sortBy}-${sortDir}`} onChange={e => { const [s, d] = e.target.value.split('-'); setSortBy(s as 'date' | 'amount'); setSortDir(d as 'asc' | 'desc'); }} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
            {(dateFrom || dateTo || accountFilter !== 'all') && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setAccountFilter('all'); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, color: '#f43f5e', cursor: 'pointer', fontSize: 13 }}>
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 120px 80px', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', minWidth: 700 }}>
          {['Description', 'Category', 'Account', 'Date', 'Amount', 'Actions'].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 4 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Transactions */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}>No transactions found</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Try adjusting your search or filters</div>
          </div>
        ) : paged.map((tx, idx) => {
          const cat = categories.find(c => c.id === tx.category);
          const acc = accounts.find(a => a.id === tx.accountId);
          return (
            <div key={tx.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 120px 80px', gap: 12,
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              transition: 'background 0.15s', minWidth: 700,
            }}>
              {/* Description */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat?.color || '#64748b'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {cat?.icon || '📦'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {tx.recurring && (
                      <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <RefreshCw size={9} /> {tx.recurringInterval}
                      </span>
                    )}
                    {tx.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ fontSize: 10, color: '#475569', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Category */}
              <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.name || tx.category}</div>
              {/* Account */}
              <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc?.name || 'Unknown'}</div>
              {/* Date */}
              <div style={{ fontSize: 13, color: '#64748b' }}>{formatDate(tx.date)}</div>
              {/* Amount */}
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? '#10b981' : tx.type === 'expense' ? '#f43f5e' : '#6366f1' }}>
                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, sym)}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button onClick={() => handleEdit(tx)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#818cf8' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(tx.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#f43f5e' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? '#334155' : '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>Previous</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid', borderColor: p === page ? '#6366f1' : 'rgba(255,255,255,0.1)', background: p === page ? 'rgba(99,102,241,0.2)' : 'transparent', color: p === page ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', fontSize: 13 }}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages ? '#334155' : '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13 }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal open={showModal} onClose={() => { setShowModal(false); setEditTx(null); }} initial={editTx} />

      {/* Delete Confirm */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Delete Transaction?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>This action cannot be undone. The transaction will be permanently removed.</p>
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
