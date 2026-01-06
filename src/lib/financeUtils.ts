import { Transaction, ExpenseCategory, IncomeCategory, PaymentType } from '@/types/finance';

export const categoryLabels: Record<ExpenseCategory | IncomeCategory, string> = {
  fixed_bills: 'Contas Fixas',
  food: 'Alimentação',
  transport: 'Transporte',
  health: 'Saúde',
  lifestyle: 'Lazer / Estilo de Vida',
  salary: 'Salário',
  extra: 'Ganhos Extras',
  food_voucher: 'Ticket Alimentação',
  transport_voucher: 'Ticket Mobilidade',
};

export const categoryIcons: Record<ExpenseCategory | IncomeCategory, string> = {
  fixed_bills: '💡',
  food: '🍽️',
  transport: '🚗',
  health: '🏥',
  lifestyle: '🎮',
  salary: '💰',
  extra: '💵',
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
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
  
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const fixedExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.category === 'fixed_bills')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return { income, expenses, fixedExpenses };
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
