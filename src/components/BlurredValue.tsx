import { usePrivacy } from '@/contexts/PrivacyContext';
import { cn } from '@/lib/utils';

interface BlurredValueProps {
  value: string;
  blurOnIncome?: boolean; // True if this should blur when hideIncome is on (for Entradas, Cofre, Saldo)
  className?: string;
}

export const BlurredValue = ({ value, blurOnIncome = false, className }: BlurredValueProps) => {
  const { hideIncome, hideAll } = usePrivacy();

  const shouldBlur = hideAll || (blurOnIncome && hideIncome);

  return (
    <span
      className={cn(
        'transition-all duration-200',
        shouldBlur && 'blur-md select-none',
        className
      )}
    >
      {value}
    </span>
  );
};
