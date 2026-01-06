import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/financeUtils';

interface VaultWidgetProps {
  balance: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
}

export const VaultWidget = ({ balance, monthlyDeposits, monthlyWithdrawals }: VaultWidgetProps) => {
  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          Cofre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Saldo Total</p>
          <p className="text-2xl font-bold text-amber-500">
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Depósitos (mês)</p>
            <p className="text-sm font-medium text-income">
              +{formatCurrency(monthlyDeposits)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Retiradas (mês)</p>
            <p className="text-sm font-medium text-expense">
              -{formatCurrency(monthlyWithdrawals)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">
          💡 Ganhos extras vão direto para o cofre
        </p>
      </CardContent>
    </Card>
  );
};