import { PiggyBank, Settings2, ArrowRightLeft } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { BlurredValue } from '@/components/BlurredValue';
import { cn } from '@/lib/utils';

interface ReserveWidgetProps {
  income: number;
  reservePercentage: number;
  onReserveChange: (percentage: number) => void;
  onTransferToVault?: (amount: number) => Promise<boolean>;
}

export const ReserveWidget = ({
  income,
  reservePercentage,
  onReserveChange,
  onTransferToVault,
}: ReserveWidgetProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [tempPercentage, setTempPercentage] = useState(reservePercentage);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  const reserveAmount = income * (reservePercentage / 100);

  const handleSave = () => {
    onReserveChange(tempPercentage);
    setIsSettingsOpen(false);
  };

  const handleTransfer = async () => {
    if (!onTransferToVault) return;
    
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const success = await onTransferToVault(amount);
    
    if (success) {
      setTransferSuccess(true);
      setTransferAmount('');
      setIsTransferOpen(false);
      
      // Reset success state after 3 seconds
      setTimeout(() => setTransferSuccess(false), 3000);
    }
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
        <div className="flex items-center gap-1">
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Retirada pra reserva">
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Retirada pra Reserva</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Transferir valor do salário para o Cofre (Reserva)
                </p>
                <div className="space-y-2">
                  <Label>Valor a transferir</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder={reserveAmount.toFixed(2)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Reserva sugerida: {formatCurrency(reserveAmount)}
                  </p>
                </div>
                <Button onClick={handleTransfer} className="w-full">
                  Transferir para Cofre
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
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
      </div>
      <p className={cn(
        "text-2xl font-bold transition-colors duration-300",
        transferSuccess ? "text-income" : "text-warning"
      )}>
        <BlurredValue value={formatCurrency(reserveAmount)} />
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        🔒 Apenas para emergências e compras pontuais
      </p>
    </div>
  );
};
