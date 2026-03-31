// Para ver os logs no terminal:
// 1. Abra o terminal onde rodou "npx expo start"
// 2. Os logs aparecem com o prefixo [BARBERSHOP]
// 3. Procure por [ERROR] ou [WARN] para identificar problemas

// Exemplo de como ficam os logs:
// [BARBERSHOP] ============================================
// [BARBERSHOP] 🚀 SESSÃO INICIADA - 30/03/2026 16:30:00
// [BARBERSHOP] ============================================
// [BARBERSHOP] [INFO] Verificando sessão...
// [BARBERSHOP] [INFO] Sessão ativa encontrada: abc123
// [BARBERSHOP] [SCREEN] Renderizando: AdminScreen (Painel Gerencial)
// [BARBERSHOP] [INFO] Aba selecionada: servicos
// [BARBERSHOP] [INFO] Buscando serviços...
// [BARBERSHOP] [DATA] services: 3 registros encontrados
// [BARBERSHOP] [DATA] ⚠️ RLS bloqueou acesso a services

// Para desativar logs em produção, adicione no início do arquivo:
// if (__DEV__) { logger.enabled = true; }
// else { logger.enabled = false; }

console.log('[BARBERSHOP] Sistema de LOG ativado - Modo DEBUG');
console.log('[BARBERSHOP] Os logs aparecem apenas aqui no terminal, não no app');
