-- =============================================
-- ADICIONAR CAMPO DE OBSERVAÇÕES
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Adicionar coluna notes na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Verificar se foi adicionada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar clientes com observações (se houver)
SELECT id, full_name, phone, notes
FROM profiles
WHERE role = 'client' AND notes IS NOT NULL;
