-- =============================================
-- VERIFICAR USUÁRIOS (SEM created_at)
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Ver TODOS os usuários de autenticação
SELECT id, email 
FROM auth.users 
ORDER BY id;

-- 2. Ver TODOS os perfis
SELECT id, full_name, role 
FROM profiles 
ORDER BY id;

-- 3. CRUZAR auth.users com profiles para ver qual está conectado
SELECT 
  au.id as auth_id,
  au.email,
  p.id as profile_id,
  p.full_name,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.id;

-- 4. Verificar qual perfil está vinculado corretamente
SELECT 
  au.id as auth_id,
  au.email,
  p.full_name,
  p.role,
  CASE WHEN au.id = p.id THEN '✅ VINCULADO' ELSE '❌ SEM VÍNCULO' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
