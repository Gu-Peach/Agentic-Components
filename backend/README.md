# Backend README

## 1. 当前阶段说明

当前 `backend/` 主要承载认证链路的最小后端能力：

- OAuth 资料换发系统自己的 `access_token` / `refresh_token`
- `refresh token` 刷新
- 当前登录用户查询

当前本地联调时，推荐：

- 基础设施用 Docker 启动
- 后端服务本体先在本机 Python 环境中启动

这样可以避开当前 Docker 拉取 Python 基础镜像时的网络问题。

## 2. 依赖准备

本机需要：

- Python 3.10+
- pip
- Docker Desktop

安装后端依赖：

```powershell
cd E:\project\Agentic Components\backend
python -m pip install -r requirements.txt
```

## 3. 环境变量

先准备配置文件：

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

POSTGRES_DSN=postgresql+asyncpg://behavior_user:behavior_pass@localhost:5432/behavior
DB_AUTO_CREATE=true

JWT_SECRET=your-own-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=14

AUTH_BRIDGE_SECRET=must-match-frontend
```

注意：

- `AUTH_BRIDGE_SECRET` 必须和 `frontend/.env.local` 里的值一致
- `JWT_SECRET` 需要单独生成，不要和 `NEXTAUTH_SECRET` 共用
- `CORS_ORIGINS` 必须保持 JSON 数组格式

## 4. 启动数据库和基础设施

在仓库根目录启动：

```powershell
cd E:\project\Agentic Components
docker compose up -d postgres mongodb redis minio pgadmin
```

服务端口：

- PostgreSQL: `5432`
- MongoDB: `27017`
- Redis: `6379`
- MinIO API: `9000`
- MinIO Console: `9001`
- pgAdmin: `5050`

查看状态：

```powershell
docker compose ps
```

## 5. 启动后端

推荐在本机直接启动：

```powershell
cd E:\project\Agentic Components\backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

启动后默认监听：

```text
http://localhost:8000
```

健康检查：

```powershell
Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing
```

正常响应应包含：

```json
{"status":"ok"}
```

## 6. 当前认证接口

当前已接入的接口：

- `POST /api/auth/oauth/exchange`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /health`

## 7. 联调顺序

建议按下面顺序启动：

1. 启动 Docker 基础设施
2. 启动后端
3. 启动前端
4. 浏览器打开 `http://localhost:3000`
5. 测试 GitHub / Google OAuth 登录

前端启动命令：

```powershell
cd E:\project\Agentic Components\frontend
corepack pnpm dev
```

## 8. 常见问题

### 8.1 `/health` 连不上

优先检查：

- PostgreSQL 是否已经启动
- `backend/.env` 中 `POSTGRES_DSN` 是否指向 `localhost:5432`
- 端口 `8000` 是否被占用

### 8.2 `CORS_ORIGINS` 报解析错误

不要写成：

```env
CORS_ORIGINS=http://localhost:3000
```

要写成：

```env
CORS_ORIGINS=["http://localhost:3000"]
```

### 8.3 Docker 启动 backend 失败

如果是拉取 `python:3.12-slim` 失败，这通常是镜像源网络问题，不是代码配置错误。当前阶段优先用“本机 Python 启动后端”即可。

## 9. 停止与重置

停止本机后端：

```powershell
Get-Process python
Stop-Process -Id <PID>
```

停止 Docker 基础设施：

```powershell
cd E:\project\Agentic Components
docker compose down
```

如果要连卷一起清空：

```powershell
docker compose down -v
```
