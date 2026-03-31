-- =============================================
-- FUNCIONALIDADES MÉDIAS
-- 1. Avaliações
-- 2. Notificações Internas
-- 3. Metas por Barbeiro
-- 4. Lista de Espera
-- =============================================

-- ==========================================
-- 1. AVALIAÇÕES DOS CLIENTES
-- ==========================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  barber_id UUID REFERENCES barbers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_barber ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 2. NOTIFICAÇÕES INTERNAS
-- ==========================================
CREATE TABLE IF NOT EXISTS internal_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_appointment', 'subscription_low', 'cash_open', 'cash_close', 'review', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Dados extras (appointment_id, user_id, etc)
  is_read BOOLEAN DEFAULT false,
  target_role TEXT DEFAULT 'barber', -- Para quem é a notificação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_internal_notifications_type ON internal_notifications(type);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_read ON internal_notifications(is_read);

-- RLS
ALTER TABLE internal_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_internal_notifications" ON internal_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 3. METAS POR BARBEIRO
-- ==========================================
CREATE TABLE IF NOT EXISTS barber_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- Primeiro dia do mês (ex: 2026-03-01)
  target_appointments INTEGER DEFAULT 0, -- Meta de atendimentos
  target_revenue DECIMAL(10,2) DEFAULT 0, -- Meta de faturamento
  current_appointments INTEGER DEFAULT 0, -- Atendimentos realizados
  current_revenue DECIMAL(10,2) DEFAULT 0, -- Faturamento realizado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, month) -- Uma meta por barbeiro por mês
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_barber_goals_barber ON barber_goals(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_goals_month ON barber_goals(month);

-- RLS
ALTER TABLE barber_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_barber_goals" ON barber_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 4. LISTA DE ESPERA
-- ==========================================
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  barber_id UUID REFERENCES barbers(id),
  service_id UUID REFERENCES services(id),
  preferred_date DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_date ON waiting_list(preferred_date);
CREATE INDEX IF NOT EXISTS idx_waiting_list_barber ON waiting_list(barber_id);

-- RLS
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_waiting_list" ON waiting_list FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON TABLE reviews IS 'Avaliações dos clientes após atendimento';
COMMENT ON TABLE internal_notifications IS 'Notificações internas para o barbeiro/admin';
COMMENT ON TABLE barber_goals IS 'Metas mensais por barbeiro (atendimentos e faturamento)';
COMMENT ON TABLE waiting_list IS 'Lista de espera para clientes quando horários estão cheios';

-- Verificar criação
SELECT tablename FROM pg_tables 
WHERE tablename IN ('reviews', 'internal_notifications', 'barber_goals', 'waiting_list');
