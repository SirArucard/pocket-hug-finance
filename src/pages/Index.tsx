import { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
} from 'lucide-react';
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance';
import { useAuth } from '@/hooks/useAuth';
import { SummaryCard } from '@/components/SummaryCard';
import { SpendingLimitBar } from '@/components/SpendingLimitBar';
import { CreditCardWidget } from '@/components/CreditCardWidget';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { ReserveWidget } from '@/components/ReserveWidget';
import { VaultWidget } from '@/components/VaultWidget';
import { VoucherCards } from '@/components/VoucherCards';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  calculateMonthlyTotals,
  calculateAvailableLimit,
  calculateVaultBalance,
  calculateVoucherBalances,
  getCurrentMonth,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/financeUtils';

const Index = () => {
  const {
    transactions,
    creditCards,
    reservePercentage,
    loading,
    addTransaction,
    removeTransaction,
    updateCreditCard,
    setReservePercentage,
    payInvoice,
    transferToVault,
    withdrawFromVault,
  } = useSupabaseFinance();

  const { signOut } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const currentMonth = getCurrentMonth();
  
  const { income, salaryIncome, expenses, fixedExpenses, vaultDeposits, vaultWithdrawals } = useMemo(
    () => calculateMonthlyTotals(transactions, selectedMonth, creditCards),
    [transactions, selectedMonth, creditCards]
  );

  const vaultBalance = useMemo(
    () => calculateVaultBalance(transactions),
    [transactions]
  );

  const { foodVoucherBalance, transportVoucherBalance } = useMemo(
    () => calculateVoucherBalances(transactions),
    [transactions]
  );

  const variableExpenses = expenses - fixedExpenses;
  // Reserve is based ONLY on salary income
  const reserve = salaryIncome * (reservePercentage / 100);
  const availableLimit = calculateAvailableLimit(
    salaryIncome,
    fixedExpenses,
    variableExpenses,
    reservePercentage
  );
  
  // SALDO: ENTRADAS - SAÍDAS
  const balance = income - expenses;

  // Calculate salary balance for invoice payment
  const salaryBalance = income - expenses;

  const monthlyTransactions = transactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );

  const handlePreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando dados...</span>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground capitalize min-w-[120px] text-center">
                    {getMonthName(selectedMonth)}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PrivacyToggle />
              <TransactionForm onSubmit={addTransaction} />
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sair">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Voucher Balances */}
        <VoucherCards 
          foodVoucherBalance={foodVoucherBalance}
          transportVoucherBalance={transportVoucherBalance}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Entradas"
            value={formatCurrency(income)}
            icon={<ArrowUpCircle className="w-5 h-5" />}
            variant="income"
            privacyCategory="income"
            privacyLabel="Entradas"
          />
          <SummaryCard
            title="Saídas"
            value={formatCurrency(expenses)}
            icon={<ArrowDownCircle className="w-5 h-5" />}
            variant="expense"
            privacyCategory="expenses"
            privacyLabel="Saídas"
          />
          <SummaryCard
            title="Gastos Fixos"
            value={formatCurrency(fixedExpenses)}
            icon={<TrendingDown className="w-5 h-5" />}
            variant="neutral"
            privacyCategory="fixed"
            privacyLabel="Gastos Fixos"
          />
          <SummaryCard
            title="Saldo"
            value={formatCurrency(balance)}
            icon={<Wallet className="w-5 h-5" />}
            variant={balance >= 0 ? 'income' : 'expense'}
            privacyCategory="balance"
            privacyLabel="Saldo"
          />
        </div>

        {/* Spending Limit + Credit Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SpendingLimitBar
            available={availableLimit}
            total={income}
            reserve={reserve}
            reservePercentage={reservePercentage}
          />
          <VaultWidget
            balance={vaultBalance}
            monthlyDeposits={vaultDeposits}
            monthlyWithdrawals={vaultWithdrawals}
            onWithdraw={withdrawFromVault}
          />
          {creditCards.map((card) => (
            <CreditCardWidget
              key={card.id}
              card={card}
              onUpdate={updateCreditCard}
              onPayInvoice={payInvoice}
              vaultBalance={vaultBalance}
              salaryBalance={salaryBalance}
            />
          ))}
        </div>

        {/* Reserve Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ReserveWidget
            income={salaryIncome}
            reservePercentage={reservePercentage}
            onReserveChange={setReservePercentage}
            onTransferToVault={transferToVault}
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
