-- =============================================
-- CORREÇÃO URGENTE - RESTAURAR ACESSO
-- Execute IMEDIATAMENTE no SQL Editor
-- =============================================

-- 1. Remover política problemática
DROP POLICY IF EXISTS "profiles_barbers_read_all" ON profiles;

-- 2. Criar política simples que funciona
CREATE POLICY "profiles_barbers_read_all" ON profiles
  FOR SELECT USING (
    -- Usuário vê seu próprio perfil
    auth.uid() = id
    -- OU é barbeiro/admin
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('barber', 'admin')
    )
  );

-- 3. Verificar se serviços estão visíveis
SELECT COUNT(*) as total_servicos FROM services;

-- 4. Verificar se barbeiros estão visíveis  
SELECT COUNT(*) as total_barbeiros FROM barbers;

-- 5. Verificar políticas de services
SELECT policyname FROM pg_policies WHERE tablename = 'services';

-- 6. Verificar políticas de barbers
SELECT policyname FROM pg_policies WHERE tablename = 'barbers';
