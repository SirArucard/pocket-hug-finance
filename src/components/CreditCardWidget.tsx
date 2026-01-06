import { CreditCard as CreditCardIcon, Edit2 } from 'lucide-react';
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
import { useState } from 'react';

interface CreditCardWidgetProps {
  card: CreditCard;
  onUpdate: (id: string, updates: Partial<CreditCard>) => void;
}

export const CreditCardWidget = ({ card, onUpdate }: CreditCardWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [limit, setLimit] = useState(card.limit.toString());
  
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
    setIsOpen(false);
  };

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
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">Limite Disponível</p>
            <p className="text-2xl font-bold">{formatCurrency(available)}</p>
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
            <span>Usado: {formatCurrency(card.usedLimit)}</span>
            <span>Limite: {formatCurrency(card.limit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
