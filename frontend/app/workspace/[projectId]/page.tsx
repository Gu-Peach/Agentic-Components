import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { authOptions } from '@/lib/auth';

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.appAccessToken) {
    redirect('/login');
  }

  const { projectId } = await params;

  return <WorkspaceLayout projectId={projectId} />;
}
