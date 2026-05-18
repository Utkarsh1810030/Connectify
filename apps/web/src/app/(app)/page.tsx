import { redirect } from 'next/navigation';

// Redirect /app → /app/home
export default function AppRoot() {
  redirect('/(app)/home');
}
