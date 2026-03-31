-- 1. Cria a tabela de Perfis (Profiles) - Para uso futuro com Autenticação de Usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- futuramente será REFERENCES auth.users
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'barber', 'admin')),
  avatar_url TEXT
);

-- 2. Cria a tabela de Serviços (Services)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  icon TEXT
);

-- 3. Cria a tabela de Barbeiros (Apenas para facilitar o MVP antes de Login Complexo)
CREATE TABLE IF NOT EXISTS barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  specialty TEXT
);

-- 4. Cria a tabela de Agendamentos (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id), -- Adicionado para associar ao cliente
  client_name TEXT NOT NULL,
  client_phone TEXT,
  barber_id UUID REFERENCES barbers(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se a tabela já existe, adicione a coluna user_id
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- ==========================================
-- Inserindo Dados Iniciais para o Aplicativo
-- ==========================================

INSERT INTO services (name, price, duration_minutes, icon) VALUES 
('Corte Clássico', 50.00, 45, 'cut'),
('Corte + Barba', 80.00, 90, 'cut'),
('Sobrancelha', 20.00, 15, 'cut')
ON CONFLICT DO NOTHING;

INSERT INTO barbers (name, avatar_url, specialty) VALUES 
('Marcos (Especialista)', 'https://i.pravatar.cc/150?img=11', 'Degradê Navalhado'),
('Rafael (Tesoura)', 'https://i.pravatar.cc/150?img=12', 'Estilos Longos'),
('Thiago', 'https://i.pravatar.cc/150?img=13', 'Barboterapia')
ON CONFLICT DO NOTHING;
