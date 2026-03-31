-- =============================================
-- TABELA DE CONTAS DE COLABORADORES
-- Vincula barbeiros do sistema a contas de login
-- =============================================

CREATE TABLE IF NOT EXISTS barber_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- Hash da senha (opcional, Supabase Auth cuida disso)
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}', -- Permissões customizadas
  created_by UUID REFERENCES profiles(id), -- Admin que cadastrou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_barber_accounts_barber ON barber_accounts(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_accounts_email ON barber_accounts(email);

-- RLS
ALTER TABLE barber_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_barber_accounts" ON barber_accounts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE barber_accounts IS 'Contas de login dos barbeiros funcionários';
COMMENT ON COLUMN barber_accounts.permissions IS 'Permissões customizadas em JSON';

-- Verificar
SELECT tablename FROM pg_tables WHERE tablename = 'barber_accounts';
