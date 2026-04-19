import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    provider?: string;
    providerAccessTokenExpiresAt?: number;
    appAccessToken?: string;
    appRefreshToken?: string;
    appAccessTokenExpiresAt?: number;
    appRefreshTokenExpiresAt?: number;
    authError?: string;
    user: DefaultSession['user'] & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    provider?: string;
    providerAccessToken?: string;
    providerRefreshToken?: string;
    providerAccessTokenExpiresAt?: number;
    appAccessToken?: string;
    appRefreshToken?: string;
    appAccessTokenExpiresAt?: number;
    appRefreshTokenExpiresAt?: number;
    appUserId?: string;
    appUserEmail?: string;
    appUserName?: string;
    appUserImage?: string;
    appUserStatus?: string;
    authError?: string;
  }
}
