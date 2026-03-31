import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

/**
 * Tela de Seleção de Serviço
 * 
 * Descrição: Lista serviços disponíveis para agendamento
 * Tabelas utilizadas: services
 * Logs: [BOOKING]
 */
const LOG_PREFIX = '[BOOKING]';

export default function SelectService() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Carregar serviços ao montar a tela
  useEffect(() => {
    console.log(`${LOG_PREFIX} Carregando lista de serviços`);
    async function load() {
      const { data, error } = await supabase.from('services').select('*').order('price', { ascending: true });
      if (error) {
        console.log(`[ERRO] ${LOG_PREFIX} Falha ao carregar serviços:`, error.message);
      }
      if (data) {
        setServices(data);
        console.log(`${LOG_PREFIX} ${data.length} serviços carregados`);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Navegar para seleção de barbeiro
  const handleNext = () => {
    if (selected) {
      console.log(`${LOG_PREFIX} Serviço selecionado: ${selected}`);
      router.push({ pathname: '/booking/barber', params: { serviceId: selected } });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
           <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
             <Ionicons name="arrow-back" size={28} color="#d4af37" />
           </TouchableOpacity>
           <Text className="text-white text-xl font-bold">Escolher Serviço</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => setSelected(service.id)}
              className={`p-4 rounded-2xl mb-4 border ${selected === service.id ? 'border-[#d4af37] bg-[#1e1e1e]' : 'border-gray-800 bg-[#1e1e1e]'}`}
            >
              <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center">
                   {service.icon && <Ionicons name={service.icon} size={20} color="#d4af37" className="mr-2" />}
                   <Text className="text-white text-lg font-bold">{service.name}</Text>
                </View>
                <Text className="text-[#d4af37] font-bold">R$ {service.price.toFixed(2)}</Text>
              </View>
              <Text className="text-gray-400">{service.duration_minutes} min</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <View className="p-4 border-t border-gray-800">
        <TouchableOpacity
          onPress={handleNext}
          disabled={!selected}
          className={`py-4 rounded-xl items-center ${selected ? 'bg-[#d4af37]' : 'bg-gray-800'}`}
        >
          <Text className={`font-bold text-lg ${selected ? 'text-black' : 'text-gray-500'}`}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
