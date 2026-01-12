import { usePrivacy, PrivacyCategory } from '@/contexts/PrivacyContext';
import { cn } from '@/lib/utils';

interface BlurredValueProps {
  value: string;
  category?: PrivacyCategory;
  className?: string;
}

export const BlurredValue = ({ value, category, className }: BlurredValueProps) => {
  const { isHidden } = usePrivacy();

  const shouldBlur = category ? isHidden(category) : false;

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
