# =============================================
# GUIA DE CONFIGURAÇÃO - WHATSAPP NOTIFICAÇÕES
# =============================================

## PASSO 1: Escolha uma API

### OPÇÃO A: Z-API (Recomendada para Brasil 🇧🇷)

1. Acesse: https://z-api.io
2. Crie uma conta
3. Crie uma instância
4. Anote: Instance ID e Token
5. Escaneie o QR Code com seu WhatsApp Business

### OPÇÃO B: Twilio (Internacional)

1. Acesse: https://twilio.com
2. Crie uma conta (ganha $15 grátis)
3. Ative o WhatsApp Sandbox
4. Anote: Account SID e Auth Token

### OPÇÃO C: ChatAPI

1. Acesse: https://chat-api.com
2. Crie uma conta
3. Anote o Token

---

## PASSO 2: Configure as Credenciais

Abra o arquivo `lib/whatsapp.ts` e preencha:

```typescript
// Para Z-API:
zapi: {
  enabled: true,  // ← Mude para true
  instanceId: 'SEU_INSTANCE_ID_AQUI',
  token: 'SEU_TOKEN_AQUI',
},

// Para Twilio:
twilio: {
  enabled: true,  // ← Mude para true
  accountSid: 'SEU_ACCOUNT_SID',
  authToken: 'SEU_AUTH_TOKEN',
},
```

---

## PASSO 3: Execute o SQL

Execute o arquivo `supabase_notifications.sql` no Supabase.

Isso criará:
- Tabela `notification_queue`
- Trigger automático para agendar notificações
- Políticas de segurança

---

## PASSO 4: Teste

1. Faça um agendamento como cliente
2. Verifique se criou um registro em `notification_queue`:
   ```sql
   SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 5;
   ```

---

## PASSO 5: Cron Job (Automatizar)

### Opção A: Supabase Edge Function (Recomendado)

Crie uma Edge Function que roda a cada hora:

```typescript
// supabase/functions/send-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar notificações pendentes que devem ser enviadas agora
  const { data: notifications } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  // Enviar cada notificação
  for (const notif of notifications || []) {
    // Chamar API do WhatsApp aqui
    // Marcar como 'sent' ou 'failed'
  }

  return new Response(JSON.stringify({ sent: notifications?.length || 0 }))
})
```

### Opção B: Servidor Próprio

Crie um script que roda a cada hora (cron):
```bash
# No crontab (Linux/Mac)
0 * * * * curl https://sua-api.com/send-notifications
```

---

## CUSTOS ESTIMADOS

| API | Custo por mensagem | Custo mensal (100 msgs/dia) |
|-----|-------------------|----------------------------|
| Z-API | ~R$0,05 | ~R$150 |
| Twilio | ~R$0,025 | ~R$75 |
| ChatAPI | ~R$0,04 | ~R$120 |

---

## DICAS

1. **Comece com Z-API** - Mais fácil de configurar no Brasil
2. **Use WhatsApp Business** - Para números de empresa
3. **Teste primeiro** - Envie para seu próprio número
4. **Horários** - Evite enviar antes das 8h ou depois das 21h
5. **Templates** - WhatsApp exige templates aprovados para contas oficiais

---

## PROBLEMAS COMUNS

**"Telefone inválido"**
- Verifique se tem código do país (55 para Brasil)
- Formato correto: 5511999999999

**"Mensagem não enviada"**
- Verifique se a API está configurada (enabled: true)
- Confirme as credenciais
- Verifique saldo na conta

**"Não criou notificação"**
- Execute o SQL novamente
- Verifique se o cliente tem telefone cadastrado
