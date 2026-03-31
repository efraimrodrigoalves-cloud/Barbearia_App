-- =============================================
-- VERIFICAR QUAL USUÁRIO ESTÁ SENDO USADO
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Ver TODOS os usuários de autenticação
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Ver TODOS os perfis
SELECT id, full_name, role 
FROM profiles 
ORDER BY created_at DESC;

-- 3. Cruzar auth.users com profiles para ver qual está conectado
SELECT 
  au.id as auth_id,
  au.email,
  p.id as profile_id,
  p.full_name,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 4. Se houver inconsistência, corrigir:
-- Verificar se os IDs batem
SELECT 
  au.id as auth_id,
  p.id as profile_id,
  CASE WHEN au.id = p.id THEN '✅ OK' ELSE '❌ ERRO' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
