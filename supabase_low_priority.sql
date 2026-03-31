-- =============================================
-- FUNCIONALIDADES BAIXAS (Diferencial competitivo)
-- 1. Sistema de Indicações
-- 2. Controle de Estoque
-- 3. Fidelidade por Pontos
-- 4. Agendamento Online (Link público)
-- =============================================

-- ==========================================
-- 1. SISTEMA DE INDICAÇÕES
-- ==========================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) NOT NULL, -- Quem indicou
  referred_id UUID REFERENCES profiles(id), -- Quem foi indicado (se cadastrou)
  referred_name TEXT, -- Nome de quem foi indicado (se não cadastrou ainda)
  referred_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT DEFAULT 'discount', -- Tipo de recompensa (discount, free_service, points)
  reward_value DECIMAL(10,2), -- Valor da recompensa
  completed_at TIMESTAMP WITH TIME ZONE, -- Quando a indicação foi completada
  rewarded_at TIMESTAMP WITH TIME ZONE, -- Quando a recompensa foi entregue
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. CONTROLE DE ESTOQUE
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Ex: Pomada, Shampoo, Loção, etc
  unit TEXT DEFAULT 'un', -- Unidade (un, ml, g, etc)
  cost_price DECIMAL(10,2), -- Preço de custo
  sale_price DECIMAL(10,2), -- Preço de venda
  stock_quantity INTEGER DEFAULT 0, -- Quantidade em estoque
  min_stock INTEGER DEFAULT 5, -- Estoque mínimo para alerta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment', 'sale')),
  quantity INTEGER NOT NULL,
  reason TEXT, -- Motivo da movimentação
  reference_id UUID, -- ID de referência (venda, compra, etc)
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. FIDELIDADE POR PONTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0, -- Total de pontos ganhos (histórico)
  total_redeemed INTEGER DEFAULT 0, -- Total de pontos resgatados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjustment')),
  points INTEGER NOT NULL, -- Positivo para ganho, negativo para resgate
  description TEXT,
  appointment_id UUID REFERENCES appointments(id), -- Se ganhou por agendamento
  reward_id UUID, -- Se resgatou uma recompensa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL, -- Quantos pontos custa
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. CONFIGURAÇÃO DE AGENDAMENTO ONLINE
-- ==========================================
CREATE TABLE IF NOT EXISTS online_booking_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_name TEXT DEFAULT 'Barbearia',
  salon_phone TEXT,
  salon_address TEXT,
  salon_logo_url TEXT,
  booking_enabled BOOLEAN DEFAULT true,
  advance_days INTEGER DEFAULT 7, -- Quantos dias à frente pode agendar
  min_hours_before INTEGER DEFAULT 2, -- Mínimo de horas antes para agendar
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- Dias da semana (0=Dom, 6=Sáb)
  slot_duration INTEGER DEFAULT 30, -- Duração de cada slot em minutos
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO online_booking_config (salon_name) 
VALUES ('Barbearia')
ON CONFLICT DO NOTHING;

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity, min_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_booking_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_referrals" ON referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stock_movements" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loyalty_points" ON loyalty_points FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loyalty_rewards" ON loyalty_rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_online_booking_config" ON online_booking_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir leitura pública para agendamento online
CREATE POLICY "public_read_online_config" ON online_booking_config FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_services" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_barbers" ON barbers FOR SELECT TO anon USING (true);

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON TABLE referrals IS 'Sistema de indicações - clientes indicam amigos e ganham recompensas';
COMMENT ON TABLE products IS 'Produtos para venda (pomadas, shampoos, etc)';
COMMENT ON TABLE stock_movements IS 'Movimentações de estoque (entrada, saída, venda)';
COMMENT ON TABLE loyalty_points IS 'Saldo de pontos de fidelidade por cliente';
COMMENT ON TABLE loyalty_transactions IS 'Histórico de transações de pontos';
COMMENT ON TABLE loyalty_rewards IS 'Recompensas disponíveis para resgate';
COMMENT ON TABLE online_booking_config IS 'Configuração do agendamento online público';

-- Verificar criação
SELECT tablename FROM pg_tables 
WHERE tablename IN ('referrals', 'products', 'stock_movements', 'loyalty_points', 'loyalty_transactions', 'loyalty_rewards', 'online_booking_config');
