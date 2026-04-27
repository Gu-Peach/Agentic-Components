import { redirect } from 'next/navigation';
import { getSupabaseAuthState } from '@/lib/supabase/auth';

export default async function HomePage() {
  const { session } = await getSupabaseAuthState();

  if (!session) {
    redirect('/login');
  }

  redirect('/projects');
}
