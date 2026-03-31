-- =============================================
-- CORRIGIR RLS PARA APPOINTMENTS
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Remover política antiga
DROP POLICY IF EXISTS "appointments_client_sees_own" ON appointments;

-- 2. Criar política correta que filtra por user_id
CREATE POLICY "appointments_client_sees_own" ON appointments
  FOR SELECT USING (
    -- Se for barbeiro, vê tudo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'barber')
    -- Ou só vê os agendamentos que criou (user_id)
    OR user_id = auth.uid()
  );

-- 3. Garantir que INSERT funciona
DROP POLICY IF EXISTS "appointments_insert_authenticated" ON appointments;
CREATE POLICY "appointments_insert_authenticated" ON appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Adicionar índice para user_id (performance)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- 5. Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appointments';
