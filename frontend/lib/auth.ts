import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import {
  exchangeOAuthLogin,
  isBackendAuthEnabled,
  refreshBackendAccessToken,
} from '@/lib/backend-auth';
import { oauthProviderConfigs } from '@/lib/auth-providers';

const providers = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  );
}

function getProfileValue(
  profile: Record<string, unknown> | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = profile?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return undefined;
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 15,
  },
  jwt: {
    maxAge: 60 * 15,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      const normalizedProfile =
        profile && typeof profile === 'object'
          ? (profile as Record<string, unknown>)
          : undefined;

      if (account) {
        token.provider = account.provider;
        token.providerAccessToken = account.access_token;
        token.providerRefreshToken = account.refresh_token;
        token.providerAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined;

        const backendSession = await exchangeOAuthLogin({
          provider: account.provider as 'github' | 'google',
          providerUserId:
            getProfileValue(normalizedProfile, 'sub', 'id') ?? token.sub ?? '',
          email:
            getProfileValue(normalizedProfile, 'email') ??
            (typeof token.email === 'string' ? token.email : undefined),
          displayName:
            getProfileValue(normalizedProfile, 'name', 'login') ??
            (typeof token.name === 'string' ? token.name : undefined),
          avatarUrl:
            getProfileValue(normalizedProfile, 'picture', 'avatar_url') ??
            (typeof token.picture === 'string' ? token.picture : undefined),
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          tokenType: account.token_type,
          scope: account.scope,
          idToken: account.id_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined,
        });

        if (backendSession) {
          token.appAccessToken = backendSession.accessToken;
          token.appRefreshToken = backendSession.refreshToken;
          token.appAccessTokenExpiresAt = backendSession.accessTokenExpiresAt;
          token.appRefreshTokenExpiresAt = backendSession.refreshTokenExpiresAt;
          token.appUserId = backendSession.user.id;
          token.appUserEmail = backendSession.user.email;
          token.appUserName = backendSession.user.name;
          token.appUserImage = backendSession.user.image ?? undefined;
          token.appUserStatus = backendSession.user.status;
          token.authError = undefined;
        } else {
          token.authError = isBackendAuthEnabled()
            ? 'BACKEND_TOKEN_EXCHANGE_FAILED'
            : 'BACKEND_AUTH_NOT_CONFIGURED';
        }
      }

      if (normalizedProfile) {
        token.picture =
          typeof normalizedProfile.picture === 'string'
            ? normalizedProfile.picture
            : token.picture;
      }

      const accessTokenExpiresSoon =
        typeof token.appAccessTokenExpiresAt === 'number' &&
        Date.now() >= token.appAccessTokenExpiresAt - 30_000;

      if (!account && accessTokenExpiresSoon && token.appRefreshToken) {
        const refreshedSession = await refreshBackendAccessToken(
          token.appRefreshToken,
        );

        if (refreshedSession) {
          token.appAccessToken = refreshedSession.accessToken;
          token.appRefreshToken = refreshedSession.refreshToken;
          token.appAccessTokenExpiresAt =
            refreshedSession.accessTokenExpiresAt;
          token.appRefreshTokenExpiresAt =
            refreshedSession.refreshTokenExpiresAt;
          token.appUserId = refreshedSession.user.id;
          token.appUserEmail = refreshedSession.user.email;
          token.appUserName = refreshedSession.user.name;
          token.appUserImage = refreshedSession.user.image ?? undefined;
          token.appUserStatus = refreshedSession.user.status;
          token.authError = undefined;
        } else {
          token.appAccessToken = undefined;
          token.appRefreshToken = undefined;
          token.appAccessTokenExpiresAt = undefined;
          token.appRefreshTokenExpiresAt = undefined;
          token.authError = 'BACKEND_TOKEN_REFRESH_FAILED';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.appUserId === 'string' ? token.appUserId : token.sub ?? '';
        session.user.name =
          typeof token.appUserName === 'string'
            ? token.appUserName
            : session.user.name;
        session.user.email =
          typeof token.appUserEmail === 'string'
            ? token.appUserEmail
            : session.user.email;
        session.user.image =
          typeof token.appUserImage === 'string'
            ? token.appUserImage
            : typeof token.picture === 'string'
              ? token.picture
              : session.user.image;
      }

      session.provider =
        typeof token.provider === 'string' ? token.provider : undefined;
      session.providerAccessTokenExpiresAt =
        typeof token.providerAccessTokenExpiresAt === 'number'
          ? token.providerAccessTokenExpiresAt
          : undefined;
      session.appAccessToken =
        typeof token.appAccessToken === 'string'
          ? token.appAccessToken
          : undefined;
      session.appRefreshToken =
        typeof token.appRefreshToken === 'string'
          ? token.appRefreshToken
          : undefined;
      session.appAccessTokenExpiresAt =
        typeof token.appAccessTokenExpiresAt === 'number'
          ? token.appAccessTokenExpiresAt
          : undefined;
      session.appRefreshTokenExpiresAt =
        typeof token.appRefreshTokenExpiresAt === 'number'
          ? token.appRefreshTokenExpiresAt
          : undefined;
      session.authError =
        typeof token.authError === 'string' ? token.authError : undefined;

      return session;
    },
  },
};

export const oauthProviders = oauthProviderConfigs.map((provider) => ({
  ...provider,
  enabled:
    provider.id === 'github'
      ? Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)
      : Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
}));

export const hasOAuthProviderEnabled = oauthProviders.some(
  (provider) => provider.enabled,
);

export const hasBackendOAuthEnabled = isBackendAuthEnabled();
