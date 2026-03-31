/**
 * Mercado Pago Integration
 * 
 * Este módulo gerencia todas as integrações com o Mercado Pago:
 * - Criação de preferências de pagamento
 * - Pagamento via PIX (QR Code)
 * - Pagamento via Cartão de Crédito
 * - Webhooks para confirmação de pagamento
 * 
 * Logs: [PAGAMENTO]
 */

import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configurações do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || '';
const MP_BASE_URL = 'https://api.mercadopago.com';

// Tipos
export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  items: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

export interface PIXPayment {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  date_of_expiration: string;
}

export interface PaymentTransaction {
  id: string;
  appointment_id: string;
  client_id: string;
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'wallet';
  mp_payment_id?: string;
  mp_preference_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  pix_expiration_date?: string;
  card_last_four?: string;
  card_brand?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * Usado para checkout transparente (cartão de crédito)
 */
export async function createPaymentPreference(
  appointmentId: string,
  serviceId: string,
  barberId: string,
  amount: number,
  description: string,
  clientEmail: string
): Promise<PaymentPreference | null> {
  console.log('[PAGAMENTO] Criando preferência de pagamento:', { appointmentId, amount });
  
  try {
    const preference = {
      items: [
        {
          id: serviceId,
          title: description,
          description: `Agendamento na barbearia`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      payer: {
        email: clientEmail,
      },
      back_urls: {
        success: `barbershop://booking/success?appointment_id=${appointmentId}`,
        failure: `barbershop://booking/failure?appointment_id=${appointmentId}`,
        pending: `barbershop://booking/pending?appointment_id=${appointmentId}`,
      },
      auto_return: 'approved',
      external_reference: appointmentId,
      notification_url: `${Constants.expoConfig?.extra?.webhookUrl || ''}/webhooks/mercadopago`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('[ERRO] Falha ao criar preferência:', error);
      throw new Error(error.message || 'Erro ao criar preferência de pagamento');
    }

    const data = await response.json();
    console.log('[PAGAMENTO] Preferência criada com sucesso:', { id: data.id });

    // Salvar no banco de dados
    await savePaymentTransaction({
      appointment_id: appointmentId,
      client_id: '', // Será preenchido pelo caller
      amount,
      payment_method: 'credit_card',
      mp_preference_id: data.id,
      status: 'pending',
    });

    return data;
  } catch (error) {
    console.log('[ERRO] Falha ao criar preferência de pagamento:', error.message);
    throw error;
  }
}

/**
 * Cria pagamento via PIX
 * Retorna QR Code para o cliente pagar
 */
export async function createPIXPayment(
  appointmentId: string,
  clientId: string,
  amount: number,
  description: string,
  clientEmail: string,
  clientName: string,
  clientCPF: string
): Promise<PIXPayment | null> {
  console.log('[PAGAMENTO] Criando pagamento PIX:', { appointmentId, amount });
  
  try {
    const payment = {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      payer: {
        email: clientEmail,
        first_name: clientName.split(' ')[0],
        last_name: clientName.split(' ').slice(1).join(' ') || 'Silva',
        identification: {
          type: 'CPF',
          number: clientCPF.replace(/\D/g, ''),
        },
      },
      external_reference: appointmentId,
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    const response = await fetch(`${MP_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `pix-${appointmentId}-${Date.now()}`,
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('[ERRO] Falha ao criar pagamento PIX:', error);
      throw new Error(error.message || 'Erro ao criar pagamento PIX');
    }

    const data = await response.json();
    console.log('[PAGAMENTO] Pagamento PIX criado:', { id: data.id, status: data.status });

    // Extrair dados do PIX
    const pixData: PIXPayment = {
      id: data.id.toString(),
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code || '',
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      date_of_expiration: data.date_of_expiration,
    };

    // Salvar no banco de dados
    await savePaymentTransaction({
      appointment_id: appointmentId,
      client_id: clientId,
      amount,
      payment_method: 'pix',
      mp_payment_id: pixData.id,
      status: 'pending',
      pix_qr_code: pixData.qr_code,
      pix_qr_code_base64: pixData.qr_code_base64,
      pix_expiration_date: pixData.date_of_expiration,
    });

    return pixData;
  } catch (error) {
    console.log('[ERRO] Falha ao criar pagamento PIX:', error.message);
    throw error;
  }
}

/**
 * Consulta status de um pagamento no Mercado Pago
 */
export async function getPaymentStatus(paymentId: string): Promise<string | null> {
  console.log('[PAGAMENTO] Consultando status do pagamento:', { paymentId });
  
  try {
    const response = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('[ERRO] Falha ao consultar pagamento:', error);
      throw new Error(error.message || 'Erro ao consultar pagamento');
    }

    const data = await response.json();
    console.log('[PAGAMENTO] Status do pagamento:', { id: data.id, status: data.status });

    return data.status;
  } catch (error) {
    console.log('[ERRO] Falha ao consultar status do pagamento:', error.message);
    throw error;
  }
}

/**
 * Salva transação de pagamento no banco de dados
 */
async function savePaymentTransaction(transaction: Partial<PaymentTransaction>): Promise<void> {
  console.log('[PAGAMENTO] Salvando transação no banco:', { appointment_id: transaction.appointment_id });
  
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .insert(transaction);

    if (error) {
      console.log('[ERRO] Falha ao salvar transação:', error.message);
      throw error;
    }

    console.log('[PAGAMENTO] Transação salva com sucesso');
  } catch (error) {
    console.log('[ERRO] Falha ao salvar transação:', error.message);
    throw error;
  }
}

/**
 * Atualiza status de uma transação no banco de dados
 */
export async function updatePaymentTransactionStatus(
  mpPaymentId: string,
  status: string,
  paidAt?: string
): Promise<void> {
  console.log('[PAGAMENTO] Atualizando status da transação:', { mpPaymentId, status });
  
  try {
    const updateData: any = {
      mp_status: status,
      status: mapMPStatusToInternal(status),
    };

    if (paidAt) {
      updateData.paid_at = paidAt;
    }

    const { error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('mp_payment_id', mpPaymentId);

    if (error) {
      console.log('[ERRO] Falha ao atualizar transação:', error.message);
      throw error;
    }

    console.log('[PAGAMENTO] Transação atualizada com sucesso');
  } catch (error) {
    console.log('[ERRO] Falha ao atualizar transação:', error.message);
    throw error;
  }
}

/**
 * Mapeia status do Mercado Pago para status interno
 */
function mapMPStatusToInternal(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    'approved': 'approved',
    'pending': 'pending',
    'authorized': 'pending',
    'in_process': 'in_process',
    'in_mediation': 'pending',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'charged_back': 'refunded',
  };

  return statusMap[mpStatus] || 'pending';
}

/**
 * Busca transação por appointment_id
 */
export async function getTransactionByAppointment(appointmentId: string): Promise<PaymentTransaction | null> {
  console.log('[PAGAMENTO] Buscando transação por agendamento:', { appointmentId });
  
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[PAGAMENTO] Nenhuma transação encontrada para este agendamento');
        return null;
      }
      console.log('[ERRO] Falha ao buscar transação:', error.message);
      throw error;
    }

    console.log('[PAGAMENTO] Transação encontrada:', { id: data.id, status: data.status });
    return data;
  } catch (error) {
    console.log('[ERRO] Falha ao buscar transação:', error.message);
    throw error;
  }
}

/**
 * Busca todas as transações de um cliente
 */
export async function getClientTransactions(clientId: string): Promise<PaymentTransaction[]> {
  console.log('[PAGAMENTO] Buscando transações do cliente:', { clientId });
  
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('[ERRO] Falha ao buscar transações do cliente:', error.message);
      throw error;
    }

    console.log('[PAGAMENTO] Transações encontradas:', { count: data?.length });
    return data || [];
  } catch (error) {
    console.log('[ERRO] Falha ao buscar transações do cliente:', error.message);
    throw error;
  }
}

/**
 * Verifica se um pagamento PIX expirou
 */
export function isPIXExpired(expirationDate: string): boolean {
  const expiration = new Date(expirationDate);
  const now = new Date();
  return now > expiration;
}

/**
 * Gera link de pagamento para WhatsApp
 */
export function generatePaymentLink(preferenceId: string): string {
  return `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
}
