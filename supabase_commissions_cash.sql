-- =============================================
-- SISTEMA DE COMISSÕES E CONTROLE DE CAIXA
-- Execute no SQL Editor do Supabase
-- =============================================

-- ==========================================
-- 1. CONFIGURAÇÃO DE COMISSÕES POR BARBEIRO
-- ==========================================
CREATE TABLE IF NOT EXISTS barber_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00, -- Percentual de comissão (ex: 50%)
  fixed_amount DECIMAL(10,2), -- Valor fixo por serviço (opcional, alternativa ao %)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. REGISTRO DE COMISSÕES GANHAS
-- ==========================================
CREATE TABLE IF NOT EXISTS commission_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  service_price DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. CONTROLE DE CAIXA (ABERTURA/FECHAMENTO)
-- ==========================================
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opened_by UUID REFERENCES profiles(id),
  closed_by UUID REFERENCES profiles(id),
  open_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  close_date TIMESTAMP WITH TIME ZONE,
  opening_balance DECIMAL(10,2) DEFAULT 0, -- Saldo inicial informado na abertura
  closing_balance DECIMAL(10,2), -- Saldo final informado no fechamento
  total_revenue DECIMAL(10,2) DEFAULT 0, -- Total de receitas do dia
  total_expenses DECIMAL(10,2) DEFAULT 0, -- Total de despesas do dia
  expected_balance DECIMAL(10,2) DEFAULT 0, -- Saldo esperado (abertura + receitas - despesas)
  difference DECIMAL(10,2) DEFAULT 0, -- Diferença entre esperado e informado
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. MOVIMENTAÇÕES DO CAIXA
-- ==========================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID REFERENCES cash_register(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  appointment_id UUID REFERENCES appointments(id), -- Se for pagamento de serviço
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_barber_commissions_barber ON barber_commissions(barber_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_barber ON commission_records(barber_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_cash_register_status ON cash_register(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(cash_register_id);

-- ==========================================
-- HABILITAR RLS
-- ==========================================
ALTER TABLE barber_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS RLS
-- ==========================================
CREATE POLICY "allow_all_barber_commissions" ON barber_commissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_commission_records" ON commission_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_cash_register" ON cash_register
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_cash_movements" ON cash_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==========================================
COMMENT ON TABLE barber_commissions IS 'Configuração de comissão por barbeiro (% ou valor fixo)';
COMMENT ON TABLE commission_records IS 'Registro de comissões ganhas por cada atendimento';
COMMENT ON TABLE cash_register IS 'Controle de abertura e fechamento de caixa diário';
COMMENT ON TABLE cash_movements IS 'Movimentações do caixa (entradas e saídas)';

-- Verificar se foi criado
SELECT tablename FROM pg_tables 
WHERE tablename IN ('barber_commissions', 'commission_records', 'cash_register', 'cash_movements');
