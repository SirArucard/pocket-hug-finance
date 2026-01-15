import { useState } from 'react';
import { RecurringExpense, Transaction, ExpenseCategory } from '@/types/finance';
import { CheckCircle2, Circle, Plus, AlertCircle, Loader2, Pencil, Trash2, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RecurringBillsWidgetProps {
  recurringExpenses: RecurringExpense[];
  currentTransactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  onAddRecurringExpense?: (expense: Omit<RecurringExpense, 'id' | 'active'>) => Promise<void>;
  onUpdateRecurringExpense?: (id: string, updates: Partial<RecurringExpense>) => Promise<void>;
  onRemoveRecurringExpense?: (id: string) => Promise<void>;
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'fixed_bills', label: 'Contas Fixas' },
  { value: 'food', label: 'Alimentação' },
  { value: 'transport', label: 'Transporte' },
  { value: 'health', label: 'Saúde' },
  { value: 'lifestyle', label: 'Estilo de Vida' },
];

export const RecurringBillsWidget = ({
  recurringExpenses = [],
  currentTransactions,
  onAddTransaction,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onRemoveRecurringExpense,
}: RecurringBillsWidgetProps) => {
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [amount, setAmount] = useState('');
  const [isLaunchOpen, setIsLaunchOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Form states for add/edit
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fixed_bills');
  const [formIsVariable, setFormIsVariable] = useState(false);

  // Verifica se a conta já foi paga neste mês (comparando nome)
  const isPaid = (name: string) => {
    return currentTransactions.some(
      (t) => t.name.toLowerCase() === name.toLowerCase() && t.type === 'expense'
    );
  };

  const handleLaunchClick = (expense: RecurringExpense) => {
    if (isPaid(expense.name)) return;

    if (expense.isVariable) {
      setSelectedExpense(expense);
      setAmount(expense.baseAmount > 0 ? expense.baseAmount.toString() : '');
      setIsLaunchOpen(true);
    } else {
      handleSubmitLaunch(expense, expense.baseAmount);
    }
  };

  const handleSubmitLaunch = async (expense: RecurringExpense, value: number) => {
    try {
      setLoadingId(expense.id);
      await onAddTransaction({
        name: expense.name,
        amount: value,
        category: 'fixed_bills',
        type: 'expense',
        paymentType: 'debit',
        date: new Date().toISOString().split('T')[0],
      });
      setIsLaunchOpen(false);
      setSelectedExpense(null);
      setAmount('');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmVariableLaunch = () => {
    if (selectedExpense && amount) {
      handleSubmitLaunch(selectedExpense, parseFloat(amount));
    }
  };

  const handleEditClick = (expense: RecurringExpense) => {
    setSelectedExpense(expense);
    setFormName(expense.name);
    setFormAmount(expense.baseAmount.toString());
    setFormCategory(expense.category);
    setFormIsVariable(expense.isVariable);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedExpense || !onUpdateRecurringExpense) return;
    
    try {
      setLoadingId(selectedExpense.id);
      await onUpdateRecurringExpense(selectedExpense.id, {
        name: formName,
        baseAmount: parseFloat(formAmount) || 0,
        category: formCategory,
        isVariable: formIsVariable,
      });
      setIsEditOpen(false);
      setSelectedExpense(null);
      resetForm();
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteClick = async (expense: RecurringExpense) => {
    if (!onRemoveRecurringExpense) return;
    
    try {
      setLoadingId(expense.id);
      await onRemoveRecurringExpense(expense.id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!onAddRecurringExpense || !formName) return;
    
    try {
      setLoadingId('new');
      await onAddRecurringExpense({
        name: formName,
        baseAmount: parseFloat(formAmount) || 0,
        category: formCategory,
        isVariable: formIsVariable,
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setLoadingId(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormCategory('fixed_bills');
    setFormIsVariable(false);
  };

  // Ordena: Pendentes primeiro, Pagas depois
  const sortedExpenses = [...recurringExpenses].sort((a, b) => {
    const paidA = isPaid(a.name) ? 1 : 0;
    const paidB = isPaid(b.name) ? 1 : 0;
    return paidA - paidB;
  });

  // Calculate total of base amounts
  const totalFixedExpenses = recurringExpenses.reduce((sum, exp) => sum + (exp.baseAmount || 0), 0);

  return (
    <div className="gradient-card rounded-xl p-5 text-white space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-300" />
            Contas Fixas do Mês
          </h3>
          <p className="text-lg font-bold mt-1">{formatCurrency(totalFixedExpenses)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {recurringExpenses.filter(e => isPaid(e.name)).length}/{recurringExpenses.length} Pagas
          </span>
          {onAddRecurringExpense && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
              onClick={handleAddClick}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortedExpenses.length === 0 ? (
          <p className="text-sm text-white/60 text-center py-4">
            Nenhuma conta recorrente cadastrada
          </p>
        ) : (
          sortedExpenses.map((expense) => {
            const paid = isPaid(expense.name);
            const isLoading = loadingId === expense.id;
            
            return (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all border border-white/5 ${
                  paid ? 'bg-white/5 opacity-60' : 'bg-white/10 hover:bg-white/20 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {paid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/50 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{expense.name}</p>
                    <p className="text-xs text-white/70">
                      {expense.isVariable ? 'Valor Variável' : formatCurrency(expense.baseAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!paid && (
                    <>
                      {onUpdateRecurringExpense && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading}
                          className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20"
                          onClick={() => handleEditClick(expense)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      {onRemoveRecurringExpense && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading}
                          className="h-7 w-7 p-0 text-white/70 hover:text-red-400 hover:bg-white/20"
                          onClick={() => handleDeleteClick(expense)}
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isLoading}
                        className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
                        onClick={() => handleLaunchClick(expense)}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                        Lançar
                      </Button>
                    </>
                  )}
                  {paid && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 text-[10px] h-6">
                      Pago
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Lançar valor variável */}
      <Dialog open={isLaunchOpen} onOpenChange={setIsLaunchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar {selectedExpense?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label>Valor da conta este mês</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && confirmVariableLaunch()}
                />
             </div>
             {selectedExpense?.baseAmount ? (
                <p className="text-xs text-muted-foreground">Valor base sugerido: {formatCurrency(selectedExpense.baseAmount)}</p>
             ) : null}
          </div>
          <DialogFooter>
            <Button onClick={confirmVariableLaunch} disabled={!amount || loadingId !== null}>
              Confirmar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar conta recorrente */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta Recorrente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Internet"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Base</Label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isVariable"
                checked={formIsVariable}
                onCheckedChange={setFormIsVariable}
              />
              <Label htmlFor="isVariable">Valor variável (ex: conta de luz)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formName || loadingId !== null}>
              {loadingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar conta recorrente */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta Recorrente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Netflix"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Base</Label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isVariableAdd"
                checked={formIsVariable}
                onCheckedChange={setFormIsVariable}
              />
              <Label htmlFor="isVariableAdd">Valor variável (ex: conta de luz)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSubmit} disabled={!formName || loadingId === 'new'}>
              {loadingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
