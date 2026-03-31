-- =============================================
-- SISTEMA DE INDICAÇÃO COM RECOMPENSA
-- Fase 4 - Crescimento
-- =============================================

-- Tabela de indicações
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quem indicou
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Quem foi indicado
  referred_name TEXT NOT NULL,
  referred_phone TEXT,
  referred_email TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed', 'cancelled')),
  
  -- Recompensa
  reward_type TEXT DEFAULT 'points' CHECK (reward_type IN ('points', 'discount', 'free_service')),
  reward_value DECIMAL(10,2) DEFAULT 0,
  reward_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadados
  notes TEXT
);

-- Tabela de configurações de recompensa
CREATE TABLE IF NOT EXISTS referral_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configurações
  points_per_referral INTEGER DEFAULT 100,
  discount_per_referral DECIMAL(10,2) DEFAULT 10.00,
  free_service_after_referrals INTEGER DEFAULT 5,
  
  -- Limites
  max_rewards_per_month INTEGER DEFAULT 10,
  min_referrals_for_free_service INTEGER DEFAULT 5,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_config ENABLE ROW LEVEL SECURITY;

-- Políticas para referrals
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para referral_config
CREATE POLICY "Anyone can view referral config"
  ON referral_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage referral config"
  ON referral_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE referrals IS 'Indicações de clientes com recompensa';
COMMENT ON TABLE referral_config IS 'Configurações do programa de indicação';
COMMENT ON COLUMN referrals.status IS 'pending: aguardando, registered: se cadastrou, completed: fez primeiro agendamento, cancelled: cancelado';
COMMENT ON COLUMN referrals.reward_type IS 'points: pontos de fidelidade, discount: desconto, free_service: serviço grátis';

-- Configuração inicial
INSERT INTO referral_config (points_per_referral, discount_per_referral, free_service_after_referrals) VALUES
  (100, 10.00, 5)
ON CONFLICT DO NOTHING;
