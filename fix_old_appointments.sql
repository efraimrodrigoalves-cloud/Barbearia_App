-- =============================================
-- CORRIGIR AGENDAMENTOS ANTIGOS SEM user_id
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Atualizar agendamentos antigos que não têm user_id
-- Associa o user_id baseado no nome do cliente
UPDATE appointments a
SET user_id = p.id
FROM profiles p
WHERE a.user_id IS NULL
  AND LOWER(TRIM(a.client_name)) = LOWER(TRIM(p.full_name))
  AND a.appointment_date >= NOW() - INTERVAL '7 days';

-- 2. Verificar quantos foram atualizados
SELECT 
  COUNT(*) as total,
  COUNT(user_id) as com_user_id,
  COUNT(*) - COUNT(user_id) as sem_user_id
FROM appointments
WHERE appointment_date >= NOW() - INTERVAL '7 days';

-- 3. Verificar agendamentos de hoje do usuário específico
SELECT 
  id,
  user_id,
  client_name,
  appointment_date,
  status
FROM appointments
WHERE user_id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077'
ORDER BY appointment_date ASC;
