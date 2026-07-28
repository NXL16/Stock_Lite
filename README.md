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

2. Tạo `backend/.env` từ `backend/.env.example`, sau đó cài và chạy API:

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

VPS cần có Node.js 20, PostgreSQL, Nginx và PM2. Tạo database/user riêng cho app, lưu `DATABASE_URL` trong `/var/www/stocklite/backend/.env`, file này không nằm trong Git.

Nginx serve `frontend/dist`, proxy `/api` vào `http://127.0.0.1:5002`. Trên VPS hiện tại, production `.env` đặt `LISTEN_HOSTS=127.0.0.1,172.18.0.1` để Prometheus trong Docker scrape `/metrics`; cả 2 địa chỉ đều là nội bộ, không phải public IP. PM2 chạy `deploy/ecosystem.config.cjs` và phải được bật startup sau reboot.

CI chạy trên mỗi push/PR vào `main`: unit test backend và build React. Chỉ khi CI xanh, workflow CD mới SSH vào VPS, cập nhật source, build, `pm2 startOrReload`, reload Nginx và health check `/api/health`.

## Monitoring và Alert

Thư mục `monitoring/` là cấu hình có thể tái sử dụng lại:

1. Tạo `monitoring/.env` từ `.env.example` và đặt `GRAFANA_ADMIN_PASSWORD`.
2. Copy `monitoring/alertmanager/alertmanager.yml.example` thanh `alertmanager.yml`, thay 2 giá trị Telegram. File thật bị `.gitignore` để không lộ token.
3. Chay `docker compose -f monitoring/docker-compose.yml up -d`.
4. Grafana chỉ bind `127.0.0.1:3001`; Nginx proxy domain HTTPS `grafana.404hz.me` vào port này.

Ba rule Alertmanager:

- `StockLiteAPIDown`: app chết trên 1 phút.
- `HighCPU`: CPU > 80% trong 5 phút.
- `DiskAlmostFull`: dung lượng trong < 15% trong 5 phút.

Tất cả đều gửi Telegram actionable và có `send_resolved: true`.

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
