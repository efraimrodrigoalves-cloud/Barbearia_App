import { Stack } from 'expo-router';

export default function BookingLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#1e1e1e' },
      headerTintColor: '#d4af37',
      headerTitleStyle: { color: '#ffffff' },
      headerBackTitle: 'Voltar',
    }}>
      <Stack.Screen name="index" options={{ title: 'Escolher Serviço' }} />
      <Stack.Screen name="barber" options={{ title: 'Escolher Barbeiro' }} />
      <Stack.Screen name="datetime" options={{ title: 'Data e Hora' }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirmação' }} />
      <Stack.Screen name="payment" options={{ title: 'Pagamento' }} />
      <Stack.Screen name="success" options={{ title: 'Sucesso', headerShown: false }} />
      <Stack.Screen name="review" options={{ title: 'Avaliação' }} />
    </Stack>
  );
}
