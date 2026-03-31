# =============================================
# SISTEMA DE NOTIFICAÇÕES WHATSAPP
# =============================================

## OPÇÕES DE API (escolha uma):

### 1. Z-API (Recomendada - Brasileira, mais barata)
- Site: https://z-api.io
- Preço: A partir de R$49/mês
- Vantagens: Fácil integração, suporte em português
- Desvantagens: Menos documentação

### 2. Twilio (Internacional)
- Site: https://twilio.com
- Preço: ~$0.005 por mensagem
- Vantagens: Documentação excelente, confiável
- Desvantagens: Mais caro, interface em inglês

### 3. ChatAPI
- Site: https://chat-api.com
- Preço: A partir de $39/mês
- Vantagens: Simples de usar
- Desvantagens: Suporte limitado

## ARQUITETURA DO SISTEMA:

1. Cliente agenda → Salva na tabela de notificações pendentes
2. Cron job roda a cada hora (Supabase Edge Function ou servidor)
3. Busca agendamentos das próximas 2-3 horas
4. Envia mensagem via API do WhatsApp
5. Marca como "enviada" para não duplicar

## FLUXO:
```
[Cliente agenda] 
    ↓
[Salva notification_queue]
    ↓
[Cron job verifica a cada hora]
    ↓
[Busca agendamentos próximos (2h antes)]
    ↓
[Envia WhatsApp via API]
    ↓
[Marca como enviada]
```
