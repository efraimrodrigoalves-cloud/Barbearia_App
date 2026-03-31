-- =============================================
-- LIMPAR PERFIS ÓRFÃOS E VERIFICAR
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Deletar perfis que não estão vinculados ao auth.users
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Verificar se sobrou apenas os perfis corretos
SELECT id, full_name, role FROM profiles;

-- 3. Garantir que seu perfil está como admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077';

-- 4. Verificar resultado final
SELECT 
  au.id as auth_id,
  au.email,
  p.full_name,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
