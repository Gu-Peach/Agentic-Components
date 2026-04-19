'use client';

import { signIn } from 'next-auth/react';

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
  return (
    <div className='space-y-3'>
      {providers.map((provider) => (
        <button
          key={provider.id}
          className='flex min-h-11 w-full flex-col items-center justify-center border border-[var(--border-strong)] bg-[var(--bg-panel-soft)] px-3 py-2 text-sm text-[var(--text-primary)] transition enabled:hover:bg-[var(--bg-panel-hover)] disabled:cursor-not-allowed disabled:opacity-50'
          disabled={!provider.enabled}
          onClick={() => signIn(provider.id, { callbackUrl })}
          type='button'
        >
          <span>{provider.label}</span>
          <span className='mt-1 text-[11px] text-[var(--text-muted)]'>
            {provider.enabled ? provider.description : '缺少环境变量，当前不可用'}
          </span>
        </button>
      ))}
    </div>
  );
}
