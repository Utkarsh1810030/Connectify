import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const { token } = useAuthStore();
  return <Redirect href={token ? '/(tabs)/home' : '/(auth)/login'} />;
}
