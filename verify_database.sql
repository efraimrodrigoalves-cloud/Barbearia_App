-- =============================================
-- SCRIPT DE VERIFICAÇÃO DO BANCO
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Verificar se a coluna user_id existe na tabela appointments
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- 2. Verificar a constraint UNIQUE
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass;

-- 3. Verificar se há agendamentos com user_id nulo
SELECT 
  COUNT(*) as total_agendamentos,
  COUNT(user_id) as com_user_id,
  COUNT(*) - COUNT(user_id) as sem_user_id
FROM appointments;

-- 4. Verificar índices
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments';

-- 5. Se a coluna user_id não existir, execute este comando:
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- 6. Se precisar criar um índice para melhorar performance:
-- CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- 7. Verificar agendamentos recentes (últimas 24h)
SELECT 
  id,
  user_id,
  client_name,
  appointment_date,
  status,
  created_at
FROM appointments 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
