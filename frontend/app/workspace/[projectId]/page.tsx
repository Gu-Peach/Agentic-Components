import { redirect } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { isAuthBypassedForDev } from '@/lib/authMode';
import { getSupabaseAuthState } from '@/lib/supabase/auth';

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  if (!isAuthBypassedForDev()) {
    const { session } = await getSupabaseAuthState();

    if (!session) {
      redirect('/login');
    }
  }

  const { projectId } = await params;

  return <WorkspaceLayout projectId={projectId} />;
}
