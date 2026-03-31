import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela de Catálogo de Estilos
 * 
 * Descrição: Galeria de cortes para inspiração
 * Tabelas utilizadas: style_catalog
 * Logs: [CATÁLOGO]
 */
const LOG_PREFIX = '[CATÁLOGO]';

export default function StyleCatalogScreen() {
  const router = useRouter();
  
  // Estados
  const [styles, setStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todos', icon: 'grid' },
    { id: 'corte', label: 'Cortes', icon: 'cut' },
    { id: 'barba', label: 'Barba', icon: 'man' },
    { id: 'sobrancelha', label: 'Sobrancelha', icon: 'eye' },
    { id: 'combo', label: 'Combos', icon: 'albums' },
  ];

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadStyles();
  }, [selectedCategory]);

  /**
   * Carrega estilos do catálogo
   * Filtra por categoria se selecionada
   */
  const loadStyles = async () => {
    setLoading(true);
    console.log('[CATÁLOGO] Carregando estilos...');

    try {
      let query = supabase
        .from('style_catalog')
        .select('*')
        .order('popularity_score', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CATÁLOGO] Erro:', error);
      } else if (data) {
        setStyles(data);
        console.log('[CATÁLOGO] Estilos carregados:', data.length);
      }
    } catch (e) {
      console.error('[CATÁLOGO] Erro:', e);
    }
    
    setLoading(false);
  };

  /**
   * Retorna cor da categoria
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'corte': return '#d4af37';
      case 'barba': return '#22c55e';
      case 'sobrancelha': return '#3b82f6';
      case 'combo': return '#a855f7';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Catálogo de Estilos</Text>
        </View>

        <Text className="text-gray-400 mb-6">
          Inspire-se com nossos cortes e estilos disponíveis
        </Text>

        {/* Categorias */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`flex-row items-center px-4 py-3 rounded-xl mr-2 ${selectedCategory === cat.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={18} 
                color={selectedCategory === cat.id ? '#000' : '#d4af37'} 
                style={{ marginRight: 6 }} 
              />
              <Text className={`font-bold text-sm ${selectedCategory === cat.id ? 'text-black' : 'text-gray-400'}`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Estilos */}
        {loading ? (
          <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
        ) : styles.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="images-outline" size={64} color="#333" />
            <Text className="text-gray-500 mt-4">Nenhum estilo encontrado</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {styles.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => {
                  // Navegar para detalhes ou agendamento
                  router.push({
                    pathname: '/booking',
                    params: { styleId: style.id }
                  });
                }}
                className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden"
                style={{ width: '48%' }}
              >
                {/* Imagem */}
                <View className="h-40 bg-gray-800 items-center justify-center">
                  {style.image_url ? (
                    <Image source={{ uri: style.image_url }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="cut" size={48} color={getCategoryColor(style.category)} />
                  )}
                  {style.is_featured && (
                    <View className="absolute top-2 right-2 bg-[#d4af37] px-2 py-1 rounded-full">
                      <Text className="text-black text-xs font-bold">Destaque</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View className="p-3">
                  <Text className="text-white font-bold mb-1" numberOfLines={1}>{style.name}</Text>
                  <Text className="text-gray-400 text-xs mb-2" numberOfLines={2}>{style.description}</Text>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#d4af37] font-bold">R$ {style.price?.toFixed(2)}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text className="text-gray-500 text-xs">{style.duration_minutes} min</Text>
                    </View>
                  </View>

                  {/* Tags */}
                  {style.tags && style.tags.length > 0 && (
                    <View className="flex-row flex-wrap mt-2">
                      {style.tags.slice(0, 2).map((tag: string, idx: number) => (
                        <View key={idx} className="bg-gray-800 px-2 py-1 rounded-full mr-1 mb-1">
                          <Text className="text-gray-400 text-xs">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
