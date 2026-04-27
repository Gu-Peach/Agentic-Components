# 当前鉴权流程说明

本文描述的是仓库当前真实生效的鉴权实现。当前默认鉴权体系已经从原来的 `NextAuth + 后端二次换票` 切换为 `Supabase Auth + 后端校验 Supabase access token`。

## 1. 当前鉴权的总体结构

当前鉴权分成两段：

1. 前端登录与会话维护
2. 后端 access token 校验与本地用户同步

当前默认路径里，不再存在：

- `NextAuth` 登录入口
- `/api/auth/oauth/exchange`
- `/api/auth/refresh`
- 前端自维护的 `appAccessToken/appRefreshToken`

现在只有一套主登录态：

- Supabase session

## 2. 前端登录入口

前端登录页文件：

- `frontend/app/login/page.tsx`

这个页面做三件事：

1. 通过 `getSupabaseAuthState()` 判断当前是否已经有 Supabase session
2. 如果已经登录，直接 `redirect('/projects')`
3. 如果还没登录，渲染 `OAuthLoginButtons`

对应代码文件：

- `frontend/app/login/page.tsx`
- `frontend/lib/supabase/auth.ts`

## 3. 前端如何读取 Supabase session

服务端读取 session 的入口函数在：

- `frontend/lib/supabase/auth.ts`

这个文件暴露：

- `getSupabaseAuthState()`

它的执行过程是：

1. 调用 `getSupabaseServerClient()`
2. 用 Supabase Server Client 读取当前请求上的 cookie
3. 执行 `supabase.auth.getSession()`
4. 如果存在 session，再执行 `supabase.auth.getUser()`
5. 返回 `{ session, user }`

相关文件：

- `frontend/lib/supabase/auth.ts`
- `frontend/lib/supabase/server.ts`

其中：

- `frontend/lib/supabase/server.ts` 使用 `createServerClient(...)`
- 它通过 `next/headers` 的 `cookies()` 把当前请求 cookie 交给 Supabase SDK

所以现在前端服务端组件判断登录态，依赖的是：

- 当前请求携带的 Supabase auth cookie

## 4. 前端浏览器端如何发起 OAuth 登录

浏览器端登录按钮文件：

- `frontend/components/auth/OAuthLoginButtons.tsx`

浏览器端 Supabase client 文件：

- `frontend/lib/supabase/browser.ts`
- `frontend/lib/supabase/config.ts`

登录按钮点击后的流程：

1. 用户点击 `OAuthLoginButtons.tsx` 里的某个 provider 按钮
2. 组件执行 `handleSignIn(provider)`
3. `handleSignIn` 调用 `getSupabaseBrowserClient()`
4. `getSupabaseBrowserClient()` 在 `frontend/lib/supabase/browser.ts` 中通过 `createBrowserClient(...)` 初始化浏览器端 Supabase client
5. 然后调用：

```ts
supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: `${window.location.origin}${callbackUrl}`,
  },
})
```

6. Supabase SDK 返回授权跳转 URL
7. 浏览器执行 `window.location.assign(data.url)`
8. 用户被带到 Supabase 托管的 OAuth 授权流程
9. Supabase 再和 GitHub / Google 完成授权交互
10. 授权完成后，浏览器被重定向回 `callbackUrl`，当前项目里默认是 `/projects`

这里和旧方案最大的区别是：

- 现在不是跳到项目自己的 `/api/auth/...`
- 而是直接走 Supabase Auth 的 OAuth 流程

## 5. 前端哪些页面会检查登录态

当前服务端页面里的登录保护已经统一改成 Supabase session 检查。

### 5.1 首页

文件：

- `frontend/app/page.tsx`

流程：

1. 调用 `getSupabaseAuthState()`
2. 如果没有 `session`，跳转 `/login`
3. 如果有 `session`，跳转 `/projects`

### 5.2 登录页

文件：

- `frontend/app/login/page.tsx`

流程：

1. 调用 `getSupabaseAuthState()`
2. 如果已经有 `session`，跳转 `/projects`
3. 否则展示 OAuth 登录入口

### 5.3 项目页

文件：

- `frontend/app/projects/page.tsx`

流程：

1. 调用 `getSupabaseAuthState()`
2. 如果没有 `session` 或 `user`，跳转 `/login`
3. 如果有，则展示项目页
4. 页面中展示的用户名称、provider、用户 ID、token 过期时间，全部来自 Supabase session / user

### 5.4 工作区页

文件：

- `frontend/app/workspace/[projectId]/page.tsx`

流程：

1. 调用 `getSupabaseAuthState()`
2. 如果没有 `session`，跳转 `/login`
3. 如果有，则进入 `WorkspaceLayout`

## 6. 前端 session 的真实来源

当前前端显示登录态，并不是自己存一份业务 token。

当前真实来源是：

- Supabase 在浏览器中维护的 auth cookie / session

也就是说现在前端不再做这些事：

- 不再自己维护 `NextAuth session`
- 不再向后端请求一套新的应用 access token
- 不再维护项目自己的 refresh token 轮换

## 7. 后端现在如何校验登录态

后端默认鉴权依赖文件：

- `backend/dependencies.py`

受保护接口文件：

- `backend/api/auth.py`

当前 `/api/auth` 默认只保留一个受保护接口：

- `GET /api/auth/me`

调用链如下：

1. 客户端请求 `GET /api/auth/me`
2. FastAPI 在 `backend/api/auth.py` 中进入：

```python
@router.get('/me', response_model=CurrentUserResponse)
async def get_me(user=Depends(get_current_user)):
    return CurrentUserResponse.model_validate(user)
```

3. 也就是会先执行 `get_current_user`
4. `get_current_user` 定义在 `backend/dependencies.py`

## 8. get_current_user 的详细执行过程

文件：

- `backend/dependencies.py`

具体步骤：

1. 通过 `HTTPBearer` 从请求头读取 `Authorization: Bearer <token>`
2. 如果没有 bearer token，返回 `401 Missing bearer token`
3. 读取后端配置 `get_settings()`
4. 检查 `SUPABASE_JWT_SECRET` 是否存在
5. 如果没有配置，返回 `500 SUPABASE_JWT_SECRET is not configured`
6. 如果配置存在，执行 `_get_user_from_supabase_token(...)`

## 9. Supabase access token 的解码过程

文件：

- `backend/core/auth.py`

核心函数：

- `decode_supabase_access_token(token: str)`

它的处理逻辑：

1. 从 `backend/config.py` 读取 `supabase_jwt_secret`
2. 使用 `jwt.decode(...)` 解码 token
3. 校验：
   - 算法为 `HS256`
   - `audience='authenticated'`
4. 解码失败时返回 `401 Invalid Supabase access token`
5. 如果 token 中 `role != 'authenticated'`，返回 `401 Supabase token role is not authenticated`
6. 解码成功后返回 payload

所以当前后端默认接受的是：

- Supabase access token

不是项目自己签发的 token。

## 10. 后端如何把 Supabase 用户同步到本地 users 表

文件：

- `backend/dependencies.py`
- `backend/repositories/pg/auth_repository.py`
- `backend/models/pg/user.py`

在 `_get_user_from_supabase_token(...)` 中：

1. 先从 token payload 中读取：
   - `sub`
   - `email`
   - `user_metadata`
2. 如果 `sub` 或 `email` 缺失，返回 `401 Supabase token is missing required claims`
3. 使用 `AuthRepository.get_user_by_email(email.lower())` 查询本地 `users` 表

如果本地没有这个用户：

1. 调用 `repository.add_user(...)`
2. 创建一条新的 `User`
3. 写入字段：
   - `email`
   - `display_name`
   - `avatar_url`
   - `status='ACTIVE'`
4. 然后 `flush()`

如果本地已经有这个用户：

1. 更新 `display_name`
2. 更新 `avatar_url`

最后：

1. 调用 `touch_user_login(...)` 更新 `last_login_at`
2. `commit()`
3. 返回这个本地 `User` 对象

## 11. display_name 和 avatar_url 是怎么推导的

文件：

- `backend/dependencies.py`

### display_name

函数：

- `_resolve_display_name(user_metadata, email)`

优先级：

1. `user_metadata.full_name`
2. `user_metadata.name`
3. `user_metadata.user_name`
4. 如果都没有，则取邮箱 `@` 前面的部分

### avatar_url

函数：

- `_resolve_avatar_url(user_metadata)`

规则：

1. 读取 `user_metadata.avatar_url`
2. 如果是非空字符串则使用
3. 否则返回 `None`

## 12. /api/auth/me 最终返回什么

文件：

- `backend/api/auth.py`
- `backend/schemas/auth.py`

当 `get_current_user` 返回本地 `User` 后：

1. `get_me(...)` 调用 `CurrentUserResponse.model_validate(user)`
2. FastAPI 返回序列化后的 JSON

返回结构定义在：

- `backend/schemas/auth.py`

字段有：

- `id`
- `email`
- `display_name`
- `avatar_url`
- `status`

其中 `id` 会被序列化成字符串。

## 13. 配置文件分别负责什么

### 前端

文件：

- `frontend/.env.example`
- `frontend/lib/supabase/config.ts`

当前前端最关键的变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`

`frontend/lib/supabase/config.ts` 中：

- `getSupabaseUrl()`
- `getSupabaseAnonKey()`

这两个函数会直接读取环境变量；如果缺失，会抛错。

### 后端

文件：

- `backend/.env.example`
- `backend/config.py`

当前后端最关键的变量：

- `POSTGRES_DSN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`

其中当前真正参与鉴权默认路径的是：

- `SUPABASE_JWT_SECRET`

## 14. 当前已经移除的旧链路

当前默认工程里已经移除：

### 前端已移除

- `next-auth`
- `frontend/lib/auth.ts`
- `frontend/lib/backend-auth.ts`
- `frontend/app/api/auth/[...nextauth]/route.ts`
- `frontend/types/next-auth.d.ts`

### 后端已移除

- `POST /api/auth/oauth/exchange`
- `POST /api/auth/refresh`
- 自建 refresh token 默认链路
- `backend/services/auth_service.py`
- `backend/models/pg/oauth_account.py`
- `backend/models/pg/refresh_token.py`

## 15. 当前完整时序流程

### 15.1 用户登录

1. 用户打开 `frontend/app/login/page.tsx`
2. 页面调用 `getSupabaseAuthState()`
3. 如果未登录，则渲染 `OAuthLoginButtons`
4. 用户点击某个 provider 按钮
5. `OAuthLoginButtons.tsx` 调用 `supabase.auth.signInWithOAuth(...)`
6. 浏览器跳转到 Supabase 托管的 OAuth 登录流程
7. Supabase 与 GitHub / Google 完成授权
8. 登录成功后浏览器跳回 `/projects`
9. Supabase session cookie 已经建立

### 15.2 前端进入受保护页面

1. 访问 `frontend/app/projects/page.tsx` 或 `frontend/app/workspace/[projectId]/page.tsx`
2. 页面调用 `getSupabaseAuthState()`
3. `getSupabaseAuthState()` 通过 `frontend/lib/supabase/server.ts` 读取 cookie
4. 如果存在 session，则页面继续渲染
5. 如果不存在 session，则跳回 `/login`

### 15.3 后端获取当前用户

1. 客户端请求 `GET /api/auth/me`
2. 请求头携带 Supabase Bearer token
3. FastAPI 进入 `backend/api/auth.py`
4. `Depends(get_current_user)` 执行
5. `backend/dependencies.py` 调用 `decode_supabase_access_token()`
6. `backend/core/auth.py` 校验 Supabase JWT
7. 成功后按 email 查本地 `users`
8. 没有就创建，有就更新资料
9. 返回本地 `User`
10. `get_me()` 输出 `CurrentUserResponse`

## 16. 一句话总结

当前真实生效的鉴权流程是：

- 前端通过 Supabase Auth 发起 OAuth 登录
- Supabase 维护浏览器 session
- 前端服务端页面通过 Supabase cookie 判断登录态
- 后端通过 `SUPABASE_JWT_SECRET` 校验 Supabase access token
- 后端把 Supabase 用户同步到本地 `users` 表

当前项目已经不再依赖原来的 `NextAuth + 自建 access_token/refresh_token` 体系。
