import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela de Lembretes
 * 
 * Descrição: Configuração de lembretes personalizados
 * Tabelas utilizadas: client_reminders
 * Logs: [LEMBRETES]
 */
const LOG_PREFIX = '[LEMBRETES]';

export default function RemindersScreen() {
  const router = useRouter();
  
  // Estados
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadReminders();
  }, []);

  /**
   * Carrega lembretes do cliente
   */
  const loadReminders = async () => {
    setLoading(true);
    console.log('[LEMBRETES] Carregando lembretes...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('client_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) {
        console.error('[LEMBRETES] Erro:', error);
      } else if (data) {
        setReminders(data);
        console.log('[LEMBRETES] Lembretes carregados:', data.length);
      }
    } catch (e) {
      console.error('[LEMBRETES] Erro:', e);
    }
    
    setLoading(false);
  };

  /**
   * Cria um novo lembrete
   */
  const createReminder = (type: string) => {
    Alert.prompt(
      'Novo Lembrete',
      'Digite a mensagem do lembrete:',
      async (message) => {
        if (!message) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calcular data do lembrete (ex: 15 dias para manutenção)
        const days = type === 'maintenance' ? 15 : 30;
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + days);

        await supabase
          .from('client_reminders')
          .insert({
            user_id: user.id,
            reminder_type: type,
            title: type === 'maintenance' ? 'Hora do retoque!' : 'Promoção especial!',
            message: message,
            reminder_date: reminderDate.toISOString(),
            is_recurring: type === 'maintenance',
            recurring_days: days
          });

        loadReminders();
        Alert.alert('Sucesso', 'Lembrete criado!');
      },
      'plain-text'
    );
  };

  /**
   * Remove um lembrete
   */
  const deleteReminder = async (id: string) => {
    Alert.alert(
      'Remover Lembrete',
      'Deseja remover este lembrete?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('client_reminders')
              .delete()
              .eq('id', id);
            
            loadReminders();
          }
        }
      ]
    );
  };

  /**
   * Retorna ícone e cor por tipo
   */
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'appointment': return { icon: 'calendar', color: '#d4af37', label: 'Agendamento' };
      case 'maintenance': return { icon: 'cut', color: '#22c55e', label: 'Manutenção' };
      case 'promotion': return { icon: 'pricetag', color: '#a855f7', label: 'Promoção' };
      case 'birthday': return { icon: 'gift', color: '#f87171', label: 'Aniversário' };
      default: return { icon: 'notifications', color: '#666', label: 'Lembrete' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
        <ActivityIndicator size="large" color="#d4af37" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Lembretes</Text>
        </View>

        <Text className="text-gray-400 mb-6">
          Configure quando deseja ser lembrado de cuidar do visual
        </Text>

        {/* Botões de Criar */}
        <View className="flex-row mb-6">
          <TouchableOpacity 
            onPress={() => createReminder('maintenance')}
            className="flex-1 bg-[#1e1e1e] border border-green-700 p-4 rounded-xl mr-2 items-center"
          >
            <Ionicons name="cut" size={24} color="#22c55e" />
            <Text className="text-green-400 font-bold mt-2">Retoque</Text>
            <Text className="text-gray-500 text-xs">15 dias</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => createReminder('promotion')}
            className="flex-1 bg-[#1e1e1e] border border-purple-700 p-4 rounded-xl ml-2 items-center"
          >
            <Ionicons name="pricetag" size={24} color="#a855f7" />
            <Text className="text-purple-400 font-bold mt-2">Promoção</Text>
            <Text className="text-gray-500 text-xs">Personalizado</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Lembretes */}
        <Text className="text-white font-bold mb-3">Meus Lembretes</Text>
        
        {reminders.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="notifications-off-outline" size={48} color="#333" />
            <Text className="text-gray-500 mt-2">Nenhum lembrete configurado</Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const style = getTypeStyle(reminder.reminder_type);
            return (
              <View key={reminder.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: style.color + '20' }}>
                      <Ionicons name={style.icon as any} size={20} color={style.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{reminder.title}</Text>
                      <Text className="text-gray-400 text-sm mt-1">{reminder.message}</Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="time-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                        <Text className="text-gray-500 text-xs">
                          {new Date(reminder.reminder_date).toLocaleDateString('pt-BR')}
                        </Text>
                        {reminder.is_recurring && (
                          <View className="flex-row items-center ml-3">
                            <Ionicons name="refresh" size={14} color="#22c55e" style={{ marginRight: 4 }} />
                            <Text className="text-green-400 text-xs">A cada {reminder.recurring_days} dias</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteReminder(reminder.id)}>
                    <Ionicons name="trash-outline" size={20} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
