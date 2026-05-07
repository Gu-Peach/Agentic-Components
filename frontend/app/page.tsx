import { redirect } from 'next/navigation';
import { getDefaultWorkspacePath, isAuthBypassedForDev } from '@/lib/authMode';
import { getSupabaseAuthState } from '@/lib/supabase/auth';

export default async function HomePage() {
  if (isAuthBypassedForDev()) {
    redirect(getDefaultWorkspacePath());
  }

  const { session } = await getSupabaseAuthState();

  if (!session) {
    redirect('/login');
  }

  redirect('/projects');
}
