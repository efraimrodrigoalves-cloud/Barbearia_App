-- =============================================
-- FUNCIONALIDADES AVANÇADAS DO CLIENTE
-- Execute no SQL Editor do Supabase
-- =============================================

-- ==========================================
-- 1. CARTEIRA DIGITAL
-- ==========================================
CREATE TABLE IF NOT EXISTS client_wallet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_deposited DECIMAL(10,2) DEFAULT 0.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PONTOS DE FIDELIDADE (EXPANDIR)
-- ==========================================
CREATE TABLE IF NOT EXISTS loyalty_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Bronze, Prata, Ouro, Platina, Diamante
  min_points INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  color TEXT DEFAULT '#d4af37',
  icon TEXT DEFAULT 'star',
  benefits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir níveis padrão
INSERT INTO loyalty_levels (name, min_points, discount_percentage, color, icon, benefits) VALUES
('Bronze', 0, 0, '#cd7f32', 'star', 'Bem-vindo ao programa de fidelidade'),
('Prata', 500, 5, '#c0c0c0', 'star-half', '5% de desconto em serviços'),
('Ouro', 1500, 10, '#d4af37', 'star', '10% de desconto + prioridade'),
('Platina', 3000, 15, '#e5e4e2', 'diamond', '15% de desconto + brindes'),
('Diamante', 5000, 20, '#b9f2ff', 'diamond', '20% de desconto + corte grátis mensal')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. LEMBRETES PERSONALIZADOS
-- ==========================================
CREATE TABLE IF NOT EXISTS client_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('appointment', 'maintenance', 'promotion', 'birthday')),
  title TEXT NOT NULL,
  message TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER, -- Dias para repetir (ex: 15, 30)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. HISTÓRICO COM FOTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS client_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'after' CHECK (photo_type IN ('before', 'after', 'style')),
  description TEXT,
  barber_id UUID REFERENCES barbers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. PREFERÊNCIAS SALVAS
-- ==========================================
CREATE TABLE IF NOT EXISTS client_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_barber_id UUID REFERENCES barbers(id),
  preferred_service_id UUID REFERENCES services(id),
  preferred_time TEXT, -- Horário preferido (ex: "14:00")
  preferred_day INTEGER, -- Dia da semana preferido (0=Dom, 6=Sáb)
  hair_type TEXT, -- Tipo de cabelo
  beard_style TEXT, -- Estilo de barba preferido
  skin_sensitivity TEXT, -- Sensibilidade da pele
  product_preferences TEXT, -- Preferências de produtos
  notes TEXT, -- Observações gerais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. AGENDAMENTO RECORRENTE
-- ==========================================
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  barber_id UUID REFERENCES barbers(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 30, -- Dias entre agendamentos
  preferred_time TIME NOT NULL,
  preferred_day_of_week INTEGER, -- Dia da semana (0=Dom, 6=Sáb)
  next_appointment_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. CATÁLOGO DE ESTILOS
-- ==========================================
CREATE TABLE IF NOT EXISTS style_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- corte, barba, sobrancelha, combo
  image_url TEXT,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  popularity_score INTEGER DEFAULT 0, -- Quantas vezes foi agendado
  is_featured BOOLEAN DEFAULT false, -- Destaque na galeria
  tags TEXT[], -- Tags para busca (ex: ['moderno', 'degradê', 'navalha'])
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir estilos padrão
INSERT INTO style_catalog (name, description, category, price, duration_minutes, is_featured, tags) VALUES
('Degradê Navalha', 'Corte degradê feito com navalha, acabamento perfeito', 'corte', 45.00, 40, true, ARRAY['moderno', 'degradê', 'navalha']),
('Social Clássico', 'Corte social tradicional, elegante e profissional', 'corte', 35.00, 30, true, ARRAY['clássico', 'social', 'profissional']),
('Barba Modelada', 'Barba aparada e modelada com precisão', 'barba', 30.00, 25, true, ARRAY['barba', 'modelada', 'aparada']),
('Combo Completo', 'Corte + Barba + Sobrancelha', 'combo', 70.00, 60, true, ARRAY['combo', 'completo', 'premium']),
('Navalhado', 'Corte feito 100% com navalha', 'corte', 50.00, 45, false, ARRAY['navalha', 'detalhado']),
('Sobrancelha Masculina', 'Design de sobrancelha masculina', 'sobrancelha', 15.00, 15, false, ARRAY['sobrancelha', 'design'])
ON CONFLICT DO NOTHING;

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_client_wallet_user ON client_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_user ON client_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_date ON client_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_client_photos_user ON client_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_client_preferences_user ON client_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_user ON recurring_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_style_catalog_category ON style_catalog(category);
CREATE INDEX IF NOT EXISTS idx_style_catalog_featured ON style_catalog(is_featured);

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE client_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_client_wallet" ON client_wallet FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_wallet_transactions" ON wallet_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loyalty_levels" ON loyalty_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_all_client_reminders" ON client_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_client_photos" ON client_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_client_preferences" ON client_preferences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recurring_appointments" ON recurring_appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_style_catalog" ON style_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir leitura pública do catálogo
CREATE POLICY "public_read_style_catalog" ON style_catalog FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_loyalty_levels" ON loyalty_levels FOR SELECT TO anon USING (true);

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON TABLE client_wallet IS 'Carteira digital do cliente (saldo pré-pago)';
COMMENT ON TABLE wallet_transactions IS 'Histórico de transações da carteira';
COMMENT ON TABLE loyalty_levels IS 'Níveis do programa de fidelidade';
COMMENT ON TABLE client_reminders IS 'Lembretes personalizados do cliente';
COMMENT ON TABLE client_photos IS 'Galeria de fotos dos cortes do cliente';
COMMENT ON TABLE client_preferences IS 'Preferências e configurações do cliente';
COMMENT ON TABLE recurring_appointments IS 'Agendamentos recorrentes automáticos';
COMMENT ON TABLE style_catalog IS 'Catálogo de estilos e cortes disponíveis';

-- Verificar criação
SELECT tablename FROM pg_tables 
WHERE tablename IN (
  'client_wallet', 'wallet_transactions', 'loyalty_levels',
  'client_reminders', 'client_photos', 'client_preferences',
  'recurring_appointments', 'style_catalog'
);
