export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type ThemeMode = 'dark' | 'light';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'INR' | 'BRL' | 'MXN';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  accountId: string;
  toAccountId?: string;
  recurring: boolean;
  recurringInterval?: RecurringInterval;
  tags: string[];
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  currency?: string;
  color: string;
  isDefault: boolean;
  creditLimit?: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  locale: string;
  theme: ThemeMode;
  dateFormat: string;
  userName: string;
  userEmail: string;
}
