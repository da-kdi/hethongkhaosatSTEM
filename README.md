# Hệ thống quản trị STEM đa cấp, đa vai trò

Nền tảng dùng chung cho **Sở GD&ĐT · Trường · Tổ/Khoa chuyên môn · Giáo viên · Học sinh · Phụ huynh · Nhà cung cấp STEM**. Một lần đăng nhập, nhiều vai trò. Menu và dữ liệu thay đổi theo **ngữ cảnh làm việc** đang chọn. Phân quyền kiểm tra ở tầng cơ sở dữ liệu (Row Level Security).

> **Trạng thái:** M0 (khởi tạo) + M1 (tổ chức · phân quyền · nhật ký · bật/tắt module) đã hoàn thành ở chế độ demo, kèm lớp database đã kiểm thử. Lộ trình xem [`docs/ARCHITECTURE_PLAN.md`](docs/ARCHITECTURE_PLAN.md) §7.

## Chạy thử nhanh (chế độ demo, không cần backend)

```bash
npm ci
npm run dev          # http://localhost:5173
```

Chọn một tài khoản demo ở màn đăng nhập. Dữ liệu là **hư cấu** (tỉnh giả định "An Hòa"). Một số kịch bản đáng thử:

| Tài khoản | Xem gì |
|---|---|
| Trần Thị Mai, Chuyên viên Sở | Thấy mọi trường và số liệu tổng hợp, **không** thấy dữ liệu cá nhân học sinh |
| Đỗ Văn Kiên, QTV THCS Bình Minh | Bật/tắt module của trường; module Sở đã khóa "bắt buộc" thì không tắt được |
| Hoàng Thị Lan | Hai vai trò (Tổ trưởng KHTN + Giáo viên), đổi ngữ cảnh thì menu và dữ liệu đổi theo |
| Đinh Thị Ngọc | Giáo viên ở Thanh Sơn **và** phụ huynh ở Bình Minh, hai ngữ cảnh không trộn dữ liệu |
| Mai Văn Tùng, Phụ huynh | Liên kết đang chờ xác minh nên không xem được gì |
| Trịnh Minh Khoa, KDI (NCC) | Chỉ thấy trường đã cấp quyền; quyền ở Thanh Sơn hết hạn nên mất quyền |
| Lý Thị Hoa, Hiệu trưởng TH Sao Mai | Trường đã tắt module Phòng & thiết bị nên menu ẩn mục đó |

## Kiến trúc tóm tắt

- **Frontend:** React 19 · Vite 8 · TypeScript 6 · Tailwind 4 · Radix UI · TanStack Router/Query. Giao diện tiếng Việt, responsive.
- **Backend:** Supabase (Postgres + Auth + Storage). **Modular monolith**: mỗi module một schema (`org`, `iam`, `cfg`, `audit`, sau này thêm `plan`, `activity`…). Ghi dữ liệu nghiệp vụ chỉ qua RPC `security definer`; đọc qua RLS.
- **Một nguồn chân lý cho quyền:** `src/domain/permissions.ts` + `roles.ts` sinh ra `supabase/seed.sql`. `src/domain/access.ts` là bản phản chiếu TS của các hàm RLS, và **test đối chiếu** khẳng định hai bên cho cùng kết quả với mọi ngữ cảnh demo.

Chi tiết: [MODULE_MAP](docs/MODULE_MAP.md) · [DATA_MODEL](docs/DATA_MODEL.md) · [PERMISSION_MATRIX](docs/PERMISSION_MATRIX.md) · [WORKFLOWS](docs/WORKFLOWS.md) · [DECISIONS](docs/DECISIONS.md) · [RUNBOOK](docs/RUNBOOK.md)

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Typecheck + build production |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Unit test (+ test DB nếu có `DATABASE_URL`) |
| `npm run test:db` | Test RLS trên Postgres thật (cần `DATABASE_URL`) |
| `npm run gen:seed` | Sinh lại `supabase/seed.sql` từ nguồn TS (bắt buộc sau khi sửa quyền/vai trò/seed) |
| `npm run db:reset:local` | Dựng database `stem_local` trên Postgres thuần (shim + migrations + seed) |

## Cấu trúc thư mục

```
src/
  domain/      permission registry, vai trò, bộ máy phạm vi (mirror RLS), cấu hình kế thừa, menu
  demo/        kịch bản dữ liệu demo xuyên suốt (nguồn của seed.sql)
  app/         router, store demo, truy vấn có phạm vi
  features/    màn hình theo module (org, iam, cfg, audit, provider, overview, auth)
  components/  ui/ (Radix + Tailwind), layout/
supabase/
  migrations/  0001 org · 0002 iam · 0003 cfg · 0004 audit · 0005 RLS & grants
  tests/       harness Postgres + test RLS
  seed.sql     SINH TỰ ĐỘNG, không sửa tay
docs/          kiến trúc, mô hình dữ liệu, ma trận quyền, workflow, quyết định, vận hành
```

## Bảo mật & dữ liệu

- Dữ liệu demo là **hư cấu**. Mật khẩu demo `Demo@2026` chỉ dùng cho local.
- Bản demo trên GitHub Pages chạy hoàn toàn trong trình duyệt, **không** dùng cho dữ liệu thật.
- Trước khi đưa dữ liệu thật lên cần chốt nơi lưu trữ và đánh giá tuân thủ bảo vệ dữ liệu cá nhân (xem `docs/DECISIONS.md` mục câu hỏi mở).
