# Nền tảng Quản trị STEM đa cấp — Phân tích & Kế hoạch kiến trúc (v0.2)

> Trạng thái: **ĐÃ DUYỆT (15/10/2026)**, triển khai trong repo này. Tiến độ: M0 ✅ · M1 ✅ · Tái cấu trúc v0.2 (14 phân hệ + QĐ 2768) ✅ đã duyệt 16/10 · M1b ⏭ · M2 ⏭.
> Các quyết định D1–D7 đang áp dụng mặc định như khuyến nghị, xem `docs/DECISIONS.md`.
> Đầu vào: `STEM_PLATFORM_PRODUCT_BRIEF.md`, `PROMPT_FOR_CLAUDE.md`, video ghi màn hình hệ thống tham khảo (8 phút 43 giây), repo `da-kdi/stemtown-preview`.
> Ngày: 15/10/2026 · cập nhật v0.2: 16/10/2026

---

## CẬP NHẬT v0.2 (16/10/2026): Tái cấu trúc 14 phân hệ × 5 bước đề án × Từ điển dữ liệu ngành

> Đầu vào bổ sung: hình **Kiến trúc tổng thể** (3 tầng + 2 nền, "14 phân hệ"), hình **Phân hệ theo tầng** (Sở ↔ Trường, phân hệ 1–8 và 0.1–0.5), **quy trình 5 bước triển khai đề án**, và **QĐ 2768/QĐ-BGDĐT** ngày 18/9/2026 ban hành Từ điển dữ liệu dùng chung ngành GDĐT (41 miền dữ liệu, 892 thuật ngữ).
> Phần v0.2 **thay thế** §1.3 (danh sách module), §2 (menu) và §7 (roadmap) của v0.1. Các phần còn lại vẫn hiệu lực.
> Nguồn chân lý trong code: `src/domain/modules.ts` (phân hệ, bước, tầng), `src/domain/navigation.ts` (menu), `src/domain/dictionary/*` (từ điển & ánh xạ).

### V2.1 Kiến trúc tổng thể → công nghệ

| Tầng (hình 1) | Thành phần | Hiện thực |
|---|---|---|
| **Tầng trên · Giao diện** | Web app / Mobile app; Online + **Offline** (đồng bộ khi có mạng) | React SPA responsive (đang có) → **PWA** có hàng đợi ngoại tuyến cho điểm danh, nhật ký buổi dạy (M7) |
| | Phân tích & báo cáo (Dashboard/BI) | Dashboard trong ứng dụng (0.1); **Power BI** đọc kho phân tích (M9) |
| **Tầng giữa · Xử lý nghiệp vụ** | Nghiệp vụ & API: 14 phân hệ | Mỗi phân hệ một schema Postgres + RPC `security definer` (hợp đồng công khai) |
| | Tích hợp hệ thống (LMS, nội bộ, bên ngoài) | Edge Functions + ánh xạ theo **QĐ 2768** (`cfg.data_term_mapping`) |
| | Tác vụ nền (thông báo, báo cáo, đồng bộ) | `pg_cron` + Edge Functions, hàng đợi |
| **Tầng dưới · Dữ liệu dùng chung** | Cơ sở dữ liệu PostgreSQL / Cloud SQL | Supabase Postgres (hoặc self-host, chờ D7) |
| | Kho tài liệu (object storage, CDN) | Supabase Storage + CDN: minh chứng, học liệu, sản phẩm HS |
| | Kho phân tích (data warehouse) | Schema `dw` dạng star schema (fact buổi dạy, điểm danh, đánh giá, khảo sát…) |
| **Nền** | Định danh & bảo mật | Auth + RLS theo vai trò × phạm vi × quan hệ, ngữ cảnh vai trò, nhật ký append-only, PII tách bảng |
| | Hạ tầng vận hành | CI/CD (GitHub Actions), giám sát, sao lưu PITR |

### V2.2 Mười bốn phân hệ

Hình phân hệ có 13 ô. Hình kiến trúc ghi "14 phân hệ". Thứ còn thiếu là **Bước 1–2 của đề án (Định hướng từ Sở, Lập kế hoạch)**, vốn có ở v0.1 dưới tên "Kế hoạch & chỉ tiêu". Vì vậy bổ sung **Phân hệ 0** làm phân hệ thứ 14 (✅ **đã xác nhận 16/10/2026**, ADR-009).

| Tầng | Số | Phân hệ | Chi tiết bên trong | Bước | Miền QĐ 2768 | Mốc |
|---|---|---|---|---|---|---|
| 0 · Định hướng | **0** | Định hướng & kế hoạch đề án *(bổ sung)* | Đề án năm học cấp tỉnh; bộ chỉ số, giao chỉ tiêu; trường tiếp nhận/kiến nghị; kế hoạch STEM của trường; tiến trình 5 bước | 1, 2, 5 | MOET30, 34 | M3 |
| 1 · Đào tạo GV | **1** | Đào tạo & đánh giá năng lực GV | Nhu cầu & kế hoạch bồi dưỡng; khóa tập huấn, ghi danh, điểm danh; chứng chỉ; xếp loại năng lực (gắn chuẩn nghề nghiệp) | 2, 3, 4 | MOET19, 22, 24 | M5 |
| 2 · Chương trình | **2** | Chương trình & học liệu STEM | Khung CT theo cấp/khối/môn; chủ đề, bài học, KHBD mẫu; thư viện học liệu có phiên bản; thẩm định & công bố | 1, 2, 3 | MOET39, 40 | M5 |
| 3 · Thiết bị | **3** | Thiết bị, vật tư & phòng STEM | Phòng STEM/thí nghiệm/xưởng; thiết bị, tài sản, nguyên giá; vật tư **nhập–xuất–tồn**; bảo trì, bảo hành; kiểm kê | 2, 3, 4 | MOET32 | M6 |
| 4 · Vận hành dạy học | **4** | Tổ chức dạy học | Hồ sơ CSGD, điểm trường; cán bộ/nhà giáo, tổ; người học, lớp, khối; PH & liên kết; phân công | 2 | MOET07, 10, 18, 20, 30, 31 | M2 (một phần đã có) |
| | **5** | Kế hoạch & lịch dạy | Kế hoạch dạy học từ khung CT (2); phân công GV/phòng/thiết bị (3); lịch & xung đột; mượn thiết bị; sự kiện | 2, 3 | MOET31 | M6 |
| | **6** | Buổi dạy & điểm danh | Check-in GV; điểm danh HS; nhật ký, minh chứng; ghi nhận vật tư đã dùng; **ngoại tuyến** | 3 | MOET11, 31 | M7 |
| | **7** | Đánh giá năng lực & sản phẩm | Rubric năng lực/phẩm chất; mức đạt, điểm ĐGTX/ĐGĐK, nhận xét; sản phẩm, dự án; hồ sơ năng lực | 4 | MOET11, 16 | M7 |
| Xuyên suốt | **8** | Quy trình & thông báo | Bộ máy phê duyệt; nhắc việc, SLA; cảnh báo; giao nhiệm vụ/giải trình; thông báo in-app/email/app | 1–5 | MOET05 | M3 |
| 5 · Quản lý vận hành | **0.1** | Dashboard & báo cáo | Dashboard theo vai trò; kỳ báo cáo; tổng hợp lên Sở; chất lượng dữ liệu; **đề xuất cải tiến** | 4, 5 | MOET33, 34 | M8 |
| | **0.2** | Khảo sát | Ngân hàng câu hỏi; mẫu của Sở (bắt buộc) + câu riêng của trường; phát hành theo đối tượng; tổng hợp | 1, 4, 5 | MOET34 | M4 |
| | **0.3** | Tích hợp dữ liệu & AI | Kết nối LMS/CSDL ngành/nội bộ; ánh xạ QĐ 2768; đồng bộ & đối soát; kho phân tích; trợ lý AI có kiểm quyền | 5 | MOET34 | M9 |
| | **0.4** | Người dùng & phân quyền | Đơn vị, tài khoản, vai trò, ngữ cảnh; quyền NCC; nhật ký | 1–5 | MOET29, 30 | ✅ |
| | **0.5** | Quản trị nền tảng | Cấu hình kế thừa; bật/tắt phân hệ; danh mục; **từ điển dữ liệu**; thuật ngữ | 1 | MOET01 | ✅ |

**Nhà cung cấp và Phụ huynh** là vai trò tham gia vào phân hệ, không phải phân hệ riêng:
- NCC: tổ chức tập huấn (1), gửi học liệu thẩm định (2), xử lý bảo hành (3), báo cáo triển khai (0.1), quyền dữ liệu theo hợp tác (0.4).
- PH: liên kết & xác minh (4), xem chuyên cần (6), xem kết quả đã công bố (7), trao đổi & thông báo (8), trả lời khảo sát (0.2).

Phân hệ **luôn bật**: 0, 4, 8, 0.1, 0.4, 0.5. **Bật/tắt theo đơn vị**: 1, 2, 3, 5, 6, 7, 0.2, 0.3. Demo: Sở đặt **bắt buộc** cho 0, 6, 0.2, 0.1; TH Sao Mai tắt phân hệ 3.

### V2.3 Quy trình 5 bước ↔ phân hệ

| Bước | Ai chủ trì | Đầu ra | Phân hệ |
|---|---|---|---|
| 1. Định hướng từ Tỉnh/Sở | Sở | Đề án năm học, bộ chỉ số & chỉ tiêu, khung CT STEM, khảo sát hiện trạng, cấu hình bắt buộc | 0, 2, 0.2, 0.5, 8 |
| 2. Lập kế hoạch | Trường (Sở duyệt) | Tiếp nhận chỉ tiêu; kế hoạch STEM; hồ sơ tổ chức dạy học; kế hoạch & lịch dạy; kế hoạch bồi dưỡng, thiết bị | 0, 4, 5, 1, 3, 8 |
| 3. Đào tạo và triển khai | Trường · NCC | Bồi dưỡng GV; triển khai học liệu; chuẩn bị phòng/thiết bị; buổi dạy, điểm danh, minh chứng | 1, 2, 3, 5, 6 |
| 4. Đánh giá vận hành | Trường · Tổ · Sở | Đánh giá năng lực HS; xếp loại GV; hiệu quả thiết bị; khảo sát hài lòng; giám sát | 7, 1, 3, 0.2, 0.1 |
| 5. Tổng hợp báo cáo & đề xuất cải tiến | Trường → Sở | Báo cáo định kỳ; tổng hợp tỉnh; đề xuất cải tiến; điều chỉnh đề án năm sau | 0.1, 0.3, 0, 8 |

Mỗi đơn vị có **tiến trình đề án** theo năm học (bước đang ở, đầu ra đã xong). Hiện là dữ liệu minh họa trên trang "Tiến trình đề án" và trang tổng quan; M3 sẽ tính tự động từ dữ liệu thật.

### V2.4 Phân tích chênh lệch: bản đã build (v0.1) so với cấu trúc mới

| # | Hạng mục | v0.1 | v0.2 | Xử lý |
|---|---|---|---|---|
| 1 | Cách nhóm | 9 module theo chức năng (core, plan, activity, resource, assess, training, provider, portal, report) | 14 phân hệ theo 5 tầng + 5 bước | ✅ Đã tái cấu trúc registry, quyền, menu, cấu hình |
| 2 | **Khảo sát (0.2)** | Không có | Phân hệ riêng, dùng ở bước 1, 4, 5 | ➕ Bổ sung vào registry & menu (M4) |
| 3 | **Buổi dạy & điểm danh (6)** | Gộp mờ trong "Hoạt động & minh chứng" | Phân hệ riêng: check-in, điểm danh, nhật ký, offline | ➕ Tách riêng (M7) |
| 4 | **Vật tư, tồn kho (3)** | Chỉ phòng & thiết bị | Thêm vật tư nhập–xuất–tồn, bảo trì | ➕ Thêm quyền `resource.stock.manage`, menu "Vật tư & tồn kho" |
| 5 | **Kế hoạch & lịch dạy (5)** | Nằm trong plan/resource | Phân hệ riêng nhận đầu vào từ 2 và 3 | ➕ Tách riêng (M6) |
| 6 | **Tích hợp dữ liệu & AI (0.3)** | Chỉ ghi chú Phase 4 | Phân hệ riêng + kho phân tích | ➕ Registry & menu (M9); từ điển + ánh xạ làm nền ngay |
| 7 | Nhà cung cấp, Cổng HS/PH | Module riêng | Vai trò tham gia phân hệ | ✅ Phân bổ lại menu NCC/PH theo phân hệ |
| 8 | Chuẩn dữ liệu ngành | Chưa có | QĐ 2768 bắt buộc dùng | ✅ Nạp 892 thuật ngữ, ánh xạ 22 cột, thêm cột chuẩn còn thiếu, COMMENT mã BG trên cột |
| 9 | Offline / mobile | Chỉ responsive | Offline đồng bộ khi có mạng | ⏭ PWA + hàng đợi cho phân hệ 6 (M7), ADR-011 |
| 10 | Tác vụ nền, object storage, kho phân tích | Chưa mô tả rõ | Có trong kiến trúc | ⏭ ADR-012; storage ở M3 (minh chứng), dw ở M9 |
| 11 | Tiến trình đề án | Không có | Xương sống điều hành Sở ↔ Trường | ✅ Trang "Tiến trình đề án" + thanh 5 bước trên tổng quan (dữ liệu minh họa) |

### V2.5 Chuẩn dữ liệu theo QĐ 2768/QĐ-BGDĐT

- **Nạp nguyên văn** Phụ lục 01 (41 miền MOET01–41) và Phụ lục 02 (892 thuật ngữ BG_00001–00892) vào `cfg.data_domain`, `cfg.data_term`. Nguồn: `src/domain/dictionary/qd2768.json`, trích tự động từ PDF và đã có test toàn vẹn.
- **Quy ước:** cột nội bộ dùng `snake_case`, ổn định cho code. **Trao đổi dữ liệu** (import/export Excel, API, báo cáo gửi Sở/Bộ) dùng **tên kỹ thuật chuẩn** (`truongId`, `tenCsgd`, `capHoc`, `maLop`, `tenLop`, `khoi`, `hoTenNh`, `ngaySinhNh`, `gioiTinh`…).
- **Ánh xạ** cột ↔ thuật ngữ trong `src/domain/dictionary/mapping.ts`, sinh ra `cfg.data_term_mapping` và `COMMENT ON COLUMN`. Trạng thái `EXACT` (khớp) hoặc `PARTIAL` (cần quy đổi giá trị).
- **Cột chuẩn đã bổ sung:** `org.unit.ma_dinh_danh` (truongId ≤15 / maDinhDanhToChuc ≤35), `loai_hinh_csgd`, `tinh_thanh`; `org.class.ma_lop`; `iam.person_private.so_dinh_danh_ca_nhan` (12 số, CDE-CN-001), `dan_toc` (CDE-CN-004), `quoc_tich` (CDE-CN-003).
- **Quy đổi giá trị đã xác định:** giới tính theo ISO/IEC 5218 (NAM→1, NU→2), đúng định nghĩa của BG_00010.
- **Giới hạn của văn bản:** QĐ 2768 **không** ban hành danh sách giá trị cho các thuộc tính kiểu Enumeration (cấp học, loại hình CSGD, khối, môn học, trạng thái người học, chức vụ, dân tộc…), và **không có thuật ngữ riêng cho STEM**. Danh mục giá trị lấy từ **CSDL ngành của Bộ** (✅ quyết định 16/10, ADR-013) và nạp ở M2; trong lúc chờ, hệ thống dùng giá trị nội bộ và đánh dấu "cần quy đổi". Dữ liệu đặc thù STEM (buổi dạy STEM, rubric STEM, khảo sát) là phần mở rộng, gắn vào miền gần nhất (MOET11, 31, 32, 39).
- **Giao diện:** tiêu đề cột dùng component `<Term code="BG_…">`; rê chuột sẽ thấy mã và tên kỹ thuật chuẩn. Trang "Từ điển dữ liệu ngành" (0.5) cho phép tra cứu, lọc theo miền và xem cột nào đang dùng thuật ngữ nào.

### V2.6 Roadmap mới (theo trình tự 5 bước)

| Mốc | Phân hệ | Bước | Tiêu chí nghiệm thu chính |
|---|---|---|---|
| M0–M1 ✅ | 0.4, 0.5, 4 (đọc) + tái cấu trúc v0.2 | – | RLS 7 vai trò; 14 phân hệ trong registry/menu; từ điển 892 thuật ngữ; test đồng bộ |
| M1b | Adapter Supabase | – | Đăng nhập thật, đổi ngữ cảnh qua JWT, đọc qua RLS trên Supabase project mới |
| M2 | **4** Tổ chức dạy học đầy đủ + **danh mục CSDL ngành** (M2a ✅ khung danh mục & nạp CSV · M2b ✅ hồ sơ tổ/GV/phân công/lớp/HS · M2c-1 ✅ import/export Excel HS & GV theo tên kỹ thuật · M2c-2 liên kết PH, hồ sơ NCC) | 2 | Nạp danh mục chuẩn từ CSDL ngành (cấp học, loại hình, khối, môn, trạng thái, chức vụ, dân tộc, đơn vị hành chính); quy đổi nội bộ → chuẩn; import/export Excel **theo tên kỹ thuật QĐ 2768**; báo lỗi theo dòng; liên kết PH (W8); hồ sơ NCC |
| M3 | **0** Định hướng & kế hoạch + **8** Quy trình & thông báo | 1, 2 | Sở ban hành → giao chỉ tiêu → trường lập kế hoạch → Sở duyệt/trả lại; tiến trình 5 bước tính tự động; minh chứng lưu object storage |
| M4 | **0.2** Khảo sát | 1, 4 | Sở phát hành phiếu hiện trạng (bắt buộc), trường thêm câu; tỷ lệ phản hồi; tổng hợp theo trường; ẩn danh đúng cấu hình |
| M5 | **2** Chương trình & học liệu + **1** Đào tạo GV | 2, 3 | Thẩm định → công bố học liệu NCC; khóa bồi dưỡng, chứng chỉ, xếp loại năng lực GV |
| M6 | **3** Thiết bị, vật tư & phòng + **5** Kế hoạch & lịch dạy | 2, 3 | Tồn kho đúng sau nhập/xuất; lịch dạy phát hiện xung đột phòng/GV/thiết bị |
| M7 | **6** Buổi dạy & điểm danh (PWA offline) + **7** Đánh giá | 3, 4 | Điểm danh ngoại tuyến đồng bộ không mất dữ liệu; rubric năng lực theo thuật ngữ MOET11; PH chỉ thấy kết quả đã công bố |
| M8 | **0.1** Dashboard & báo cáo nâng cao | 4, 5 | Kỳ báo cáo điền sẵn, khóa snapshot; đề xuất cải tiến; số liệu Sở = tổng từ trường |
| M9 | **0.3** Tích hợp dữ liệu & AI + kho phân tích | 5 | Đồng bộ ít nhất một nguồn ngoài; dw cho Power BI; trợ lý AI chỉ trả lời trong phạm vi quyền |

> ✅ Đã xác nhận 16/10/2026: giữ thứ tự theo 5 bước, Khảo sát ở M4.

---


## 0. Hiện trạng

### 0.1 Codebase
| Hạng mục | Phát hiện |
|---|---|
| Repo của nền tảng STEM | **Chưa có.** Tài khoản GitHub chỉ có `da-kdi/stemtown-preview` |
| `stemtown-preview` là gì | Bản preview độc lập của module BI **STEM TOWN** (B2B/B2C, tour, KPI). Bản này dùng stub `useAuth` và stub `supabase` client. Repo gốc là `supabase-checker`, tôi không truy cập được |
| Stack thực tế của anh/chị | React 19, Vite 8, TypeScript 6, Tailwind 4, Radix UI (kiểu shadcn), TanStack Query + TanStack Router, Supabase JS, zod, recharts, xlsx, sonner, oxlint, GitHub Actions → GitHub Pages |
| Tái sử dụng được | Bộ `components/ui/*` (button, card, dialog, input, select, label, textarea); pattern `chart-kit`, `kpi`, `filters`, `panel`, `data-table-view`; pattern import Excel có kiểm tra (`b2b-import`, `tour-import`); lớp trừu tượng `data-source`; pattern guard `canViewReport` + `AccessDenied` |
| Rủi ro | (1) `xlsx@0.18.5` trên npm còn lỗ hổng đã công bố (prototype pollution, ReDoS) và bản vá chỉ phát hành qua CDN của SheetJS, nên với dữ liệu học sinh cần thay bằng `exceljs` hoặc bản SheetJS đã vá. (2) Có cả `react-router-dom` lẫn `@tanstack/react-router`, cần chọn một. (3) GitHub Pages chỉ phù hợp để demo, không dùng cho môi trường có dữ liệu thật. (4) Chưa có test runner. |

**Kết luận:** dự án mới, nhưng **giữ nguyên stack** của anh/chị để tận dụng kỹ năng, component và hạ tầng Supabase sẵn có. Không động vào `stemtown-preview` hay `supabase-checker`.

### 0.2 Hệ thống tham khảo (từ video)
Chỉ dùng để hiểu bài toán. **Không sao chép giao diện, thương hiệu hay mã nguồn.**

| Vai trò trong video | Nhóm menu quan sát được |
|---|---|
| **Trường – Quản trị (Hiệu trưởng)** | Tổng quan (Dashboard, Hồ sơ trường) · Mua sắm gói STEM · Nhân sự & đồng bộ K12 (GV, Phân công giảng dạy, Lớp, HS) · Phòng STEM (Phòng, Thiết bị, Bảo hành) · Kế hoạch GD & TKB (KHGD toàn trường, Duyệt đăng ký dạy STEM, TKB, Phân công GV dạy STEM) · Tập huấn GV (Kế hoạch, Lịch, Bài giảng, Lớp học ảo, Chứng chỉ) · Quản lý khai báo (Tòa nhà & tầng, Cấu hình tiết học, PPCT) · Quản trị (Tài khoản, Vai trò & phân quyền) |
| **Giáo viên** | Tổng quan · Kế hoạch giáo dục (TKB tuần/năm) · Lớp giảng dạy · Bài tập · Chấm bài · Giáo dục STEM · Đặt phòng STEM · Soạn bài giảng · Kho hoạt động & bài giảng · Thư viện STEM · Khác (Học trước & tự học, Lịch/Bài giảng tập huấn) |
| **Học sinh** | Tổng quan · Bài tập · Lịch học · Giáo dục STEM (vào lớp bằng PIN) · Chủ đề (buổi học, nhiệm vụ, tài liệu, thảo luận) |
| **Sở GD&ĐT** | Dashboard toàn Sở · KPI & xếp hạng xã/phường · Danh sách trường · Chương trình CT1–CT5 · Theo dõi môn học STEM · Giám sát tập huấn GV · Kế hoạch/Lịch tập huấn · Hiệu quả phòng STEM · Báo cáo Bộ GD&ĐT (theo mẫu thông tư, xuất PDF/Excel/Word) · Điều hành & cấu hình |

**Đáng học hỏi:**
- Xử lý **tranh chấp phòng** ngay trong màn duyệt đăng ký dạy STEM.
- Ma trận quyền dạng lưới (Xem / Chi tiết / Tạo / Sửa / Xóa theo từng phân hệ), có vai trò tùy chỉnh như "Tổ trưởng chuyên môn".
- Bảng "trạng thái cấu hình theo trường" ở cấp Sở: kích hoạt, đồng bộ, phòng STEM, báo cáo.
- Ticket bảo hành gửi thẳng tới nhà cung cấp.
- Mỗi dashboard đều có khối "Cần làm / Việc cần xử lý".

**Khoảng trống so với brief (cơ hội khác biệt):**
1. Không có không gian làm việc riêng cho **Tổ/Khoa chuyên môn**, chỉ có một vai trò.
2. Không có **cổng Nhà cung cấp**. NCC chỉ xuất hiện như nơi nhận ticket bảo hành và đơn vị tập huấn.
3. Không có **Phụ huynh**.
4. Cấp Sở chủ yếu *xem*. Video không cho thấy luồng **giao chỉ tiêu → trường tiếp nhận → giải trình**.
5. Không thấy cơ chế **cấu hình biểu mẫu/quy trình theo trường** hay **kế thừa cấu hình**.
6. Nhiều số liệu mẫu không khớp nhau. Ví dụ "Phòng STEM 4" ở hồ sơ trường nhưng "3/4 phòng hoạt động" ở dashboard. Điều này cho thấy cần **một nguồn số liệu chuẩn** (metric registry).

---

## 1. Kiến trúc tổng thể & ranh giới module

### 1.1 Phương án nền tảng

| | **A. Supabase-centric modular monolith** (khuyến nghị) | B. Node API (NestJS) + Postgres |
|---|---|---|
| Phù hợp với stack hiện tại | ✅ Đã dùng Supabase | ❌ Công nghệ mới |
| Phân quyền theo phạm vi dữ liệu | ✅ **RLS ở tầng DB**, an toàn cả khi frontend lỗi | Phải tự viết ở tầng service, dễ sót |
| Logic workflow phức tạp | ⚠️ Viết bằng Postgres function + Edge Function (Deno/TS) | ✅ Thuận tay hơn |
| Auth / Storage / Realtime | ✅ Có sẵn | Phải tự dựng |
| Test | pgTAP cho RLS + Vitest cho FE/Edge | Jest/Vitest |
| Chi phí vận hành MVP | Thấp | Trung bình |

→ **Chọn A.** Ranh giới module được giữ bằng **schema Postgres riêng cho từng module**. Hợp đồng giữa các module là **RPC function + view công khai**. Module này không đọc thẳng bảng nội bộ của module khác. Nếu sau này cần tách service, có thể bọc schema bằng một API riêng mà không phải đổi mô hình.

### 1.2 Sơ đồ lớp

```
┌──────────────────────────── Web SPA (React 19 + Vite, tiếng Việt, responsive) ─────────────────────────────┐
│ App shell: chọn ngữ cảnh vai trò · menu động (module registry ∩ module bật ∩ quyền) · thông báo · tìm kiếm │
│ features/<module>/  (routes, views, hooks, api.ts — chỉ gọi RPC/view công khai của module)                 │
└──────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                               │ supabase-js (JWT có claim active_assignment_id)
┌──────────────────────────────────────────────┴───────────────────────── Supabase ────────────────────────────┐
│ Auth (email/OTP; VNeID SSO sau)   Storage (bucket theo mức nhạy cảm)   Edge Functions (import/export,      │
│                                                                         thông báo, sinh báo cáo, cron SLA) │
│ PostgreSQL ── schema theo module ── RLS dùng chung hàm iam.can(perm, org_unit) ── audit trigger ──────────── │
│  core │ org │ iam │ cfg │ wf │ catalog │ plan │ activity │ resource │ assess │ training │ provider │         │
│  portal │ report │ notify │ file │ audit                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Danh sách module *(v0.1 — đã thay bằng V2.2)*

| # | Module (schema) | Trách nhiệm | Phụ thuộc | Phase |
|---|---|---|---|---|
| 1 | `org` – Tổ chức | Cây đơn vị Sở → (đơn vị trực thuộc) → Trường → Tổ/Khoa → Lớp; closure table; hồ sơ trường | – | 1 |
| 2 | `iam` – Danh tính & quyền | Tài khoản, hồ sơ cá nhân, vai trò, permission registry, gán vai trò theo phạm vi, ngữ cảnh làm việc, liên kết PH–HS, grant cho NCC | org | 1 |
| 3 | `cfg` – Cấu hình | Module registry, bật/tắt theo đơn vị, kế thừa 3 chế độ, định nghĩa biểu mẫu, nhãn thuật ngữ, phiên bản cấu hình | org, iam | 1 |
| 4 | `wf` – Workflow | Định nghĩa trạng thái/chuyển trạng thái, instance, lịch sử bước, SLA, giao nhiệm vụ/giải trình | iam, cfg | 1 |
| 5 | `catalog` – Danh mục dùng chung | Năm học/học kỳ, cấp học, khối, môn, loại hoạt động, chương trình STEM, tiêu chí/rubric mẫu | cfg | 1 |
| 6 | `plan` – Kế hoạch & chỉ tiêu | Bộ chỉ số, chỉ tiêu Sở giao, kế hoạch STEM trường/tổ/GV, phân công | catalog, wf | 1 |
| 7 | `activity` – Hoạt động dạy học STEM | Kế hoạch bài dạy, hoạt động thực tế, minh chứng, điểm danh/tham gia | plan, file, wf | 1 |
| 8 | `report` – Báo cáo & dữ liệu | Metric registry, snapshot tổng hợp, kỳ báo cáo, nộp báo cáo, data quality, import/export | tất cả (chỉ đọc view) | 1 |
| 9 | `notify` – Thông báo | In-app, sau này email/Zalo; hàng đợi; tùy chọn nhận | iam | 1 |
| 10 | `file` – Tệp & minh chứng | Metadata, mức nhạy cảm, phiên bản, thời hạn lưu, signed URL | iam | 1 |
| 11 | `audit` – Nhật ký | Append-only; không lưu PII thô | – | 1 |
| 12 | `resource` – Phòng & thiết bị | Phòng, thiết bị, kiểm kê, đặt lịch, phát hiện xung đột, bảo trì/bảo hành | org, wf | 1b |
| 13 | `training` – Phát triển năng lực GV | Nhu cầu, khóa/buổi tập huấn, ghi danh, chứng chỉ | iam, provider | 2 |
| 14 | `provider` – Nhà cung cấp | Hồ sơ NCC, sản phẩm/học liệu có phiên bản, thẩm định–công bố, hợp đồng, triển khai, hỗ trợ, phản hồi | org, wf, file | 2 |
| 15 | `assess` – Nhiệm vụ & đánh giá | Bài tập/dự án, bài nộp, rubric, nhận xét, hồ sơ năng lực | activity, file | 3 |
| 16 | `portal` – HS/PH | Lịch, sự kiện, đăng ký hoạt động, trao đổi PH–GV | assess, notify | 3 |
| 17 | `ai` – Trợ lý | RAG trên dữ liệu được phép, có trích nguồn | report | 4 |

**Quy tắc ranh giới:**
- Mỗi module có `public` RPC/view (hợp đồng) và bảng nội bộ.
- Mọi ghi dữ liệu nghiệp vụ đi qua RPC để luôn qua kiểm tra quyền, kiểm tra workflow và ghi audit.
- Đọc danh sách được phép đi qua view có RLS.

### 1.4 Cấu trúc thư mục đề xuất

```
stem-platform/
├─ apps/web/src/
│  ├─ app/ (shell, router, context-switcher, menu-builder)
│  ├─ components/ui/          ← tái dùng từ stemtown-preview
│  ├─ components/data/        ← chart-kit, kpi, filters, data-table (tái dùng có chỉnh)
│  ├─ features/{org,iam,cfg,plan,activity,report,resource,provider,assess,portal}/
│  └─ lib/{supabase,permissions,i18n-vi,format}
├─ supabase/
│  ├─ migrations/  (mỗi module một nhóm migration, đặt tiền tố theo module)
│  ├─ functions/   (edge: import-xlsx, export-report, notify-dispatch, sla-cron)
│  ├─ seed/        (kịch bản demo xuyên suốt)
│  └─ tests/       (pgTAP: test RLS theo từng vai trò)
└─ docs/  PRODUCT_BRIEF · MODULE_MAP · DATA_MODEL · PERMISSION_MATRIX · WORKFLOWS · DECISIONS · RUNBOOK
```

---

## 2. Cấu trúc menu theo vai trò *(v0.1 — menu hiện hành nhóm theo phân hệ: `src/domain/navigation.ts`)*

Menu được **sinh động** theo công thức: `module registry` ∩ `module được bật ở đơn vị của ngữ cảnh hiện tại` ∩ `quyền của vai trò`. Nhãn dùng thuật ngữ cấu hình được, ví dụ "Tổ chuyên môn" có thể đổi thành "Khoa". Mỗi trang tổng quan đều có khối **"Việc cần làm"** và đường drill-down.

| Vai trò | Nhóm menu |
|---|---|
| **Sở GD&ĐT** (Lãnh đạo, Chuyên viên, QTV Sở) | **Tổng quan**: Điều hành toàn tỉnh · Cảnh báo & trường cần hỗ trợ · **Mạng lưới trường**: Danh sách trường · So sánh trường/địa bàn · **Kế hoạch & chỉ tiêu**: Bộ chỉ số · Kế hoạch năm · Giao chỉ tiêu · Tiến độ · **Giám sát chất lượng**: Hoạt động STEM · Năng lực GV · Hiệu quả phòng/thiết bị · Chương trình & NCC · **Điều phối**: Nhiệm vụ & yêu cầu giải trình · Tập huấn & chuyên gia · **Báo cáo & dữ liệu**: Kỳ báo cáo · Báo cáo đã nộp · Xuất báo cáo · Chất lượng dữ liệu · **Thẩm định NCC** (nếu được giao) · **Quản trị**: Đơn vị · Tài khoản & vai trò · Cấu hình áp dụng cho cấp dưới · Nhật ký |
| **Trường** (BGH, QTV trường, Nhân viên thiết bị) | **Tổng quan**: Dashboard trường · Việc cần xử lý · **Kế hoạch & chương trình**: Chỉ tiêu được giao · Kế hoạch STEM năm/kỳ · Chương trình đăng ký · Phân bổ theo khối/tổ/GV · **Hoạt động**: Lịch hoạt động · Hoạt động & minh chứng · Duyệt cấp trường · **Nhân sự & lớp**: GV · HS · Lớp · Tổ chuyên môn · Phân công · **Phòng & thiết bị**: Phòng · Thiết bị · Đặt lịch & xung đột · Bảo trì/bảo hành · Đề xuất bổ sung · **Năng lực GV**: Nhu cầu · Tập huấn · Chứng chỉ · **Làm việc với Sở**: Nhiệm vụ được giao · Nộp báo cáo · Giải trình · **Đối tác NCC**: Chương trình đang triển khai · Cấp quyền NCC · Hỗ trợ · **Quản trị**: Tài khoản & vai trò · Module & biểu mẫu · Liên kết phụ huynh · Nhật ký |
| **Tổ/Khoa chuyên môn** (Tổ trưởng, Tổ phó) | **Tổng quan tổ** · **Kế hoạch chuyên môn**: Kế hoạch theo môn/khối · Phân công chủ đề/người phụ trách · **Rà soát & duyệt**: KHBD chờ duyệt · Minh chứng chờ duyệt · Đánh giá theo tiêu chí · **Học liệu tổ**: Thư viện tổ · Đề xuất học liệu NCC · **Báo cáo & năng lực**: Kết quả tổ · Nhu cầu tập huấn · Đề xuất với BGH |
| **Giáo viên** | **Hôm nay**: Lịch dạy/STEM/tập huấn · Việc đến hạn · **Bài dạy & học liệu**: KHBD của tôi · Thư viện (trường/tổ/NCC đã công bố) · **Hoạt động STEM**: Ghi nhận hoạt động · Đặt phòng/thiết bị · Minh chứng · **Lớp của tôi**: Danh sách & điểm danh · Nhiệm vụ/dự án · Tiến độ nhóm · **Đánh giá**: Chấm theo rubric · Nhận xét · Gửi phản hồi PH · **Hồ sơ chuyên môn**: Minh chứng · Tập huấn/chứng chỉ · Tự đánh giá |
| **Học sinh** | **Trang chủ** (lịch, nhiệm vụ, thông báo) · **Học liệu** · **Dự án STEM** (nhiệm vụ, nộp sản phẩm, nhận xét) · **Hồ sơ năng lực** (sản phẩm, kết quả, chứng nhận) |
| **Phụ huynh** | **Chọn con** (nếu nhiều con) · **Tổng quan học tập** · **Lịch & thông báo** · **Trao đổi với trường** · **Đăng ký hoạt động** · **Tài khoản & liên kết** (trạng thái xác minh) |
| **Nhà cung cấp** (QTV NCC, Chuyên gia/Trainer) | **Tổng quan** · **Hồ sơ NCC** (pháp nhân, năng lực, nhân sự) · **Danh mục sản phẩm/dịch vụ** · **Nội dung & học liệu** (phiên bản, gửi thẩm định) · **Hợp tác & triển khai** (nhu cầu tiếp nhận, trường tham gia, hợp đồng, lịch đào tạo) · **Chất lượng & hỗ trợ** (báo cáo triển khai trong phạm vi grant, ticket, phản hồi, cải tiến) |
| **QTV nền tảng** | Đơn vị cấp Sở · Module registry · Cấu hình mặc định · Giám sát hệ thống. **Mặc định không xem dữ liệu cá nhân HS.** |

---

## 3. Mô hình dữ liệu

### 3.1 Phân lớp dữ liệu
| Lớp | Ví dụ | Đặc điểm |
|---|---|---|
| Danh mục (master) | năm học, môn, loại hoạt động, chương trình | Có phạm vi (Sở/trường), mở rộng được theo cấu hình |
| Giao dịch/nghiệp vụ | kế hoạch, hoạt động, đặt phòng, bài nộp | Có `org_unit_id`, `academic_year_id`, trạng thái workflow, audit |
| Báo cáo | `report.metric_snapshot`, `report.submission` | Chốt theo kỳ, bất biến sau khi khóa, truy được nguồn |
| Tệp | `file.object` | Mức nhạy cảm, thời hạn lưu, quyền theo đối tượng gắn kèm |

**Nguyên tắc "lõi chuẩn + phần mở rộng":**
- Mọi bảng nghiệp vụ có **cột chuẩn có kiểu** (dùng tổng hợp lên Sở).
- Bảng nghiệp vụ có thêm `ext jsonb` cho trường bổ sung của từng đơn vị, được validate bằng `cfg.form_definition`.
- Báo cáo cấp tỉnh **chỉ đọc cột chuẩn**.

### 3.2 Thực thể chính

**Tổ chức & con người**
- `org.unit` (id, type: `SO|DON_VI_TRUC_THUOC|TRUONG|TO|...`, parent_id, code, name, ward/xã-phường, school_level, ownership_type, status)
- `org.unit_closure` (ancestor_id, descendant_id, depth): truy vấn cây con nhanh cho RLS
- `org.school_profile` (unit_id, quy mô, cơ sở vật chất, ext)
- `org.class` (id, school_id, academic_year_id, grade, name, homeroom_teacher_id)
- `iam.person` (id, họ tên, ngày sinh, giới tính, mã định danh nội bộ). **PII tách bảng riêng, có RLS chặt hơn.**
- `iam.account` (auth.users ↔ person)
- `org.staff_membership` (person, school, department, position, from/to)
- `org.student_enrollment` (person, class, from/to, status)
- `iam.guardian_link` (guardian_person, student_person, relation, status `PENDING|VERIFIED|REVOKED`, method, verified_by, verified_at, expires_at)

**Phân quyền**
- `iam.permission` (code `module.resource.action`, ví dụ `activity.evidence.approve`)
- `iam.role` (code, name, scope_kind, is_system, owner_unit_id → vai trò tùy chỉnh do trường tạo)
- `iam.role_permission` (role, permission)
- `iam.role_assignment` (id, account, role, scope_unit_id, scope_class_id?, valid_from/to, status)
- `iam.provider_grant` (provider_id, school_id, program_id?, contract_id, data_level `AGGREGATE|CLASS|NAMED`, valid_from/to, granted_by)

**Cấu hình & workflow**
- `cfg.module` (code, name, depends_on[])
- `cfg.setting` (unit_id, key, value jsonb, mode `MANDATORY|EXTEND|AUTONOMOUS`, version, effective_from, updated_by)
- `cfg.form_definition` (key, unit_id, base_def_id, version, schema jsonb, locked_fields[], status)
- `cfg.term_label` (unit_id, key, label)
- `wf.definition` (key, unit_id, base_def_id, version, states jsonb, transitions jsonb, params jsonb)
- `wf.instance` (id, definition_id+version, entity_type, entity_id, state, assignee_rule, due_at)
- `wf.step_log` (instance, actor_assignment, action, from_state, to_state, comment, at)
- `wf.directive` (nhiệm vụ / yêu cầu giải trình: from_unit, title, due_at) và `wf.directive_target` (unit, status, response)

**Nghiệp vụ STEM**
- `catalog.academic_year`, `catalog.term`, `catalog.subject`, `catalog.grade`, `catalog.activity_type`, `catalog.stem_program`, `catalog.rubric` + `rubric_criterion`
- `plan.indicator` (mã chỉ số, công thức → metric) · `plan.target_set` (Sở ban hành) · `plan.target_allocation` (unit, indicator, target_value)
- `plan.stem_plan` (unit [trường/tổ/GV], year, term, status, version) · `plan.plan_item` (chủ đề, môn, khối, người phụ trách, kỳ, số tiết dự kiến)
- `activity.lesson_plan` (KHBD, có phiên bản) · `activity.stem_activity` (plan_item, class, teacher, date, room, status) · `activity.evidence` (activity, file, type) · `activity.participation` (activity, student, status)
- `resource.room`, `resource.equipment_type`, `resource.equipment_unit`, `resource.booking` (resource, slot, requester, status, conflict_group), `resource.maintenance_ticket`
- `training.program`, `training.session`, `training.enrollment`, `training.certificate`
- `provider.provider`, `provider.member`, `provider.offering` + `offering_version`, `provider.review`, `provider.contract`, `provider.deployment` (provider × school × offering), `provider.support_ticket`, `provider.feedback`
- `assess.task` (bài tập/dự án, cá nhân/nhóm), `assess.group`, `assess.submission`, `assess.evaluation` (rubric scores, nhận xét, `visible_to_guardian`), `assess.portfolio_item`
- `portal.event`, `portal.registration`, `portal.thread` + `message`
- `report.metric` (định nghĩa: SQL view, đơn vị, cấp tổng hợp) · `report.metric_snapshot` (metric, unit, period, value, computed_at, source_hash) · `report.period` · `report.submission` (unit, period, template, status, payload, locked_at) · `report.dq_issue`
- `file.object` (bucket, path, owner_unit, sensitivity `PUBLIC|INTERNAL|PERSONAL|CHILD`, retention_until, checksum)
- `audit.log` (at, actor_account, active_assignment, action, entity, entity_id, diff_masked, ip_hash)

### 3.3 Sơ đồ quan hệ lõi (Phase 1)

```mermaid
erDiagram
  ORG_UNIT ||--o{ ORG_UNIT : "cha-con"
  ORG_UNIT ||--o{ CLASS : "trường có lớp"
  ORG_UNIT ||--o{ ROLE_ASSIGNMENT : "phạm vi"
  ROLE ||--o{ ROLE_ASSIGNMENT : ""
  ROLE ||--o{ ROLE_PERMISSION : ""
  ACCOUNT ||--o{ ROLE_ASSIGNMENT : "nhiều vai trò"
  PERSON ||--|| ACCOUNT : ""
  PERSON ||--o{ STUDENT_ENROLLMENT : ""
  CLASS ||--o{ STUDENT_ENROLLMENT : ""
  PERSON ||--o{ GUARDIAN_LINK : "phụ huynh"
  PERSON ||--o{ GUARDIAN_LINK : "học sinh"
  TARGET_SET ||--o{ TARGET_ALLOCATION : "giao cho trường"
  ORG_UNIT ||--o{ STEM_PLAN : ""
  STEM_PLAN ||--o{ PLAN_ITEM : ""
  PLAN_ITEM ||--o{ STEM_ACTIVITY : ""
  CLASS ||--o{ STEM_ACTIVITY : ""
  STEM_ACTIVITY ||--o{ EVIDENCE : ""
  EVIDENCE }o--|| FILE_OBJECT : ""
  WF_INSTANCE ||--o{ WF_STEP_LOG : ""
  STEM_PLAN ||--o| WF_INSTANCE : "trạng thái duyệt"
  STEM_ACTIVITY ||--o| WF_INSTANCE : ""
  REPORT_PERIOD ||--o{ REPORT_SUBMISSION : ""
  ORG_UNIT ||--o{ REPORT_SUBMISSION : ""
  ORG_UNIT ||--o{ CFG_SETTING : "cấu hình theo tầng"
```

---

## 4. Ma trận phân quyền & phạm vi dữ liệu

### 4.1 Cơ chế
- **Quyền = vai trò × phạm vi × quan hệ.** Hàm dùng chung `iam.can(permission, target_unit_id)` trả true khi **assignment đang hoạt động** có permission đó **và** `target_unit_id` nằm trong cây con của `scope_unit_id`. Các quan hệ đặc biệt có hàm riêng: `iam.teaches(class_id)`, `iam.is_guardian_of(student_id)` (chỉ khi `VERIFIED`), `iam.provider_can(school_id, program_id, level)`.
- **Ngữ cảnh làm việc chống trộn quyền:** một người có thể có nhiều `role_assignment`. Khi đăng nhập hoặc đổi ngữ cảnh, user chọn **một** assignment. Lựa chọn này được ghi vào JWT bằng claim `active_assignment_id` (qua Custom Access Token Hook của Supabase). RLS **chỉ** xét assignment đó. Đổi ngữ cảnh là refresh token. Audit ghi kèm assignment.
- **Kiểm tra ở DB (RLS + RPC)**. Frontend ẩn menu chỉ để trải nghiệm tốt hơn, không phải lớp bảo mật.
- **Dữ liệu trẻ em:** bảng PII và tệp có `sensitivity=CHILD` cần quyền riêng `*.personal.read`. Mặc định Sở và NCC **chỉ thấy số liệu tổng hợp**. Tổng hợp có ngưỡng ẩn nhóm nhỏ (ví dụ < 5 HS) để tránh suy ra cá nhân.

### 4.2 Vai trò × module

Ký hiệu: **V** xem · **C** tạo · **U** sửa · **A** duyệt/trả lại · **X** xuất · **M** quản trị/cấu hình · Σ chỉ số tổng hợp · — không có quyền

| Module \ Vai trò | Sở (LĐ/CV) | QTV Sở | BGH | QTV trường | Tổ trưởng | GV | HS | PH | NCC |
|---|---|---|---|---|---|---|---|---|---|
| Tổ chức/đơn vị | V | M | V | M (trong trường) | V (tổ) | V | — | — | V (trường được grant) |
| Tài khoản & vai trò | V | M | V | M (trong trường) | V (tổ) | V (mình) | V (mình) | V (mình) | M (thành viên NCC) |
| Cấu hình module/biểu mẫu | V | M (MANDATORY) | V | M (trong giới hạn) | V | — | — | — | — |
| Chỉ tiêu & bộ chỉ số | C U A X | M | V (của trường) + tiếp nhận | V | V | — | — | — | — |
| Kế hoạch STEM | V X (Σ + từng trường) | V | C U **A** X | V | C U **A** (tổ) | C U (phần được giao) | — | — | V (Σ phần chương trình của mình) |
| Hoạt động & minh chứng | V Σ, xem mẫu minh chứng | V | V **A** X | V | V **A** | C U (lớp mình dạy) | V (lớp mình) | V (của con, đã duyệt) | V Σ / CLASS theo grant |
| Phòng & thiết bị | V Σ | — | V A | M | V | C (đặt lịch) | — | — | V (thiết bị NCC cung cấp), xử lý ticket |
| Đánh giá/rubric | V Σ | — | V | V | V A (tiêu chí tổ) | C U | V (của mình) | V (của con, khi GV công bố) | — |
| Nhiệm vụ/dự án HS | — | — | V | — | V | C U | V + nộp bài | V (của con) | — |
| Báo cáo định kỳ | C (mở kỳ) **A** X | M (mẫu) | C U **A** (ký nộp) X | C U | C (phần tổ) | — | — | — | C (báo cáo triển khai) |
| Giao nhiệm vụ/giải trình | C A | — | V + phản hồi, giao xuống | V | V + phản hồi | V + phản hồi | — | — | V + phản hồi (nếu được giao) |
| NCC: sản phẩm/học liệu | **A** (thẩm định) | — | V (đã công bố) + đăng ký | V | V + đề xuất | V | V (nếu được gán) | — | C U (gửi duyệt) |
| NCC: hợp đồng/grant | V | — | C U A | M | — | — | — | — | V (của mình) |
| Liên kết PH–HS | — | — | V | **A** (xác minh) | — | A (nếu là GVCN, tùy cấu hình) | — | C (yêu cầu) | — |
| Trao đổi PH–trường | — | — | V | — | — | C U (lớp mình) | — | C U | — |
| Audit log | V (Sở) | V | V (trường) | V (trường) | — | — | — | — | — |
| Xuất dữ liệu cá nhân | — mặc định | — | X (ghi audit) | X (ghi audit) | — | X (lớp mình) | — | — | — |

### 4.3 Phạm vi dữ liệu theo vai trò
| Vai trò | `scope_kind` | Đọc bản ghi khi |
|---|---|---|
| Sở | `UNIT_SUBTREE` | record.unit ∈ cây con của Sở; PII HS: không (chỉ Σ) |
| BGH / QTV trường | `UNIT_SUBTREE` (trường) | record.unit ∈ trường |
| Tổ trưởng | `UNIT_SUBTREE` (tổ) | record.department = tổ, hoặc GV thuộc tổ |
| GV | `TEACHING` | lớp được phân công dạy/chủ nhiệm, hoặc bản ghi do mình tạo |
| HS | `SELF` | person_id = mình |
| PH | `LINKED` | student ∈ guardian_link VERIFIED, còn hạn; chỉ field đánh dấu "PH xem được" |
| NCC | `GRANT` | school/program ∈ provider_grant còn hiệu lực; mức AGGREGATE/CLASS/NAMED |

**Bộ test bắt buộc:** pgTAP sinh ma trận *(vai trò × bảng × thao tác)* trên dữ liệu seed và khẳng định cả kết quả **cho phép** lẫn **từ chối**, ví dụ PH của HS A không đọc được HS B, NCC hết hạn grant không đọc được gì.

---

## 5. Workflow nghiệp vụ quan trọng

Tất cả chạy trên một **workflow engine dùng chung** (`wf`): định nghĩa máy trạng thái có phiên bản, mỗi bước kiểm quyền và ghi `step_log` + audit + thông báo.

| Mã | Workflow | Luồng chính | Ghi chú cấu hình |
|---|---|---|---|
| **W1** | Chỉ tiêu Sở → Trường | Sở soạn bộ chỉ số → **Ban hành** → giao chỉ tiêu cho trường → trường **Tiếp nhận** (hoặc kiến nghị điều chỉnh) → theo dõi tiến độ tự động từ metric | Chỉ số, công thức và hạn do Sở đặt (MANDATORY) |
| **W2** | Kế hoạch STEM trường | Nháp → (Tổ rà soát) → BGH **Duyệt**, hoặc **Trả lại** kèm góp ý → Hiệu lực → Điều chỉnh tạo phiên bản mới | Trường được bật/tắt bước "Tổ rà soát" và số cấp duyệt |
| **W3** | Hoạt động & minh chứng | GV ghi nhận → Đã thực hiện → nộp minh chứng → Tổ **Duyệt** hoặc **Yêu cầu bổ sung** → Được tính vào báo cáo | Trường định nghĩa loại minh chứng bắt buộc thêm; Sở khóa tối thiểu |
| **W4** | Đặt phòng/thiết bị | GV đăng ký → hệ thống phát hiện **xung đột** (cùng phòng/slot) → QTV/BGH chọn ưu tiên, các đơn còn lại tự **Từ chối** kèm gợi ý slot trống → Xác nhận → Check-in/trả thiết bị | Quy tắc ưu tiên cấu hình được |
| **W5** | Báo cáo định kỳ | Sở mở kỳ (mẫu, hạn) → hệ thống **điền sẵn** từ metric → trường bổ sung/giải trình → BGH ký nộp → Sở **Chấp nhận** hoặc **Yêu cầu giải trình** → Khóa (snapshot bất biến) | Trường quá hạn tự vào danh sách cảnh báo |
| **W6** | Nhiệm vụ & giải trình | Sở/BGH giao (đối tượng, hạn, yêu cầu) → đơn vị nhận phản hồi + minh chứng → bên giao **Đóng** hoặc **Mở lại** | Nhắc hạn theo SLA |
| **W7** | NCC: thẩm định → triển khai | NCC tạo sản phẩm/học liệu → **Gửi thẩm định** → hội đồng (Sở hoặc trường, tùy cấu hình) Duyệt/Trả lại → **Công bố** (phạm vi) → trường đăng ký → hợp đồng + **grant dữ liệu** → triển khai → NCC báo cáo kết quả → trường/Sở đánh giá chất lượng | Bất kỳ phiên bản mới nào cũng phải thẩm định lại |
| **W8** | Liên kết Phụ huynh–HS | Trường phát **mã mời một lần** gắn với HS → PH đăng ký và nhập mã → xác minh lớp 2 (OTP tới SĐT đã có trong hồ sơ HS, **hoặc** GVCN/QTV duyệt) → VERIFIED (có hạn) → thu hồi khi chuyển trường hoặc theo yêu cầu | Cần quyết định phương thức (xem mục 8) |
| **W9** | Dự án HS & đánh giá | GV giao (cá nhân/nhóm, rubric, hạn) → HS nộp (nhiều lần, có phiên bản) → GV chấm rubric + nhận xét → **Công bố** → HS/PH xem → đưa vào hồ sơ năng lực | Nhận xét chỉ hiện với PH khi GV bật `visible_to_guardian` |

Sơ đồ trạng thái mẫu (W2/W3):

```
NHÁP ──gửi──► CHỜ_TỔ_DUYỆT ──duyệt──► CHỜ_BGH_DUYỆT ──duyệt──► ĐÃ_DUYỆT ──điều chỉnh──► (phiên bản mới: NHÁP)
  ▲               │ trả lại                 │ trả lại
  └───────────────┴─────────────────────────┘          (bước CHỜ_TỔ_DUYỆT có thể tắt theo cấu hình trường)
```

---

## 6. Phương án tùy chỉnh theo trường

### 6.1 Kế thừa cấu hình
```
Nền tảng (mặc định) → Sở → Đơn vị trực thuộc (nếu có) → Trường → Tổ/nhóm
```
Hàm `cfg.effective(unit_id, key)` đi từ gốc xuống:
- **MANDATORY** ở tầng trên: dừng, cấp dưới không ghi đè được (DB chặn bằng trigger, không chỉ chặn ở UI).
- **EXTEND**: hợp nhất. Cấp dưới được *thêm* phần tử, không được *xóa* phần tử bị khóa.
- **AUTONOMOUS**: cấp dưới thay hoàn toàn trong miền giá trị cho phép.

Mọi thay đổi tạo **phiên bản mới**, ghi người sửa, ngày hiệu lực và xem được lịch sử/diff. Bản ghi nghiệp vụ lưu `def_version` mà nó đã dùng.

### 6.2 Bốn trục tùy chỉnh (MVP → nâng cao)

| Trục | MVP (Phase 1) | Nâng cao (Phase 4) |
|---|---|---|
| **Module** | Bật/tắt module và module con theo đơn vị; kiểm phụ thuộc (tắt `resource` thì ẩn "Đặt phòng" ở GV) | Gói module theo hợp đồng/giấy phép |
| **Biểu mẫu** | Form = **form gốc của Sở** (trường chuẩn bị khóa) + **trường bổ sung** của trường (text, số, ngày, chọn, nhiều lựa chọn, tệp, bắt buộc/không) lưu vào `ext jsonb`; một **renderer** dùng chung cho mọi form | Form builder kéo-thả, điều kiện hiển thị, công thức |
| **Quy trình** | Tham số hóa workflow mẫu: bật/tắt bước, chọn người duyệt theo **chức vụ**, SLA, nhắc hạn; trạng thái lõi do Sở khóa | Workflow builder trực quan, rẽ nhánh điều kiện |
| **Báo cáo/KPI** | **Metric registry** do Sở/nền tảng định nghĩa trên cột chuẩn; mẫu báo cáo bắt buộc của Sở; trường chọn KPI hiển thị trên dashboard của mình và đặt chỉ tiêu nội bộ | Dashboard builder, KPI tự định nghĩa từ trường mở rộng (chỉ dùng nội bộ trường) |
| *(Kèm theo)* Danh mục & thuật ngữ | Danh mục EXTEND (Sở có danh sách loại hoạt động, trường thêm loại riêng); đổi nhãn "Tổ" ↔ "Khoa", "Hoạt động" ↔ "Chuyên đề" | Đa ngôn ngữ |

**Ràng buộc then chốt:** dữ liệu ở trường mở rộng **không bao giờ** đi vào báo cáo cấp tỉnh. Nhờ vậy trường được linh hoạt mà Sở vẫn tổng hợp được.

---

## 7. Roadmap MVP *(v0.1 — đã thay bằng V2.6)*

Ước lượng giả định 1 dev full-stack + Claude, làm theo lát cắt dọc. Mỗi milestone kết thúc với **build + lint + test xanh**, có seed demo và docs cập nhật.

| MS | Tên | Phạm vi chính | Tiêu chí nghiệm thu |
|---|---|---|---|
| **M0** (≈1 tuần) | Khởi tạo | Repo mới, cấu trúc thư mục, Supabase local (CLI), migration nền, CI (lint/typecheck/test/pgTAP), Vitest + Playwright, design system tiếng Việt (tái dùng `components/ui`), app shell responsive, khung `docs/*` | `npm run build/lint/test` xanh trên CI; `supabase db reset` dựng DB + seed; shell hiển thị đúng ở 375px và 1440px |
| **M1** (≈2–3 tuần) | Tổ chức · IAM · Audit · Module | `org` (cây + closure), `iam` (vai trò hệ thống, permission registry, assignment, **chọn/đổi ngữ cảnh**), RLS helpers, `audit` trigger, `cfg.module` bật/tắt + **menu động**, màn quản trị đơn vị/tài khoản/vai trò (lưới quyền), seed kịch bản demo | Test RLS: 7 vai trò × bảng lõi, cả cho phép và từ chối; người có 2 vai trò không thấy dữ liệu của vai trò kia khi đổi ngữ cảnh; tắt module ở trường X thì menu và RPC của trường X bị chặn, trường Y không ảnh hưởng; mọi thay đổi quyền có audit |
| **M2** (≈2 tuần) | Danh mục · Nhân sự · Import/Export | Năm học/kỳ, khối, môn, loại hoạt động; tổ, lớp, GV, HS, phân công; **import Excel** có preview + báo lỗi theo dòng + rollback; export; kiểm tra chất lượng dữ liệu cơ bản | Import 1.000 HS có 5% lỗi: báo đúng dòng/cột, không ghi phần lỗi; export chỉ chứa dữ liệu trong phạm vi; trùng mã bị chặn |
| **M3** (≈3 tuần) | Kế hoạch · Hoạt động · Minh chứng · Duyệt | `wf` engine; W2, W3; KHBD; minh chứng (Storage, signed URL, giới hạn loại/kích thước); thông báo in-app; **form gốc + trường bổ sung** cho Hoạt động | Luồng Nháp → Tổ → BGH → Duyệt/Trả lại chạy đủ, có lịch sử; trường A tắt bước Tổ, trường B giữ, cả hai hoạt động đúng; trường thêm 2 field riêng mà báo cáo Sở không đổi; tệp minh chứng không truy cập được qua URL khi không có quyền |
| **M4** (≈3 tuần) | Chỉ tiêu · Dashboard · Báo cáo | W1, W5, W6; metric registry + snapshot; **Dashboard trường** và **Dashboard Sở** (bộ lọc địa bàn/cấp học/năm học, drill-down Sở → trường → hoạt động, khối "Việc cần làm"); xuất Excel/PDF; danh sách cảnh báo trường thiếu dữ liệu/chưa đạt | Số liệu dashboard Sở = tổng từ dữ liệu trường (test đối soát); báo cáo đã khóa không đổi khi dữ liệu nguồn sửa; trạng thái rỗng/lỗi/loading đầy đủ |
| **M5** (≈2 tuần) | Phòng & thiết bị | Phòng, thiết bị, kiểm kê, W4 đặt lịch + xung đột, bảo trì | 2 đơn trùng slot được gom vào nhóm xung đột; duyệt 1 thì đơn còn lại tự từ chối kèm thông báo |
| **— Hết Phase 1 (MVP) —** | | | **Demo xuyên suốt**: Sở giao chỉ tiêu → trường lập KH → tổ duyệt → GV ghi hoạt động + minh chứng → BGH nộp báo cáo → Sở xem dashboard & yêu cầu giải trình |
| **M6** (≈3–4 tuần) | Nhà cung cấp (Phase 2) | Hồ sơ NCC, sản phẩm/học liệu có phiên bản, W7 thẩm định–công bố, hợp đồng, **provider_grant**, báo cáo triển khai, ticket hỗ trợ, phản hồi; tập huấn GV (`training`) | NCC chỉ thấy trường/chương trình được grant; hết hạn grant thì mất quyền ngay; mức AGGREGATE không lộ tên HS |
| **M7** (≈3–4 tuần) | HS & Phụ huynh (Phase 3) | Tài khoản HS, W8 liên kết PH, W9 dự án/đánh giá, hồ sơ năng lực, lịch, sự kiện + đăng ký, trao đổi PH–GV | PH chưa VERIFIED không xem được gì; PH có 2 con chuyển qua lại không lẫn dữ liệu; nhận xét chưa công bố không hiện với PH |
| **M8+** | Nâng cao (Phase 4) | Form/workflow/dashboard builder, cảnh báo bất thường, trợ lý AI có trích nguồn và kiểm quyền, tích hợp ngoài (CSDL ngành, SSO VNeID…) | Theo đặc tả riêng |

---

## 8. Điểm chưa rõ, giả định và quyết định cần xác nhận

### 8.1 Quyết định cần anh/chị chốt trước M0
| # | Quyết định | Khuyến nghị |
|---|---|---|
| **D1** | Stack: Supabase-centric (A) hay NestJS + Postgres (B) | **A**, giữ đồng bộ với hệ sinh thái hiện có |
| **D2** | Repo: tạo repo mới (ví dụ `da-kdi/stem-platform`) hay đặt vào `supabase-checker` | **Repo mới + Supabase project mới**, tách dữ liệu HS khỏi dữ liệu kinh doanh STEM TOWN |
| **D3** | Router: TanStack Router hay React Router | **TanStack Router** (type-safe, đã dùng ở repo gốc) |
| **D4** | Mức truy cập của Sở vào dữ liệu cá nhân HS | Chỉ số liệu tổng hợp; xem danh sách có tên phải qua quyền đặc biệt và được ghi audit |
| **D5** | Phương thức xác minh phụ huynh | Mã mời một lần do trường phát + OTP tới SĐT có sẵn trong hồ sơ; GVCN duyệt là phương án dự phòng |
| **D6** | Mức dữ liệu mặc định cho NCC | AGGREGATE; CLASS/NAMED chỉ khi hợp đồng ghi rõ và trường cấp |
| **D7** | Hosting & nơi lưu dữ liệu | Cần tư vấn pháp lý về bảo vệ dữ liệu cá nhân (Nghị định 13/2023 và Luật Bảo vệ dữ liệu cá nhân) nếu dùng Supabase cloud đặt ngoài Việt Nam; có thể cần self-host Supabase tại VN cho bản production |

### 8.2 Giả định (sẽ áp dụng nếu không có ý kiến khác)
1. **Tỉnh thí điểm** và dữ liệu demo đều **hư cấu** (ví dụ "Sở GD&ĐT tỉnh Demo"), không dùng tên trường/người thật.
2. **Cấu trúc tổ chức:** Sở → Trường → Tổ → Lớp. **Xã/phường** là thuộc tính địa bàn để lọc và xếp hạng, **không** phải cấp quản lý. Cấp "đơn vị trực thuộc" để tùy chọn qua cấu hình. *(Cần xác nhận cấp quản lý trường MN/TH/THCS sau khi sắp xếp chính quyền 2 cấp: Sở hay UBND xã.)*
3. Chỉ dùng **một năm học hiện hành**; dữ liệu theo năm học, chuyển năm bằng thao tác "kết chuyển".
4. MVP chưa tích hợp hệ thống ngoài. Nhân sự/HS nhập qua **Excel** theo mẫu do hệ thống phát hành.
5. Đăng nhập email/mật khẩu + OTP; tài khoản HS do trường cấp; SSO VNeID để Phase 4.
6. Không xây LMS đầy đủ (bài giảng tương tác, game học tập như hệ thống tham khảo). MVP chỉ quản lý KHBD, học liệu dạng tệp/liên kết và minh chứng.
7. Thời khóa biểu đầy đủ nằm ngoài MVP; chỉ có **lịch hoạt động STEM** và đặt phòng.

### 8.3 Câu hỏi nghiệp vụ còn mở (không chặn M0–M1)
1. **Danh sách chỉ số/KPI** cấp tỉnh và công thức chính thức? (Video có "Tỷ lệ triển khai STEM", "Bao phủ STEM", "STEM Index"… nhưng tôi không bịa công thức.)
2. **CT1–CT5** trong hệ thống tham khảo là phân loại do Bộ/Sở ban hành hay phân loại riêng của họ? Ta có cần phân loại chương trình STEM tương tự không?
3. **Mẫu báo cáo bắt buộc** gửi Sở/Bộ: anh/chị có văn bản mẫu (thông tư/công văn, biểu mẫu Excel) để chuẩn hóa không?
4. Hội đồng **thẩm định học liệu NCC** thuộc Sở, trường hay cả hai?
5. **Thời hạn lưu** minh chứng/tệp ảnh-video của HS? Giới hạn dung lượng mỗi trường?
6. Kênh thông báo ngoài in-app: email, Zalo OA hay SMS? (Ảnh hưởng chi phí.)
7. KDI vừa là **nhà cung cấp** vừa là **đơn vị vận hành nền tảng**? Nếu vậy cần tách vai trò để KDI-NCC không có quyền quản trị dữ liệu trường.
8. Có yêu cầu **ký số** cho báo cáo nộp Sở không?
9. Tên/thương hiệu sản phẩm?

---

## 9. Việc tôi sẽ làm đầu tiên khi được duyệt (M0)
1. Tạo repo mới theo D2, khởi tạo Vite + React 19 + TS + Tailwind 4 với **đúng phiên bản** đang dùng ở `stemtown-preview`.
2. Port `components/ui/*` và các thành phần data (chart-kit, kpi, filters, data-table) đã chuẩn hóa, bỏ phần đặc thù STEM TOWN.
3. Supabase CLI local; migration `org`/`iam`/`audit` khung; pgTAP; seed kịch bản demo (1 Sở, 3 trường, mỗi trường 2 tổ, 6 GV, 4 lớp, 40 HS, 10 PH đã xác minh + 2 đang chờ, 1 NCC có grant 2 trường).
4. CI GitHub Actions: lint (oxlint) · typecheck · Vitest · pgTAP · build.
5. Viết `docs/MODULE_MAP.md`, `DATA_MODEL.md`, `PERMISSION_MATRIX.md`, `WORKFLOWS.md`, `DECISIONS.md` (ADR-001: chọn stack; ADR-002: ngữ cảnh vai trò qua JWT claim) từ nội dung tài liệu này.
