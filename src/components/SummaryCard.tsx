import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: 'default' | 'income' | 'expense' | 'warning' | 'neutral';
  subtitle?: string;
}

export const SummaryCard = ({
  title,
  value,
  icon,
  variant = 'default',
  subtitle,
}: SummaryCardProps) => {
  const variantStyles = {
    default: 'border-border/50',
    income: 'border-income/30 bg-income/5',
    expense: 'border-expense/30 bg-expense/5',
    warning: 'border-warning/30 bg-warning/5',
    neutral: 'border-muted/50 bg-muted/20',
  };

  const textStyles = {
    default: 'text-foreground',
    income: 'text-income',
    expense: 'text-expense',
    warning: 'text-warning',
    neutral: 'text-muted-foreground',
  };

  return (
    <div
      className={cn(
        'card-glass p-4 sm:p-5 animate-fade-in',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {title}
          </p>
          <p className={cn('text-xl sm:text-2xl font-bold', textStyles[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'p-2 sm:p-3 rounded-lg',
            variant === 'income' && 'bg-income/20 text-income',
            variant === 'expense' && 'bg-expense/20 text-expense',
            variant === 'warning' && 'bg-warning/20 text-warning',
            variant === 'neutral' && 'bg-muted/30 text-muted-foreground',
            variant === 'default' && 'bg-primary/20 text-primary'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
