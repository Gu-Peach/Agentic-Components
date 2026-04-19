export type OAuthProviderConfig = {
  id: 'github' | 'google';
  label: string;
  description: string;
};

export const oauthProviderConfigs: OAuthProviderConfig[] = [
  {
    id: 'github',
    label: '使用 GitHub 登录',
    description: '适合开发者和内部协作账号',
  },
  {
    id: 'google',
    label: '使用 Google 登录',
    description: '适合邮箱统一的企业与个人账号',
  },
];
