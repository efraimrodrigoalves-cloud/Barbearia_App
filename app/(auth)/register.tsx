import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

export default function Register() {
  logger.screen.render('Register');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!name || !email || !password) return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios!');
    setLoading(true);
    logger.info(`Tentativa de registro: ${email}`);
    
    // Cria o usuário na Autenticação
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      logger.auth.error('registro', error);
      Alert.alert('Erro', error.message);
    } else {
      logger.auth.register(email, true);
      
      // Salva os dados extras no perfil
      if (data.user) {
        logger.info(`Criando perfil para: ${data.user.id}`);
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: name,
          phone: phone,
          role: 'client'
        });
        
        if (profileError) {
          logger.data.insert('profiles', false, profileError);
        } else {
          logger.data.insert('profiles', true);
          logger.info(`Perfil criado: ${name} | Telefone: ${phone || 'Não informado'}`);
        }
      }
      Alert.alert('Sucesso!', 'Conta criada com sucesso.');
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'bottom']}>
      <ScrollView className="flex-1 px-6 pt-8">
        <Link href="/(auth)/login" className="mb-4">
          <Ionicons name="arrow-back" size={28} color="#d4af37" />
        </Link>
        <Text className="text-white text-3xl font-bold mb-2">Criar Conta</Text>
        <Text className="text-gray-400 mb-8">Preencha seus dados para agendar</Text>
        
        <View className="mb-4">
          <Text className="text-gray-400 mb-2 ml-1">Nome Completo *</Text>
          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
            placeholder="João Silva"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-4">
          <Text className="text-gray-400 mb-2 ml-1">Telefone (WhatsApp)</Text>
          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
            placeholder="(11) 99999-9999"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View className="mb-4">
          <Text className="text-gray-400 mb-2 ml-1">E-mail *</Text>
          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
            placeholder="seu@email.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-8">
          <Text className="text-gray-400 mb-2 ml-1">Senha *</Text>
          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
            placeholder="********"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          onPress={signUpWithEmail} 
          disabled={loading}
          className="bg-[#d4af37] p-4 rounded-xl items-center mb-6 shadow-lg shadow-black"
        >
          <Text className="text-black font-bold text-lg">{loading ? 'Criando...' : 'Finalizar Cadastro'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
