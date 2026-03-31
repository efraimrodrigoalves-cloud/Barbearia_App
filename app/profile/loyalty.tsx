import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Tela de Pontos de Fidelidade
 * 
 * Descrição: Visualização de pontos, níveis e recompensas com resgate
 * Tabelas utilizadas: loyalty_points, loyalty_levels, loyalty_rewards, loyalty_transactions
 * Logs: [FIDELIDADE]
 */
const LOG_PREFIX = '[FIDELIDADE]';

export default function LoyaltyScreen() {
  const router = useRouter();
  
  // Estados
  const [points, setPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadLoyaltyData();
  }, []);

  /**
   * Carrega dados de fidelidade do cliente
   * 
   * Logs: [FIDELIDADE]
   */
  const loadLoyaltyData = async () => {
    setLoading(true);
    console.log(`${LOG_PREFIX} Carregando dados...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Buscar pontos do cliente
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsData) {
        setPoints(pointsData.points);
        setTotalEarned(pointsData.total_earned);
        setTotalRedeemed(pointsData.total_redeemed);
        console.log(`${LOG_PREFIX} Pontos:`, pointsData.points);
      }

      // Buscar níveis
      const { data: levelsData } = await supabase
        .from('loyalty_levels')
        .select('*')
        .order('min_points', { ascending: true });

      if (levelsData) {
        setLevels(levelsData);
        const current = [...levelsData].reverse().find(l => points >= l.min_points);
        const next = levelsData.find(l => points < l.min_points);
        setCurrentLevel(current);
        setNextLevel(next);
      }

      // Buscar recompensas
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (rewardsData) setRewards(rewardsData);

      // Buscar transações
      const { data: transData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transData) setTransactions(transData);

    } catch (e: any) {
      console.log(`${LOG_PREFIX} Erro:`, e.message);
    }
    
    setLoading(false);
  };

  /**
   * Resgata uma recompensa usando pontos
   * 
   * @param reward - Recompensa a ser resgatada
   * 
   * Logs: [FIDELIDADE]
   */
  const handleRedeemReward = async (reward: any) => {
    if (points < reward.points_cost) {
      Alert.alert('Pontos Insuficientes', `Você precisa de ${reward.points_cost - points} pontos a mais.`);
      return;
    }

    Alert.alert(
      'Resgatar Recompensa',
      `Deseja resgatar "${reward.name}" por ${reward.points_cost} pontos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resgatar',
          onPress: async () => {
            setRedeeming(reward.id);
            console.log(`${LOG_PREFIX} Resgatando recompensa:`, reward.name);

            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // Debitar pontos
              const { error: pointsError } = await supabase
                .from('loyalty_points')
                .update({
                  points: points - reward.points_cost,
                  total_redeemed: totalRedeemed + reward.points_cost,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

              if (pointsError) throw pointsError;

              // Registrar transação
              await supabase.from('loyalty_transactions').insert({
                user_id: user.id,
                points: -reward.points_cost,
                type: 'redeemed',
                description: `Resgate: ${reward.name}`,
                reference_id: reward.id
              });

              console.log(`${LOG_PREFIX} Recompensa resgatada com sucesso`);
              Alert.alert('Resgatado!', `Você resgatou "${reward.name}". Apresente esta tela na barbearia.`);
              
              setPoints(prev => prev - reward.points_cost);
              setTotalRedeemed(prev => prev + reward.points_cost);
              loadLoyaltyData();
            } catch (error: any) {
              console.log(`${LOG_PREFIX} Erro ao resgatar:`, error.message);
              Alert.alert('Erro', 'Não foi possível resgatar a recompensa.');
            } finally {
              setRedeeming(null);
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
          <Text className="text-white text-xl font-bold">Fidelidade</Text>
        </View>

        {/* Card Principal de Pontos */}
        <View className="bg-[#1e1e1e] p-6 rounded-2xl border border-[#d4af37] mb-6">
          <View className="items-center">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: currentLevel?.color + '20' || '#d4af3720' }}
            >
              <Ionicons name={currentLevel?.icon || 'star'} size={48} color={currentLevel?.color || '#d4af37'} />
            </View>
            <Text className="text-4xl font-bold" style={{ color: currentLevel?.color || '#d4af37' }}>
              {points}
            </Text>
            <Text className="text-gray-400">pontos</Text>
            
            {currentLevel && (
              <View 
                className="px-4 py-2 rounded-full mt-3"
                style={{ backgroundColor: currentLevel.color + '20', borderColor: currentLevel.color, borderWidth: 1 }}
              >
                <Text className="font-bold" style={{ color: currentLevel.color }}>
                  Nível {currentLevel.name}
                </Text>
              </View>
            )}
          </View>

          {/* Progresso para próximo nível */}
          {nextLevel && (
            <View className="mt-6 pt-4 border-t border-gray-800">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-xs">Progresso para {nextLevel.name}</Text>
                <Text className="text-gray-400 text-xs">{points}/{nextLevel.min_points}</Text>
              </View>
              <View className="bg-gray-800 rounded-full h-3 overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min((points / nextLevel.min_points) * 100, 100)}%`,
                    backgroundColor: nextLevel.color 
                  }}
                />
              </View>
              <Text className="text-gray-500 text-xs mt-2">
                Faltam {nextLevel.min_points - points} pontos
              </Text>
            </View>
          )}

          {/* Estatísticas */}
          <View className="flex-row mt-4 pt-4 border-t border-gray-800">
            <View className="flex-1 items-center">
              <Text className="text-green-400 font-bold">{totalEarned}</Text>
              <Text className="text-gray-500 text-xs">Ganhos</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-red-400 font-bold">{totalRedeemed}</Text>
              <Text className="text-gray-500 text-xs">Resgatados</Text>
            </View>
          </View>
        </View>

        {/* Níveis */}
        <Text className="text-white font-bold mb-3">Níveis</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {levels.map((level) => (
            <View 
              key={level.id}
              className={`bg-[#1e1e1e] p-4 rounded-xl mr-3 items-center ${
                currentLevel?.id === level.id ? 'border-2' : 'border border-gray-800'
              }`}
              style={{ width: 100, borderColor: currentLevel?.id === level.id ? level.color : undefined }}
            >
              <Ionicons name={level.icon} size={24} color={level.color} />
              <Text className="text-white font-bold mt-2">{level.name}</Text>
              <Text className="text-gray-500 text-xs">{level.min_points} pts</Text>
              {level.discount_percentage > 0 && (
                <Text className="text-green-400 text-xs mt-1">{level.discount_percentage}% off</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Recompensas */}
        <Text className="text-white font-bold mb-3">Recompensas Disponíveis</Text>
        {rewards.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="gift-outline" size={40} color="#333" />
            <Text className="text-gray-500 mt-2">Nenhuma recompensa disponível</Text>
          </View>
        ) : (
          rewards.map((reward) => (
            <TouchableOpacity
              key={reward.id}
              onPress={() => handleRedeemReward(reward)}
              disabled={redeeming === reward.id || points < reward.points_cost}
              className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-white font-bold">{reward.name}</Text>
                {reward.description && (
                  <Text className="text-gray-400 text-sm">{reward.description}</Text>
                )}
              </View>
              <View className="items-center">
                {redeeming === reward.id ? (
                  <ActivityIndicator color="#d4af37" />
                ) : (
                  <>
                    <View className={`px-3 py-1 rounded-full mb-1 ${points >= reward.points_cost ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <Text className={`font-bold text-sm ${points >= reward.points_cost ? 'text-green-400' : 'text-gray-400'}`}>
                        {reward.points_cost} pts
                      </Text>
                    </View>
                    {points >= reward.points_cost && (
                      <Text className="text-[#d4af37] text-xs">Toque para resgatar</Text>
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Histórico */}
        {transactions.length > 0 && (
          <>
            <Text className="text-white font-bold mb-3 mt-4">Histórico</Text>
            {transactions.slice(0, 5).map((tx) => (
              <View key={tx.id} className="flex-row justify-between items-center py-2 border-b border-gray-800">
                <View>
                  <Text className="text-white text-sm">{tx.description}</Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text className={`font-bold ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </Text>
              </View>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
