# Bản đồ module

Kiến trúc **modular monolith** trên Supabase. Mỗi module có:
- một **schema Postgres** riêng (bảng nội bộ + hàm),
- một **thư mục `src/features/<module>`** ở frontend,
- **hợp đồng công khai** gồm RPC `security definer` và view/bảng có RLS. Module khác chỉ dùng hợp đồng này.

## Quy tắc ranh giới

1. Ghi dữ liệu nghiệp vụ **chỉ qua RPC**. Role `authenticated` không có quyền INSERT/UPDATE/DELETE trực tiếp lên bảng (đã có test).
2. Đọc qua RLS. Mọi policy dựa trên các hàm phạm vi dùng chung `iam.*` (xem PERMISSION_MATRIX §4).
3. Module nghiệp vụ (plan, activity…) **không** tự viết logic quyền mà gọi `iam.has_perm`, `iam.can_see_*`.
4. Báo cáo cấp tỉnh chỉ đọc **cột chuẩn**. Cột `ext jsonb` (trường mở rộng của từng đơn vị) không đi vào báo cáo Sở.
5. Mọi thay đổi quan trọng có trigger `audit.capture`.

## Danh sách 14 phân hệ & trạng thái

Nguồn chân lý: `src/domain/modules.ts`. Trang "Bản đồ phân hệ" trong ứng dụng hiển thị cùng dữ liệu này. Chi tiết: ARCHITECTURE_PLAN §V2.2.

| Số | Phân hệ | Mã (`module.<mã>`, tiền tố quyền) | Schema DB | Bật/tắt | Bước | Trạng thái |
|---|---|---|---|---|---|---|
| 0 | Định hướng & kế hoạch đề án | `plan` | `plan` | Luôn bật | 1, 2, 5 | Tiến trình đề án (minh họa) ✅; nghiệp vụ M3 |
| 1 | Đào tạo & đánh giá năng lực GV | `training` | `training` | Có | 2, 3, 4 | M5 |
| 2 | Chương trình & học liệu STEM | `program` | `program` | Có | 1, 2, 3 | M5 |
| 3 | Thiết bị, vật tư & phòng STEM | `resource` | `resource` | Có | 2, 3, 4 | M6 |
| 4 | Tổ chức dạy học | `org` | `org` | Luôn bật | 2 | Đọc ✅ (M1) · ✅ M2b ghi hồ sơ tổ, GV, phân công, lớp, HS (RPC `org.upsert_*`, `org.set_*`) · ✅ M2c-1 nhập/xuất Excel HS & GV (`org.import_*`, `org.log_export`) · ✅ M2c-2 liên kết PH W8 (`iam.*guardian*`), hồ sơ NCC (`org.provider_profile`) · M2d cấp quyền NCC |
| 5 | Kế hoạch & lịch dạy | `schedule` | `schedule` | Có | 2, 3 | M6 |
| 6 | Buổi dạy & điểm danh | `session` | `session` | Có | 3 | M7 (PWA offline) |
| 7 | Đánh giá năng lực & sản phẩm | `assess` | `assess` | Có | 4 | M7 |
| 8 | Quy trình & thông báo (xuyên suốt) | `workflow` | `wf`, `notify` | Luôn bật | 1–5 | M3 |
| 0.1 | Dashboard & báo cáo | `report` | `report`, `dw` | Luôn bật | 4, 5 | M8 |
| 0.2 | Khảo sát | `survey` | `survey` | Có | 1, 4, 5 | M4 |
| 0.3 | Tích hợp dữ liệu & AI | `integration` | `integration` | Có | 5 | M9 |
| 0.4 | Người dùng & phân quyền | `iam` (+ `audit`) | `iam`, `audit` | Luôn bật | 1–5 | ✅ M1 |
| 0.5 | Quản trị nền tảng | `platform` (quyền `cfg.*`) | `cfg`, `catalog` | Luôn bật | 1 | ✅ M1 (cấu hình, bản đồ phân hệ, từ điển dữ liệu) · ✅ M2a (danh mục dùng chung, nạp CSV) |

Ghi chú:
- Mã quyền `org.*`, `iam.*`, `cfg.*`, `audit.*` được dùng trong hàm RLS nên **không đổi tên**.
- Danh sách phân hệ bật/tắt được phải khớp `cfg.my_modules()` trong SQL (có test).

## Frontend

| Thư mục | Vai trò |
|---|---|
| `src/domain/` | Logic thuần, không phụ thuộc React: `permissions.ts` (registry), `roles.ts`, `access.ts` (mirror RLS), `config.ts` (mirror `cfg.effective`), `navigation.ts` (module registry + menu theo cổng), `menu.ts` |
| `src/domain/modules.ts` | Registry 14 phân hệ, 5 tầng, 5 bước đề án |
| `src/domain/dictionary/` | Từ điển QĐ 2768 (`qd2768.json`), ánh xạ cột (`mapping.ts`), tập con cho UI (`core-terms.ts`) |
| `src/demo/seed.ts` | Kịch bản dữ liệu demo xuyên suốt, là nguồn của `supabase/seed.sql` |
| `src/app/` | Router (hash history, chạy trên hosting tĩnh), store demo, truy vấn có phạm vi |
| `src/features/` | Màn hình theo module |
| `src/components/` | `ui/` (Radix + Tailwind, port từ stemtown-preview), `layout/` |

**Menu động** = mục của cổng vai trò ∩ phân hệ bật tại đơn vị ngữ cảnh ∩ quyền. Nhóm menu mang số và tên phân hệ, theo thứ tự 0 → 8 → 0.1 → 0.5. `PageView` kiểm tra lại khi người dùng gõ URL trực tiếp.

## Lớp dữ liệu (data source)

| Chế độ | Khi nào | Cách hoạt động |
|---|---|---|
| `demo` | Không có `VITE_SUPABASE_*` | Dữ liệu trong trình duyệt; mọi đọc đi qua `access.ts`; ghi qua `actions` với cùng kiểm tra như RPC |
| `supabase` | Có `VITE_SUPABASE_*` | **M1b, chưa làm:** adapter gọi RPC/RLS thật, cùng interface với store demo |
