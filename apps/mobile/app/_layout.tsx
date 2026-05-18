import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync());
  }, [hydrate]);

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
