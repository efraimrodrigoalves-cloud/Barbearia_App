import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

/**
 * Tela de Perfil do Barbeiro (Visão do Cliente)
 * 
 * Descrição: Mostra informações do barbeiro e suas avaliações
 * Parâmetros: id, name
 * Tabelas utilizadas: barbers, reviews, appointments
 * Logs: [BARBEIRO]
 */
const LOG_PREFIX = '[BARBEIRO]';

export default function BarberProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name } = params;

  const [barber, setBarber] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ avg: 0, count: 0, totalClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBarberData();
  }, []);

  const loadBarberData = async () => {
    setLoading(true);

    // Buscar dados do barbeiro
    const { data: barberData } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', id)
      .single();

    if (barberData) setBarber(barberData);

    // Buscar avaliações
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('barber_id', id)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      setReviews(reviewsData);

      // Calcular estatísticas
      const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
      const avg = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;
      
      // Contar clientes únicos
      const uniqueClients = new Set(reviewsData.map(r => r.user_id));

      setStats({
        avg,
        count: reviewsData.length,
        totalClients: uniqueClients.size
      });
    }

    setLoading(false);
  };

  /**
   * Renderiza estrelas de avaliação
   */
  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? "star" : "star-outline"}
        size={size}
        color="#d4af37"
      />
    ));
  };

  /**
   * Renderiza barra de distribuição de avaliações
   */
  const renderRatingBar = (stars: number) => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

    return (
      <View className="flex-row items-center mb-1">
        <Text className="text-gray-400 text-xs w-8">{stars}★</Text>
        <View className="flex-1 h-2 bg-gray-800 rounded-full mx-2 overflow-hidden">
          <View 
            className="h-full bg-[#d4af37] rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text className="text-gray-500 text-xs w-8 text-right">{count}</Text>
      </View>
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Perfil do Profissional</Text>
        </View>

        {/* Perfil do Barbeiro */}
        <View className="items-center px-4 mb-6">
          <Image 
            source={{ uri: barber?.avatar_url || 'https://i.pravatar.cc/200' }}
            className="w-28 h-28 rounded-full border-4 border-[#d4af37] mb-4 bg-gray-700"
          />
          <Text className="text-white text-2xl font-bold mb-1">{barber?.name || name}</Text>
          <Text className="text-gray-400 mb-4">{barber?.specialty || 'Barbeiro Profissional'}</Text>

          {/* Estatísticas */}
          <View className="flex-row w-full justify-around bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
            <View className="items-center">
              <View className="flex-row items-center mb-1">
                <Ionicons name="star" size={20} color="#d4af37" />
                <Text className="text-[#d4af37] text-2xl font-bold ml-1">{stats.avg.toFixed(1)}</Text>
              </View>
              <Text className="text-gray-400 text-xs">Avaliação</Text>
            </View>
            <View className="w-px bg-gray-700" />
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.count}</Text>
              <Text className="text-gray-400 text-xs">Avaliações</Text>
            </View>
            <View className="w-px bg-gray-700" />
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.totalClients}</Text>
              <Text className="text-gray-400 text-xs">Clientes</Text>
            </View>
          </View>
        </View>

        {/* Distribuição de Avaliações */}
        <View className="px-4 mb-6">
          <Text className="text-white font-bold text-lg mb-3">Distribuição</Text>
          <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
            {renderRatingBar(5)}
            {renderRatingBar(4)}
            {renderRatingBar(3)}
            {renderRatingBar(2)}
            {renderRatingBar(1)}
          </View>
        </View>

        {/* Avaliações dos Clientes */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold text-lg">Avaliações</Text>
            <Text className="text-gray-400">{reviews.length} avaliações</Text>
          </View>

          {reviews.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="star-outline" size={48} color="#333" />
              <Text className="text-gray-500 mt-2">Nenhuma avaliação ainda</Text>
              <Text className="text-gray-600 text-sm text-center mt-1">
                Seja o primeiro a avaliar este profissional!
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-[#121212] items-center justify-center mr-3">
                      <Text className="text-[#d4af37] font-bold">
                        {review.profiles?.full_name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-semibold">
                        {review.profiles?.full_name || 'Cliente'}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    {renderStars(review.rating, 14)}
                  </View>
                </View>
                {review.comment && (
                  <Text className="text-gray-300 mt-2">{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Botão Agendar */}
        <View className="px-4 pb-8">
          <TouchableOpacity
            onPress={() => router.push('/booking')}
            className="bg-[#d4af37] py-4 rounded-xl items-center"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text className="text-black font-bold text-lg">Agendar um Horário</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-gray-500 text-center text-xs mt-2">
            Você poderá escolher {barber?.name?.split(' ')[0] || name} na seleção de profissional
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
