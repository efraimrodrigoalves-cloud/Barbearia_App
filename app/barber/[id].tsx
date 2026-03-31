import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela de Perfil do Barbeiro (Dinâmica)
 * 
 * Descrição: Exibe perfil do barbeiro pelo ID na URL
 * Parâmetros: id (ID do barbeiro)
 * Tabelas utilizadas: barbers, appointments
 * Logs: [BARBEIRO]
 */
const LOG_PREFIX = '[BARBEIRO]';

export default function BarberProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [barber, setBarber] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`${LOG_PREFIX} Carregando perfil do barbeiro: ${id}`);
    async function loadBarber() {
      const { data: b } = await supabase.from('barbers').select('*').eq('id', id).single();
      setBarber(b);
      console.log(`${LOG_PREFIX} Barbeiro carregado: ${b?.name}`);

      const { data: appts } = await supabase
        .from('appointments')
        .select('id, appointment_date, services(name), client_name')
        .eq('barber_id', id)
        .order('appointment_date', { ascending: false })
        .limit(10);
      if (appts) setAppointments(appts);
      setLoading(false);
    }
    if (id) loadBarber();
  }, [id]);

  if (loading) return (
    <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
      <ActivityIndicator size="large" color="#d4af37" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Perfil do Profissional</Text>
        </View>

        {/* Barber Card */}
        <View className="bg-[#1e1e1e] rounded-3xl border border-gray-800 p-6 mb-8 items-center">
          <Image
            source={{ uri: barber?.avatar_url || 'https://i.pravatar.cc/150' }}
            className="w-28 h-28 rounded-full border-4 border-[#d4af37] mb-4 bg-gray-800"
          />
          <Text className="text-white text-2xl font-bold mb-1">{barber?.name}</Text>
          <Text className="text-gray-400 mb-6">{barber?.specialty || 'Barbeiro Oficial'}</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/booking/barber', params: { preSelectedBarberId: barber?.id } })}
            className="bg-[#d4af37] py-4 px-10 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">Agendar com {barber?.name?.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Appointments */}
        <Text className="text-white text-xl font-bold mb-4">Histórico de Cortes</Text>
        {appointments.length === 0 ? (
          <Text className="text-gray-500">Nenhum corte registrado ainda.</Text>
        ) : appointments.map((appt) => (
          <View key={appt.id} className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-3 flex-row justify-between items-center">
            <View>
              <Text className="text-white font-bold">{appt.client_name}</Text>
              <Text className="text-gray-400 text-sm">{appt.services?.name}</Text>
            </View>
            <Text className="text-gray-500 text-sm">
              {new Date(appt.appointment_date).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
