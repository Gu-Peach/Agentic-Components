import { redirect } from 'next/navigation';
import { OAuthLoginButtons } from '@/components/auth/OAuthLoginButtons';
import { oauthProviderConfigs } from '@/lib/auth-providers';
import { getSupabaseAuthState } from '@/lib/supabase/auth';

const oauthProviders = oauthProviderConfigs.map((provider) => ({
  ...provider,
  enabled: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
}));

const hasOAuthProviderEnabled = oauthProviders.some((provider) => provider.enabled);

export default async function LoginPage() {
  const { session } = await getSupabaseAuthState();

  if (session) {
    redirect('/projects');
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] p-6'>
      <div className='grid w-full max-w-5xl overflow-hidden border border-[var(--border-soft)] bg-[var(--bg-shell)] shadow-[var(--shadow-panel)] lg:grid-cols-[1.1fr_0.9fr]'>
        <section className='border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(31,111,138,0.22),rgba(47,47,47,0.8))] p-8 lg:border-b-0 lg:border-r'>
          <p className='text-xs uppercase tracking-[0.28em] text-[var(--text-accent)]'>
            Agentic Components
          </p>
          <h1 className='mt-4 max-w-md text-3xl font-semibold leading-tight text-[var(--text-primary)]'>
            Supabase Auth 登录入口
          </h1>
          <p className='mt-4 max-w-lg text-sm leading-7 text-[var(--text-secondary)]'>
            当前页面将通过 Supabase Auth 发起 OAuth 登录，并由 Supabase 维护用户会话、身份提供商映射与访问令牌生命周期。
          </p>

          <div className='mt-10 grid gap-4 sm:grid-cols-3'>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                Users
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                保存 Supabase 认证用户资料与基础身份信息。
              </p>
            </div>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                OAuth Identity
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                由 Supabase 托管 GitHub、Google 等身份提供商映射。
              </p>
            </div>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                Session Lifecycle
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                由 Supabase 管理 access token、refresh token 与多端会话。
              </p>
            </div>
          </div>
        </section>

        <section className='p-8'>
          <div className='mx-auto max-w-md'>
            <h2 className='text-xl font-semibold text-[var(--text-primary)]'>
              登录工作区
            </h2>
            <p className='mt-2 text-sm text-[var(--text-muted)]'>
              当前默认提供 OAuth 登录，后续如果需要邮箱登录或邀请码登录，也会统一走 Supabase Auth。
            </p>

            <div className='mt-8 rounded border border-[var(--border-strong)] bg-[rgba(0,0,0,0.12)] p-4 text-sm text-[var(--text-secondary)]'>
              <p className='font-medium text-[var(--text-primary)]'>
                环境变量提示
              </p>
              <p className='mt-2 leading-7 text-[var(--text-muted)]'>
                请先在 `frontend/.env.local` 中配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，并在 Supabase 控制台启用 GitHub 或 Google Provider。
              </p>
            </div>

            <div className='my-6 flex items-center gap-3 text-xs text-[var(--text-muted)]'>
              <div className='h-px flex-1 bg-[var(--border-soft)]' />
              <span>OAuth Providers</span>
              <div className='h-px flex-1 bg-[var(--border-soft)]' />
            </div>

            <OAuthLoginButtons callbackUrl='/projects' providers={oauthProviders} />

            {!hasOAuthProviderEnabled ? (
              <p className='mt-4 text-xs leading-6 text-[var(--warning)]'>
                当前未检测到 Supabase Auth 前端配置，按钮会保持禁用状态。
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
