-- =============================================
-- SOLUÇÃO DEFINITIVA - RLS QUE FUNCIONA
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. DESABILITAR RLS COMPLETAMENTE (emergência)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('profiles', 'services', 'barbers', 'appointments')) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. REABILITAR RLS COM POLÍTICAS MÍNIMAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS SIMPLES - SEM RECURSÃO

-- PROFILES: permitir tudo para autenticados
CREATE POLICY "allow_all_profiles" ON profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- SERVICES: permitir tudo para autenticados
CREATE POLICY "allow_all_services" ON services
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- BARBERS: permitir tudo para autenticados
CREATE POLICY "allow_all_barbers" ON barbers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- APPOINTMENTS: permitir tudo para autenticados
CREATE POLICY "allow_all_appointments" ON appointments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. VERIFICAR SE FUNCIONA
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'barbers', COUNT(*) FROM barbers
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;

-- 6. Ver políticas criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'services', 'barbers', 'appointments');
