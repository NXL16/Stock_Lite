# BAO CAO VAN HANH SAN PHAM WEB - STOCKLITE

**Sinh vien:** Nguyen Xuan Linh  
**Mon:** Intro to DevOps  
**San pham:** StockLite - he thong quan ly kho nho  
**Website:** https://stocklite.404hz.me  
**Grafana:** https://grafana.404hz.me

## 1. Gioi thieu

StockLite la web app quan ly san pham va ton kho. Nguoi dung co the tao, xem, sua, xoa san pham; nhap/xuat kho va theo doi danh sach sap het hang. Muc tieu cua bai khong chi la xay dung CRUD ma la dua san pham vao van hanh thuc te: HTTPS, CI/CD, monitoring va alert Telegram.

## 2. Kien truc he thong

Client React sau khi build duoc Nginx phuc vu qua HTTPS. Nginx proxy cac request `/api` vao Express API nghe tren `127.0.0.1:5002` va Docker bridge noi bo cho Prometheus scrape metrics. API dung PostgreSQL voi user rieng va database chi nghe localhost. PM2 quan ly tien trinh `stocklite-api`.

Prometheus scrape metrics cua Node Exporter va endpoint `/metrics` cua API. Grafana hien thi suc khoe VPS va metrics request/latency. Alertmanager gui canh bao Telegram khi API chet, CPU cao keo dai hoac dung luong dia sap day.

## 3. CI/CD va notify

GitHub Actions CI chay khi push/pull request vao `main`: cai dependency, unit test logic ton kho va build React. CD chi chay khi CI thanh cong; workflow SSH vao VPS, pull source, cai dependency, build frontend, `pm2 startOrReload`, reload Nginx va health check `/api/health`.

Thong tin SSH va Telegram nam trong GitHub Secrets. Telegram nhan mot tin moi lan pipeline ket thuc: thanh cong kem nguoi push/commit message, hoac that bai kem link log Actions. Khi test fail, CD khong duoc chay nen production van giu ban cu.

## 4. Monitoring va dien tap su co

Metrics HTTP cua API gom so request va histogram thoi gian xu ly. Hai truy van PromQL su dung trong Grafana:

```promql
sum(rate(http_request_duration_seconds_count{job="stocklite-api"}[5m]))
```

```promql
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{job="stocklite-api"}[5m])))
```

Khi dung `pm2 stop stocklite-api`, Prometheus danh dau target down; sau 1 phut Alertmanager gui FIRING Telegram. Khi bat lai `pm2 start stocklite-api`, target up va Telegram gui RESOLVED. Cac alert CPU/Disk dung nguong va `for: 5m` de tranh bao vat.

## 5. Bao mat va kha nang khoi phuc

Nginx redirect HTTP sang HTTPS va Certbot tu gia han chung chi. Cac dich vu noi bo khong expose ra Internet; firewall chi mo SSH, 80 va 443. PM2 startup giup API tu chay sau reboot. Runbook trong README mo ta lenh xu ly cho tung alert.

## 6. Ket luan

StockLite dap ung 5 tru cot cua bai: full-stack CRUD + database, deploy HTTPS, CI/CD co health check va secrets, Telegram notify, monitoring/alert co dien tap su co. Cac bang chung kem theo gom GitHub Actions, website HTTPS, dashboard Grafana, Telegram FIRING/RESOLVED va video demo.
