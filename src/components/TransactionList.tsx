import { Transaction } from '@/types/finance';
import {
  categoryLabels,
  categoryIcons,
  paymentTypeLabels,
  formatCurrency,
} from '@/lib/financeUtils';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

export const TransactionList = ({ transactions, onRemove }: TransactionListProps) => {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (transactions.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <p className="text-muted-foreground">Nenhuma transação registrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em "Novo Lançamento" para começar
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass divide-y divide-border/50 overflow-hidden">
      {sortedTransactions.map((transaction, index) => (
        <div
          key={transaction.id}
          className={cn(
            'p-4 flex items-center justify-between hover:bg-muted/30 transition-colors',
            'animate-fade-in'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                transaction.type === 'income'
                  ? 'bg-income/20'
                  : 'bg-expense/20'
              )}
            >
              {categoryIcons[transaction.category]}
            </div>
            <div>
              <p className="font-medium">{transaction.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{categoryLabels[transaction.category]}</span>
                {transaction.paymentType && (
                  <>
                    <span>•</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium',
                        transaction.paymentType === 'debit' && 'bg-income/20 text-income',
                        transaction.paymentType === 'credit' && 'bg-credit-card/20 text-credit-card',
                        transaction.paymentType === 'food_voucher' && 'bg-food-voucher/20 text-food-voucher',
                        transaction.paymentType === 'transport_voucher' && 'bg-transport-voucher/20 text-transport-voucher'
                      )}
                    >
                      {paymentTypeLabels[transaction.paymentType]}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'font-semibold',
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              )}
            >
              {transaction.type === 'income' ? '+' : '-'}{' '}
              {formatCurrency(transaction.amount)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-expense"
              onClick={() => onRemove(transaction.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
