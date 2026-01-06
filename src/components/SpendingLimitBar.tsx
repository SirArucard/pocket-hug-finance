import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financeUtils';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface SpendingLimitBarProps {
  available: number;
  total: number;
  reserve: number;
  reservePercentage: number;
}

export const SpendingLimitBar = ({
  available,
  total,
  reserve,
  reservePercentage,
}: SpendingLimitBarProps) => {
  const usedPercentage = total > 0 ? Math.min(100, ((total - available - reserve) / total) * 100) : 0;
  const reservePercentageOfTotal = total > 0 ? (reserve / total) * 100 : 0;
  const availablePercentage = total > 0 ? (available / total) * 100 : 0;

  const getStatus = () => {
    if (available <= 0) return 'critical';
    if (availablePercentage < 20) return 'warning';
    return 'good';
  };

  const status = getStatus();

  return (
    <div className="card-glass p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Limite Disponível</h3>
        </div>
        <div className="flex items-center gap-2">
          {status === 'good' && <CheckCircle className="w-4 h-4 text-income" />}
          {status === 'warning' && <AlertTriangle className="w-4 h-4 text-warning" />}
          {status === 'critical' && <AlertTriangle className="w-4 h-4 text-expense" />}
          <span
            className={cn(
              'text-sm font-medium',
              status === 'good' && 'text-income',
              status === 'warning' && 'text-warning',
              status === 'critical' && 'text-expense'
            )}
          >
            {status === 'good' && 'Dentro do limite'}
            {status === 'warning' && 'Atenção'}
            {status === 'critical' && 'Limite excedido'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Próximo gasto disponível</span>
          <span
            className={cn(
              'font-bold',
              status === 'good' && 'text-income',
              status === 'warning' && 'text-warning',
              status === 'critical' && 'text-expense'
            )}
          >
            {formatCurrency(Math.max(0, available))}
          </span>
        </div>

        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-expense transition-all duration-500"
            style={{ width: `${usedPercentage}%` }}
          />
          <div
            className="h-full bg-warning transition-all duration-500"
            style={{ width: `${reservePercentageOfTotal}%` }}
          />
          <div
            className="h-full bg-income transition-all duration-500"
            style={{ width: `${availablePercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-expense" />
            <span>Gasto</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>Reserva ({reservePercentage}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-income" />
            <span>Disponível</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 Mantenha sua reserva de {formatCurrency(reserve)} intocada para emergências
        </p>
      </div>
    </div>
  );
};
