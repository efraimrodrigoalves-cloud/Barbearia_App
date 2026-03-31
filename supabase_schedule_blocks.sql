-- =============================================
-- SISTEMA DE BLOQUEIO DE HORÁRIOS
-- Permite que barbeiros bloqueiem horários
-- para folga, almoço, feriados, etc.
-- =============================================

-- 1. Criar tabela de bloqueios
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT, -- Motivo do bloqueio (ex: Almoço, Folga, Feriado)
  is_recurring BOOLEAN DEFAULT false, -- Se repete toda semana
  recurring_day INTEGER, -- Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_barber ON schedule_blocks(barber_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_date ON schedule_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_recurring ON schedule_blocks(is_recurring, recurring_day);

-- 3. Habilitar RLS
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS - Todos autenticados podem ver e modificar
CREATE POLICY "allow_all_schedule_blocks" ON schedule_blocks
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Comentários para documentação
COMMENT ON TABLE schedule_blocks IS 'Bloqueios de horários dos barbeiros (folga, almoço, feriado)';
COMMENT ON COLUMN schedule_blocks.barber_id IS 'ID do barbeiro';
COMMENT ON COLUMN schedule_blocks.block_date IS 'Data do bloqueio';
COMMENT ON COLUMN schedule_blocks.start_time IS 'Hora de início do bloqueio';
COMMENT ON COLUMN schedule_blocks.end_time IS 'Hora de fim do bloqueio';
COMMENT ON COLUMN schedule_blocks.reason IS 'Motivo do bloqueio';
COMMENT ON COLUMN schedule_blocks.is_recurring IS 'Se o bloqueio se repete semanalmente';
COMMENT ON COLUMN schedule_blocks.recurring_day IS 'Dia da semana para bloqueio recorrente (0=Dom, 6=Sáb)';

-- 6. Verificar se foi criado
SELECT tablename FROM pg_tables WHERE tablename = 'schedule_blocks';
