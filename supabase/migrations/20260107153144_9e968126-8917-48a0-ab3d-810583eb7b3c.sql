-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_type TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  installments INTEGER,
  current_installment INTEGER,
  parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_cards table
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Cartão Principal',
  card_limit NUMERIC NOT NULL DEFAULT 5000,
  used_limit NUMERIC NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 15,
  due_day INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for reserve percentage
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserve_percentage INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default credit card
INSERT INTO public.credit_cards (name, card_limit, used_limit, closing_day, due_day)
VALUES ('Cartão Principal', 5000, 0, 15, 25);

-- Insert default settings
INSERT INTO public.settings (reserve_percentage)
VALUES (10);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS but allow public access (no auth required for this app)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create public access policies (app doesn't require authentication)
CREATE POLICY "Allow public read access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.credit_cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.credit_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.credit_cards FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.credit_cards FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.settings FOR DELETE USING (true);