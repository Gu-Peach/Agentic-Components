type OAuthProvider = 'github' | 'google';

type ExchangeOAuthLoginParams = {
  provider: OAuthProvider;
  providerUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
  expiresAt?: number;
};

type BackendUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  status: string;
};

type BackendTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_at: string;
  user: BackendUser;
};

export type BackendAuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    status: string;
  };
};

function getBackendApiUrl() {
  return process.env.BACKEND_API_URL;
}

function getBridgeSecret() {
  return process.env.AUTH_BRIDGE_SECRET;
}

export function isBackendAuthEnabled() {
  return Boolean(getBackendApiUrl() && getBridgeSecret());
}

function mapBackendSession(response: BackendTokenResponse): BackendAuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: Date.now() + response.expires_in * 1000,
    refreshTokenExpiresAt: new Date(response.refresh_expires_at).getTime(),
    user: {
      id: response.user.id,
      email: response.user.email,
      name: response.user.display_name,
      image: response.user.avatar_url,
      status: response.user.status,
    },
  };
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function exchangeOAuthLogin(
  params: ExchangeOAuthLoginParams,
): Promise<BackendAuthSession | null> {
  const backendApiUrl = getBackendApiUrl();
  const bridgeSecret = getBridgeSecret();

  if (!backendApiUrl || !bridgeSecret) {
    return null;
  }

  const response = await fetch(`${backendApiUrl}/api/auth/oauth/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Bridge-Secret': bridgeSecret,
    },
    cache: 'no-store',
    body: JSON.stringify({
      provider: params.provider,
      provider_user_id: params.providerUserId,
      email: params.email,
      display_name: params.displayName,
      avatar_url: params.avatarUrl,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_type: params.tokenType,
      scope: params.scope,
      id_token: params.idToken,
      expires_at: params.expiresAt
        ? new Date(params.expiresAt).toISOString()
        : undefined,
    }),
  });

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    console.error('Backend auth exchange failed:', detail);
    return null;
  }

  const payload = (await response.json()) as BackendTokenResponse;
  return mapBackendSession(payload);
}

export async function refreshBackendAccessToken(
  refreshToken: string,
): Promise<BackendAuthSession | null> {
  const backendApiUrl = getBackendApiUrl();

  if (!backendApiUrl) {
    return null;
  }

  const response = await fetch(`${backendApiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    console.error('Backend token refresh failed:', detail);
    return null;
  }

  const payload = (await response.json()) as BackendTokenResponse;
  return mapBackendSession(payload);
}
