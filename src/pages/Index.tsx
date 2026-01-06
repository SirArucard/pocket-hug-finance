import { useMemo } from 'react';
import {
  Wallet,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { SummaryCard } from '@/components/SummaryCard';
import { SpendingLimitBar } from '@/components/SpendingLimitBar';
import { CreditCardWidget } from '@/components/CreditCardWidget';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { ReserveWidget } from '@/components/ReserveWidget';
import {
  formatCurrency,
  calculateMonthlyTotals,
  calculateAvailableLimit,
  getCurrentMonth,
  getMonthName,
} from '@/lib/financeUtils';

const Index = () => {
  const {
    transactions,
    creditCards,
    reservePercentage,
    addTransaction,
    removeTransaction,
    updateCreditCard,
    setReservePercentage,
  } = useFinanceStore();

  const currentMonth = getCurrentMonth();
  const { income, expenses, fixedExpenses } = useMemo(
    () => calculateMonthlyTotals(transactions, currentMonth),
    [transactions, currentMonth]
  );

  const variableExpenses = expenses - fixedExpenses;
  const reserve = income * (reservePercentage / 100);
  const availableLimit = calculateAvailableLimit(
    income,
    fixedExpenses,
    variableExpenses,
    reservePercentage
  );
  const balance = income - expenses;

  const monthlyTransactions = transactions.filter((t) =>
    t.date.startsWith(currentMonth)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-income">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Meu Financeiro</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {getMonthName(currentMonth)}
                </p>
              </div>
            </div>
            <TransactionForm onSubmit={addTransaction} />
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Entradas"
            value={formatCurrency(income)}
            icon={<ArrowUpCircle className="w-5 h-5" />}
            variant="income"
          />
          <SummaryCard
            title="Saídas"
            value={formatCurrency(expenses)}
            icon={<ArrowDownCircle className="w-5 h-5" />}
            variant="expense"
          />
          <SummaryCard
            title="Gastos Fixos"
            value={formatCurrency(fixedExpenses)}
            icon={<TrendingDown className="w-5 h-5" />}
            variant="neutral"
          />
          <SummaryCard
            title="Saldo"
            value={formatCurrency(balance)}
            icon={<Wallet className="w-5 h-5" />}
            variant={balance >= 0 ? 'income' : 'expense'}
          />
        </div>

        {/* Spending Limit + Credit Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SpendingLimitBar
              available={availableLimit}
              total={income}
              reserve={reserve}
              reservePercentage={reservePercentage}
            />
          </div>
          <div className="space-y-4">
            {creditCards.map((card) => (
              <CreditCardWidget
                key={card.id}
                card={card}
                onUpdate={updateCreditCard}
              />
            ))}
          </div>
        </div>

        {/* Reserve Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ReserveWidget
            income={income}
            reservePercentage={reservePercentage}
            onReserveChange={setReservePercentage}
          />
        </div>

        {/* Transactions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📋 Lançamentos do Mês
            <span className="text-sm font-normal text-muted-foreground">
              ({monthlyTransactions.length})
            </span>
          </h2>
          <TransactionList
            transactions={monthlyTransactions}
            onRemove={removeTransaction}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
