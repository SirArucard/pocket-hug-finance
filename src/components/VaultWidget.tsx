import { Lock, ArrowDownCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface VaultWidgetProps {
  balance: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  onWithdraw?: (amount: number) => Promise<boolean>;
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

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= balance) {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!onWithdraw) return;
    
    const amount = parseFloat(withdrawAmount);
    const success = await onWithdraw(amount);
    
    if (success) {
      setWithdrawAmount('');
      setIsWithdrawOpen(false);
      setIsConfirmOpen(false);
    } else {
      setIsConfirmOpen(false);
    }
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
                  O valor será transferido para a conta principal.
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

                <Button 
                  onClick={handleWithdrawClick} 
                  className="w-full"
                  disabled={parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance}
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
              <AlertDialogDescription>
                Deseja confirmar a retirada de {formatCurrency(parseFloat(withdrawAmount) || 0)} do cofre para a conta principal?
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
          💡 Ganhos extras vão direto para o cofre
        </p>
      </CardContent>
    </Card>
  );
};
