# Quyết định kiến trúc (ADR) & giả định

## ADR-001 · Supabase-centric modular monolith
- **Bối cảnh:** hệ sinh thái hiện có (stemtown-preview) dùng React + Vite + Supabase. Bài toán cần phân quyền theo phạm vi dữ liệu rất chặt.
- **Quyết định:** Supabase (Postgres + Auth + Storage). Mỗi module một schema; ghi qua RPC `security definer`; đọc qua RLS. Không dùng microservices.
- **Hệ quả:** bảo mật nằm ở DB nên đúng cả khi frontend lỗi. Logic workflow phức tạp viết bằng plpgsql/Edge Function và cần test DB kỹ (đã có harness).
- **Trạng thái:** áp dụng mặc định vì chưa nhận phản hồi khác (D1).

## ADR-002 · Ngữ cảnh vai trò qua JWT claim
- **Quyết định:** người nhiều vai trò chọn một `role_assignment`; `iam.switch_context` lưu vào `iam.account.current_assignment_id`; Custom Access Token Hook đưa `active_assignment_id` vào JWT; `iam.ctx()` kiểm lại assignment thuộc `auth.uid()` và còn hiệu lực.
- **Lý do:** RLS chỉ xét **một** ngữ cảnh nên quyền không bị trộn. Claim giả mạo không có tác dụng.

## ADR-003 · Bản phản chiếu TS của RLS + test đối chiếu + chế độ demo
- **Quyết định:** `src/domain/access.ts` và `config.ts` tái hiện các hàm `iam.can_see_*` và `cfg.effective`. Test `supabase/tests/rls.test.ts` chạy **mọi ngữ cảnh demo** trên Postgres thật và so sánh từng tập đơn vị/lớp/người/dữ liệu cá nhân với bản TS.
- **Lý do:** (1) bản demo chạy được trên hosting tĩnh để duyệt UX với các bên; (2) menu/nút ở UI khớp đúng với quyền thật; (3) sửa một bên mà quên bên kia thì CI báo đỏ.
- **Lưu ý:** bảo mật thật luôn ở Postgres. M1b sẽ gom hợp đồng công khai vào schema `api` để không phơi schema nội bộ qua PostgREST.

## ADR-004 · Một nguồn chân lý cho quyền & dữ liệu demo
- `permissions.ts`, `roles.ts`, `demo/seed.ts` → `npm run gen:seed` → `supabase/seed.sql`; → `npm run gen:docs` → `docs/PERMISSION_MATRIX.md`. Hai test đồng bộ chặn việc sửa tay.

## ADR-005 · Cấu hình kế thừa 3 chế độ, khóa ở DB
- MANDATORY / EXTEND / AUTONOMOUS. Khóa thực thi bằng trigger (kể cả với service role), có version và lịch sử. Mặc định module = bật.

## ADR-006 · PII tách bảng, audit không lưu giá trị PII
- `iam.person_private` có RLS riêng (`org.person.personal`). Trigger audit trên bảng PII chỉ ghi **tên cột** thay đổi.

## ADR-007 · Hash router
- Dùng `createHashHistory` để bản demo chạy trên GitHub Pages không cần rewrite. Có thể đổi sang browser history khi tự host.

## ADR-008 · Thay `xlsx@0.18.5`
- Bản trên npm còn lỗ hổng đã công bố. Import/export Excel (M2) sẽ dùng `exceljs` hoặc bản SheetJS đã vá.
- ✅ **M2c-1:** dùng `exceljs@4.4.0`, tải động (chunk riêng, không vào bundle chính); ép `uuid ^11.1.1` qua `overrides` để hết cảnh báo audit (0 lỗ hổng). Tệp tối đa 5 MB / 5000 dòng; nhận cả `.csv`.
- **Định dạng trao đổi:** dòng 1 = tên kỹ thuật QĐ 2768 (`maHocSinh`, `hoTenNh`, `gioiTinh`…), dòng 2 tùy chọn = tên nghiệp vụ; giới tính theo ISO/IEC 5218 (1/2). Nhập **tất cả hoặc không**: kiểm tra toàn tệp, báo lỗi theo dòng/cột, chỉ ghi khi không còn lỗi.

## ADR-009 · Cấu trúc 14 phân hệ × 5 tầng × 5 bước đề án (v0.2)
- **Bối cảnh:** hình kiến trúc ghi 14 phân hệ; hình phân hệ có 13 ô (1–8, 0.1–0.5); quy trình đề án 5 bước.
- **Quyết định:** registry `src/domain/modules.ts` là nguồn chân lý. Bổ sung **Phân hệ 0 · Định hướng & kế hoạch đề án** làm phân hệ thứ 14 để phủ Bước 1–2. Nhà cung cấp và Phụ huynh là vai trò tham gia, không phải phân hệ. Menu, quyền và cấu hình bật/tắt đều theo phân hệ.
- **Trạng thái:** ✅ **Đã chấp nhận 16/10/2026.**

## ADR-010 · Áp dụng Từ điển dữ liệu dùng chung ngành GDĐT (QĐ 2768/QĐ-BGDĐT)
- **Quyết định:** nạp nguyên văn 41 miền + 892 thuật ngữ vào DB. Cột nội bộ giữ `snake_case`; mọi trao đổi dữ liệu dùng **tên kỹ thuật chuẩn**. Ánh xạ trong `mapping.ts`, có test đảm bảo mã BG tồn tại. Bảng mới bắt buộc khai báo ánh xạ.
- **Lý do:** không đổi tên cột hàng loạt (rủi ro, camelCase phải trích dẫn trong Postgres), nhưng vẫn đúng chuẩn ở mọi điểm giao tiếp.
- **Giới hạn:** văn bản chưa có danh sách giá trị cho kiểu danh mục; giá trị lấy từ CSDL ngành của Bộ (ADR-013), trong lúc chờ dùng giá trị nội bộ + trạng thái PARTIAL.

## ADR-011 · Phân hệ 6 hoạt động ngoại tuyến (PWA)
- Điểm danh và nhật ký buổi dạy ghi vào IndexedDB, mỗi bản ghi có id do client sinh (UUID). Đồng bộ qua RPC idempotent khi có mạng; xung đột giải theo "bản ghi của giáo viên phụ trách thắng" và ghi nhật ký. Triển khai ở M7.

## ADR-012 · Kho phân tích & tác vụ nền
- Kho phân tích: schema `dw` (star schema), nạp theo lịch từ các schema nghiệp vụ, **chỉ chứa số liệu tổng hợp hoặc mã hóa**, phục vụ Power BI và dashboard Sở. Tác vụ nền: `pg_cron` + Edge Functions (thông báo, sinh báo cáo, đồng bộ). Triển khai M8–M9.

## ADR-013 · Danh mục giá trị chuẩn lấy từ CSDL ngành của Bộ GD&ĐT
- **Bối cảnh:** QĐ 2768 định nghĩa thuật ngữ nhưng không ban hành danh sách giá trị cho kiểu Enumeration (cấp học, loại hình CSGD, khối, môn học, trạng thái người học, chức vụ, dân tộc, tỉnh/xã…).
- **Quyết định (16/10/2026):** nguồn danh mục duy nhất là **CSDL ngành của Bộ**. Thiết kế (M2):
  - `catalog.code_list` (mã danh mục, thuật ngữ BG gắn kèm, nguồn `CSDL_NGANH`, phiên bản, thời điểm đồng bộ) và `catalog.code_value` (mã, tên, hiệu lực từ/đến, ngừng dùng).
  - `catalog.value_map`: quy đổi giá trị nội bộ ↔ mã chuẩn, từng cột. Khi đủ quy đổi, trạng thái ánh xạ chuyển PARTIAL → EXACT.
  - Nạp danh mục bằng file xuất từ CSDL ngành (M2). Đồng bộ tự động qua phân hệ 0.3 khi có quyền kết nối (M9).
  - Danh mục chỉ đọc với trường/Sở; chỉ QTV nền tảng nạp phiên bản mới; mọi lần nạp đều ghi nhật ký.
- **Cần chuẩn bị:** file danh mục xuất từ CSDL ngành, hoặc thông tin kết nối/tài khoản do Sở cung cấp.

## ADR-014 · Liên kết phụ huynh bằng mã mời + đối chiếu SĐT (thực hiện D5, M2c-2)
- **Quyết định:** trường phát mã 8 ký tự (bảng chữ không gây nhầm, CSPRNG), dùng một lần, hạn 14 ngày; DB chỉ lưu SHA-256, cột băm không cấp quyền đọc. PH nhập mã: SĐT của tài khoản PH (đã xác thực OTP khi đăng nhập bằng Supabase phone auth — M1b) khớp SĐT trường ghi trên mã → `VERIFIED/INVITE_OTP`; không khớp/không có → `PENDING`, QTV trường duyệt (`TEACHER_APPROVAL`). Liên kết hết hạn 31/8 cuối năm học; chuyển trường/tốt nghiệp → trigger thu hồi mọi liên kết và mã chưa dùng.
- **Chống dò mã:** sai 5 lần/24 giờ → khóa; lần sai ghi `LINK_CODE_FAIL` vào audit (RPC trả `{error}` thay vì raise để giữ dòng nhật ký).
- **Tối thiểu dữ liệu:** PH chỉ thấy tên con khi liên kết đã xác minh và còn hạn; trường thấy tên PH qua RPC `iam.guardian_links_for_approver()` (không mở RLS `iam.person`).
- **Hoãn:** GVCN duyệt thay QTV (cần thêm quyền theo lớp chủ nhiệm); gửi OTP SMS riêng cho bước liên kết — chưa cần vì tài khoản PH đã xác thực SĐT.

---

## Giả định đang áp dụng (chờ xác nhận)

| # | Nội dung | Mặc định đang dùng |
|---|---|---|
| D1 | Stack | Supabase (ADR-001) |
| D2 | Repo & Supabase project | Repo `da-kdi/hethongkhaosatstem`; Supabase project **mới**, tách khỏi STEM TOWN |
| D3 | Router | TanStack Router |
| D4 | Sở xem dữ liệu cá nhân HS | Không, chỉ số liệu tổng hợp (đã thực thi trong RLS) |
| D5 | Xác minh phụ huynh | Mã mời một lần + OTP tới SĐT trong hồ sơ; GVCN/QTV duyệt là dự phòng |
| D6 | Mức dữ liệu NCC | Mặc định AGGREGATE; CLASS/NAMED khi hợp đồng ghi rõ (đã thực thi trong RLS) |
| D7 | Nơi lưu dữ liệu | **Chưa chốt.** Cần tư vấn tuân thủ bảo vệ dữ liệu cá nhân trước khi có dữ liệu thật |
| — | Cấu trúc | Sở → (đơn vị trực thuộc, tùy chọn) → Trường → Tổ → Lớp; xã/phường là thuộc tính |
| — | Dữ liệu demo | Hư cấu: tỉnh "An Hòa", 3 trường, 2 NCC |

## Câu hỏi mở
- **(M2b)** Học sinh đã chuyển trường/tốt nghiệp: hiện trường cũ **mất quyền xem** hồ sơ ngay khi đổi trạng thái (theo nguyên tắc tối thiểu dữ liệu). Có cần cho BGH/QTV trường cũ xem lại hồ sơ đã rời trường trong một thời hạn (ví dụ để báo cáo cuối năm) không?
- ✅ **(v0.2, đã trả lời 16/10)** Thêm "Phân hệ 0 · Định hướng & kế hoạch đề án" làm phân hệ thứ 14: **đồng ý**.
- ✅ **(v0.2, đã trả lời 16/10)** Đưa Khảo sát lên ngay sau M2: **không**, giữ lộ trình theo 5 bước (M4).
- ✅ **(v0.2, đã trả lời 16/10)** Danh mục giá trị chuẩn: **CSDL ngành của Bộ** (ADR-013). Còn cần: file danh mục hoặc quyền kết nối.
1. Bộ chỉ số/KPI cấp tỉnh và công thức chính thức.
2. Phân loại chương trình STEM (hệ thống tham khảo dùng "CT1–CT5", chưa rõ nguồn).
3. Mẫu báo cáo bắt buộc gửi Sở/Bộ.
4. Hội đồng thẩm định học liệu NCC thuộc Sở, trường hay cả hai.
5. Thời hạn lưu minh chứng/ảnh/video HS; hạn mức dung lượng.
6. Kênh thông báo ngoài in-app (email, Zalo OA, SMS).
7. Tách vai trò KDI-nhà cung cấp và KDI-đơn vị vận hành nền tảng.
8. Yêu cầu ký số báo cáo.
9. Cấp quản lý trường MN/TH/THCS sau sắp xếp chính quyền 2 cấp (Sở hay UBND xã).
