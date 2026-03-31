import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { logger } from '../lib/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  logger.sessionStart();
  
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    logger.info('Verificando sessão...');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
      
      if (session?.user) {
        logger.info(`Sessão ativa encontrada: ${session.user.id}`);
        registerForPushNotificationsAsync(session.user.id);
      } else {
        logger.info('Nenhuma sessão ativa - redirecionando para login');
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      logger.info(`Auth state changed: ${event}`);
      setSession(session);
      if (session?.user) {
        registerForPushNotificationsAsync(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    logger.info(`Navegação: segments=${segments.join('/')} | session=${!!session} | inAuth=${inAuthGroup}`);

    if (!session && !inAuthGroup) {
      logger.info('Sem sessão, redirecionando para login');
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      logger.info('Com sessão, redirecionando para tabs');
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    logger.info('App ainda não inicializado...');
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="barber" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
