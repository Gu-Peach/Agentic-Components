# Backend README

## 1. 当前定位

当前 `backend/` 主要承载基于 Supabase Auth 的鉴权接入与基础 API 能力：

- 校验 Supabase access token
- 按 Supabase 用户信息同步本地 `users`
- 当前登录用户查询
- 基础健康检查

仓库当前默认基础设施方向已经调整为：

- 数据库：Supabase PostgreSQL
- 对象存储：Supabase Storage
- 本地 Docker：仅保留仍需本地辅助的基础服务

## 2. 本地准备

需要：

- Python 3.10+
- `uv`
- Docker Desktop
- 本地 Supabase CLI，或一个可用的 Supabase 项目

启动本地 Supabase：

```powershell
cd E:\project\Agentic Components
supabase start
supabase status -o env
```

本地控制面板默认地址：

```text
http://127.0.0.1:54323
```

安装依赖：

```powershell
cd E:\project\Agentic Components\backend
uv sync
```

## 3. 环境变量

先复制模板：

```powershell
cd E:\project\Agentic Components\backend
Copy-Item .env.example .env
```

当前最关键的变量如下：

```env
APP_NAME=Agentic Components Backend
APP_ENV=development
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]

POSTGRES_DSN=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres
DB_AUTO_CREATE=true

JWT_SECRET=your-own-random-secret
JWT_ALGORITHM=HS256
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key-from-supabase-status
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
SUPABASE_STORAGE_BUCKET=agentic-components
```

注意：

- `POSTGRES_DSN` 现在应指向 Supabase PostgreSQL。本地 Supabase 默认端口是 `54322`
- `CORS_ORIGINS` 必须保持 JSON 数组格式
- 更多本地 Supabase 参数见根目录 `docs/local_supabase.md`

## 4. 本地辅助服务

根目录 `docker-compose.yml` 已不再默认启动本地 PostgreSQL、MinIO、pgAdmin。

如需本地辅助服务，可在仓库根目录启动：

```powershell
cd E:\project\Agentic Components
docker compose up -d mongodb redis
```

查看状态：

```powershell
docker compose ps
```

## 5. 启动后端

推荐直接在本机启动：

```powershell
cd E:\project\Agentic Components\backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

默认地址：

```text
http://localhost:8000
```

健康检查：

```powershell
Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing
```

正常响应：

```json
{"status":"ok"}
```

## 6. 当前接口

当前已接入的接口：

- `GET /api/auth/me`
- `GET /health`

## 7. 联调顺序

建议顺序：

1. 启动本地 Supabase，或在云端 Supabase 控制台准备数据库、Storage bucket 和认证配置
2. 填写 `backend/.env` 与 `frontend/.env.local`
3. 如有需要，启动本地 `mongodb`、`redis`
4. 启动后端
5. 启动前端
6. 访问 `http://localhost:3000`

前端启动命令：

```powershell
cd E:\project\Agentic Components\frontend
corepack pnpm dev
```

## 8. 常见问题

### 8.1 `/health` 无法访问

优先检查：

- `backend/.env` 中的 `POSTGRES_DSN` 是否填写为可连通的 Supabase 连接串
- Supabase 项目网络访问是否正常
- 端口 `8000` 是否被占用

### 8.2 `CORS_ORIGINS` 解析错误

不要写成：

```env
CORS_ORIGINS=http://localhost:3000
```

要写成：

```env
CORS_ORIGINS=["http://localhost:3000"]
```

### 8.3 Docker 中 backend 启动失败

如果问题出在镜像拉取，优先改用“本机 Python 启动后端”进行开发联调。

### 8.4 数据库连不上

优先确认：

- 使用的是 Supabase 提供的 PostgreSQL 连接串
- 用户名、密码、主机和端口填写正确
- 如果使用 pooler，端口通常不是本地 `5432`

## 9. 停止服务

停止本机后端：

```powershell
Get-Process python
Stop-Process -Id <PID>
```

停止 Docker 辅助服务：

```powershell
cd E:\project\Agentic Components
docker compose down
```
