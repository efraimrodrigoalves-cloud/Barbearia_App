import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { logger } from '../../lib/logger';

/**
 * Tela de Sucesso do Agendamento
 * 
 * Descrição: Mostra confirmação após agendamento realizado com sucesso
 * Parâmetros: appointmentId, barberId, barberName, serviceName
 * Logs: [BOOKING]
 */
const LOG_PREFIX = '[BOOKING]';

export default function BookingSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log(`${LOG_PREFIX} Agendamento concluído com sucesso:`, params);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center px-8">
      <View className="items-center w-full">
        {/* Checkmark Icon */}
        <View className="w-28 h-28 rounded-full bg-[#1e1e1e] border-2 border-[#d4af37] items-center justify-center mb-8 shadow-lg shadow-black">
          <Ionicons name="checkmark" size={60} color="#d4af37" />
        </View>

        <Text className="text-white text-3xl font-bold text-center mb-3">Agendado!</Text>
        <Text className="text-gray-400 text-center text-lg mb-8 leading-7">
          Seu horário foi confirmado com sucesso. Te esperamos na barbearia! ✂️
        </Text>

        {/* Summary Card */}
        <View className="bg-[#1e1e1e] p-6 rounded-3xl border border-gray-800 w-full mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={22} color="#d4af37" style={{ marginRight: 12 }} />
            <Text className="text-white font-bold text-lg">{params.dateStr || 'Horário confirmado'}</Text>
          </View>
          {params.clientName ? (
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={22} color="#d4af37" style={{ marginRight: 12 }} />
              <Text className="text-gray-300">{params.clientName}</Text>
            </View>
          ) : null}
        </View>

        {/* Mensalista Info */}
        {params.subscriptionMsg ? (
          <View className="bg-green-900/20 p-4 rounded-2xl border border-green-700 w-full mb-6">
            <View className="flex-row items-center">
              <Ionicons name="card" size={20} color="#22c55e" style={{ marginRight: 10 }} />
              <Text className="text-green-400 flex-1">{params.subscriptionMsg}</Text>
            </View>
          </View>
        ) : null}

        {/* CTA Buttons */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/appointments')}
          activeOpacity={0.85}
          className="bg-[#d4af37] py-4 rounded-2xl items-center w-full mb-4 shadow-lg shadow-black"
        >
          <Text className="text-black font-bold text-lg">Ver Minha Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
          className="py-4 items-center w-full"
        >
          <Text className="text-gray-400 font-semibold">Voltar para o Início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
