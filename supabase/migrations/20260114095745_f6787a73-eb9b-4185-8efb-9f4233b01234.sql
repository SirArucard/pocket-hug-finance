-- Create recurring_expenses table
CREATE TABLE public.recurring_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    base_amount numeric,
    category text NOT NULL,
    is_variable boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own recurring_expenses"
ON public.recurring_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_expenses"
ON public.recurring_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_expenses"
ON public.recurring_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_expenses"
ON public.recurring_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();