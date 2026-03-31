-- =============================================
-- TABELA DE NOTIFICAÇÕES WHATSAPP
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela de fila de notificações
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  phone TEXT NOT NULL,
  client_name TEXT NOT NULL,
  service_name TEXT,
  barber_name TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_type TEXT DEFAULT 'reminder' CHECK (notification_type IN ('reminder', 'confirmation', 'cancellation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_appointment ON notification_queue(appointment_id);

-- 3. Habilitar RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS (permitir tudo para autenticados)
CREATE POLICY "allow_all_notifications" ON notification_queue
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Função para agendar notificação quando agendamento é criado
CREATE OR REPLACE FUNCTION schedule_appointment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Agendar lembrete 2 horas antes do agendamento
  INSERT INTO notification_queue (
    appointment_id,
    user_id,
    phone,
    client_name,
    service_name,
    barber_name,
    appointment_date,
    notification_type,
    status,
    scheduled_for
  )
  SELECT 
    NEW.id,
    NEW.user_id,
    p.phone,
    NEW.client_name,
    s.name,
    b.name,
    NEW.appointment_date,
    'reminder',
    'pending',
    NEW.appointment_date - INTERVAL '2 hours'
  FROM appointments a
  LEFT JOIN profiles p ON p.id = NEW.user_id
  LEFT JOIN services s ON s.id = NEW.service_id
  LEFT JOIN barbers b ON b.id = NEW.barber_id
  WHERE a.id = NEW.id
    AND p.phone IS NOT NULL
    AND p.phone != '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para agendar automaticamente
DROP TRIGGER IF EXISTS trigger_schedule_notification ON appointments;
CREATE TRIGGER trigger_schedule_notification
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION schedule_appointment_notification();

-- 7. Verificar se está funcionando
SELECT 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename = 'notification_queue';
