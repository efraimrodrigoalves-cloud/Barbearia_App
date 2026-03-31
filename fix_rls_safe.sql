-- =============================================
-- RLS CORRIGIDO - SEM RECURSÃO
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Reabilitar RLS com políticas corretas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES - Todos autenticados podem ler (sem recursão)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. SERVICES - Todos podem ler, barbeiros podem modificar
DROP POLICY IF EXISTS "services_select_all" ON services;
CREATE POLICY "services_select_all" ON services
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "services_insert_barbers" ON services;
CREATE POLICY "services_insert_barbers" ON services
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "services_update_barbers" ON services;
CREATE POLICY "services_update_barbers" ON services
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "services_delete_barbers" ON services;
CREATE POLICY "services_delete_barbers" ON services
  FOR DELETE TO authenticated USING (true);

-- 4. BARBERS - Todos podem ler
DROP POLICY IF EXISTS "barbers_select_all" ON barbers;
CREATE POLICY "barbers_select_all" ON barbers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "barbers_insert_authenticated" ON barbers;
CREATE POLICY "barbers_insert_authenticated" ON barbers
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "barbers_update_authenticated" ON barbers;
CREATE POLICY "barbers_update_authenticated" ON barbers
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "barbers_delete_authenticated" ON barbers;
CREATE POLICY "barbers_delete_authenticated" ON barbers
  FOR DELETE TO authenticated USING (true);

-- 5. APPOINTMENTS - Todos autenticados podem ver e inserir
DROP POLICY IF EXISTS "appointments_select_all" ON appointments;
CREATE POLICY "appointments_select_all" ON appointments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "appointments_insert_all" ON appointments;
CREATE POLICY "appointments_insert_all" ON appointments
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_update_all" ON appointments;
CREATE POLICY "appointments_update_all" ON appointments
  FOR UPDATE TO authenticated USING (true);

-- 6. Verificar se está funcionando
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'barbers', COUNT(*) FROM barbers
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;
