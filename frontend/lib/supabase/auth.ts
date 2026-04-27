import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export type SupabaseAuthState = {
  session: Session | null;
  user: User | null;
};

export async function getSupabaseAuthState(): Promise<SupabaseAuthState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      session: null,
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    session,
    user,
  };
}
