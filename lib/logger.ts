// Logger interno para debug do DEV
// Logs aparecem apenas no terminal, não no app

const LOG_PREFIX = '[BARBERSHOP]';

export const logger = {
  // Log de autenticação
  auth: {
    login: (email: string, success: boolean) => {
      console.log(`${LOG_PREFIX} [AUTH] Login: ${email} | Sucesso: ${success}`);
    },
    register: (email: string, success: boolean) => {
      console.log(`${LOG_PREFIX} [AUTH] Registro: ${email} | Sucesso: ${success}`);
    },
    logout: () => {
      console.log(`${LOG_PREFIX} [AUTH] Logout realizado`);
    },
    error: (action: string, error: any) => {
      console.error(`${LOG_PREFIX} [AUTH] Erro em ${action}:`, error?.message || error);
    },
  },

  // Log de dados
  data: {
    fetch: (table: string, count: number | null, error?: any) => {
      if (error) {
        console.error(`${LOG_PREFIX} [DATA] Erro ao buscar ${table}:`, error?.message || error);
      } else {
        console.log(`${LOG_PREFIX} [DATA] ${table}: ${count} registros encontrados`);
      }
    },
    insert: (table: string, success: boolean, error?: any) => {
      if (error) {
        console.error(`${LOG_PREFIX} [DATA] Erro ao inserir em ${table}:`, error?.message || error);
      } else {
        console.log(`${LOG_PREFIX} [DATA] Inserção em ${table}: ${success ? 'OK' : 'FALHOU'}`);
      }
    },
    update: (table: string, id: string, success: boolean, error?: any) => {
      if (error) {
        console.error(`${LOG_PREFIX} [DATA] Erro ao atualizar ${table} (${id}):`, error?.message || error);
      } else {
        console.log(`${LOG_PREFIX} [DATA] Atualização ${table} (${id}): ${success ? 'OK' : 'FALHOU'}`);
      }
    },
    delete: (table: string, id: string, success: boolean, error?: any) => {
      if (error) {
        console.error(`${LOG_PREFIX} [DATA] Erro ao deletar ${table} (${id}):`, error?.message || error);
      } else {
        console.log(`${LOG_PREFIX} [DATA] Exclusão ${table} (${id}): ${success ? 'OK' : 'FALHOU'}`);
      }
    },
  },

  // Log de navegação/telas
  screen: {
    navigate: (from: string, to: string) => {
      console.log(`${LOG_PREFIX} [SCREEN] Navegação: ${from} → ${to}`);
    },
    render: (screen: string) => {
      console.log(`${LOG_PREFIX} [SCREEN] Renderizando: ${screen}`);
    },
    error: (screen: string, error: any) => {
      console.error(`${LOG_PREFIX} [SCREEN] Erro em ${screen}:`, error?.message || error);
    },
  },

  // Log de agendamentos
  booking: {
    start: (service: string, barber: string) => {
      console.log(`${LOG_PREFIX} [BOOKING] Iniciando: Serviço=${service}, Barbeiro=${barber}`);
    },
    timeSelected: (date: string, time: string) => {
      console.log(`${LOG_PREFIX} [BOOKING] Horário selecionado: ${date} às ${time}`);
    },
    confirmed: (clientName: string, service: string, date: string) => {
      console.log(`${LOG_PREFIX} [BOOKING] ✅ Agendamento confirmado: ${clientName} - ${service} em ${date}`);
    },
    error: (step: string, error: any) => {
      console.error(`${LOG_PREFIX} [BOOKING] Erro em ${step}:`, error?.message || error);
    },
  },

  // Log de RLS/Permissões
  rls: {
    blocked: (table: string, action: string) => {
      console.warn(`${LOG_PREFIX} [RLS] ⚠️ Acesso bloqueado: ${action} em ${table}`);
    },
    allowed: (table: string, action: string) => {
      console.log(`${LOG_PREFIX} [RLS] Acesso permitido: ${action} em ${table}`);
    },
  },

  // Log geral
  info: (message: string) => {
    console.log(`${LOG_PREFIX} [INFO] ${message}`);
  },
  warn: (message: string) => {
    console.warn(`${LOG_PREFIX} [WARN] ⚠️ ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`${LOG_PREFIX} [ERROR] ❌ ${message}`, error?.message || error || '');
  },

  // Separador visual no terminal
  divider: () => {
    console.log(`${LOG_PREFIX} ============================================`);
  },
  sessionStart: () => {
    console.log('');
    logger.divider();
    console.log(`${LOG_PREFIX} 🚀 SESSÃO INICIADA - ${new Date().toLocaleString()}`);
    logger.divider();
  },
};
