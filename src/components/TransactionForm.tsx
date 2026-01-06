import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction, ExpenseCategory, IncomeCategory, PaymentType } from '@/types/finance';
import {
  categoryLabels,
  paymentTypeLabels,
  getCurrentMonth,
} from '@/lib/financeUtils';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>, installments?: number) => void;
}

export const TransactionForm = ({ onSubmit }: TransactionFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('food');
  const [paymentType, setPaymentType] = useState<PaymentType>('debit');
  const [installments, setInstallments] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const expenseCategories: ExpenseCategory[] = [
    'fixed_bills',
    'food',
    'transport',
    'health',
    'lifestyle',
    'vault_withdrawal',
  ];

  const incomeCategories: IncomeCategory[] = [
    'salary',
    'extra',
    'food_voucher',
    'transport_voucher',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: Omit<Transaction, 'id'> = {
      name,
      amount: parseFloat(amount),
      category,
      type,
      paymentType: type === 'expense' ? paymentType : undefined,
      date,
    };

    const numInstallments = paymentType === 'credit' ? parseInt(installments) : 1;
    onSubmit(transaction, numInstallments);

    // Reset form
    setName('');
    setAmount('');
    setInstallments('1');
    setIsOpen(false);
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    if (newType === 'income') {
      setCategory('salary');
    } else {
      setCategory('food');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-income text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn(
                'flex-1 gap-2',
                type === 'income' && 'gradient-income text-primary-foreground'
              )}
              onClick={() => handleTypeChange('income')}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Entrada
            </Button>
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn(
                'flex-1 gap-2',
                type === 'expense' && 'gradient-expense text-destructive-foreground'
              )}
              onClick={() => handleTypeChange('expense')}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Saída
            </Button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado, Aluguel..."
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as ExpenseCategory | IncomeCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type === 'income'
                  ? incomeCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))
                  : expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type (only for expenses) */}
          {type === 'expense' && (
            <div className="space-y-2">
              <Label>Tipo de Pagamento</Label>
              <Select
                value={paymentType}
                onValueChange={(value) => setPaymentType(value as PaymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Installments (only for credit card) */}
          {type === 'expense' && paymentType === 'credit' && (
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x {num > 1 && `de R$ ${(parseFloat(amount || '0') / num).toFixed(2)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Adicionar Lançamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
