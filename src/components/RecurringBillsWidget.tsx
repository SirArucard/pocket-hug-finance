import { useState } from 'react';
import { RecurringExpense, Transaction } from '@/types/finance';
import { CheckCircle2, Circle, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/financeUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface RecurringBillsWidgetProps {
  recurringExpenses: RecurringExpense[];
  currentTransactions: Transaction[];
  onAddTransaction: (transaction: any) => Promise<void>;
}

export const RecurringBillsWidget = ({
  recurringExpenses,
  currentTransactions,
  onAddTransaction,
}: RecurringBillsWidgetProps) => {
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Verifica se a conta já foi paga neste mês (comparando nome)
  const isPaid = (name: string) => {
    return currentTransactions.some(
      (t) => t.name.toLowerCase() === name.toLowerCase() && t.type === 'expense'
    );
  };

  const handleClick = (expense: RecurringExpense) => {
    if (isPaid(expense.name)) return;

    if (expense.isVariable) {
      // Se for variável, abre modal para perguntar o valor
      setSelectedExpense(expense);
      setAmount(expense.baseAmount > 0 ? expense.baseAmount.toString() : '');
      setIsOpen(true);
    } else {
      // Se for fixo, lança direto
      handleSubmit(expense, expense.baseAmount);
    }
  };

  const handleSubmit = async (expense: RecurringExpense, value: number) => {
    try {
      setLoadingId(expense.id);
      await onAddTransaction({
        name: expense.name,
        amount: value,
        category: expense.category,
        type: 'expense',
        paymentType: 'debit', // Assume débito/pix para contas fixas
        date: new Date().toISOString().split('T')[0],
      });
      setIsOpen(false);
      setSelectedExpense(null);
      setAmount('');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmVariableExpense = () => {
    if (selectedExpense && amount) {
      handleSubmit(selectedExpense, parseFloat(amount));
    }
  };

  // Ordena: Pendentes primeiro, Pagas depois
  const sortedExpenses = [...recurringExpenses].sort((a, b) => {
    const paidA = isPaid(a.name) ? 1 : 0;
    const paidB = isPaid(b.name) ? 1 : 0;
    return paidA - paidB;
  });

  if (recurringExpenses.length === 0) return null;

  return (
    <div className="gradient-card rounded-xl p-5 text-white space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-300" />
          Contas Fixas do Mês
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
          {recurringExpenses.filter(e => isPaid(e.name)).length}/{recurringExpenses.length} Pagas
        </span>
      </div>

      <div className="space-y-2">
        {sortedExpenses.map((expense) => {
          const paid = isPaid(expense.name);
          const isLoading = loadingId === expense.id;
          
          return (
            <div
              key={expense.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all border border-white/5 ${
                paid ? 'bg-white/5 opacity-60' : 'bg-white/10 hover:bg-white/20 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {paid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-white/50" />
                )}
                <div>
                  <p className="font-medium text-sm">{expense.name}</p>
                  <p className="text-xs text-white/70">
                    {expense.isVariable ? 'Valor Variável' : formatCurrency(expense.baseAmount)}
                  </p>
                </div>
              </div>

              {!paid && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isLoading}
                  className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
                  onClick={() => handleClick(expense)}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Lançar
                </Button>
              )}
              {paid && (
                <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 text-[10px] h-6">
                  Pago
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar {selectedExpense?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Valor da conta este mês</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && confirmVariableExpense()}
                />
             </div>
             {selectedExpense?.baseAmount ? (
                <p className="text-xs text-muted-foreground">Valor base sugerido: {formatCurrency(selectedExpense.baseAmount)}</p>
             ) : null}
          </div>
          <DialogFooter>
            <Button onClick={confirmVariableExpense} disabled={!amount || loadingId !== null}>
              Confirmar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
