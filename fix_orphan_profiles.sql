-- =============================================
-- TRANSFERIR AGENDAMENTOS E LIMPAR PERFIS ÓRFÃOS
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Transferir agendamentos do perfil órfão para o perfil correto
-- (Do perfil 3af67c9a para o perfil c7f24009)
UPDATE appointments 
SET user_id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077'
WHERE user_id = '3af67c9a-32b0-4e2a-8188-32e0f5fb066a';

-- 2. Verificar quantos foram transferidos
SELECT COUNT(*) as transferidos 
FROM appointments 
WHERE user_id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077';

-- 3. Agora deletar o perfil órfão
DELETE FROM profiles 
WHERE id = '3af67c9a-32b0-4e2a-8188-32e0f5fb066a';

-- 4. Garantir que o perfil correto é admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077';

-- 5. Verificar resultado final
SELECT id, full_name, role FROM profiles;

-- 6. Verificar agendamentos
SELECT user_id, COUNT(*) as total
FROM appointments
GROUP BY user_id;
