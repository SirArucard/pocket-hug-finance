import { Transaction, ExpenseCategory, IncomeCategory, PaymentType } from '@/types/finance';

export const categoryLabels: Record<ExpenseCategory | IncomeCategory, string> = {
  fixed_bills: 'Contas Fixas',
  food: 'Alimentação',
  transport: 'Transporte',
  health: 'Saúde',
  lifestyle: 'Lazer / Estilo de Vida',
  vault_withdrawal: 'Cofre (Retirada)',
  salary: 'Salário',
  extra: 'Cofre (Depósito)',
  food_voucher: 'Ticket Alimentação',
  transport_voucher: 'Ticket Mobilidade',
};

export const categoryIcons: Record<ExpenseCategory | IncomeCategory, string> = {
  fixed_bills: '💡',
  food: '🍽️',
  transport: '🚗',
  health: '🏥',
  lifestyle: '🎮',
  vault_withdrawal: '🔓',
  salary: '💰',
  extra: '🔐',
  food_voucher: '🍴',
  transport_voucher: '🚌',
};

export const paymentTypeLabels: Record<PaymentType, string> = {
  debit: 'Débito',
  credit: 'Cartão de Crédito',
  food_voucher: 'Ticket Alimentação',
  transport_voucher: 'Ticket Mobilidade',
};

export const paymentTypeColors: Record<PaymentType, string> = {
  debit: 'bg-income',
  credit: 'bg-credit-card',
  food_voucher: 'bg-food-voucher',
  transport_voucher: 'bg-transport-voucher',
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateId = (): string => {
  // UUID v4 for database primary keys (uuid)
  const c = typeof crypto !== 'undefined' ? crypto : undefined;

  if (c && 'randomUUID' in c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }

  if (c && 'getRandomValues' in c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Último fallback (ambiente sem crypto): UUID "suficiente" para dev
  const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const calculateMonthlyTotals = (transactions: Transaction[], month: string) => {
  const monthTransactions = transactions.filter(t => t.date.startsWith(month));
  
  // Income excluding vault deposits (extra gains) AND vouchers (they are separate)
  const income = monthTransactions
    .filter(t => t.type === 'income' && t.category !== 'extra' && t.category !== 'food_voucher' && t.category !== 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Only salary for reserve calculation
  const salaryIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'salary')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Food voucher income
  const foodVoucherIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'food_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Transport voucher income
  const transportVoucherIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Food voucher expenses
  const foodVoucherExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.paymentType === 'food_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Transport voucher expenses
  const transportVoucherExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.paymentType === 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Vault deposits (extra gains)
  const vaultDeposits = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'extra')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Vault withdrawals
  const vaultWithdrawals = monthTransactions
    .filter(t => t.type === 'expense' && t.category === 'vault_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Expenses excluding vault withdrawals (they don't affect balance) AND voucher expenses (separate system)
  const expenses = monthTransactions
    .filter(t => t.type === 'expense' && t.category !== 'vault_withdrawal' && t.paymentType !== 'food_voucher' && t.paymentType !== 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const fixedExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.category === 'fixed_bills')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return { 
    income, 
    salaryIncome, 
    expenses, 
    fixedExpenses, 
    vaultDeposits, 
    vaultWithdrawals,
    foodVoucherIncome,
    foodVoucherExpenses,
    transportVoucherIncome,
    transportVoucherExpenses,
  };
};

// Calculate total voucher balances across all transactions
export const calculateVoucherBalances = (transactions: Transaction[]) => {
  const foodVoucherIncome = transactions
    .filter(t => t.type === 'income' && t.category === 'food_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const foodVoucherExpenses = transactions
    .filter(t => t.type === 'expense' && t.paymentType === 'food_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const transportVoucherIncome = transactions
    .filter(t => t.type === 'income' && t.category === 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const transportVoucherExpenses = transactions
    .filter(t => t.type === 'expense' && t.paymentType === 'transport_voucher')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    foodVoucherBalance: foodVoucherIncome - foodVoucherExpenses,
    transportVoucherBalance: transportVoucherIncome - transportVoucherExpenses,
  };
};

export const getPreviousMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const getNextMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Calculate total vault balance across all transactions
export const calculateVaultBalance = (transactions: Transaction[]) => {
  const deposits = transactions
    .filter(t => t.type === 'income' && t.category === 'extra')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const withdrawals = transactions
    .filter(t => t.type === 'expense' && t.category === 'vault_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return deposits - withdrawals;
};

export const calculateAvailableLimit = (
  income: number,
  fixedExpenses: number,
  variableExpenses: number,
  reservePercentage: number
): number => {
  const reserve = income * (reservePercentage / 100);
  return Math.max(0, income - fixedExpenses - variableExpenses - reserve);
};

export const generateInstallmentTransactions = (
  transaction: Omit<Transaction, 'id'>,
  installments: number
): Transaction[] => {
  const transactions: Transaction[] = [];
  const parentId = generateId();
  const monthlyAmount = transaction.amount / installments;
  const startDate = new Date(transaction.date);
  
  for (let i = 0; i < installments; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    transactions.push({
      ...transaction,
      id: i === 0 ? parentId : generateId(),
      parentId: i === 0 ? undefined : parentId,
      amount: monthlyAmount,
      date: date.toISOString().split('T')[0],
      installments,
      currentInstallment: i + 1,
      name: `${transaction.name} (${i + 1}/${installments})`,
    });
  }
  
  return transactions;
};
