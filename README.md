# StockLite - Quản lý kho nhỏ

StockLite là ứng dụng quản lý sản phẩm và nhập/xuất tồn kho

- Website: https://stocklite.404hz.me
- Grafana: https://grafana.404hz.me
- API health: `GET /api/health`
- Application metrics: `GET /metrics` (chỉ nghe nội bộ trên `127.0.0.1:5002`)

## Chức năng

- CRUD sản phẩm: danh sách, chi tiết, tạo, cập nhật, xóa.
- Nhập/xuất kho theo transaction PostgreSQL, không cho tồn kho âm
- Cảnh báo sản phẩm sắp hết hàng.
- UI có validate, loading, thông báo lỗi và xác nhận trước khi xóa.

## Kiến trúc

```text
Internet
  |
  +-- HTTPS :443 --> Nginx
                       |-- static React build
                       +-- /api --> Express API (127.0.0.1:5002)
                                      +-- PostgreSQL (127.0.0.1:5432)

Prometheus Docker --> /metrics (127.0.0.1:5002)
Node Exporter ------> CPU/RAM/Disk VPS
Prometheus --> Alertmanager --> Telegram
Grafana (sau Nginx + HTTPS) --> Prometheus
GitHub Actions --> SSH deploy --> PM2 --> health check
```

## Cấu trúc

```text
backend/                 Express API, PostgreSQL schema, test va metrics
frontend/                React + Vite UI
deploy/                  PM2 ecosystem config
monitoring/              Docker Compose, Prometheus, alert rules, Alertmanager template
.github/workflows/       CI va CD + Telegram notification
```

## Chay local

1. Tạo `compose.env` từ `compose.env.example`, đặt mật khẩu local, rồi tạo database nhanh bằng Docker:

```bash
docker compose --env-file compose.env -f compose.yml up -d
```

2. Tạo `backend/.env` từu `backend/.env.example`, sau đó cài và chạy API:

```bash
cd backend
npm ci
npm test
npm start
```

3. Chạy giao diện:

```bash
cd frontend
npm ci
npm run dev
```

## Deploy VPS

VPS cần có Node.js 20, PostgreSQL, Nginx va PM2. Tạo database/user riêng cho app, lưu `DATABASE_URL` trong `/var/www/stocklite/backend/.env`, file này không nằm trong Git.

Nginx serve `frontend/dist`, proxy `/api` vao `http://127.0.0.1:5002`. PM2 chạy `deploy/ecosystem.config.cjs` va phai duoc bat startup sau reboot.

CI chạy tren moi push/PR vao `main`: unit test backend va build React. Chi khi CI xanh, workflow CD moi SSH vao VPS, cap nhat source, build, `pm2 startOrReload`, reload Nginx va health check `/api/health`.

## Monitoring va Alert

Thu muc `monitoring/` la cau hinh co the dung lai:

1. Tao `monitoring/.env` tu `.env.example` va dat `GRAFANA_ADMIN_PASSWORD`.
2. Copy `monitoring/alertmanager/alertmanager.yml.example` thanh `alertmanager.yml`, thay 2 gia tri Telegram. File that bi `.gitignore` de khong lo token.
3. Chay `docker compose -f monitoring/docker-compose.yml up -d`.
4. Grafana chi bind `127.0.0.1:3001`; Nginx proxy domain HTTPS `grafana.404hz.me` vao port nay.

Ba rule Alertmanager:

- `StockLiteAPIDown`: app chet tren 1 phut.
- `HighCPU`: CPU > 80% trong 5 phut.
- `DiskAlmostFull`: dung luong trong < 15% trong 5 phut.

Tat ca deu gui Telegram actionable va co `send_resolved: true`.

## Runbook

| Alert | Kiem tra dau tien | Lenh xu ly |
|---|---|---|
| StockLiteAPIDown | PM2/API | `pm2 status`, `pm2 logs stocklite-api`, `pm2 restart stocklite-api` |
| HighCPU | process/container | `top`, `pm2 monit`, `docker stats` |
| DiskAlmostFull | filesystem/Docker | `df -h`, `docker system df` |

## Bao mat

- Khong commit `.env`, token Telegram, mat khau VPS/DB hay private key.
- API, PostgreSQL, Prometheus, Alertmanager, Grafana chi bind localhost; public access di qua Nginx HTTPS.
- GitHub Secrets can co: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## Kich ban demo

1. CRUD tren `https://stocklite.404hz.me`.
2. Sua mot dong giao dien -> push -> CI xanh -> CD xanh -> Telegram thanh cong -> web cap nhat.
3. Lam hong mot assertion trong `backend/test/stock.test.js` -> push -> CI do -> Telegram that bai -> web giu ban cu -> sua lai va push xanh.
4. `pm2 stop stocklite-api` -> doi alert FIRING -> `pm2 start stocklite-api` -> doi RESOLVED.
