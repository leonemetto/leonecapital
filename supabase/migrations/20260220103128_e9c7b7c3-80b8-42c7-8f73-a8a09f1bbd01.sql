
-- Create criteria_settings table
CREATE TABLE public.criteria_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.criteria_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own criteria" ON public.criteria_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own criteria" ON public.criteria_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own criteria" ON public.criteria_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own criteria" ON public.criteria_settings FOR DELETE USING (auth.uid() = user_id);

-- Create trade_verifications table (stores checklist results per trade)
CREATE TABLE public.trade_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  user_id UUID NOT NULL,
  checks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trade_id)
);

ALTER TABLE public.trade_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trade verifications" ON public.trade_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trade verifications" ON public.trade_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trade verifications" ON public.trade_verifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trade verifications" ON public.trade_verifications FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function (reuse if exists, otherwise create)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_criteria_settings_updated_at
  BEFORE UPDATE ON public.criteria_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trade_verifications_updated_at
  BEFORE UPDATE ON public.trade_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
