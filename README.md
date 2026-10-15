# Hệ thống quản trị STEM đa cấp, đa vai trò

Nền tảng dùng chung cho **Sở GD&ĐT · Trường · Tổ/Khoa chuyên môn · Giáo viên · Học sinh · Phụ huynh · Nhà cung cấp STEM**. Một lần đăng nhập, nhiều vai trò. Menu và dữ liệu thay đổi theo **ngữ cảnh làm việc** đang chọn. Phân quyền kiểm tra ở tầng cơ sở dữ liệu (Row Level Security).

> **Trạng thái:** M0 + M1 hoàn thành, đã tái cấu trúc theo **14 phân hệ × 5 bước triển khai đề án** và chuẩn hóa theo **Từ điển dữ liệu ngành (QĐ 2768/QĐ-BGDĐT)**. Lộ trình: [`docs/ARCHITECTURE_PLAN.md`](docs/ARCHITECTURE_PLAN.md) §V2.6.

## Chạy thử nhanh (chế độ demo, không cần backend)

```bash
npm ci
npm run dev          # http://localhost:5173
```

Chọn một tài khoản demo ở màn đăng nhập. Dữ liệu là **hư cấu** (tỉnh giả định "An Hòa"). Một số kịch bản đáng thử:

| Tài khoản | Xem gì |
|---|---|
| Trần Thị Mai, Chuyên viên Sở | Thấy mọi trường và số liệu tổng hợp, **không** thấy dữ liệu cá nhân học sinh |
| Đỗ Văn Kiên, QTV THCS Bình Minh | Bật/tắt phân hệ của trường; phân hệ Sở đã khóa "bắt buộc" (6, 0.2) thì không tắt được |
| Phạm Thu Hà, Hiệu trưởng Bình Minh | Tiến trình đề án 5 bước, bản đồ phân hệ, từ điển dữ liệu ngành |
| Hoàng Thị Lan | Hai vai trò (Tổ trưởng KHTN + Giáo viên), đổi ngữ cảnh thì menu và dữ liệu đổi theo |
| Đinh Thị Ngọc | Giáo viên ở Thanh Sơn **và** phụ huynh ở Bình Minh, hai ngữ cảnh không trộn dữ liệu |
| Mai Văn Tùng, Phụ huynh | Liên kết đang chờ xác minh nên không xem được gì |
| Trịnh Minh Khoa, KDI (NCC) | Chỉ thấy trường đã cấp quyền; quyền ở Thanh Sơn hết hạn nên mất quyền |
| Lý Thị Hoa, Hiệu trưởng TH Sao Mai | Trường đã tắt phân hệ 3 (Thiết bị, vật tư & phòng) nên menu ẩn mục đó |

## 14 phân hệ

| Tầng | Phân hệ |
|---|---|
| 0 · Định hướng | **0** Định hướng & kế hoạch đề án |
| 1 · Đào tạo GV | **1** Đào tạo & đánh giá năng lực GV |
| 2 · Chương trình | **2** Chương trình & học liệu STEM |
| 3 · Thiết bị | **3** Thiết bị, vật tư & phòng STEM |
| 4 · Vận hành dạy học | **4** Tổ chức dạy học → **5** Kế hoạch & lịch dạy → **6** Buổi dạy & điểm danh → **7** Đánh giá năng lực & sản phẩm |
| Xuyên suốt | **8** Quy trình & thông báo |
| 5 · Quản lý vận hành | **0.1** Dashboard & báo cáo · **0.2** Khảo sát · **0.3** Tích hợp dữ liệu & AI · **0.4** Người dùng & phân quyền · **0.5** Quản trị nền tảng |

Quy trình đề án: **1** Định hướng từ Tỉnh/Sở → **2** Lập kế hoạch → **3** Đào tạo và triển khai → **4** Đánh giá vận hành → **5** Tổng hợp báo cáo và đề xuất cải tiến.

## Kiến trúc tóm tắt

- **Frontend:** React 19 · Vite 8 · TypeScript 6 · Tailwind 4 · Radix UI · TanStack Router/Query. Giao diện tiếng Việt, responsive.
- **Backend:** Supabase (Postgres + Auth + Storage). **Modular monolith**: mỗi phân hệ một schema (`org`, `iam`, `cfg`, `audit`; sau này thêm `plan`, `survey`, `session`…). Ghi dữ liệu nghiệp vụ chỉ qua RPC `security definer`; đọc qua RLS.
- **Chuẩn dữ liệu ngành:** 892 thuật ngữ QĐ 2768 nạp vào `cfg.data_term`; trao đổi dữ liệu dùng tên kỹ thuật chuẩn (`truongId`, `maLop`, `hoTenNh`…), xem trang "Từ điển dữ liệu ngành".
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
  domain/      registry 14 phân hệ, quyền, vai trò, bộ máy phạm vi (mirror RLS), cấu hình kế thừa, menu
  domain/dictionary/  Từ điển QĐ 2768 + ánh xạ cột
  demo/        kịch bản dữ liệu demo xuyên suốt (nguồn của seed.sql)
  app/         router, store demo, truy vấn có phạm vi
  features/    màn hình theo phân hệ (org, iam, cfg, audit, plan, provider, overview, auth)
  components/  ui/ (Radix + Tailwind), layout/
supabase/
  migrations/  0001 org · 0002 iam · 0003 cfg · 0004 audit · 0005 RLS & grants · 0006 từ điển & phân hệ
  tests/       harness Postgres + test RLS
  seed.sql     SINH TỰ ĐỘNG, không sửa tay
docs/          kiến trúc, mô hình dữ liệu, ma trận quyền, workflow, quyết định, vận hành
```

## Bảo mật & dữ liệu

- Dữ liệu demo là **hư cấu**. Mật khẩu demo `Demo@2026` chỉ dùng cho local.
- Bản demo trên GitHub Pages chạy hoàn toàn trong trình duyệt, **không** dùng cho dữ liệu thật.
- Trước khi đưa dữ liệu thật lên cần chốt nơi lưu trữ và đánh giá tuân thủ bảo vệ dữ liệu cá nhân (xem `docs/DECISIONS.md` mục câu hỏi mở).
