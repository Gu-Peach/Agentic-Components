# 本地 Supabase 部署说明

## 1. 启动

在仓库根目录执行：

```powershell
cd E:\project\Agentic Components
supabase start
```

启动成功后查看参数：

```powershell
supabase status -o env
```

控制面板地址：

```text
http://127.0.0.1:54323
```

## 2. 本地默认参数

当前本地 Supabase 默认服务地址如下：

```env
API_URL=http://127.0.0.1:54321
STUDIO_URL=http://127.0.0.1:54323
DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

前端使用 `ANON_KEY` 或 `PUBLISHABLE_KEY`，后端服务端操作使用 `SERVICE_ROLE_KEY` 或 `SECRET_KEY`。

## 3. 前端环境变量

在 `frontend/.env.local` 中配置：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase status -o env 输出的 ANON_KEY>
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=modles
NEXT_PUBLIC_SUPABASE_COMPONENTS_PREFIX=Components
NEXT_PUBLIC_SUPABASE_LAYOUTS_PREFIX=Layouts
SUPABASE_SERVICE_ROLE_KEY=<supabase status -o env 输出的 SERVICE_ROLE_KEY>
```

说明：前端收藏面板中的公共模型目录通过 Next.js 服务端接口代理读取 Supabase Storage，因此 `frontend/.env.local` 还需要配置 `SUPABASE_SERVICE_ROLE_KEY`，仅在服务端使用，不会暴露到浏览器。

## 4. 后端环境变量

在 `backend/.env` 中配置：

```env
POSTGRES_DSN=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<supabase status -o env 输出的 SERVICE_ROLE_KEY>
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
SUPABASE_STORAGE_BUCKET=modles
DB_AUTO_CREATE=true
```

## 5. 数据库迁移

本地 schema 位于：

```text
supabase/migrations/
```

重置并重新执行 migration：

```powershell
supabase db reset
```

注意：`supabase db reset` 会清空本地数据库数据，仅用于本地开发。

## 6. 本地 OAuth Provider

如果登录时报错 `Unsupported provider: provider is not enabled`，说明本地 Supabase Auth 还没有启用对应 provider。

本仓库已经在 `supabase/config.toml` 中启用了 GitHub 和 Google，并通过环境变量读取密钥。Supabase CLI 会读取仓库根目录 `.env`。复制示例文件：

```powershell
cd E:\project\Agentic Components
Copy-Item .env.example .env
```

然后把 `.env` 中的变量替换为真实 OAuth 应用参数：

```env
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=<GitHub OAuth Client ID>
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=<GitHub OAuth Client Secret>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<Google OAuth Client Secret>
```

OAuth 应用的 callback URL 必须配置为：

```text
http://127.0.0.1:54321/auth/v1/callback
```

修改后重启本地 Supabase：

```powershell
cd E:\project\Agentic Components
supabase stop
supabase start
```

## 7. 停止

```powershell
supabase stop
```
