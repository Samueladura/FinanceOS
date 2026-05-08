import { useState, useRef } from 'react';
import {
  User, Globe, Shield, Download,
  Trash2, Save, Database, Loader2, Plus, X, Edit2, Tags,
  // Category icons
  ShoppingCart, Car, Home, Utensils, Heart, Book, Gamepad2,
  Briefcase, DollarSign, PiggyBank, CreditCard, Smartphone,
  Wifi, Zap, Droplets, Shirt, Baby, GraduationCap, Plane,
  Coffee, Music, Camera, Wrench, Pill, Stethoscope, Dumbbell,
  Palette, Film, Gift, TreePine, Fuel, Building2, Bus
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { exportToCSV } from '../utils/formatters';
import { fetchExchangeRates, convertAmount } from '../utils/currencyService';
import type { Category } from '../types/finance';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso' },
];

const DATE_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (EU)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
  { value: 'MMM dd, yyyy', label: 'Jan 01, 2026' },
];

// Simple CSV parser that handles quotes
function parseCSV(text: string): string[][] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const result: string[][] = [];
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  return result;
}

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


export function Settings() {
  const { settings, updateSettings, transactions, accounts, categories, clearAllData, updateTransaction, updateAccount, addAccount, addCategory, updateCategory, deleteCategory, addTransaction } = useFinance();
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('ShoppingCart');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catType, setCatType] = useState<'income' | 'expense' | 'both'>('expense');

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importJsonFile, setImportJsonFile] = useState<File | null>(null);
  const [importingJson, setImportingJson] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);


  // Helper function to get icon component
  const getCategoryIcon = (iconName: string) => {
    const iconData = CATEGORY_ICONS.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : ShoppingCart; // Default to ShoppingCart if not found
  };

  const handleSave = async () => {
    const sel = CURRENCIES.find(c => c.code === currency);
    const oldCurrency = settings.currency;
    const newCurrency = currency;

    if (oldCurrency !== newCurrency) {
      setRatesLoading(true);
      const rates = await fetchExchangeRates('USD');
      setRatesLoading(false);

      for (const t of transactions) {
        const convertedAmount = convertAmount(t.amount, oldCurrency, newCurrency, rates);
        await updateTransaction({ ...t, amount: convertedAmount });
      }

      for (const a of accounts) {
        const accountCurrency = a.currency || oldCurrency;
        const convertedBalance = convertAmount(a.balance, accountCurrency, newCurrency, rates);
        await updateAccount({ ...a, balance: convertedBalance, currency: newCurrency });
      }
    }

    updateSettings({
      userName: userName.trim() || settings.userName,
      userEmail: userEmail.trim() || settings.userEmail,
      currency,
      currencySymbol: sel?.symbol || '$',
      dateFormat,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportAll = (format: 'csv' | 'json' = 'csv') => {
    const data = transactions.map(t => ({
      Date: t.date,
      Type: t.type,
      Description: t.description,
      Category: categories.find(c => c.id === t.category)?.name || t.category,
      Amount: t.amount,
      Account: accounts.find(a => a.id === t.accountId)?.name || t.accountId,
      Recurring: t.recurring ? 'Yes' : 'No',
      Tags: t.tags.join('; '),
      Notes: t.notes || '',
    }));

    if (format === 'json') {
      const jsonData = {
        transactions: data,
        accounts: accounts.map(a => ({ ...a })),
        categories: categories.map(c => ({ ...c })),
        settings: { ...settings },
        exportDate: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finance-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      exportToCSV(data as Record<string, unknown>[], 'finance-export-all');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const text = await importFile.text();
      const csvData = parseCSV(text);
      if (csvData.length < 2) throw new Error('CSV must have at least header and one data row');

      // Parse headers case-insensitively
      const headers = csvData[0].map(h => h.toLowerCase());
      const headerMap: Record<string, number> = {};
      headers.forEach((h, idx) => headerMap[h] = idx);

      const requiredHeaders = ['date', 'type', 'description', 'category', 'amount', 'account'];
      const missing = requiredHeaders.filter(h => !(h in headerMap));
      if (missing.length) throw new Error(`Missing required headers: ${missing.join(', ')}`);

      const importedTransactions = [];
      const errors: string[] = [];

      for (let i = 1; i < csvData.length; i++) {
        const values = csvData[i];
        const row: Record<string, string> = {};
        Object.keys(headerMap).forEach(h => row[h] = values[headerMap[h]] || '');

        // Validate data
        const amount = parseFloat(row.amount);
        if (isNaN(amount)) {
          errors.push(`Row ${i + 1}: Invalid amount '${row.amount}'`);
          continue;
        }

        const type = row.type.toLowerCase();
        if (!['income', 'expense', 'transfer'].includes(type)) {
          errors.push(`Row ${i + 1}: Invalid type '${row.type}' (must be income, expense, or transfer)`);
          continue;
        }

        const category = categories.find(c => c.name.toLowerCase() === row.category.toLowerCase());
        if (!category) {
          errors.push(`Row ${i + 1}: Category '${row.category}' not found`);
          continue;
        }

        const account = accounts.find(a => a.name.toLowerCase() === row.account.toLowerCase());
        if (!account) {
          errors.push(`Row ${i + 1}: Account '${row.account}' not found`);
          continue;
        }

        if (!row.date.trim()) {
          errors.push(`Row ${i + 1}: Missing date`);
          continue;
        }

        const transaction = {
          type: type as 'income' | 'expense' | 'transfer',
          amount,
          category: category.id,
          description: row.description || '',
          date: row.date,
          accountId: account.id,
          recurring: (row.recurring || '').toLowerCase() === 'yes',
          tags: row.tags ? row.tags.split(';').map(t => t.trim()) : [],
          notes: row.notes || '',
        };
        importedTransactions.push(transaction);
      }

      if (errors.length) {
        throw new Error(`Import errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`);
      }

      // Add imported transactions
      for (const tx of importedTransactions) {
        await addTransaction(tx);
      }

      alert(`Imported ${importedTransactions.length} transactions successfully.`);
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      setImportFile(null);
    }
  };

  const handleImportJson = async () => {
    if (!importJsonFile) return;
    setImportingJson(true);
    try {
      const text = await importJsonFile.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.transactions || !Array.isArray(data.transactions)) throw new Error('Invalid JSON: missing or invalid transactions');
      if (!data.accounts || !Array.isArray(data.accounts)) throw new Error('Invalid JSON: missing or invalid accounts');
      if (!data.categories || !Array.isArray(data.categories)) throw new Error('Invalid JSON: missing or invalid categories');
      if (!data.settings || typeof data.settings !== 'object') throw new Error('Invalid JSON: missing or invalid settings');

      // Import categories first (as transactions reference them)
      for (const cat of data.categories) {
        if (!cat.name || !cat.icon || !cat.color || !cat.type) continue;
        const exists = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
        if (!exists) {
          await addCategory({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
        }
      }

      // Import accounts
      for (const acc of data.accounts) {
        if (!acc.name || !acc.type || typeof acc.balance !== 'number') continue;
        const exists = accounts.find(a => a.name.toLowerCase() === acc.name.toLowerCase());
        if (!exists) {
          await addAccount({
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            initialBalance: acc.initialBalance || acc.balance,
            currency: acc.currency || 'USD',
            color: acc.color || '#6366f1',
            isDefault: acc.isDefault || false,
            creditLimit: acc.creditLimit,
          });
        }
      }

      // Import transactions
      const importedTx = [];
      for (const tx of data.transactions) {
        if (!tx.type || !tx.amount || !tx.category || !tx.description || !tx.date || !tx.accountId) continue;
        const category = categories.find(c => c.id === tx.category) || categories.find(c => c.name.toLowerCase() === tx.category.toLowerCase());
        const account = accounts.find(a => a.id === tx.accountId) || accounts.find(a => a.name.toLowerCase() === tx.accountId.toLowerCase());
        if (category && account) {
          importedTx.push({
            type: tx.type,
            amount: tx.amount,
            category: category.id,
            description: tx.description,
            date: tx.date,
            accountId: account.id,
            toAccountId: tx.toAccountId,
            recurring: tx.recurring || false,
            recurringInterval: tx.recurringInterval,
            tags: tx.tags || [],
            notes: tx.notes || '',
          });
        }
      }

      for (const tx of importedTx) {
        await addTransaction(tx);
      }

      // Update settings (optional, skip user-specific)
      if (data.settings.currency) {
        await updateSettings({
          currency: data.settings.currency,
          currencySymbol: data.settings.currencySymbol || '$',
          dateFormat: data.settings.dateFormat || 'MM/dd/yyyy',
        });
      }

      alert(`Imported ${importedTx.length} transactions, ${data.categories.length} categories, ${data.accounts.length} accounts successfully.`);
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportingJson(false);
      setImportJsonFile(null);
    }
  };

  const handleClearData = async () => {
    await clearAllData();
    setClearConfirm(false);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    if (editingCategory) {
      await updateCategory({ ...editingCategory, name: catName, icon: catIcon, color: catColor, type: catType });
    } else {
      await addCategory({ name: catName, icon: catIcon, color: catColor, type: catType });
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCatName('');
    setCatIcon('ShoppingCart');
    setCatColor('#6366f1');
    setCatType('expense');
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Delete this category?')) {
      await deleteCategory(id);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '12px 16px', color: '#0f172a', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#64748b', marginBottom: 8,
    display: 'block', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 40px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: '#0f172a',
  };

  const sectionSubStyle: React.CSSProperties = {
    fontSize: 14, color: '#64748b',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minHeight: '100vh' }}>

      {/* Header */}
      <div className="settings-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Customize your FinanceOS experience</p>
        </div>
        <button
          onClick={handleSave}
          disabled={ratesLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12, color: 'white', cursor: ratesLoading ? 'wait' : 'pointer',
            fontSize: 14, fontWeight: 600, boxShadow: `0 4px 15px ${saved ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`,
            transition: 'all 0.3s', opacity: ratesLoading ? 0.7 : 1,
          }}
        >
          {ratesLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {ratesLoading ? 'Converting...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="settings-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* Left Column - Main Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Profile */}
          <div className="settings-card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                <User size={20} color="white" />
              </div>
              <div>
                <div className="settings-section-title" style={sectionTitleStyle}>Profile Settings</div>
                <div className="settings-section-sub" style={{ ...sectionSubStyle, marginTop: 2 }}>Manage your personal information and preferences</div>
              </div>
            </div>

            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Avatar Preview */}
            <div style={{ marginTop: 24, padding: '24px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: 'white', boxShadow: '0 6px 16px rgba(99,102,241,0.3)',
              }}>
                {userName.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{userName || 'Your Name'}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{userEmail || 'your@email.com'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Profile avatar and contact information</div>
              </div>
            </div>
          </div>

          {/* Currency & Locale */}
          <div className="settings-card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                <Globe size={20} color="white" />
              </div>
              <div>
                <div className="settings-section-title" style={sectionTitleStyle}>Currency & Localization</div>
                <div className="settings-section-sub" style={{ ...sectionSubStyle, marginTop: 2 }}>Configure financial display and regional preferences</div>
              </div>
            </div>

            <div className="currency-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={labelStyle}>Primary Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 }}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} style={{ background: '#ffffff', color: '#0f172a' }}>{c.symbol} — {c.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>
                  Changing currency will automatically convert all existing transactions and account balances using current exchange rates.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Date Format</label>
                <select
                  value={dateFormat}
                  onChange={e => setDateFormat(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 }}
                >
                  {DATE_FORMATS.map(f => (
                    <option key={f.value} value={f.value} style={{ background: '#ffffff', color: '#0f172a' }}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Overview */}
          <div className="settings-card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}>
                <Database size={20} color="white" />
              </div>
              <div>
                <div className="settings-section-title" style={sectionTitleStyle}>Data Overview</div>
                <div className="settings-section-sub" style={{ ...sectionSubStyle, marginTop: 2 }}>Your financial data statistics and metrics</div>
              </div>
            </div>

            <div className="data-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {[
                { label: 'Transactions', value: transactions.length, color: '#6366f1' },
                { label: 'Accounts', value: accounts.length, color: '#10b981' },
                { label: 'Categories', value: categories.length, color: '#f59e0b' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: `${stat.color}08`, border: `1px solid ${stat.color}20`,
                  borderRadius: 12, padding: '20px', textAlign: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${stat.color}12`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${stat.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${stat.color}08`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: '-0.5px', marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="settings-card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
                <Shield size={20} color="white" />
              </div>
              <div>
                <div className="settings-section-title" style={sectionTitleStyle}>Data Management</div>
                <div className="settings-section-sub" style={{ ...sectionSubStyle, marginTop: 2 }}>Export, backup, and manage your data</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Export */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                    <Download size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Export All Data</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Download all transactions as CSV or full backup as JSON</div>
                  </div>
                </div>
                <div className="data-management-buttons" style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => handleExportAll('csv')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                      background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                      borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={() => handleExportAll('json')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                      background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', border: 'none',
                      borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Download size={16} /> Export JSON
                  </button>
                </div>
            </div>

            {/* Import Data */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #e0f2fe, #bae6fd)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
                  <Download size={18} color="white" style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Import Transactions</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Import transactions from CSV or JSON files</div>
                </div>
              </div>
              <div className="data-management-buttons" style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    if (!importFile) {
                      csvInputRef.current?.click();
                    } else {
                      handleImport();
                    }
                  }}
                  disabled={importing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', border: 'none',
                    borderRadius: 10, color: 'white', cursor: importing ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                    transition: 'all 0.2s', opacity: importing ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {importing ? 'Importing CSV...' : 'Import CSV'}
                </button>
                <button
                  onClick={() => {
                    if (!importJsonFile) {
                      jsonInputRef.current?.click();
                    } else {
                      handleImportJson();
                    }
                  }}
                  disabled={importingJson}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', border: 'none',
                    borderRadius: 10, color: 'white', cursor: importingJson ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                    transition: 'all 0.2s', opacity: importingJson ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {importingJson ? 'Importing JSON...' : 'Import JSON'}
                </button>
              </div>
            </div>

            {/* Clear All Data */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2, #fecaca)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2, #fee2e2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>
                    <Trash2 size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Clear All Data</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Permanently delete all financial data</div>
                  </div>
                </div>
                <button
                  onClick={() => setClearConfirm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
                    borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Trash2 size={16} /> Clear Data
                </button>
              </div>
            </div>
          </div>

        </div>
        {/* ✅ END Left Column */}

        {/* Right Column - Additional Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Categories */}
          <div className="settings-card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #a855f7, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(168,85,247,0.2)' }}>
                  <Tags size={20} color="white" />
                </div>
                <div>
                  <div className="settings-section-title" style={sectionTitleStyle}>Categories</div>
                  <div className="settings-section-sub" style={{ ...sectionSubStyle, marginTop: 2 }}>Organize your transaction categories</div>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)', border: 'none',
                  borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={14} /> Add Category
              </button>
            </div>

            <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: '#ffffff', border: '1px solid #e2e8f0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafbfc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}>

                  {/* Status indicator */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}dd)`,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)`,
                        border: `1px solid ${cat.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        {(() => {
                          const IconComponent = getCategoryIcon(cat.icon);
                          return <IconComponent size={16} color={cat.color} />;
                        })()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>{cat.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{cat.type}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryModal(true); }}
                        style={{
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                          borderRadius: 6, padding: '4px', cursor: 'pointer', color: '#6366f1',
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
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                          borderRadius: 6, padding: '4px', cursor: 'pointer', color: '#ef4444',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* ✅ END Right Column */}

      </div>
      {/* ✅ END Main Grid */}

      {/* About Section - Full Width */}
      <div className="settings-card" style={{ ...cardStyle, textAlign: 'center', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Personal Finance Tracker</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Version 2.0.0</div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          A comprehensive financial management application designed to help you track expenses,
          manage accounts, and gain insights into your spending habits. Built with modern web technologies
          for a seamless and secure experience.
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={(e) => setImportJsonFile(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Clear All Data?</h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: '#ef4444' }}>all</strong> your transactions, accounts, budgets, and settings. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => setClearConfirm(false)} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}>Cancel</button>
              <button onClick={handleClearData} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>Delete All Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} style={{
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 8, padding: 8,
                color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Category Name</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g., Groceries, Transportation" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Icon</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: 8, maxHeight: 200, overflowY: 'auto', padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {CATEGORY_ICONS.map(({ name, icon: IconComponent, label }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCatIcon(name)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '8px',
                        borderRadius: 8,
                        border: catIcon === name ? '2px solid #6366f1' : '2px solid transparent',
                        background: catIcon === name ? 'rgba(99,102,241,0.1)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: 10,
                        color: '#64748b',
                      }}
                      onMouseEnter={(e) => {
                        if (catIcon !== name) {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (catIcon !== name) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <IconComponent size={20} />
                      <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Color Theme</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {['#f43f5e', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#94a3b8'].map(c => (
                    <button key={c} onClick={() => setCatColor(c)} style={{
                      width: 32, height: 32, borderRadius: 8, border: catColor === c ? '3px solid #0f172a' : '2px solid #e2e8f0',
                      background: c, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Category Type</label>
                <select value={catType} onChange={e => setCatType(e.target.value as 'income' | 'expense' | 'both')} style={{
                  ...inputStyle, appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40
                }}>
                  <option value="expense" style={{ background: '#ffffff', color: '#0f172a' }}>Expense Category</option>
                  <option value="income" style={{ background: '#ffffff', color: '#0f172a' }}>Income Category</option>
                  <option value="both" style={{ background: '#ffffff', color: '#0f172a' }}>Both Income & Expense</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}>Cancel</button>
              <button onClick={handleSaveCategory} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #c084fc)', color: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .settings-main-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .settings-card {
            padding: 20px !important;
          }
          .settings-section-title {
            font-size: 16px !important;
          }
          .settings-section-sub {
            font-size: 12px !important;
          }
          .profile-grid, .currency-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .data-overview-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
          }
          .categories-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
          }
          .data-management-buttons {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .settings-main-grid {
            gap: 16px !important;
          }
          .settings-card {
            padding: 12px !important;
          }
          .settings-header h1 {
            font-size: 20px !important;
          }
          .data-overview-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)) !important;
          }
          .categories-grid {
            grid-template-columns: 1fr !important;
          }
          .data-management-buttons button {
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          .profile-grid, .currency-grid {
            gap: 12px !important;
          }
          .settings-section-title {
            font-size: 14px !important;
          }
          .settings-section-sub {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}