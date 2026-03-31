import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4af37',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
        // Tenta pegar o projectId dinamicamente do perfil do app Expo
        const projectId =
           Constants.expoConfig?.extra?.eas?.projectId ??
           Constants.easConfig?.projectId;
        
        const tokenOptions = projectId ? { projectId } : undefined;
        token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data;
        
        console.log("Expo Push Token:", token);
        
        // Atualiza a tabela profiles com a placa do celular (token)
        if (token && userId) {
            await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
        }
    } catch (e) {
        console.error("Token error:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { notificationOrigin: 'barbershop-system' },
  };

  try {
     await fetch('https://exp.host/--/api/v2/push/send', {
       method: 'POST',
       headers: {
         Accept: 'application/json',
         'Accept-encoding': 'gzip, deflate',
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(message),
     });
  } catch(e) {
      console.error("Falha no disparo de push", e);
  }
}
