import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Transaction, Account, Budget, Category, AppSettings } from '../types/finance';
import { defaultCategories, defaultAccounts, defaultBudgets, defaultTransactions, defaultSettings } from '../data/sampleData';
import { supabase } from '../../lib/supabase';
import { generateId } from '../utils/formatters';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', JPY: '¥',
  CAD: 'CA$', AUD: 'A$', CHF: 'CHF', INR: '₹', BRL: 'R$', MXN: 'MX$',
};

interface FinanceContextType {
  loaded: boolean;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  categories: Category[];
  settings: AppSettings;
  selectedAccountCurrency: string;
  setSelectedAccountCurrency: (currency: string) => void;
  displayCurrencySymbol: string;

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;

  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;

  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;

  updateSettings: (s: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  logout: () => void;

  getTotalBalance: () => number;
  getMonthlyIncome: (monthYear?: string) => number;
  getMonthlyExpenses: (monthYear?: string) => number;
  getCategorySpending: (monthYear?: string) => Record<string, number>;
  getBudgetSpent: (budgetId: string) => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

// --- DB <-> TypeScript mapping helpers ---

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as Transaction['type'],
    amount: Number(row.amount),
    category: row.category as string,
    description: row.description as string,
    date: row.date as string,
    accountId: row.account_id as string,
    toAccountId: (row.to_account_id as string) || undefined,
    recurring: row.recurring as boolean,
    recurringInterval: (row.recurring_interval as Transaction['recurringInterval']) || undefined,
    tags: (row.tags as string[]) || [],
    notes: (row.notes as string) || undefined,
  };
}

function transactionToRow(t: Transaction | Omit<Transaction, 'id'>, userId: string) {
  return {
    ...(('id' in t) ? { id: t.id } : {}),
    user_id: userId,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
    account_id: t.accountId,
    to_account_id: t.toAccountId ?? null,
    recurring: t.recurring,
    recurring_interval: t.recurringInterval ?? null,
    tags: t.tags,
    notes: t.notes ?? null,
  };
}

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Account['type'],
    balance: Number(row.balance),
    initialBalance: Number(row.initial_balance),
    currency: row.currency as string,
    color: row.color as string,
    isDefault: row.is_default as boolean,
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : undefined,
  };
}

function accountToRow(a: Account | Omit<Account, 'id'>, userId: string) {
  return {
    ...(('id' in a) ? { id: a.id } : {}),
    user_id: userId,
    name: a.name,
    type: a.type,
    balance: a.balance,
    initial_balance: a.initialBalance,
    currency: a.currency,
    color: a.color,
    is_default: a.isDefault,
    credit_limit: a.creditLimit ?? null,
  };
}

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    category: row.category as string,
    limit: Number(row.limit),
    period: row.period as Budget['period'],
    color: row.color as string,
    icon: row.icon as string,
  };
}

function budgetToRow(b: Budget | Omit<Budget, 'id'>, userId: string) {
  return {
    ...(('id' in b) ? { id: b.id } : {}),
    user_id: userId,
    category: b.category,
    limit: b.limit,
    period: b.period,
    color: b.color,
    icon: b.icon,
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    type: row.type as Category['type'],
  };
}

function categoryToRow(c: Category | Omit<Category, 'id'>, userId: string) {
  return {
    ...(('id' in c) ? { id: c.id } : {}),
    user_id: userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
  };
}

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    currency: row.currency as string,
    currencySymbol: row.currency_symbol as string,
    locale: row.locale as string,
    theme: row.theme as AppSettings['theme'],
    dateFormat: row.date_format as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
  };
}

export function FinanceProvider({ children, userId, userName, userEmail }: { children: React.ReactNode; userId: string; userName: string; userEmail: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [settings, setSettings] = useState<AppSettings>({ ...defaultSettings, userName, userEmail });
  const [loaded, setLoaded] = useState(false);
  const [selectedAccountCurrency, setSelectedAccountCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedAccountCurrency');
      return saved || '';
    }
    return '';
  });

  const displayCurrencySymbol = CURRENCY_SYMBOLS[selectedAccountCurrency as keyof typeof CURRENCY_SYMBOLS] || settings.currencySymbol;

  const setSelectedAccountCurrency = useCallback((currency: string) => {
    setSelectedAccountCurrencyState(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAccountCurrency', currency);
    }
  }, []);

  const navigate = useNavigate();

  // Load all data from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [catRes, accRes, txRes, budRes, setRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('settings').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (cancelled) return;

      if (catRes.data?.length) setCategories(catRes.data.map(rowToCategory));
      if (accRes.data?.length) setAccounts(accRes.data.map(rowToAccount));
      if (txRes.data?.length) setTransactions(txRes.data.map(rowToTransaction));
      if (budRes.data?.length) setBudgets(budRes.data.map(rowToBudget));
      if (setRes.data) {
        setSettings(rowToSettings(setRes.data));
        setSelectedAccountCurrencyState(rowToSettings(setRes.data).currency);
      } else {
        // No settings yet - use Supabase auth metadata
        setSettings(prev => ({
          ...prev,
          userName: userName || prev.userName,
          userEmail: userEmail || prev.userEmail,
        }));
      }

      setLoaded(true);
    }

    loadData();
    return () => { cancelled = true; };
  }, [userId]);

  // Apply theme
  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme, loaded]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!t.accountId) {
      console.error('No accountId provided for transaction', t);
      return;
    }
    
    console.log('Adding transaction:', t.type, t.amount, 'to account:', t.accountId);
    
    const id = generateId();
    const newT = { ...t, id };
    setTransactions(prev => [newT, ...prev]);

    setAccounts(prevAccounts => {
      console.log('Current accounts:', prevAccounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })));
      return prevAccounts.map(acc => {
        if (acc.id === t.accountId) {
          if (t.type === 'expense') {
            const newBalance = acc.balance - t.amount;
            console.log('Expense: reducing balance from', acc.balance, 'to', newBalance);
            if (userId) {
              supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id).then();
            }
            return { ...acc, balance: newBalance };
          } else if (t.type === 'income') {
            const newBalance = acc.balance + t.amount;
            console.log('Income: increasing balance from', acc.balance, 'to', newBalance);
            if (userId) {
              supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id).then();
            }
            return { ...acc, balance: newBalance };
          } else if (t.type === 'transfer' && t.toAccountId) {
            const newBalance = acc.balance - t.amount;
            console.log('Transfer out: reducing balance from', acc.balance, 'to', newBalance);
            if (userId) {
              supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id).then();
            }
            return { ...acc, balance: newBalance };
          }
        }
        if (t.type === 'transfer' && t.toAccountId && acc.id === t.toAccountId) {
          const newBalance = acc.balance + t.amount;
          console.log('Transfer in: increasing balance from', acc.balance, 'to', newBalance);
          if (userId) {
            supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id).then();
          }
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
    });

    if (userId) {
      await supabase.from('transactions').insert(transactionToRow(newT, userId));
    }
  }, [userId]);

  const updateTransaction = useCallback(async (t: Transaction) => {
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
    if (userId) {
      await supabase.from('transactions').update(transactionToRow(t, userId)).eq('id', t.id);
    }
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(x => x.id !== id));

    if (tx) {
      setAccounts(prev => {
        const updated = prev.map(acc => {
          if (acc.id === tx.accountId) {
            if (tx.type === 'expense') {
              return { ...acc, balance: acc.balance + tx.amount };
            } else if (tx.type === 'income') {
              return { ...acc, balance: acc.balance - tx.amount };
            } else if (tx.type === 'transfer' && tx.toAccountId) {
              return { ...acc, balance: acc.balance + tx.amount };
            }
          }
          if (tx.type === 'transfer' && tx.toAccountId && acc.id === tx.toAccountId) {
            return { ...acc, balance: acc.balance - tx.amount };
          }
          return acc;
        });

        if (userId) {
          const updates = updated
            .filter(acc => acc.id === tx.accountId || (tx.type === 'transfer' && tx.toAccountId && acc.id === tx.toAccountId))
            .map(acc => supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id));
          Promise.all(updates).then();
        }

        return updated;
      });
    }

    if (userId) {
      await supabase.from('transactions').delete().eq('id', id);
    }
  }, [userId, transactions]);

  const addAccount = useCallback(async (a: Omit<Account, 'id'>) => {
    const id = generateId();
    const newA = { ...a, id };
    setAccounts(prev => [...prev, newA]);
    if (userId) {
      await supabase.from('accounts').insert(accountToRow(newA, userId));
    }
  }, [userId]);

  const updateAccount = useCallback(async (a: Account) => {
    setAccounts(prev => prev.map(x => x.id === a.id ? a : x));
    if (userId) {
      await supabase.from('accounts').update(accountToRow(a, userId)).eq('id', a.id);
    }
  }, [userId]);

  const deleteAccount = useCallback(async (id: string) => {
    setAccounts(prev => prev.filter(x => x.id !== id));
    if (userId) {
      await supabase.from('accounts').delete().eq('id', id);
    }
  }, [userId]);

  const addBudget = useCallback(async (b: Omit<Budget, 'id'>) => {
    const id = generateId();
    const newB = { ...b, id };
    setBudgets(prev => [...prev, newB]);
    if (userId) {
      await supabase.from('budgets').insert(budgetToRow(newB, userId));
    }
  }, [userId]);

  const updateBudget = useCallback(async (b: Budget) => {
    setBudgets(prev => prev.map(x => x.id === b.id ? b : x));
    if (userId) {
      await supabase.from('budgets').update(budgetToRow(b, userId)).eq('id', b.id);
    }
  }, [userId]);

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets(prev => prev.filter(x => x.id !== id));
    if (userId) {
      await supabase.from('budgets').delete().eq('id', id);
    }
  }, [userId]);

  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    const id = generateId();
    const newC = { ...c, id };
    setCategories(prev => [...prev, newC]);
    if (userId) {
      await supabase.from('categories').insert(categoryToRow(newC, userId));
    }
  }, [userId]);

  const updateCategory = useCallback(async (c: Category) => {
    setCategories(prev => prev.map(x => x.id === c.id ? c : x));
    if (userId) {
      await supabase.from('categories').update(categoryToRow(c, userId)).eq('id', c.id);
    }
  }, [userId]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
    if (userId) {
      await supabase.from('categories').delete().eq('id', id);
    }
  }, [userId]);

  const updateSettings = useCallback(async (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
    if (s.currency !== undefined) {
      setSelectedAccountCurrencyState(s.currency);
    }
    if (userId) {
      const update: Record<string, unknown> = {};
      if (s.currency !== undefined) update.currency = s.currency;
      if (s.currencySymbol !== undefined) update.currency_symbol = s.currencySymbol;
      if (s.locale !== undefined) update.locale = s.locale;
      if (s.theme !== undefined) update.theme = s.theme;
      if (s.dateFormat !== undefined) update.date_format = s.dateFormat;
      if (s.userName !== undefined) update.user_name = s.userName;
      if (s.userEmail !== undefined) update.user_email = s.userEmail;
      update.updated_at = new Date().toISOString();
      await supabase.from('settings').update(update).eq('user_id', userId);
    }
  }, [userId]);

  const getTotalBalance = useCallback((): number => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const getCurrentMonthYear = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthlyIncome = useCallback((monthYear?: string): number => {
    const my = monthYear || getCurrentMonthYear();
    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(my))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getMonthlyExpenses = useCallback((monthYear?: string): number => {
    const my = monthYear || getCurrentMonthYear();
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(my))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCategorySpending = useCallback((monthYear?: string): Record<string, number> => {
    const my = monthYear || getCurrentMonthYear();
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(my))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const getBudgetSpent = useCallback((budgetId: string): number => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return 0;
    const my = getCurrentMonthYear();
    return transactions
      .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(my))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [budgets, transactions]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  }, [navigate]);

  const seedUserData = useCallback(async () => {
    await supabase.from('categories').insert(
      defaultCategories.map(c => ({ ...c, user_id: userId }))
    );
    await supabase.from('accounts').insert(
      defaultAccounts.map(a => ({ ...a, user_id: userId, initial_balance: a.initialBalance, is_default: a.isDefault, credit_limit: a.creditLimit ?? null }))
    );
    await supabase.from('transactions').insert(
      defaultTransactions.map(t => ({
        ...t, user_id: userId, account_id: t.accountId,
        to_account_id: t.toAccountId ?? null, recurring_interval: t.recurringInterval ?? null,
      }))
    );
    await supabase.from('budgets').insert(
      defaultBudgets.map(b => ({ ...b, user_id: userId }))
    );
    await supabase.from('settings').upsert({
      user_id: userId, currency: defaultSettings.currency, currency_symbol: defaultSettings.currencySymbol,
      locale: defaultSettings.locale, theme: defaultSettings.theme, date_format: defaultSettings.dateFormat,
      user_name: defaultSettings.userName, user_email: defaultSettings.userEmail,
    });
  }, [userId]);

  const clearAllData = useCallback(async () => {
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('budgets').delete().eq('user_id', userId),
      supabase.from('accounts').delete().eq('user_id', userId),
      supabase.from('categories').delete().eq('user_id', userId),
      supabase.from('settings').delete().eq('user_id', userId),
    ]);
    setTransactions([]);
    setAccounts([]);
    setBudgets([]);
    setCategories([]);
    setSettings(defaultSettings);
  }, [userId]);

  const resetDemoData = useCallback(async () => {
    await clearAllData();
    await seedUserData();
    setCategories(defaultCategories);
    setAccounts(defaultAccounts);
    setTransactions(defaultTransactions);
    setBudgets(defaultBudgets);
    setSettings(defaultSettings);
  }, [clearAllData, seedUserData]);

  return (
    <FinanceContext.Provider value={{
      loaded, transactions, accounts, budgets, categories, settings,
      selectedAccountCurrency, setSelectedAccountCurrency, displayCurrencySymbol,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addBudget, updateBudget, deleteBudget,
      addCategory, updateCategory, deleteCategory,
      updateSettings, clearAllData, resetDemoData, logout,
      getTotalBalance, getMonthlyIncome, getMonthlyExpenses,
      getCategorySpending, getBudgetSpent,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
