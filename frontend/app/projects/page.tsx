import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDefaultWorkspacePath, isAuthBypassedForDev } from '@/lib/authMode';
import { getSupabaseAuthState } from '@/lib/supabase/auth';

export default async function ProjectsPage() {
  if (isAuthBypassedForDev()) {
    redirect(getDefaultWorkspacePath());
  }

  const { session, user } = await getSupabaseAuthState();

  if (!session || !user) {
    redirect('/login');
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] p-6'>
      <div className='w-full max-w-3xl border border-[var(--border-soft)] bg-[var(--bg-shell)] p-8 shadow-[var(--shadow-panel)]'>
        <p className='text-xs uppercase tracking-[0.28em] text-[var(--text-accent)]'>
          Projects
        </p>
        <h1 className='mt-4 text-3xl font-semibold text-[var(--text-primary)]'>
          欢迎回来，{user.user_metadata.full_name ?? user.email ?? '用户'}
        </h1>
        <p className='mt-3 text-sm leading-7 text-[var(--text-secondary)]'>
          Supabase Auth 登录已经生效。当前页面作为登录后的落点页，后续可以在这里接入最近项目、团队项目和权限过滤。
        </p>

        <div className='mt-8 grid gap-4 sm:grid-cols-2'>
          <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
            <p className='text-sm font-medium text-[var(--text-primary)]'>
              当前 Provider
            </p>
            <p className='mt-2 text-xs text-[var(--text-muted)]'>
              {user.app_metadata.provider ?? 'unknown'}
            </p>
          </div>
          <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
            <p className='text-sm font-medium text-[var(--text-primary)]'>
              Supabase 用户 ID
            </p>
            <p className='mt-2 break-all text-xs text-[var(--text-muted)]'>
              {user.id}
            </p>
          </div>
        </div>

        <div className='mt-4 border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
          <p className='text-sm font-medium text-[var(--text-primary)]'>
            Access Token 过期时间
          </p>
          <p className='mt-2 text-xs text-[var(--text-muted)]'>
            {session.expires_at
              ? new Date(session.expires_at * 1000).toLocaleString('zh-CN')
              : 'unknown'}
          </p>
        </div>

        <div className='mt-8 flex flex-wrap gap-3'>
          <Link
            className='flex h-11 items-center justify-center bg-[var(--bg-accent)] px-5 text-sm font-medium text-white transition hover:bg-[var(--bg-accent-strong)]'
            href={getDefaultWorkspacePath()}
          >
            打开默认工作区
          </Link>
          <Link
            className='flex h-11 items-center justify-center border border-[var(--border-strong)] px-5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-panel-hover)]'
            href='/login'
          >
            返回登录页
          </Link>
        </div>
      </div>
    </main>
  );
}
