-- =============================================
-- SISTEMA DE MENSALISTAS
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela de mensalistas
CREATE TABLE IF NOT EXISTS monthly_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  total_cuts INTEGER NOT NULL DEFAULT 4,
  used_cuts INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de histórico de uso (para relatórios)
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES monthly_subscriptions(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service_name TEXT,
  barber_name TEXT
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_monthly_subscriptions_user ON monthly_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_subscriptions_status ON monthly_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON subscription_usage(subscription_id);

-- 4. Habilitar RLS
ALTER TABLE monthly_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "allow_all_monthly_subscriptions" ON monthly_subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_subscription_usage" ON subscription_usage
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_monthly_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_subscription
  BEFORE UPDATE ON monthly_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_subscription_timestamp();

-- 7. Verificar se foi criado
SELECT tablename FROM pg_tables 
WHERE tablename IN ('monthly_subscriptions', 'subscription_usage');
