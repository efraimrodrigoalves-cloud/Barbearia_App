-- =============================================
-- LIMPAR DUPLICATAS E CORRIGIR DADOS
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Identificar agendamentos duplicados (mesmo barbeiro, mesmo horário)
SELECT 
  barber_id,
  appointment_date,
  COUNT(*) as quantidade,
  ARRAY_AGG(id) as ids
FROM appointments
WHERE status = 'confirmed'
  AND appointment_date >= NOW() - INTERVAL '1 day'
GROUP BY barber_id, appointment_date
HAVING COUNT(*) > 1
ORDER BY appointment_date;

-- 2. Manter apenas o mais recente de cada duplicata
DELETE FROM appointments
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY barber_id, appointment_date 
        ORDER BY created_at DESC
      ) as rn
    FROM appointments
    WHERE status = 'confirmed'
  ) sub
  WHERE rn > 1
);

-- 3. Verificar agendamentos de Efraim Rodrigo hoje
SELECT 
  id,
  user_id,
  client_name,
  appointment_date,
  status,
  created_at
FROM appointments
WHERE user_id = 'c7f24009-54d9-42d1-a8ba-d07e4e59f077'
  AND appointment_date >= '2026-03-30'
  AND appointment_date < '2026-03-31'
ORDER BY appointment_date ASC;

-- 4. Verificar agendamentos de Jeferson hoje  
SELECT 
  id,
  user_id,
  client_name,
  appointment_date,
  status,
  created_at
FROM appointments
WHERE (user_id = '8313e6c0-6b28-4fbf-86f7-4657c42a4b12' OR client_name = 'Jeferson')
  AND appointment_date >= '2026-03-30'
  AND appointment_date < '2026-03-31'
ORDER BY appointment_date ASC;
