import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/services/api';

SplashScreen.preventAutoHideAsync();

async function registerFcmToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    await api.patch('/users/me/device-token', { token });
  } catch {
    // Non-fatal — push notifications degrade gracefully
  }
}

export default function RootLayout() {
  const { isHydrated, hydrate, token } = useAuthStore();

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync());
  }, [hydrate]);

  useEffect(() => {
    if (token) registerFcmToken();
  }, [token]);

  if (!isHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="provider/[id]" />
        <Stack.Screen name="session/chat/[id]" />
        <Stack.Screen name="session/voice/[id]" />
        <Stack.Screen name="session/video/[id]" />
        <Stack.Screen name="(modals)/topup" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/rate" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/report" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
