-- =============================================
-- Sprint 1: Row Level Security (RLS)
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES: usuário só vê/edita o próprio perfil
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. SERVICES: todos autenticados podem ler; só barbeiros podem modificar
CREATE POLICY "services_read_authenticated" ON services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "services_write_barbers_only" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'barber')
  );

-- 4. BARBERS: todos autenticados podem ler; só barbeiros podem modificar
CREATE POLICY "barbers_read_all" ON barbers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "barbers_write_barbers_only" ON barbers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'barber')
  );

-- 5. APPOINTMENTS: cliente vê os seus; barbeiros veem todos
-- Remover política antiga
DROP POLICY IF EXISTS "appointments_client_sees_own" ON appointments;

-- Criar política correta que filtra por user_id
CREATE POLICY "appointments_client_sees_own" ON appointments
  FOR SELECT USING (
    -- Se for barbeiro, vê tudo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'barber')
    -- Ou só vê os agendamentos que criou (user_id)
    OR user_id = auth.uid()
  );

-- Política de INSERT (já existe, mas garantindo)
DROP POLICY IF EXISTS "appointments_insert_authenticated" ON appointments;
CREATE POLICY "appointments_insert_authenticated" ON appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Política de UPDATE para barbeiros
CREATE POLICY "appointments_update_barbers" ON appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'barber')
  );

-- Índice para user_id (melhora performance)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- 6. Índices de performance para queries frequentes
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date
  ON appointments(barber_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_appointments_client_name
  ON appointments(client_name);

-- 7. Constraint de unicidade: mesmo barbeiro, mesma data/hora
-- PASSO 1: Remover duplicatas (manter apenas o mais recente)
DELETE FROM appointments
WHERE id NOT IN (
  SELECT DISTINCT ON (barber_id, appointment_date) id
  FROM appointments
  ORDER BY barber_id, appointment_date, created_at DESC
);

-- PASSO 2: Agora criar a constraint com segurança
ALTER TABLE appointments
  ADD CONSTRAINT appointments_barber_datetime_unique
  UNIQUE (barber_id, appointment_date);
