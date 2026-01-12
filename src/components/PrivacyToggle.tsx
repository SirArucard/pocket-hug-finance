import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PrivacyToggle = () => {
  const { hideAll, toggleHideAll } = usePrivacy();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${hideAll ? 'text-warning' : 'text-muted-foreground'}`}
            onClick={toggleHideAll}
          >
            {hideAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hideAll ? 'Mostrar' : 'Ocultar'} todos os valores</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
