-- Add best_buy_day to credit_cards (Melhor Dia de Compra)
ALTER TABLE public.credit_cards 
ADD COLUMN IF NOT EXISTS best_buy_day integer NOT NULL DEFAULT 7;

-- Add reason and destination_type to transactions for vault withdrawals
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS destination_type text;

-- Add constraint for destination_type values
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_destination_type_check 
CHECK (destination_type IS NULL OR destination_type IN ('INCOME_TRANSFER', 'DIRECT_USE'));