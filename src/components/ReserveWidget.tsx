import { PiggyBank, Settings2 } from 'lucide-react';
import { formatCurrency } from '@/lib/financeUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface ReserveWidgetProps {
  income: number;
  reservePercentage: number;
  onReserveChange: (percentage: number) => void;
}

export const ReserveWidget = ({
  income,
  reservePercentage,
  onReserveChange,
}: ReserveWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPercentage, setTempPercentage] = useState(reservePercentage);
  
  const reserveAmount = income * (reservePercentage / 100);

  const handleSave = () => {
    onReserveChange(tempPercentage);
    setIsOpen(false);
  };

  return (
    <div className="card-glass p-5 border-warning/30 bg-warning/5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning/20">
            <PiggyBank className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Reserva Mensal</h3>
            <p className="text-xs text-muted-foreground">{reservePercentage}% do salário</p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Porcentagem da Reserva</Label>
                  <span className="font-bold text-warning">{tempPercentage}%</span>
                </div>
                <Slider
                  value={[tempPercentage]}
                  onValueChange={(value) => setTempPercentage(value[0])}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Com {tempPercentage}% você economizará{' '}
                  <span className="text-warning font-medium">
                    {formatCurrency(income * (tempPercentage / 100))}
                  </span>{' '}
                  por mês
                </p>
              </div>
              <Button onClick={handleSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-2xl font-bold text-warning">{formatCurrency(reserveAmount)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        🔒 Apenas para emergências e compras pontuais
      </p>
    </div>
  );
};
