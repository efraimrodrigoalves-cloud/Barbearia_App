-- =============================================
-- TABELA DE TRANSAÇÕES DE PAGAMENTO
-- Integração com Mercado Pago (PIX + Cartão) + Pagamento Presencial
-- =============================================

-- Tabela principal de transações
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Dados do pagamento
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'wallet', 'cash', 'card_at_shop')),
  
  -- Mercado Pago (apenas para pagamentos online)
  mp_payment_id TEXT UNIQUE,
  mp_preference_id TEXT,
  mp_status TEXT,
  mp_status_detail TEXT,
  mp_payment_type TEXT,
  
  -- PIX específico
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration_date TIMESTAMPTZ,
  
  -- Cartão específico (online ou presencial)
  card_last_four TEXT,
  card_brand TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_payment_transactions_appointment ON payment_transactions(appointment_id);
CREATE INDEX idx_payment_transactions_client ON payment_transactions(client_id);
CREATE INDEX idx_payment_transactions_mp_payment ON payment_transactions(mp_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- RLS (Row Level Security)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem apenas suas transações
CREATE POLICY "Clients can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = client_id);

-- Política: Admins veem todas as transações
CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Sistema pode inserir transações
CREATE POLICY "System can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar transações (webhooks)
CREATE POLICY "System can update transactions"
  ON payment_transactions FOR UPDATE
  USING (true);

-- Comentários
COMMENT ON TABLE payment_transactions IS 'Armazena todas as transações de pagamento (PIX, Cartão Online, Dinheiro, Cartão Presencial, Carteira Digital)';
COMMENT ON COLUMN payment_transactions.mp_payment_id IS 'ID do pagamento no Mercado Pago (apenas para pagamentos online)';
COMMENT ON COLUMN payment_transactions.mp_preference_id IS 'ID da preferência de pagamento no Mercado Pago (apenas para checkout Pro)';
COMMENT ON COLUMN payment_transactions.pix_qr_code IS 'Código QR para pagamento PIX';
COMMENT ON COLUMN payment_transactions.pix_qr_code_base64 IS 'Imagem base64 do QR Code PIX';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Método: pix, credit_card, debit_card, wallet, cash, card_at_shop';
