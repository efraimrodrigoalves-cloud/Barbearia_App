import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import * as Haptics from 'expo-haptics';

/**
 * Tela de Avaliação do Barbeiro
 * 
 * Descrição: Permite que o cliente avalie o atendimento após conclusão
 * Parâmetros: appointmentId, barberId, barberName, serviceName
 * Tabelas utilizadas: reviews, appointments
 * Logs: [BOOKING]
 */
const LOG_PREFIX = '[BOOKING]';

export default function ReviewBarber() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { appointmentId, barberId, barberName, serviceName } = params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Envia a avaliação para o banco de dados
   */
  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para avaliar');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          barber_id: barberId,
          rating: rating,
          comment: comment.trim() || null
        });

      if (error) {
        console.error('Erro ao salvar avaliação:', error);
        Alert.alert('Erro', 'Não foi possível salvar sua avaliação');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Obrigado! 🙏',
          'Sua avaliação foi registrada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e) {
      console.error('Erro:', e);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar sua avaliação');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Avaliar Atendimento</Text>
        </View>

        {/* Info do Atendimento */}
        <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="person" size={24} color="#d4af37" style={{ marginRight: 12 }} />
            <View>
              <Text className="text-gray-400 text-xs">Profissional</Text>
              <Text className="text-white font-bold text-lg">{barberName || 'Barbeiro'}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cut" size={24} color="#d4af37" style={{ marginRight: 12 }} />
            <View>
              <Text className="text-gray-400 text-xs">Serviço</Text>
              <Text className="text-white font-semibold">{serviceName || 'Serviço'}</Text>
            </View>
          </View>
        </View>

        {/* Avaliação com Estrelas */}
        <Text className="text-white text-lg font-bold mb-4">Como foi seu atendimento?</Text>
        
        <View className="flex-row justify-center mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => {
                setRating(star);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="mx-2"
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={48}
                color={star <= rating ? "#d4af37" : "#555"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Texto da Avaliação */}
        <Text className="text-gray-400 text-center mb-6">
          {rating === 0 && 'Toque nas estrelas para avaliar'}
          {rating === 1 && '⭐ Muito insatisfeito'}
          {rating === 2 && '⭐⭐ Insatisfeito'}
          {rating === 3 && '⭐⭐⭐ Regular'}
          {rating === 4 && '⭐⭐⭐⭐ Bom'}
          {rating === 5 && '⭐⭐⭐⭐⭐ Excelente!'}
        </Text>

        {/* Campo de Comentário */}
        <Text className="text-gray-400 text-xs mb-2">Comentário (opcional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Conte como foi sua experiência..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800 mb-6"
          style={{ textAlignVertical: 'top', minHeight: 100 }}
        />

        {/* Botão Enviar */}
        <TouchableOpacity
          onPress={submitReview}
          disabled={loading || rating === 0}
          className={`py-4 rounded-xl items-center mb-4 ${loading || rating === 0 ? 'bg-gray-800' : 'bg-[#d4af37]'}`}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className={`font-bold text-lg ${loading || rating === 0 ? 'text-gray-500' : 'text-black'}`}>
              Enviar Avaliação
            </Text>
          )}
        </TouchableOpacity>

        {/* Botão Pular */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-4 items-center mb-8"
        >
          <Text className="text-gray-400 font-semibold">Avaliar depois</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
