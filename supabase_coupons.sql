-- =============================================
-- SISTEMA DE CUPONS DE DESCONTO
-- Fase 4 - Crescimento
-- =============================================

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do cupom
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Tipo de desconto
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Limitações
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_per_user INTEGER DEFAULT 1,
  
  -- Validade
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Restrições
  applicable_services UUID[] DEFAULT NULL,
  applicable_barbers UUID[] DEFAULT NULL,
  first_purchase_only BOOLEAN DEFAULT false,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Metadados
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Dados no momento do uso
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- Timestamp
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Políticas para coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para coupon_usages
CREATE POLICY "Users can view own usages"
  ON coupon_usages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usages"
  ON coupon_usages FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE coupons IS 'Cupons de desconto para agendamentos';
COMMENT ON TABLE coupon_usages IS 'Histórico de uso de cupons';
COMMENT ON COLUMN coupons.discount_type IS 'percentage: % de desconto, fixed: valor fixo';
COMMENT ON COLUMN coupons.usage_limit IS 'NULL = ilimitado';
COMMENT ON COLUMN coupons.applicable_services IS 'NULL = todos os serviços';
COMMENT ON COLUMN coupons.applicable_barbers IS 'NULL = todos os barbeiros';

-- Cupons iniciais
INSERT INTO coupons (code, description, discount_type, discount_value, valid_until, usage_limit) VALUES
  ('PRIMEIRAVISITA', '10% de desconto para primeira visita', 'percentage', 10.00, NOW() + INTERVAL '1 year', NULL),
  ('INDICA10', 'R$ 10 de desconto por indicação', 'fixed', 10.00, NOW() + INTERVAL '6 months', 100),
  ('VOLTEI', '15% de desconto para clientes recorrentes', 'percentage', 15.00, NOW() + INTERVAL '3 months', 50)
ON CONFLICT DO NOTHING;
