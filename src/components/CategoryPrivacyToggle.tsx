import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrivacy, PrivacyCategory } from '@/contexts/PrivacyContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CategoryPrivacyToggleProps {
  category: PrivacyCategory;
  label: string;
  className?: string;
}

export const CategoryPrivacyToggle = ({ 
  category, 
  label, 
  className = '' 
}: CategoryPrivacyToggleProps) => {
  const { isHidden, toggleCategory, hideAll } = usePrivacy();

  const hidden = isHidden(category);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${hidden ? 'text-warning' : 'text-muted-foreground'} ${className}`}
            onClick={() => toggleCategory(category)}
            disabled={hideAll}
          >
            {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hidden ? 'Mostrar' : 'Ocultar'} {label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
