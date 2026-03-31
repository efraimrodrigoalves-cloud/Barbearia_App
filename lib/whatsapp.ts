// =============================================
// SERVIÇO DE WHATSAPP - NOTIFICAÇÕES
// =============================================

import { logger } from './logger';

// Configuração da API (escolha uma e preencha as credenciais)
const WHATSAPP_CONFIG = {
  // OPÇÃO 1: Z-API (Recomendada - Brasileira)
  zapi: {
    enabled: false, // Mude para true quando configurar
    instanceId: 'SUA_INSTANCE_ID',
    token: 'SEU_TOKEN',
    baseUrl: 'https://api.z-api.io',
  },
  
  // OPÇÃO 2: Twilio
  twilio: {
    enabled: false, // Mude para true quando configurar
    accountSid: 'SEU_ACCOUNT_SID',
    authToken: 'SEU_AUTH_TOKEN',
    fromNumber: 'whatsapp:+14155238886', // Número do Twilio Sandbox
  },
  
  // OPÇÃO 3: ChatAPI
  chatapi: {
    enabled: false, // Mude para true quando configurar
    token: 'SEU_TOKEN',
    baseUrl: 'https://api.chat-api.com',
  },
};

// Template de mensagem de lembrete
const REMINDER_TEMPLATE = (data: {
  clientName: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
}) => `
💈 *Lembrete de Agendamento - Barbearia*

Olá *${data.clientName}*! 👋

Este é um lembrete do seu agendamento:

✂️ *Serviço:* ${data.serviceName}
👨‍🔧 *Profissional:* ${data.barberName}
📅 *Data:* ${data.date}
🕐 *Horário:* ${data.time}

Estamos te esperando! 😊

Caso precise cancelar ou remarque, entre em contato conosco.
`.trim();

// Função para formatar número de telefone
function formatPhone(phone: string): string {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tem código do país, adiciona 55 (Brasil)
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

// Função para formatar data
function formatDate(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`,
  };
}

// =============================================
// Z-API (Recomendada)
// =============================================
async function sendViaZApi(phone: string, message: string): Promise<boolean> {
  const config = WHATSAPP_CONFIG.zapi;
  if (!config.enabled) {
    logger.warn('Z-API não configurada');
    return false;
  }

  try {
    const formattedPhone = formatPhone(phone);
    const url = `${config.baseUrl}/instances/${config.instanceId}/token/${config.token}/send-text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      logger.info(`WhatsApp enviado via Z-API para ${formattedPhone}`);
      return true;
    } else {
      logger.error('Erro Z-API', data);
      return false;
    }
  } catch (error) {
    logger.error('Erro ao enviar via Z-API', error);
    return false;
  }
}

// =============================================
// Twilio
// =============================================
async function sendViaTwilio(phone: string, message: string): Promise<boolean> {
  const config = WHATSAPP_CONFIG.twilio;
  if (!config.enabled) {
    logger.warn('Twilio não configurado');
    return false;
  }

  try {
    const formattedPhone = formatPhone(phone);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    
    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: `whatsapp:+${formattedPhone}`,
        From: config.fromNumber,
        Body: message,
      }),
    });

    if (response.ok) {
      logger.info(`WhatsApp enviado via Twilio para ${formattedPhone}`);
      return true;
    } else {
      const data = await response.json();
      logger.error('Erro Twilio', data);
      return false;
    }
  } catch (error) {
    logger.error('Erro ao enviar via Twilio', error);
    return false;
  }
}

// =============================================
// ChatAPI
// =============================================
async function sendViaChatApi(phone: string, message: string): Promise<boolean> {
  const config = WHATSAPP_CONFIG.chatapi;
  if (!config.enabled) {
    logger.warn('ChatAPI não configurada');
    return false;
  }

  try {
    const formattedPhone = formatPhone(phone);
    const url = `${config.baseUrl}/sendMessage?token=${config.token}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        body: message,
      }),
    });

    const data = await response.json();
    
    if (response.sent) {
      logger.info(`WhatsApp enviado via ChatAPI para ${formattedPhone}`);
      return true;
    } else {
      logger.error('Erro ChatAPI', data);
      return false;
    }
  } catch (error) {
    logger.error('Erro ao enviar via ChatAPI', error);
    return false;
  }
}

// =============================================
// FUNÇÃO PRINCIPAL DE ENVIO
// =============================================
export async function sendWhatsAppNotification(data: {
  phone: string;
  clientName: string;
  serviceName: string;
  barberName: string;
  appointmentDate: string;
}): Promise<boolean> {
  const { date, time } = formatDate(data.appointmentDate);
  
  const message = REMINDER_TEMPLATE({
    clientName: data.clientName,
    serviceName: data.serviceName,
    barberName: data.barberName,
    date,
    time,
  });

  logger.info(`Enviando WhatsApp para ${data.clientName} (${data.phone})`);

  // Tenta cada API na ordem de preferência
  if (WHATSAPP_CONFIG.zapi.enabled) {
    return sendViaZApi(data.phone, message);
  }
  
  if (WHATSAPP_CONFIG.twilio.enabled) {
    return sendViaTwilio(data.phone, message);
  }
  
  if (WHATSAPP_CONFIG.chatapi.enabled) {
    return sendViaChatApi(data.phone, message);
  }

  logger.warn('Nenhuma API de WhatsApp configurada!');
  return false;
}

// =============================================
// EXPORTAR CONFIGURAÇÕES
// =============================================
export const whatsappConfig = WHATSAPP_CONFIG;
