import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { OAuthLoginButtons } from '@/components/auth/OAuthLoginButtons';
import {
  authOptions,
  hasBackendOAuthEnabled,
  hasOAuthProviderEnabled,
  oauthProviders,
} from '@/lib/auth';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.appAccessToken) {
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
            OAuth 2.0 登录入口
          </h1>
          <p className='mt-4 max-w-lg text-sm leading-7 text-[var(--text-secondary)]'>
            当前页面会先完成 Auth.js OAuth 登录，再由后端认证服务同步写入 `users`、`oauth_accounts` 和 `refresh_tokens`，并签发系统自己的双 Token。
          </p>

          <div className='mt-10 grid gap-4 sm:grid-cols-3'>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                Users
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                保存系统主体用户资料与登录状态。
              </p>
            </div>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                OAuth Accounts
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                映射第三方 provider 身份与账号信息。
              </p>
            </div>
            <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] p-4'>
              <p className='text-sm font-medium text-[var(--text-primary)]'>
                Refresh Tokens
              </p>
              <p className='mt-2 text-xs leading-6 text-[var(--text-muted)]'>
                支撑双 Token 刷新与多端会话撤销。
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
              当前优先提供 OAuth 入口，账号密码登录会在后端认证完成后再接入。
            </p>

            <div className='mt-8 rounded border border-[var(--border-strong)] bg-[rgba(0,0,0,0.12)] p-4 text-sm text-[var(--text-secondary)]'>
              <p className='font-medium text-[var(--text-primary)]'>
                环境变量提示
              </p>
              <p className='mt-2 leading-7 text-[var(--text-muted)]'>
                请先在 `frontend/.env.local` 中配置 `NEXTAUTH_SECRET`、OAuth provider 凭据、`BACKEND_API_URL` 和 `AUTH_BRIDGE_SECRET`。
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
                当前没有启用的 OAuth provider，按钮会保持禁用状态。
              </p>
            ) : null}
            {!hasBackendOAuthEnabled ? (
              <p className='mt-4 text-xs leading-6 text-[var(--warning)]'>
                后端认证桥接尚未配置，OAuth 完成后无法换发系统自己的 access token。
              </p>
            ) : null}
            {session?.authError ? (
              <p className='mt-4 text-xs leading-6 text-[var(--warning)]'>
                最近一次认证没有完成后端换票：{session.authError}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
