import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

/**
 * Tela de Seleção de Barbeiro
 * 
 * Descrição: Lista barbeiros com avaliações para o cliente escolher
 * Parâmetros: serviceId (ID do serviço selecionado)
 * Tabelas utilizadas: barbers, reviews
 * Logs: [BOOKING]
 */
const LOG_PREFIX = '[BOOKING]';

export default function SelectBarber() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [barberRatings, setBarberRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    console.log(`${LOG_PREFIX} Carregando barbeiros para serviço: ${params.serviceId}`);
    async function load() {
      // Buscar barbeiros
      const { data: barbersData } = await supabase.from('barbers').select('*');
      if (barbersData) {
        setBarbers(barbersData);
        console.log(`${LOG_PREFIX} ${barbersData.length} barbeiros carregados`);
      }

      // Buscar avaliações para calcular média
      const { data: reviews } = await supabase
        .from('reviews')
        .select('barber_id, rating');

      if (reviews) {
        console.log(`${LOG_PREFIX} Calculando avaliações de ${reviews.length} reviews`);
        const ratings: Record<string, { total: number; count: number }> = {};
        reviews.forEach(r => {
          if (!ratings[r.barber_id]) {
            ratings[r.barber_id] = { total: 0, count: 0 };
          }
          ratings[r.barber_id].total += r.rating;
          ratings[r.barber_id].count++;
        });

        const avgs: Record<string, { avg: number; count: number }> = {};
        Object.entries(ratings).forEach(([id, val]) => {
          avgs[id] = { avg: val.total / val.count, count: val.count };
        });
        setBarberRatings(avgs);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleNext = () => {
    if (selected) {
      const barber = barbers.find(b => b.id === selected);
      router.push({ 
        pathname: '/booking/datetime', 
        params: { ...params, barberId: selected, barberName: barber?.name } 
      });
    }
  };

  /**
   * Renderiza estrelas de avaliação
   */
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={16}
          color="#d4af37"
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
           <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
             <Ionicons name="arrow-back" size={28} color="#d4af37" />
           </TouchableOpacity>
           <Text className="text-white text-xl font-bold">Escolha o Profissional</Text>
        </View>

        <Text className="text-gray-400 mb-4">Selecione o barbeiro de sua preferência</Text>

        {loading ? (
            <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
        ) : barbers.map((barber) => {
          const rating = barberRatings[barber.id];
          
          return (
            <TouchableOpacity
              key={barber.id}
              onPress={() => setSelected(barber.id)}
              className={`p-4 rounded-2xl mb-4 border ${selected === barber.id ? 'border-[#d4af37] bg-[#1e1e1e]' : 'border-gray-800 bg-[#1e1e1e]'}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Image 
                    source={{ uri: barber.avatar_url || 'https://i.pravatar.cc/150' }} 
                    className="w-16 h-16 rounded-full mr-4 bg-gray-600" 
                  />
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">{barber.name}</Text>
                    <Text className="text-gray-400 mb-2">{barber.specialty || 'Barbeiro'}</Text>
                    
                    {/* Avaliações */}
                    <View className="flex-row items-center">
                      {rating ? (
                        <>
                          <View className="flex-row mr-2">
                            {renderStars(rating.avg)}
                          </View>
                          <Text className="text-[#d4af37] font-bold mr-1">{rating.avg.toFixed(1)}</Text>
                          <Text className="text-gray-500">({rating.count})</Text>
                        </>
                      ) : (
                        <View className="flex-row items-center">
                          <Ionicons name="star-outline" size={16} color="#555" />
                          <Text className="text-gray-500 ml-1">Sem avaliações</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {selected === barber.id && (
                  <View className="w-8 h-8 rounded-full bg-[#d4af37] justify-center items-center ml-2">
                    <Ionicons name="checkmark" size={20} color="#000" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
