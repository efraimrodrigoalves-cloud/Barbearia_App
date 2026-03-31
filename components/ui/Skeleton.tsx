/**
 * Skeleton Loader - Componente de carregamento
 * 
 * Descrição: Placeholder animado para conteúdo carregando
 * Uso: Substituir ActivityIndicator por Skeleton para melhor UX
 */

import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, className = '' }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="bg-gray-700"
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }}
    />
  );
}

/**
 * Card Skeleton - Para listas de cards
 */
export function CardSkeleton() {
  return (
    <View className="bg-[#1e1e1e] p-4 rounded-2xl mb-3">
      <View className="flex-row items-center mb-3">
        <Skeleton width={40} height={40} borderRadius={20} />
        <View className="flex-1 ml-3">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} className="mt-2" />
        </View>
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} className="mt-2" />
    </View>
  );
}

/**
 * List Skeleton - Para listas genéricas
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}
