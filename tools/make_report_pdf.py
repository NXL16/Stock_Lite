from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "StockLite-DevOps-Report.pdf"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#D8E2F0"))
    canvas.line(1.8 * cm, 1.45 * cm, A4[0] - 1.8 * cm, 1.45 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#5B6B82"))
    canvas.drawString(1.8 * cm, 1.0 * cm, "StockLite - Final Assignment Intro to DevOps")
    canvas.drawRightString(A4[0] - 1.8 * cm, 1.0 * cm, f"Trang {doc.page}")
    canvas.restoreState()


def p(text, style):
    return Paragraph(text, style)


def main():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCustom", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=31, textColor=HexColor("#0F2742"), alignment=TA_CENTER, spaceAfter=14))
    styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontSize=11, leading=17, alignment=TA_CENTER, textColor=HexColor("#52657C"), spaceAfter=8))
    styles.add(ParagraphStyle(name="H1Custom", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=16, leading=21, textColor=HexColor("#0F2742"), spaceBefore=8, spaceAfter=8))
    styles.add(ParagraphStyle(name="H2Custom", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=HexColor("#1E5DB6"), spaceBefore=8, spaceAfter=5))
    styles.add(ParagraphStyle(name="BodyCustom", parent=styles["BodyText"], fontSize=10.3, leading=15.5, textColor=HexColor("#24364B"), spaceAfter=7))
    styles.add(ParagraphStyle(name="CodeCustom", parent=styles["Code"], fontName="Courier", fontSize=8.5, leading=12, backColor=HexColor("#F1F5FA"), borderColor=HexColor("#D8E2F0"), borderWidth=0.5, borderPadding=7, spaceBefore=4, spaceAfter=9))
    body = styles["BodyCustom"]
    story = [Spacer(1, 2.6 * cm), p("BAO CAO VAN HANH SAN PHAM WEB", styles["Subtitle"]), p("StockLite", styles["TitleCustom"]), p("Final Assignment - Intro to DevOps", styles["Subtitle"]), Spacer(1, 1.3 * cm)]
    info = [["Sinh vien", "Nguyen Xuan Linh"], ["San pham", "StockLite - quan ly kho nho"], ["Website", "https://stocklite.404hz.me"], ["Monitoring", "https://grafana.404hz.me"], ["Repository", "https://github.com/NXL16/Stock_Lite"]]
    table = Table(info, colWidths=[4.0 * cm, 11.2 * cm])
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), HexColor("#EAF2FF")), ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#173656")), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("FONTNAME", (1, 0), (1, -1), "Helvetica"), ("FONTSIZE", (0, 0), (-1, -1), 10), ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#CAD8EB")), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story += [table, Spacer(1, 1.0 * cm), p("Muc tieu cua bao cao", styles["H2Custom"]), p("Trinh bay viec xay dung va van hanh StockLite nhu mot he thong thuc te: full-stack CRUD, deploy HTTPS, CI/CD tu dong, monitoring va alert Telegram.", body), PageBreak()]
    story += [p("1. San pham va kien truc", styles["H1Custom"]), p("StockLite la web app quan ly san pham va ton kho. Nguoi dung co the tao, xem, sua, xoa san pham; nhap/xuat kho va theo doi danh sach sap het hang. Du lieu duoc luu trong PostgreSQL nen van ton tai sau restart app va reboot VPS.", body), p("Kien truc", styles["H2Custom"]), p("Internet -> Nginx HTTPS -> React static build va /api -> Express API (127.0.0.1:5002) -> PostgreSQL (127.0.0.1:5432). PM2 quan ly tien trinh stocklite-api. Cac cong noi bo khong expose truc tiep ra Internet.", body), p("API va giao dien", styles["H2Custom"]), p("API cung cap day du GET list, GET detail, POST, PUT va DELETE cho entity Product. UI React co validate form, loading, xu ly loi, xac nhan xoa va thao tac nhap/xuat kho. Endpoint /api/health duoc dung trong deploy pipeline va monitoring.", body), p("2. Deploy va bao mat", styles["H1Custom"]), p("Nginx phuc vu frontend va reverse proxy /api ve Express. HTTP redirect sang HTTPS voi chung chi Lets Encrypt/Certbot. PM2 tu restart khi crash va cau hinh startup giup app chay lai sau reboot.", body), p("PostgreSQL dung user va password rieng cho StockLite, chi nghe localhost. UFW chi cho phep SSH, 80 va 443. Secrets VPS, database va Telegram duoc luu ngoai Git; repo ignore .env va file Alertmanager that.", body), PageBreak()]
    story += [p("3. CI/CD va Telegram", styles["H1Custom"]), p("Workflow CI chay tren moi push/pull request vao main. CI cai dependencies, chay unit test that cho logic ton kho va build React. Workflow CD chi duoc kich hoat khi CI thanh cong; CD pull source tren VPS, build frontend, startOrReload PM2, reload Nginx va health check /api/health.", body), p("Khi CI/test that bai, CD khong chay va production giu nguyen ban cu. Telegram gui mot tin bao ket qua pipeline: thanh cong kem nguoi push va commit message; that bai kem link log GitHub Actions.", body), p("4. Monitoring va alert", styles["H1Custom"]), p("Prometheus thu thap CPU, RAM, disk tu Node Exporter va metrics HTTP tu endpoint /metrics cua Express. Grafana duoc truy cap qua HTTPS sau Nginx. Hai query da dung de quan sat app:", body), p("sum(rate(http_request_duration_seconds_count{job=\"stocklite-api\"}[5m]))", styles["CodeCustom"]), p("histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{job=\"stocklite-api\"}[5m])))", styles["CodeCustom"]), p("Alertmanager co ba quy tac: StockLiteAPIDown sau 1 phut, HighCPU lon hon 80% trong 5 phut va DiskAlmostFull khi con duoi 15% trong 5 phut. Moi alert deu co huong dan xu ly va send_resolved.", body), PageBreak()]
    story += [p("5. Dien tap su co va ket luan", styles["H1Custom"]), p("Dien tap su co duoc thuc hien bang pm2 stop stocklite-api. Sau khi Prometheus thay target down qua nguong for, Alertmanager gui Telegram FIRING. Sau pm2 start stocklite-api, target phuc hoi va Telegram gui RESOLVED. Dashboard Node Exporter va Grafana Explore the hien CPU/RAM/disk, request per second va p95 latency.", body), p("Bang chung can nop", styles["H2Custom"])]
    evidence = [["Muc", "Bang chung"], ["Source va workflow", "Repository public co backend, frontend, monitoring va .github/workflows"], ["Website", "StockLite chay HTTPS va thao tac CRUD"], ["CI/CD", "GitHub Actions xanh, deploy va Telegram notification"], ["Monitoring", "Node Exporter Full, request/s va p95 latency"], ["Alert", "Telegram FIRING va RESOLVED khi stop/start PM2"], ["Video", "CRUD -> deploy xanh -> test fail -> fire drill"]]
    tbl = Table(evidence, colWidths=[4.0 * cm, 11.2 * cm])
    tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), HexColor("#1E5DB6")), ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("BACKGROUND", (0, 1), (-1, -1), HexColor("#F7FAFE")), ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#CAD8EB")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("FONTSIZE", (0, 0), (-1, -1), 9.2), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story += [tbl, Spacer(1, 0.6 * cm), p("Ket luan", styles["H2Custom"]), p("StockLite dap ung nam tru cot cua Final Assignment: full-stack CRUD, deploy VPS HTTPS, CI/CD va notify, monitoring va alert co dien tap su co. README cung cap kien truc, cau hinh, runbook va kich ban demo de he thong co the duoc dung lai va van hanh nhat quan.", body)]
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=1.8 * cm, leftMargin=1.8 * cm, topMargin=1.6 * cm, bottomMargin=2.0 * cm, title="StockLite DevOps Report", author="Nguyen Xuan Linh")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    main()
