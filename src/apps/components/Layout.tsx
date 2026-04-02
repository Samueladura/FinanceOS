import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Wallet,
  Target, Settings, Menu, X, Bell, TrendingUp, TrendingDown,
  ChevronRight, AlertTriangle, CheckCircle, Info, DollarSign
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { LogOut } from 'lucide-react';
import { formatCurrency, getRelativeTime } from '../utils/formatters';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budget', icon: Target, label: 'Budget' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifIconMap = {
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  info: { icon: Info, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  alert: { icon: DollarSign, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
};

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateNotifications(
  transactions: ReturnType<typeof useFinance>['transactions'],
  accounts: ReturnType<typeof useFinance>['accounts'],
  budgets: ReturnType<typeof useFinance>['budgets'],
  categories: ReturnType<typeof useFinance>['categories'],
  getBudgetSpent: ReturnType<typeof useFinance>['getBudgetSpent'],
  sym: string,
): Notification[] {
  const notifs: Notification[] = [];
  const my = getCurrentMonthYear();

  // Budget alerts
  for (const b of budgets) {
    const spent = getBudgetSpent(b.id);
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const cat = categories.find(c => c.id === b.category);
    const catName = cat?.name || b.category;

    if (pct >= 100) {
      notifs.push({
        id: `budget-over-${b.id}`,
        type: 'alert',
        title: 'Budget Exceeded',
        message: `${catName} has gone ${formatCurrency(spent - b.limit, sym)} over budget.`,
        time: 'This month',
        read: false,
      });
    } else if (pct >= 80) {
      notifs.push({
        id: `budget-warn-${b.id}`,
        type: 'warning',
        title: 'Budget Warning',
        message: `${catName} is at ${pct.toFixed(0)}% of your ${b.period} budget (${formatCurrency(spent, sym)} / ${formatCurrency(b.limit, sym)}).`,
        time: 'This month',
        read: false,
      });
    }
  }

  // Large expense alerts (> $500 in current month)
  const largeExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(my) && t.amount >= 500)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  for (const tx of largeExpenses) {
    notifs.push({
      id: `large-tx-${tx.id}`,
      type: 'info',
      title: 'Large Expense',
      message: `${tx.description} — ${formatCurrency(tx.amount, sym)}`,
      time: getRelativeTime(tx.date),
      read: false,
    });
  }

  // Low balance alerts (credit cards near limit, or accounts below $200)
  for (const acc of accounts) {
    if (acc.type === 'credit' && acc.creditLimit) {
      const util = (Math.abs(acc.balance) / acc.creditLimit) * 100;
      if (util >= 80) {
        notifs.push({
          id: `credit-util-${acc.id}`,
          type: 'warning',
          title: 'High Credit Utilization',
          message: `${acc.name} is at ${util.toFixed(1)}% utilization.`,
          time: 'Now',
          read: false,
        });
      }
    } else if (acc.type !== 'credit' && acc.balance > 0 && acc.balance < 200) {
      notifs.push({
        id: `low-balance-${acc.id}`,
        type: 'alert',
        title: 'Low Balance',
        message: `${acc.name} balance is ${formatCurrency(acc.balance, sym)}.`,
        time: 'Now',
        read: false,
      });
    }
  }

  // Recurring transactions coming up (transactions with recurring=true that have a date in the next 7 days)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().slice(0, 10);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  for (const tx of transactions) {
    if (tx.recurring && tx.date >= todayStr && tx.date <= nextWeekStr) {
      notifs.push({
        id: `recurring-${tx.id}`,
        type: 'info',
        title: 'Upcoming Payment',
        message: `${tx.description} of ${formatCurrency(tx.amount, sym)} is due ${getRelativeTime(tx.date)}.`,
        time: getRelativeTime(tx.date),
        read: false,
      });
    }
  }

  // Positive: good savings rate this month
  const monthIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(my)).reduce((s, t) => s + t.amount, 0);
  if (monthIncome > 0 && monthExpenses > 0) {
    const savingsRate = ((monthIncome - monthExpenses) / monthIncome) * 100;
    if (savingsRate >= 20) {
      notifs.push({
        id: 'savings-rate',
        type: 'success',
        title: 'Great Savings Rate',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income this month. Keep it up!`,
        time: 'This month',
        read: true,
      });
    }
  }

  return notifs;
}

function computePercentChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous <= 0) {
    if (current > 0) return { text: 'New', positive: true };
    return { text: '0%', positive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    positive: pct >= 0,
  };
}

function SidebarContent({ onLinkClick, showLogo = true }: { onLinkClick?: () => void; showLogo?: boolean }) {
  const { getTotalBalance, transactions, settings, logout, displayCurrencySymbol } = useFinance();

  const netWorthChange = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const thisIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);
    const thisExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);
    const lastIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(lastMonthStr)).reduce((s, t) => s + t.amount, 0);
    const lastExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(lastMonthStr)).reduce((s, t) => s + t.amount, 0);
    const thisNet = thisIncome - thisExpenses;
    const lastNet = lastIncome - lastExpenses;

    return computePercentChange(thisNet, lastNet);
  }, [transactions]);

  return (
    <>
      {showLogo && (
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.3px' }}>FinanceOS</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>Personal Finance</div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net Worth</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            {formatCurrency(getTotalBalance(), displayCurrencySymbol)}
          </div>
          <div style={{ fontSize: 11, color: netWorthChange.positive ? '#10b981' : '#f43f5e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {netWorthChange.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {netWorthChange.text} this month
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px 12px', fontWeight: 600 }}>Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onLinkClick}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 3,
              textDecoration: 'none',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive ? '#a5b4fc' : '#94a3b8',
              border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} color={isActive ? '#818cf8' : '#64748b'} />
                <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                {isActive && <ChevronRight size={14} color="#6366f1" style={{ marginLeft: 'auto' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {settings.userName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.userName}</div>
            <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.userEmail}</div>
          </div>
          <button
            onClick={logout}
            style={{
              marginLeft: 'auto',
              background: 'rgba(244,63,94,0.2)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              color: '#f43f5e', fontSize: 12, fontWeight: 500,
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0,
            }}
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { transactions, accounts, budgets, categories, settings, getBudgetSpent, logout, displayCurrencySymbol } = useFinance();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const notifRef = useRef<HTMLDivElement>(null);

  // Generate dynamic notifications from real data
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const generated = generateNotifications(
      transactions, accounts, budgets, categories, getBudgetSpent, displayCurrencySymbol
    );
    // Merge with existing read states
    setNotifications(prev => {
      return generated.map(n => {
        const existing = prev.find(p => p.id === n.id);
        return existing ? { ...n, read: existing.read } : n;
      });
    });
  }, [transactions, accounts, budgets, categories, getBudgetSpent, displayCurrencySymbol]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const pageTitle = navItems.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label ?? 'Finance Tracker';

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e', color: '#f1f5f9', overflow: 'hidden' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar — visible on md+ only */}
      <aside className="hidden md:flex" style={{
        width: 260,
        background: '#0d1526',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 30,
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar — visible below md only, slides in from left */}
      {sidebarOpen && (
        <aside className="flex md:hidden" style={{
          width: 260,
          background: '#0d1526',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
        }}>
          {/* Mobile close header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="white" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>FinanceOS</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          <SidebarContent onLinkClick={() => setSidebarOpen(false)} showLogo={false} />
        </aside>
      )}

      {/* Main Content */}
      <div className="ml-0 md:ml-[260px]" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          background: '#0d1526',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
        }}>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex md:hidden"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', alignItems: 'center', padding: 4 }}
          >
            <Menu size={22} />
          </button>

          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', flex: 1 }}>{pageTitle}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                style={{
                  background: notifOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${notifOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '8px', cursor: 'pointer',
                  color: notifOpen ? '#818cf8' : '#94a3b8',
                  position: 'relative', display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 8, height: 8,
                    background: '#f43f5e', borderRadius: '50%',
                    border: '1.5px solid #0d1526',
                  }} />
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 360, maxHeight: 480,
                  background: '#0d1526',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Bell size={16} color="#818cf8" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: 'white',
                          background: '#f43f5e', borderRadius: 100,
                          padding: '1px 7px', lineHeight: '18px',
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 12, color: '#6366f1', fontWeight: 500,
                          padding: 0,
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                        <div style={{ fontSize: 14, color: '#64748b' }}>No notifications</div>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const meta = notifIconMap[notif.type];
                        const Icon = meta.icon;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markRead(notif.id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                              padding: '14px 20px',
                              background: notif.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              position: 'relative',
                            }}
                          >
                            {!notif.read && (
                              <div style={{
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                              }} />
                            )}
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: meta.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon size={16} color={meta.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: '#f1f5f9', marginBottom: 2 }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                                {notif.message}
                              </div>
                              <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>
                                {notif.time}
                              </div>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); dismissNotif(notif.id); }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#475569', padding: 2, flexShrink: 0,
                                display: 'flex', alignItems: 'center',
                                borderRadius: 4,
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div style={{
                      padding: '12px 20px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'center',
                    }}>
                      <button
                        onClick={() => setNotifications([])}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 12, color: '#475569',
                        }}
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar with dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => setUserMenuOpen(prev => !prev)}
              >
                {settings.userName.slice(0, 2).toUpperCase()}
              </div>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#0d1526',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  minWidth: 160,
                  zIndex: 100,
                }}>
                  <button
                    onClick={logout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', color: '#94a3b8',
                      fontSize: 14, cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={18} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
