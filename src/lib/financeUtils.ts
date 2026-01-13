import { Transaction, ExpenseCategory, IncomeCategory, PaymentType, CreditCard } from '@/types/finance';

export const categoryLabels: Record<ExpenseCategory | IncomeCategory, string> = {
  fixed_bills: 'Contas Fixas',
  food: 'Alimentação',
  transport: 'Transporte',
  health: 'Saúde',
  lifestyle: 'Lazer / Estilo de Vida',
  vault_withdrawal: 'Cofre (Retirada)',
  salary: 'Salário',
  extra: 'Cofre (Depósito)',
  extra_values: 'Valores Extras',
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
  extra_values: '💎',
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

// Determina o mês da fatura baseado na data da compra e melhor dia de compra
export const getInvoiceMonth = (transactionDate: string, bestBuyDay: number): string => {
  const txDate = new Date(transactionDate);
  const txDay = txDate.getDate();
  const txMonth = txDate.getMonth();
  const txYear = txDate.getFullYear();
  
  // Se compra antes do melhor dia de compra -> fatura do MÊS ATUAL
  // Se compra no ou após melhor dia de compra -> fatura do PRÓXIMO MÊS
  if (txDay < bestBuyDay) {
    return `${txYear}-${String(txMonth + 1).padStart(2, '0')}`;
  } else {
    const nextMonth = txMonth + 1;
    if (nextMonth > 11) {
      return `${txYear + 1}-01`;
    }
    return `${txYear}-${String(nextMonth + 1).padStart(2, '0')}`;
  }
};

export const calculateMonthlyTotals = (
  transactions: Transaction[], 
  month: string,
  creditCards?: CreditCard[]
) => {
  const monthTransactions = transactions.filter(t => t.date.startsWith(month));
  const bestBuyDay = creditCards?.[0]?.bestBuyDay ?? 7;
  
  // Income: Salário + Valores Extras + Retiradas do Cofre com destino INCOME_TRANSFER
  const salaryIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'salary')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const extraValuesIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category === 'extra_values')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Retiradas do cofre que vão para Entradas (INCOME_TRANSFER)
  const vaultToIncome = monthTransactions
    .filter(t => t.type === 'expense' && t.category === 'vault_withdrawal' && t.destinationType === 'INCOME_TRANSFER')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const income = salaryIncome + extraValuesIncome + vaultToIncome;
  
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
  
  // Vault withdrawals (todas)
  const vaultWithdrawals = monthTransactions
    .filter(t => t.type === 'expense' && t.category === 'vault_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Saídas: Débito + Crédito (atribuído ao mês da fatura atual)
  // Débito: transações do mês
  const debitExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.paymentType === 'debit' && t.category !== 'vault_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Crédito: buscar todas as transações de crédito e filtrar pela fatura do mês atual
  const creditExpenses = transactions
    .filter(t => {
      if (t.type !== 'expense' || t.paymentType !== 'credit') return false;
      const invoiceMonth = getInvoiceMonth(t.date, bestBuyDay);
      return invoiceMonth === month;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Excluir vault withdrawals com DIRECT_USE (invisíveis ao orçamento)
  // e voucher expenses (sistema separado)
  const expenses = debitExpenses + creditExpenses;
  
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

// Calcula o limite usado baseado em transações de crédito da fatura do mês atual
export const calculateUsedLimit = (
  transactions: Transaction[], 
  bestBuyDay: number,
  targetMonth: string
): number => {
  return transactions
    .filter((t) => {
      if (t.paymentType !== 'credit' || t.type !== 'expense') return false;
      const invoiceMonth = getInvoiceMonth(t.date, bestBuyDay);
      return invoiceMonth === targetMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};
