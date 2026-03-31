-- =============================================
-- SISTEMA DE PONTOS DE FIDELIDADE - COMPLETO
-- =============================================

-- Tabela de níveis (se não existir)
CREATE TABLE IF NOT EXISTS loyalty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  color TEXT DEFAULT '#d4af37',
  icon TEXT DEFAULT 'star',
  benefits TEXT
);

-- Tabela de saldo de pontos
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de transações
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus', 'referral')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recompensas
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração de pontos
CREATE TABLE IF NOT EXISTS loyalty_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_per_appointment INTEGER DEFAULT 10,
  points_per_real_spent DECIMAL(5,2) DEFAULT 1,
  bonus_review INTEGER DEFAULT 5,
  bonus_referral INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE loyalty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can view loyalty levels" ON loyalty_levels FOR SELECT USING (true);
CREATE POLICY "Users can view own loyalty points" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage loyalty points" ON loyalty_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON loyalty_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view active rewards" ON loyalty_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rewards" ON loyalty_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Anyone can view loyalty config" ON loyalty_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage loyalty config" ON loyalty_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Dados iniciais
INSERT INTO loyalty_levels (name, min_points, discount_percentage, color, icon, benefits) VALUES
  ('Bronze', 0, 0, '#cd7f32', 'star', 'Bem-vindo ao programa de fidelidade'),
  ('Prata', 100, 5, '#c0c0c0', 'star', '5% de desconto em serviços'),
  ('Ouro', 250, 10, '#ffd700', 'trophy', '10% de desconto + prioridade'),
  ('Platina', 500, 15, '#e5e4e2', 'diamond', '15% de desconto + agendamento prioritário'),
  ('Diamante', 1000, 20, '#b9f2ff', 'flash', '20% de desconto + benefícios exclusivos')
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_rewards (name, description, points_cost) VALUES
  ('Corte Grátis', 'Um corte clássico gratuito', 200),
  ('Barba Grátis', 'Barba gratuita', 100),
  ('10% de Desconto', 'Desconto de 10% no próximo serviço', 50),
  ('Sobrancelha Grátis', 'Design de sobrancelha gratuito', 30),
  ('Combo Corte + Barba', 'Corte + Barba gratuito', 300)
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_config (points_per_appointment, points_per_real_spent, bonus_review, bonus_referral)
VALUES (10, 1, 5, 50)
ON CONFLICT DO NOTHING;

-- Função para adicionar pontos automaticamente
CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_wallet_exists BOOLEAN;
BEGIN
  -- Verificar se já existe saldo
  SELECT EXISTS(SELECT 1 FROM loyalty_points WHERE user_id = p_user_id) INTO v_wallet_exists;
  
  IF v_wallet_exists THEN
    UPDATE loyalty_points 
    SET points = points + p_points,
        total_earned = total_earned + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO loyalty_points (user_id, points, total_earned)
    VALUES (p_user_id, p_points, p_points);
  END IF;
  
  -- Registrar transação
  INSERT INTO loyalty_transactions (user_id, points, type, description, reference_id)
  VALUES (p_user_id, p_points, p_type, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql;
