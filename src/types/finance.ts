export type PaymentType = 'debit' | 'credit' | 'food_voucher' | 'transport_voucher';

export type ExpenseCategory = 
  | 'fixed_bills' 
  | 'food' 
  | 'transport' 
  | 'health' 
  | 'lifestyle'
  | 'vault_withdrawal';

export type IncomeCategory = 
  | 'salary' 
  | 'extra' 
  | 'extra_values'
  | 'food_voucher' 
  | 'transport_voucher';

export type VaultDestinationType = 'INCOME_TRANSFER' | 'DIRECT_USE';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory | IncomeCategory;
  type: 'income' | 'expense';
  paymentType?: PaymentType;
  date: string;
  installments?: number;
  currentInstallment?: number;
  parentId?: string;
  reason?: string;
  destinationType?: VaultDestinationType;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  usedLimit: number;
  closingDay: number;
  dueDay: number;
  bestBuyDay: number;
}

export interface MonthlyBudget {
  month: string;
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  reserve: number;
  availableLimit: number;
}

export interface FinanceState {
  transactions: Transaction[];
  creditCards: CreditCard[];
  reservePercentage: number;
  recurringExpenses: RecurringExpense[]; // Adicionado aqui
}

// NOVA INTERFACE
export interface RecurringExpense {
  id: string;
  name: string;
  baseAmount: number;
  category: ExpenseCategory;
  isVariable: boolean;
  active: boolean;
}
