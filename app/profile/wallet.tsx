import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela da Carteira Digital
 * 
 * Descrição: Permite visualizar saldo e histórico de transações
 * Tabelas utilizadas: client_wallet, wallet_transactions
 * Logs: [CARTEIRA]
 */
const LOG_PREFIX = '[CARTEIRA]';

export default function WalletScreen() {
  const router = useRouter();
  
  // Estados
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);

  // Carregar dados da carteira
  useEffect(() => {
    console.log(`${LOG_PREFIX} Carregando dados da carteira`);
    loadWalletData();
  }, []);

  /**
   * Carrega dados da carteira e transações
   */
  const loadWalletData = async () => {
    setLoading(true);
    console.log('[CARTEIRA] Carregando dados...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Buscar ou criar carteira
      let { data: walletData } = await supabase
        .from('client_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!walletData) {
        console.log('[CARTEIRA] Criando carteira...');
        const { data: newWallet } = await supabase
          .from('client_wallet')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();
        walletData = newWallet;
      }

      setWallet(walletData);
      console.log('[CARTEIRA] Saldo: R$', walletData?.balance);

      // Buscar transações
      const { data: transData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transData) {
        setTransactions(transData);
        console.log('[CARTEIRA] Transações:', transData.length);
      }
    } catch (e) {
      console.error('[CARTEIRA] Erro:', e);
    }
    
    setLoading(false);
  };

  /**
   * Simula depósito (em produção integraria com gateway de pagamento)
   */
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Erro', 'Informe um valor válido');
      return;
    }

    console.log('[CARTEIRA] Depósito: R$', amount);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Atualizar saldo
      await supabase
        .from('client_wallet')
        .update({ 
          balance: (wallet?.balance || 0) + amount,
          total_deposited: (wallet?.total_deposited || 0) + amount
        })
        .eq('user_id', user.id);

      // Registrar transação
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          description: 'Depósito na carteira'
        });

      console.log('[CARTEIRA] ✅ Depósito realizado');
      setDepositAmount('');
      setShowDeposit(false);
      loadWalletData();
      Alert.alert('Sucesso', `R$ ${amount.toFixed(2)} adicionados à carteira!`);
    } catch (e) {
      console.error('[CARTEIRA] Erro:', e);
      Alert.alert('Erro', 'Não foi possível processar o depósito');
    }
  };

  /**
   * Retorna ícone e cor baseado no tipo de transação
   */
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'deposit': return { icon: 'arrow-down-circle', color: '#22c55e', label: 'Depósito' };
      case 'payment': return { icon: 'card', color: '#f87171', label: 'Pagamento' };
      case 'refund': return { icon: 'refresh', color: '#3b82f6', label: 'Reembolso' };
      case 'bonus': return { icon: 'gift', color: '#a855f7', label: 'Bônus' };
      default: return { icon: 'swap-horizontal', color: '#666', label: 'Transação' };
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
          <Text className="text-white text-xl font-bold">Carteira Digital</Text>
        </View>

        {/* Saldo */}
        <View className="bg-[#1e1e1e] p-6 rounded-2xl border border-[#d4af37] mb-6">
          <Text className="text-gray-400 text-sm">Saldo Disponível</Text>
          <Text className="text-[#d4af37] text-4xl font-bold mt-2">
            R$ {(wallet?.balance || 0).toFixed(2)}
          </Text>
          
          <View className="flex-row mt-4 pt-4 border-t border-gray-800">
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">Total Depositado</Text>
              <Text className="text-green-400 font-bold">R$ {(wallet?.total_deposited || 0).toFixed(2)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">Total Gasto</Text>
              <Text className="text-red-400 font-bold">R$ {(wallet?.total_spent || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Botão Adicionar Saldo */}
        {!showDeposit ? (
          <TouchableOpacity 
            onPress={() => setShowDeposit(true)}
            className="bg-[#d4af37] p-4 rounded-xl items-center mb-6"
          >
            <View className="flex-row items-center">
              <Ionicons name="add-circle" size={24} color="#000" style={{ marginRight: 8 }} />
              <Text className="text-black font-bold text-lg">Adicionar Saldo</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-6">
            <Text className="text-white font-bold mb-4">Adicionar Saldo</Text>
            
            <View className="flex-row mb-4">
              {['50', '100', '150', '200'].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setDepositAmount(value)}
                  className={`flex-1 py-3 mr-2 rounded-xl ${depositAmount === value ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                >
                  <Text className={`text-center font-bold ${depositAmount === value ? 'text-black' : 'text-gray-400'}`}>
                    R$ {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={depositAmount}
              onChangeText={setDepositAmount}
              placeholder="Outro valor (R$)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              className="bg-[#121212] text-[#d4af37] font-bold text-2xl p-4 rounded-xl border border-gray-700 text-center mb-4"
            />

            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => { setShowDeposit(false); setDepositAmount(''); }}
                className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
              >
                <Text className="text-gray-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeposit}
                className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center"
              >
                <Text className="text-black font-bold">Depositar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Histórico */}
        <Text className="text-white font-bold text-lg mb-4">Histórico</Text>
        
        {transactions.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="receipt-outline" size={48} color="#333" />
            <Text className="text-gray-500 mt-2">Nenhuma transação ainda</Text>
          </View>
        ) : (
          transactions.map((trans) => {
            const style = getTransactionStyle(trans.type);
            return (
              <View key={trans.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3 flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: style.color + '20' }}>
                  <Ionicons name={style.icon as any} size={20} color={style.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{style.label}</Text>
                  <Text className="text-gray-500 text-xs">{trans.description}</Text>
                  <Text className="text-gray-600 text-xs">
                    {new Date(trans.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text className={`font-bold ${trans.type === 'deposit' || trans.type === 'refund' || trans.type === 'bonus' ? 'text-green-400' : 'text-red-400'}`}>
                  {trans.type === 'deposit' || trans.type === 'refund' || trans.type === 'bonus' ? '+' : '-'} R$ {trans.amount.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
