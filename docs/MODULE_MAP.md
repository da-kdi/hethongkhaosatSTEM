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

## Danh sách module & trạng thái

| Module | Schema | Frontend | Trách nhiệm | Trạng thái |
|---|---|---|---|---|
| Tổ chức | `org` | `features/org` | Cây đơn vị (closure table), năm học, lớp, nhân sự, phân công, ghi danh | ✅ M1 (đọc); tạo/sửa + import Excel: M2 |
| Danh tính & phân quyền | `iam` | `features/iam`, `features/auth` | Người (PII tách bảng), tài khoản, vai trò, quyền, gán vai trò theo phạm vi, ngữ cảnh làm việc, liên kết PH, grant NCC, hàm phạm vi RLS | ✅ M1 |
| Cấu hình | `cfg` | `features/cfg` | Cấu hình kế thừa 3 chế độ, bật/tắt module, nhãn thuật ngữ, lịch sử phiên bản | ✅ M1 (module, danh mục EXTEND, tham số quy trình); form definition: M3 |
| Nhật ký | `audit` | `features/audit` | Append-only, che dữ liệu cá nhân | ✅ M1 |
| Workflow | `wf` | — | Máy trạng thái có phiên bản, lịch sử bước, SLA, nhiệm vụ/giải trình | M3 |
| Danh mục | `catalog` | — | Năm học/kỳ, môn, khối, loại hoạt động, chương trình, rubric | M2 |
| Kế hoạch & chỉ tiêu | `plan` | — | Bộ chỉ số, giao chỉ tiêu, kế hoạch trường/tổ/GV | M3–M4 |
| Hoạt động | `activity` | — | KHBD, hoạt động, minh chứng, tham gia | M3 |
| Báo cáo | `report` | — | Metric registry, snapshot, kỳ báo cáo, data quality, import/export | M4 |
| Thông báo | `notify` | — | In-app (sau: email/Zalo) | M3 |
| Tệp | `file` | — | Metadata, mức nhạy cảm, signed URL, thời hạn lưu | M3 |
| Phòng & thiết bị | `resource` | — | Phòng, thiết bị, đặt lịch, xung đột, bảo trì | M5 |
| Năng lực GV | `training` | — | Tập huấn, chứng chỉ | M6 |
| Nhà cung cấp | `provider` | `features/provider` | Hồ sơ, sản phẩm/học liệu, thẩm định, hợp đồng, triển khai, hỗ trợ | Trang "Trường được cấp quyền" ✅; còn lại M6 |
| Nhiệm vụ & đánh giá | `assess` | — | Bài tập/dự án, bài nộp, rubric, hồ sơ năng lực | M7 |
| Cổng HS/PH | `portal` | — | Lịch, sự kiện, đăng ký, trao đổi | M7 |

## Frontend

| Thư mục | Vai trò |
|---|---|
| `src/domain/` | Logic thuần, không phụ thuộc React: `permissions.ts` (registry), `roles.ts`, `access.ts` (mirror RLS), `config.ts` (mirror `cfg.effective`), `navigation.ts` (module registry + menu theo cổng), `menu.ts` |
| `src/demo/seed.ts` | Kịch bản dữ liệu demo xuyên suốt, là nguồn của `supabase/seed.sql` |
| `src/app/` | Router (hash history, chạy trên hosting tĩnh), store demo, truy vấn có phạm vi |
| `src/features/` | Màn hình theo module |
| `src/components/` | `ui/` (Radix + Tailwind, port từ stemtown-preview), `layout/` |

**Menu động** = mục của cổng vai trò ∩ module bật tại đơn vị ngữ cảnh ∩ quyền. `PageView` kiểm tra lại khi người dùng gõ URL trực tiếp.

## Lớp dữ liệu (data source)

| Chế độ | Khi nào | Cách hoạt động |
|---|---|---|
| `demo` | Không có `VITE_SUPABASE_*` | Dữ liệu trong trình duyệt; mọi đọc đi qua `access.ts`; ghi qua `actions` với cùng kiểm tra như RPC |
| `supabase` | Có `VITE_SUPABASE_*` | **M1b, chưa làm:** adapter gọi RPC/RLS thật, cùng interface với store demo |
