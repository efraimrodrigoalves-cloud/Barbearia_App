import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela de Agendamento Recorrente
 * 
 * Descrição: Permite configurar agendamento automático
 * Tabelas utilizadas: recurring_appointments, services, barbers
 * Logs: [RECORRENTE]
 */
const LOG_PREFIX = '[RECORRENTE]';

export default function RecurringAppointmentScreen() {
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [recurring, setRecurring] = useState<any>(null);
  
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [frequency, setFrequency] = useState(15);
  const [preferredTime, setPreferredTime] = useState('14:00');
  const [preferredDay, setPreferredDay] = useState<number | null>(null);

  const frequencies = [
    { days: 7, label: 'Semanal' },
    { days: 15, label: 'Quinzenal' },
    { days: 30, label: 'Mensal' },
    { days: 45, label: '45 dias' },
    { days: 60, label: 'Bimestral' },
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carrega barbeiros, serviços e agendamento recorrente existente
   */
  const loadData = async () => {
    setLoading(true);
    console.log('[RECORRENTE] Carregando dados...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Buscar barbeiros
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*');
      
      if (barbersData) setBarbers(barbersData);

      // Buscar serviços
      const { data: servicesData } = await supabase
        .from('services')
        .select('*');
      
      if (servicesData) setServices(servicesData);

      // Buscar agendamento recorrente existente
      const { data: recurringData } = await supabase
        .from('recurring_appointments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (recurringData) {
        console.log('[RECORRENTE] Agendamento recorrente encontrado');
        setRecurring(recurringData);
        setSelectedBarber(barbersData?.find(b => b.id === recurringData.barber_id));
        setSelectedService(servicesData?.find(s => s.id === recurringData.service_id));
        setFrequency(recurringData.frequency_days);
        setPreferredTime(recurringData.preferred_time);
        setPreferredDay(recurringData.preferred_day_of_week);
      }
    } catch (e) {
      console.error('[RECORRENTE] Erro:', e);
    }
    
    setLoading(false);
  };

  /**
   * Salva ou atualiza o agendamento recorrente
   */
  const saveRecurring = async () => {
    if (!selectedBarber || !selectedService) {
      Alert.alert('Erro', 'Selecione um barbeiro e um serviço');
      return;
    }

    setSaving(true);
    console.log('[RECORRENTE] Salvando configuração...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Calcular próximo agendamento
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + frequency);

      const recurringData = {
        user_id: user.id,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        frequency_days: frequency,
        preferred_time: preferredTime,
        preferred_day_of_week: preferredDay,
        next_appointment_date: nextDate.toISOString().split('T')[0],
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (recurring) {
        await supabase
          .from('recurring_appointments')
          .update(recurringData)
          .eq('id', recurring.id);
      } else {
        await supabase
          .from('recurring_appointments')
          .insert(recurringData);
      }

      console.log('[RECORRENTE] ✅ Configuração salva');
      Alert.alert(
        'Sucesso!',
        `Agendamento recorrente configurado!\n\n${selectedService.name} com ${selectedBarber.name}\nA cada ${frequency} dias às ${preferredTime}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      console.error('[RECORRENTE] Erro:', e);
      Alert.alert('Erro', 'Não foi possível salvar');
    }
    
    setSaving(false);
  };

  /**
   * Desativa o agendamento recorrente
   */
  const deactivateRecurring = async () => {
    Alert.alert(
      'Desativar Agendamento Recorrente',
      'Deseja realmente desativar o agendamento automático?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            if (recurring) {
              await supabase
                .from('recurring_appointments')
                .update({ is_active: false })
                .eq('id', recurring.id);
              
              setRecurring(null);
              console.log('[RECORRENTE] Agendamento desativado');
              Alert.alert('Sucesso', 'Agendamento recorrente desativado');
            }
          }
        }
      ]
    );
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
          <Text className="text-white text-xl font-bold">Agendamento Recorrente</Text>
        </View>

        <Text className="text-gray-400 mb-6">
          Configure um agendamento automático e nunca mais esqueça de cuidar do visual!
        </Text>

        {/* Status Atual */}
        {recurring && (
          <View className="bg-green-900/20 p-4 rounded-2xl border border-green-700 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" style={{ marginRight: 10 }} />
                <View>
                  <Text className="text-green-400 font-bold">Agendamento Ativo</Text>
                  <Text className="text-gray-400 text-sm">
                    Próximo: {recurring.next_appointment_date ? new Date(recurring.next_appointment_date).toLocaleDateString('pt-BR') : 'Calculando...'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={deactivateRecurring}>
                <Ionicons name="close-circle" size={24} color="#f87171" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selecionar Barbeiro */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">Escolha o Profissional</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {barbers.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedBarber(b)}
                className={`px-4 py-3 rounded-xl mr-2 ${selectedBarber?.id === b.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${selectedBarber?.id === b.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {b.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selecionar Serviço */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">Escolha o Serviço</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedService(s)}
                className={`px-4 py-3 rounded-xl mr-2 ${selectedService?.id === s.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${selectedService?.id === s.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Frequência */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">Com que frequência?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {frequencies.map((f) => (
              <TouchableOpacity
                key={f.days}
                onPress={() => setFrequency(f.days)}
                className={`px-4 py-3 rounded-xl mr-2 ${frequency === f.days ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${frequency === f.days ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Horário Preferido */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">Horário Preferido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setPreferredTime(time)}
                className={`px-4 py-3 rounded-xl mr-2 ${preferredTime === time ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${preferredTime === time ? 'text-black font-bold' : 'text-gray-400'}`}>{time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Resumo */}
        {selectedBarber && selectedService && (
          <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-6">
            <Text className="text-[#d4af37] font-bold mb-3">Resumo</Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="cut" size={18} color="#d4af37" style={{ marginRight: 10 }} />
              <Text className="text-white">{selectedService.name} - R$ {selectedService.price.toFixed(2)}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="person" size={18} color="#d4af37" style={{ marginRight: 10 }} />
              <Text className="text-white">com {selectedBarber.name}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="refresh" size={18} color="#d4af37" style={{ marginRight: 10 }} />
              <Text className="text-white">A cada {frequency} dias</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#d4af37" style={{ marginRight: 10 }} />
              <Text className="text-white">às {preferredTime}</Text>
            </View>
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity
          onPress={saveRecurring}
          disabled={saving || !selectedBarber || !selectedService}
          className={`py-4 rounded-xl items-center mb-8 ${saving || !selectedBarber || !selectedService ? 'bg-gray-700' : 'bg-[#d4af37]'}`}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-bold text-lg">
              {recurring ? 'Atualizar Configuração' : 'Ativar Agendamento Recorrente'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
