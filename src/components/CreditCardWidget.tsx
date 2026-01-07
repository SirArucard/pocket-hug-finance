import { CreditCard as CreditCardIcon, Edit2, Eye, FileText, Wallet } from 'lucide-react';
import { CreditCard } from '@/types/finance';
import { formatCurrency } from '@/lib/financeUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { BlurredValue } from '@/components/BlurredValue';

interface CreditCardWidgetProps {
  card: CreditCard;
  onUpdate: (id: string, updates: Partial<CreditCard>) => void;
  onPayInvoice?: (amount: number, source: 'salary' | 'vault') => Promise<boolean>;
  vaultBalance?: number;
  salaryBalance?: number;
}

export const CreditCardWidget = ({ 
  card, 
  onUpdate, 
  onPayInvoice,
  vaultBalance = 0,
  salaryBalance = 0,
}: CreditCardWidgetProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [limit, setLimit] = useState(card.limit.toString());
  const [showInvoice, setShowInvoice] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paySource, setPaySource] = useState<'salary' | 'vault'>('salary');
  
  const usedPercentage = (card.usedLimit / card.limit) * 100;
  const available = card.limit - card.usedLimit;

  const getStatus = () => {
    if (usedPercentage >= 90) return 'critical';
    if (usedPercentage >= 70) return 'warning';
    return 'good';
  };

  const status = getStatus();

  const handleSave = () => {
    onUpdate(card.id, { limit: parseFloat(limit) || card.limit });
    setIsEditOpen(false);
  };

  const handlePayInvoice = async () => {
    if (!onPayInvoice) return;
    
    const amount = parseFloat(payAmount) || card.usedLimit;
    const success = await onPayInvoice(amount, paySource);
    
    if (success) {
      setPayAmount('');
      setIsPayOpen(false);
    }
  };

  const toggleView = () => setShowInvoice(!showInvoice);

  return (
    <div className="gradient-card rounded-xl p-5 text-white relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5" />
            <span className="font-medium">{card.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={toggleView}
              title={showInvoice ? 'Ver Limite' : 'Ver Fatura'}
            >
              {showInvoice ? <Eye className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Limite do Cartão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Limite Total</Label>
                    <Input
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">
              {showInvoice ? 'Fatura Atual' : 'Limite Disponível'}
            </p>
            <p className="text-2xl font-bold">
              <BlurredValue value={formatCurrency(showInvoice ? card.usedLimit : available)} />
            </p>
          </div>

          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                status === 'good' && 'bg-white',
                status === 'warning' && 'bg-warning',
                status === 'critical' && 'bg-expense'
              )}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/70">
            <span>Usado: <BlurredValue value={formatCurrency(card.usedLimit)} /></span>
            <span>Limite: <BlurredValue value={formatCurrency(card.limit)} /></span>
          </div>

          {/* Pay Invoice Button */}
          {card.usedLimit > 0 && (
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Pagar Fatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pagar Fatura</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Valor pago?</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={card.usedLimit.toString()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fatura atual: {formatCurrency(card.usedLimit)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Origem do dinheiro?</Label>
                    <Select value={paySource} onValueChange={(v) => setPaySource(v as 'salary' | 'vault')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">
                          Salário ({formatCurrency(salaryBalance)} disponível)
                        </SelectItem>
                        <SelectItem value="vault">
                          Cofre ({formatCurrency(vaultBalance)} disponível)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handlePayInvoice} className="w-full">
                    Confirmar Pagamento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};
