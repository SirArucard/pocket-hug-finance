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
  | 'food_voucher' 
  | 'transport_voucher';

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
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  usedLimit: number;
  closingDay: number;
  dueDay: number;
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
}
