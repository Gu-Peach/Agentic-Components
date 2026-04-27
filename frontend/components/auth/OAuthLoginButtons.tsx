'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type OAuthLoginButtonsProps = {
  callbackUrl?: string;
  providers: Array<{
    id: 'github' | 'google';
    label: string;
    description: string;
    enabled: boolean;
  }>;
};

export function OAuthLoginButtons({
  callbackUrl = '/projects',
  providers,
}: OAuthLoginButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  async function handleSignIn(provider: 'github' | 'google') {
    setPendingProvider(provider);

    try {
      const supabase = getSupabaseBrowserClient();
      const next = encodeURIComponent(callbackUrl);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });

      if (error) {
        console.error('Supabase OAuth sign-in failed:', error.message);
        setPendingProvider(null);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }
    } catch (error) {
      console.error('Supabase client initialization failed:', error);
    }

    setPendingProvider(null);
  }

  return (
    <div className='space-y-3'>
      {providers.map((provider) => (
        <button
          key={provider.id}
          className='flex min-h-11 w-full flex-col items-center justify-center border border-[var(--border-strong)] bg-[var(--bg-panel-soft)] px-3 py-2 text-sm text-[var(--text-primary)] transition enabled:hover:bg-[var(--bg-panel-hover)] disabled:cursor-not-allowed disabled:opacity-50'
          disabled={!provider.enabled || pendingProvider !== null}
          onClick={() => handleSignIn(provider.id)}
          type='button'
        >
          <span>{provider.label}</span>
          <span className='mt-1 text-[11px] text-[var(--text-muted)]'>
            {!provider.enabled
              ? '缺少 Supabase 或 OAuth 环境变量，当前不可用'
              : pendingProvider === provider.id
                ? '正在跳转到身份提供商...'
                : provider.description}
          </span>
        </button>
      ))}
    </div>
  );
}
