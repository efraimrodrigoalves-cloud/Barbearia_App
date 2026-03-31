/**
 * Tela de Cupons de Desconto
 * 
 * Descrição: Aplicar cupom de desconto durante o agendamento
 * Parâmetros: amount (valor do serviço)
 * Tabelas utilizadas: coupons, coupon_usages
 * Logs: [CUPOM]
 */

import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const LOG_PREFIX = '[CUPOM]';

export default function CouponScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = parseFloat(params.amount as string) || 0;
  
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(amount);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Erro', 'Digite um cupom válido');
      return;
    }

    setLoading(true);
    console.log(`${LOG_PREFIX} Validando cupom:`, couponCode);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        console.log(`${LOG_PREFIX} Cupom não encontrado ou inválido`);
        Alert.alert('Cupom Inválido', 'Este cupom não existe ou está expirado.');
        return;
      }

      // Verificar validade
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        Alert.alert('Cupom Expirado', 'Este cupom já expirou.');
        return;
      }

      // Verificar valor mínimo
      if (coupon.min_purchase_amount && amount < coupon.min_purchase_amount) {
        Alert.alert('Valor Mínimo', `Este cupom requer um pedido mínimo de R$ ${coupon.min_purchase_amount.toFixed(2)}.`);
        return;
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = amount * (coupon.discount_value / 100);
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, coupon.max_discount_amount);
        }
      } else {
        discount = coupon.discount_value;
      }

      discount = Math.min(discount, amount);
      const final = amount - discount;

      console.log(`${LOG_PREFIX} Cupom aplicado:`, { discount, final });
      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
      setFinalAmount(final);

      Alert.alert('Cupom Aplicado!', `Desconto de R$ ${discount.toFixed(2)} aplicado.`);
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao validar cupom:`, error.message);
      Alert.alert('Erro', 'Não foi possível validar o cupom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Cupom de Desconto</Text>
        </View>

        <View className="bg-[#1e1e1e] p-6 rounded-3xl mb-6">
          <Text className="text-gray-400 mb-2">Valor do Serviço</Text>
          <Text className="text-white text-2xl font-bold">R$ {amount.toFixed(2)}</Text>
        </View>

        <View className="bg-[#1e1e1e] p-6 rounded-3xl mb-6">
          <Text className="text-white font-bold mb-4">Digite o Cupom</Text>
          <View className="flex-row">
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Ex: PRIMEIRAVISITA"
              placeholderTextColor="#666"
              className="flex-1 bg-[#121212] text-white px-4 py-3 rounded-xl mr-3"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={validateCoupon}
              disabled={loading}
              className="bg-[#d4af37] px-6 rounded-xl items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {appliedCoupon && (
          <View className="bg-[#1e1e1e] p-6 rounded-3xl mb-6 border border-[#d4af37]">
            <Text className="text-[#d4af37] font-bold mb-2">Cupom Aplicado!</Text>
            <Text className="text-white mb-1">{appliedCoupon.description}</Text>
            <View className="flex-row justify-between mt-3 py-2 border-t border-gray-800">
              <Text className="text-gray-400">Subtotal</Text>
              <Text className="text-white">R$ {amount.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-800">
              <Text className="text-green-400">Desconto</Text>
              <Text className="text-green-400">- R$ {discountAmount.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-white font-bold">Total</Text>
              <Text className="text-[#d4af37] font-bold text-xl">R$ {finalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            router.navigate({
              pathname: '/booking/payment' as any,
              params: {
                ...params,
                discountAmount: discountAmount.toString(),
                finalAmount: finalAmount.toString(),
                couponCode: appliedCoupon?.code || '',
              }
            });
          }}
          className="bg-[#d4af37] py-4 rounded-xl mt-4"
        >
          <Text className="text-black font-bold text-lg text-center">
            {appliedCoupon ? 'Continuar com Desconto' : 'Continuar sem Desconto'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
