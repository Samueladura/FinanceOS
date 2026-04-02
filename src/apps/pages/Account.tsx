import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, CreditCard, PiggyBank, Briefcase, DollarSign, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AccountModal } from '../components/AccountModel';
import type { Account, AccountType } from '../types/finance';

const accountIcons: Record<AccountType, React.ReactNode> = {
  checking: <Landmark size={22} />,
  savings: <PiggyBank size={22} />,
  credit: <CreditCard size={22} />,
  investment: <TrendingUp size={22} />,
  cash: <DollarSign size={22} />,
  other: <Briefcase size={22} />,
};

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

export function Accounts() {
  const { accounts, transactions, categories, deleteAccount, selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const sym = displayCurrencySymbol;
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return [...transactions]
      .filter(t => t.accountId === selectedAccountId || t.toAccountId === selectedAccountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [transactions, selectedAccountId]);

  const handleEdit = (a: Account) => { setEditAccount(a); setShowModal(true); };
  const handleDelete = (id: string) => setDeletingId(id);
  const confirmDelete = () => { if (deletingId) { deleteAccount(deletingId); setDeletingId(null); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Accounts</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Manage your financial accounts</p>
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
          <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
            <Plus size={16} /> Add Account
          </button>
        </div>
      </div>

      {/* Net Worth Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '28px 32px',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total Net Worth</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px' }}>{formatCurrency(netWorth, sym)}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Across {accounts.length} accounts</div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Total Assets</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', letterSpacing: '-0.3px' }}>{formatCurrency(totalAssets, sym)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Total Liabilities</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f43f5e', letterSpacing: '-0.3px' }}>{formatCurrency(totalLiabilities, sym)}</div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div style={{ display: 'grid', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          const accTxCount = transactions.filter(t => t.accountId === acc.id).length;
          const monthIncome = transactions.filter(t => t.type === 'income' && t.accountId === acc.id && t.date.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)).reduce((s, t) => s + t.amount, 0);
          const monthExpenses = transactions.filter(t => t.type === 'expense' && t.accountId === acc.id && t.date.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)).reduce((s, t) => s + t.amount, 0);

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${acc.color}20, ${acc.color}10)`
                  : `linear-gradient(135deg, ${acc.color}12, ${acc.color}06)`,
                border: `1px solid ${isSelected ? `${acc.color}50` : `${acc.color}25`}`,
                borderRadius: 18, padding: '22px 24px', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 0 2px ${acc.color}30` : 'none',
              }}
            >
              {/* Account Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${acc.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: acc.color }}>
                    {accountIcons[acc.type]}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 1 }}>{acc.type}{acc.isDefault ? ' · Default' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(acc)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#94a3b8' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#f43f5e' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{acc.type === 'credit' ? 'Amount Owed' : 'Current Balance'}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: acc.balance < 0 ? '#f43f5e' : acc.color, letterSpacing: '-0.5px' }}>
                  {formatCurrency(acc.balance, CURRENCY_SYMBOLS[acc.currency as string] || sym)}
                </div>
                {acc.creditLimit && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      <span>Credit utilization</span>
                      <span>{(Math.abs(acc.balance) / acc.creditLimit * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100 }}>
                      <div style={{ height: '100%', width: `${Math.min(Math.abs(acc.balance) / acc.creditLimit * 100, 100)}%`, background: acc.color, borderRadius: 100 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>This Month In</div>
                  <div style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>+{formatCurrency(monthIncome, sym)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Transactions</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>{accTxCount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>This Month Out</div>
                  <div style={{ fontSize: 14, color: '#f43f5e', fontWeight: 600 }}>-{formatCurrency(monthExpenses, sym)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Transactions Panel */}
      {selectedAccount && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{selectedAccount.name} — Recent Transactions</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Last 20 transactions for this account</div>
            </div>
            <button onClick={() => setSelectedAccountId(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
              Close
            </button>
          </div>
          {accountTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: 14 }}>No transactions for this account</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accountTransactions.map(tx => {
                const cat = categories.find(c => c.id === tx.category);
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cat?.color || '#64748b'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {cat?.icon || '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{formatDate(tx.date)} · {cat?.name || 'Other'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? '#10b981' : tx.type === 'expense' ? '#f43f5e' : '#6366f1', flexShrink: 0 }}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, sym)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AccountModal open={showModal} onClose={() => { setShowModal(false); setEditAccount(null); }} initial={editAccount} />

      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Delete Account?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>This will permanently remove the account. Transaction history will remain.</p>
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
