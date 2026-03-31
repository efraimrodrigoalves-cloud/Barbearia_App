-- =============================================
-- DEFINIR USUÁRIO COMO ADMIN
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Ver seu usuário atual
SELECT id, email, full_name, role 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Definir como admin (substitua o email pelo seu)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'SEU_EMAIL_AQUI';

-- OU se souber o ID:
-- UPDATE profiles SET role = 'admin' WHERE id = 'SEU_ID_AQUI';

-- 3. Verificar se foi atualizado
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'admin';

-- 4. Garantir que permissões de admin existem
INSERT INTO role_permissions (
  role, 
  can_view_dashboard, 
  can_view_agenda, 
  can_edit_appointments,
  can_view_clients, 
  can_edit_clients,
  can_view_services, 
  can_edit_services,
  can_view_team, 
  can_edit_team,
  can_view_finance, 
  can_view_commissions,
  can_view_cash_register, 
  can_view_subscriptions,
  can_view_settings, 
  can_manage_barbers
) VALUES (
  'admin', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true
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
  can_view_settings = true,
  can_manage_barbers = true,
  updated_at = NOW();

-- 5. Verificar permissões
SELECT * FROM role_permissions WHERE role = 'admin';
