-- =============================================
-- SISTEMA DE ROLES E PERMISSÕES
-- Admin (dono) vs Barbeiros (funcionários)
-- =============================================

-- ==========================================
-- 1. ROLES DISPONÍVEIS
-- ==========================================
-- 'admin' - Dono da barbearia (acesso total)
-- 'barber' - Barbeiro funcionário (acesso limitado)
-- 'client' - Cliente comum

-- ==========================================
-- 2. TABELA DE PERMISSÕES POR ROLE
-- ==========================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barber', 'client')),
  can_view_dashboard BOOLEAN DEFAULT false,
  can_view_agenda BOOLEAN DEFAULT false,
  can_edit_appointments BOOLEAN DEFAULT false,
  can_view_clients BOOLEAN DEFAULT false,
  can_edit_clients BOOLEAN DEFAULT false,
  can_view_services BOOLEAN DEFAULT false,
  can_edit_services BOOLEAN DEFAULT false,
  can_view_team BOOLEAN DEFAULT false,
  can_edit_team BOOLEAN DEFAULT false,
  can_view_finance BOOLEAN DEFAULT false,
  can_view_commissions BOOLEAN DEFAULT false,
  can_view_cash_register BOOLEAN DEFAULT false,
  can_view_subscriptions BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_view_settings BOOLEAN DEFAULT false,
  can_manage_barbers BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role)
);

-- ==========================================
-- 3. INSERIR PERMISSÕES PADRÃO
-- ==========================================

-- Admin: acesso total
INSERT INTO role_permissions (role, 
  can_view_dashboard, can_view_agenda, can_edit_appointments,
  can_view_clients, can_edit_clients, can_view_services, can_edit_services,
  can_view_team, can_edit_team, can_view_finance, can_view_commissions,
  can_view_cash_register, can_view_subscriptions, can_view_reports,
  can_view_settings, can_manage_barbers
) VALUES (
  'admin', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true
) ON CONFLICT (role) DO UPDATE SET
  can_view_dashboard = true,
  can_view_agenda = true,
  can_edit_appointments = true,
  can_view_clients = true,
  can_edit_clients = true,
  can_view_services = true,
  can_edit_services = true,
  can_view_team = true,
  can_edit_team = true,
  can_view_finance = true,
  can_view_commissions = true,
  can_view_cash_register = true,
  can_view_subscriptions = true,
  can_view_reports = true,
  can_view_settings = true,
  can_manage_barbers = true,
  updated_at = NOW();

-- Barbeiro: acesso limitado
INSERT INTO role_permissions (role,
  can_view_dashboard, can_view_agenda, can_edit_appointments,
  can_view_clients, can_edit_clients, can_view_services, can_edit_services,
  can_view_team, can_edit_team, can_view_finance, can_view_commissions,
  can_view_cash_register, can_view_subscriptions, can_view_reports,
  can_view_settings, can_manage_barbers
) VALUES (
  'barber', true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false
) ON CONFLICT (role) DO UPDATE SET
  can_view_dashboard = true,
  can_view_agenda = true,
  can_edit_appointments = true,
  can_view_clients = true,
  can_edit_clients = false,
  can_view_services = false,
  can_edit_services = false,
  can_view_team = false,
  can_edit_team = false,
  can_view_finance = false,
  can_view_commissions = false,
  can_view_cash_register = false,
  can_view_subscriptions = false,
  can_view_reports = false,
  can_view_settings = false,
  can_manage_barbers = false,
  updated_at = NOW();

-- Client: acesso apenas ao app
INSERT INTO role_permissions (role,
  can_view_dashboard, can_view_agenda, can_edit_appointments,
  can_view_clients, can_edit_clients, can_view_services, can_edit_services,
  can_view_team, can_edit_team, can_view_finance, can_view_commissions,
  can_view_cash_register, can_view_subscriptions, can_view_reports,
  can_view_settings, can_manage_barbers
) VALUES (
  'client', false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
) ON CONFLICT (role) DO UPDATE SET
  can_view_dashboard = false,
  can_view_agenda = false,
  can_edit_appointments = false,
  can_view_clients = false,
  can_edit_clients = false,
  can_view_services = false,
  can_edit_services = false,
  can_view_team = false,
  can_edit_team = false,
  can_view_finance = false,
  can_view_commissions = false,
  can_view_cash_register = false,
  can_view_subscriptions = false,
  can_view_reports = false,
  can_view_settings = false,
  can_manage_barbers = false,
  updated_at = NOW();

-- ==========================================
-- 4. TABELA DE BARBEIROS CADASTRADOS PELO ADMIN
-- ==========================================
CREATE TABLE IF NOT EXISTS barber_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id), -- Admin que cadastrou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_barber_accounts_user ON barber_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_accounts_barber ON barber_accounts(barber_id);

-- ==========================================
-- 6. RLS
-- ==========================================
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_role_permissions" ON role_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_barber_accounts" ON barber_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON TABLE role_permissions IS 'Permissões por role (admin, barber, client)';
COMMENT ON TABLE barber_accounts IS 'Contas de barbeiros funcionários vinculadas ao perfil';

-- Verificar
SELECT role, can_view_dashboard, can_view_finance, can_manage_barbers
FROM role_permissions;
