/**
 * Tela de Indicações
 * 
 * Descrição: Registrar e acompanhar indicações de clientes
 * Tabelas utilizadas: referrals, referral_config, profiles, loyalty_points
 * Logs: [INDICACOES]
 */

import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const LOG_PREFIX = '[INDICACOES]';

export default function ReferralsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [totalRewards, setTotalRewards] = useState(0);
  const [referredName, setReferredName] = useState('');
  const [referredPhone, setReferredPhone] = useState('');
  const [referredEmail, setReferredEmail] = useState('');

  useEffect(() => {
    console.log(`${LOG_PREFIX} Tela de indicações carregada`);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log(`${LOG_PREFIX} Carregando dados de indicações`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar indicações do usuário
      const { data: refs } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (refs) {
        setReferrals(refs);
        console.log(`${LOG_PREFIX} Indicações encontradas:`, refs.length);

        // Calcular recompensas totais
        const rewards = refs
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.reward_value || 0), 0);
        setTotalRewards(rewards);
      }

      // Buscar configuração
      const { data: cfg } = await supabase
        .from('referral_config')
        .select('*')
        .eq('active', true)
        .single();

      if (cfg) {
        setConfig(cfg);
        console.log(`${LOG_PREFIX} Configuração carregada:`, cfg);
      }
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao carregar indicações:`, error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReferral = async () => {
    if (!referredName.trim()) {
      Alert.alert('Erro', 'Digite o nome do indicado');
      return;
    }

    setSubmitting(true);
    console.log(`${LOG_PREFIX} Registrando indicação:`, { referredName, referredPhone, referredEmail });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('referrals').insert({
        referrer_id: user.id,
        referred_name: referredName.trim(),
        referred_phone: referredPhone.trim() || null,
        referred_email: referredEmail.trim() || null,
        reward_type: config?.points_per_referral ? 'points' : 'discount',
        reward_value: config?.points_per_referral || 100,
        reward_description: `${config?.points_per_referral || 100} pontos de fidelidade`,
      });

      if (error) throw error;

      console.log(`${LOG_PREFIX} Indicação registrada com sucesso`);
      Alert.alert('Indicação Registrada!', `Quando ${referredName} fizer o primeiro agendamento, você ganhará ${config?.points_per_referral || 100} pontos!`);
      
      setReferredName('');
      setReferredPhone('');
      setReferredEmail('');
      loadData();
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao registrar indicação:`, error.message);
      Alert.alert('Erro', 'Não foi possível registrar a indicação.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'registered': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'registered': return 'Cadastrado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return status;
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
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Indicações</Text>
        </View>

        {/* Resumo */}
        <View className="bg-[#1e1e1e] p-6 rounded-3xl mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-400 text-sm">Total de Indicações</Text>
              <Text className="text-white text-3xl font-bold">{referrals.length}</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-400 text-sm">Recompensas</Text>
              <Text className="text-[#d4af37] text-3xl font-bold">{totalRewards}</Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-400 text-sm">Concluídas</Text>
              <Text className="text-green-400 text-3xl font-bold">
                {referrals.filter(r => r.status === 'completed').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Formulário */}
        <View className="bg-[#1e1e1e] p-6 rounded-3xl mb-6">
          <Text className="text-white font-bold text-lg mb-4">Indicar Amigo</Text>
          
          <TextInput
            value={referredName}
            onChangeText={setReferredName}
            placeholder="Nome do amigo"
            placeholderTextColor="#666"
            className="bg-[#121212] text-white px-4 py-3 rounded-xl mb-3"
          />
          
          <TextInput
            value={referredPhone}
            onChangeText={setReferredPhone}
            placeholder="Telefone (opcional)"
            placeholderTextColor="#666"
            className="bg-[#121212] text-white px-4 py-3 rounded-xl mb-3"
            keyboardType="phone-pad"
          />
          
          <TextInput
            value={referredEmail}
            onChangeText={setReferredEmail}
            placeholder="Email (opcional)"
            placeholderTextColor="#666"
            className="bg-[#121212] text-white px-4 py-3 rounded-xl mb-4"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={submitReferral}
            disabled={submitting}
            className="bg-[#d4af37] py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg text-center">
              {submitting ? 'Registrando...' : 'Registrar Indicação'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Indicações */}
        <Text className="text-white font-bold text-lg mb-4">Histórico</Text>
        {referrals.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="people-outline" size={64} color="#333" />
            <Text className="text-gray-500 mt-4 text-center">
              Você ainda não fez nenhuma indicação.
            </Text>
            <Text className="text-gray-500 text-center">
              Indique amigos e ganhe {config?.points_per_referral || 100} pontos por cada um!
            </Text>
          </View>
        ) : (
          referrals.map((referral) => (
            <View key={referral.id} className="bg-[#1e1e1e] p-4 rounded-2xl mb-3">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold">{referral.referred_name}</Text>
                  <Text className="text-gray-400 text-sm">
                    {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text className={`${getStatusColor(referral.status)} font-bold`}>
                  {getStatusLabel(referral.status)}
                </Text>
              </View>
              {referral.reward_description && (
                <Text className="text-[#d4af37] text-sm mt-2">
                  🎁 {referral.reward_description}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
