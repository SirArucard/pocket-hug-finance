-- Add user_id columns to all tables
ALTER TABLE public.transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.credit_cards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public policies on transactions
DROP POLICY IF EXISTS "Allow public read access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public delete access" ON public.transactions;

-- Drop existing public policies on credit_cards
DROP POLICY IF EXISTS "Allow public read access" ON public.credit_cards;
DROP POLICY IF EXISTS "Allow public insert access" ON public.credit_cards;
DROP POLICY IF EXISTS "Allow public update access" ON public.credit_cards;
DROP POLICY IF EXISTS "Allow public delete access" ON public.credit_cards;

-- Drop existing public policies on settings
DROP POLICY IF EXISTS "Allow public read access" ON public.settings;
DROP POLICY IF EXISTS "Allow public insert access" ON public.settings;
DROP POLICY IF EXISTS "Allow public update access" ON public.settings;
DROP POLICY IF EXISTS "Allow public delete access" ON public.settings;

-- Create user-scoped policies for transactions
CREATE POLICY "Users can read own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user-scoped policies for credit_cards
CREATE POLICY "Users can read own credit_cards"
ON public.credit_cards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit_cards"
ON public.credit_cards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit_cards"
ON public.credit_cards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit_cards"
ON public.credit_cards FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user-scoped policies for settings
CREATE POLICY "Users can read own settings"
ON public.settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
ON public.settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);