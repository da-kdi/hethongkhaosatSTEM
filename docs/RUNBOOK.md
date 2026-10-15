# Hướng dẫn chạy & vận hành

## Yêu cầu
- Node ≥ 22.18 (chạy script `.ts` trực tiếp bằng `node`)
- Postgres 15+ để chạy test DB (tùy chọn)
- Supabase CLI + Docker để chạy backend đầy đủ (tùy chọn)

## 1. Chế độ demo (mặc định)
```bash
npm ci
npm run dev
```
Không đặt `VITE_SUPABASE_*` thì app chạy bằng dữ liệu hư cấu trong trình duyệt. Thay đổi cấu hình và nhật ký được lưu ở `localStorage`; nút "Khôi phục dữ liệu demo" ở màn đăng nhập sẽ xóa chúng.

## 2. Kiểm thử
```bash
npm run lint && npm run typecheck
npx vitest run --project unit                     # logic domain, store, đồng bộ seed/docs
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:db   # RLS trên Postgres thật
```
Test DB tự tạo database `stem_test_rls`, áp `supabase/tests/supabase_shim.sql` (giả lập `auth.uid()/auth.jwt()` và các role của Supabase), rồi migrations + seed, chạy xong thì xóa.

Postgres nhanh bằng Docker:
```bash
docker run -d --name stem-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

Dựng database để xem dữ liệu:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:reset:local   # → stem_local
```

## 3. Sửa quyền / vai trò / dữ liệu demo
1. Sửa `src/domain/permissions.ts`, `roles.ts` hoặc `src/demo/seed.ts`.
2. Nếu đổi quy tắc phạm vi: sửa **cả** `src/domain/access.ts` **và** hàm SQL tương ứng (migration mới, không sửa migration cũ khi đã lên môi trường thật).
3. `npm run gen:seed && npm run gen:docs`
4. `npm test` + `npm run test:db`.

## 4. Supabase local (backend đầy đủ)
```bash
supabase start          # đọc supabase/config.toml: bật custom access token hook
supabase db reset       # áp migrations + seed.sql
```
Đặt `.env.local` với URL/anon key do `supabase start` in ra. Mật khẩu mọi tài khoản demo: `Demo@2026`.

> ⚠️ Adapter frontend cho chế độ Supabase là việc của **M1b**. Lớp DB đã kiểm thử trên Postgres 16 với shim, nhưng **chưa chạy thử trên Supabase thật** (môi trường build không có Docker daemon). Khi chạy lần đầu cần kiểm: hook token, seed `auth.identities`, quyền `supabase_auth_admin`.

## 5. Triển khai
- **Demo:** push lên `main` thì workflow `pages.yml` build với `BASE_PATH=/<tên-repo>/` và đăng lên GitHub Pages. Bật Pages ở Settings → Pages → Source: GitHub Actions.
- **Production:** chưa thiết lập. Chờ quyết định D7 về nơi lưu dữ liệu.

## 6. CI
`ci.yml`: job `check` (lint, typecheck, unit test, build) và job `db` (Postgres 16 service, `npm run test:db`).
