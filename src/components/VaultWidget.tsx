import { Lock, ArrowDownCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/financeUtils';
import { BlurredValue } from '@/components/BlurredValue';
import { CategoryPrivacyToggle } from '@/components/CategoryPrivacyToggle';
import { useState } from 'react';
import { VaultDestinationType } from '@/types/finance';

interface VaultWidgetProps {
  balance: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  onWithdraw?: (amount: number, reason: string, destinationType: VaultDestinationType) => Promise<boolean>;
}

export const VaultWidget = ({ 
  balance, 
  monthlyDeposits, 
  monthlyWithdrawals,
  onWithdraw 
}: VaultWidgetProps) => {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [reason, setReason] = useState('');
  const [destinationType, setDestinationType] = useState<VaultDestinationType>('INCOME_TRANSFER');

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= balance && reason.trim()) {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!onWithdraw) return;
    
    const amount = parseFloat(withdrawAmount);
    const success = await onWithdraw(amount, reason.trim(), destinationType);
    
    if (success) {
      setWithdrawAmount('');
      setReason('');
      setDestinationType('INCOME_TRANSFER');
      setIsWithdrawOpen(false);
      setIsConfirmOpen(false);
    } else {
      setIsConfirmOpen(false);
    }
  };

  const getDestinationLabel = () => {
    return destinationType === 'INCOME_TRANSFER' 
      ? 'Enviar para Entradas (afeta saldo)' 
      : 'Uso Direto (não afeta orçamento)';
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          Cofre
          <CategoryPrivacyToggle category="vault" label="Cofre" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Saldo Total</p>
          <p className="text-2xl font-bold text-amber-500">
            <BlurredValue value={formatCurrency(balance)} category="vault" />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Depósitos (mês)</p>
            <p className="text-sm font-medium text-income">
              +<BlurredValue value={formatCurrency(monthlyDeposits)} category="vault" />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Retiradas (mês)</p>
            <p className="text-sm font-medium text-expense">
              -<BlurredValue value={formatCurrency(monthlyWithdrawals)} category="vault" />
            </p>
          </div>
        </div>
        
        {/* Withdraw Button */}
        {balance > 0 && onWithdraw && (
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mt-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Retirar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Retirar do Cofre</DialogTitle>
                <DialogDescription>
                  Escolha o destino do valor retirado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Valor a retirar</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saldo disponível: {formatCurrency(balance)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Pagamento de conta, Emergência..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destino</Label>
                  <RadioGroup 
                    value={destinationType} 
                    onValueChange={(value) => setDestinationType(value as VaultDestinationType)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50">
                      <RadioGroupItem value="INCOME_TRANSFER" id="income" />
                      <Label htmlFor="income" className="flex-1 cursor-pointer">
                        <span className="font-medium">Enviar para Entradas</span>
                        <p className="text-xs text-muted-foreground">
                          Adiciona às Entradas e afeta o Saldo do mês
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50">
                      <RadioGroupItem value="DIRECT_USE" id="direct" />
                      <Label htmlFor="direct" className="flex-1 cursor-pointer">
                        <span className="font-medium">Uso Direto</span>
                        <p className="text-xs text-muted-foreground">
                          Invisível ao orçamento mensal, afeta apenas o Cofre
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleWithdrawClick} 
                  className="w-full"
                  disabled={
                    parseFloat(withdrawAmount) <= 0 || 
                    parseFloat(withdrawAmount) > balance ||
                    !reason.trim()
                  }
                >
                  Retirar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Retirada</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Deseja confirmar a retirada de <strong>{formatCurrency(parseFloat(withdrawAmount) || 0)}</strong> do cofre?
                </p>
                <p><strong>Motivo:</strong> {reason}</p>
                <p><strong>Destino:</strong> {getDestinationLabel()}</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmWithdraw}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground italic">
          💡 Valores extras vão direto para o cofre
        </p>
      </CardContent>
    </Card>
  );
};
