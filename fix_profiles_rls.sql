-- =============================================
-- CORRIGIR VISIBILIDADE DE CLIENTES
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Ver quantos clientes existem
SELECT COUNT(*) as total_clientes
FROM profiles
WHERE role = 'client';

-- 2. Listar todos os clientes
SELECT id, full_name, phone, role
FROM profiles
WHERE role = 'client';

-- 3. Verificar se barbeiro consegue ver clientes
-- (Execute logado como barbeiro no SQL Editor)
SELECT id, full_name, phone
FROM profiles
WHERE role = 'client';

-- 4. Adicionar política para barbeiros verem todos os clientes
DROP POLICY IF EXISTS "profiles_barbers_read_all" ON profiles;

CREATE POLICY "profiles_barbers_read_all" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('barber', 'admin')
    )
  );

-- 5. Verificar políticas atuais
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
