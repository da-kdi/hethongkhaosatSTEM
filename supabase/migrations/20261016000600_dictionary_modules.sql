-- =====================================================================
-- 0006 · TỪ ĐIỂN DỮ LIỆU NGÀNH (QĐ 2768/QĐ-BGDĐT) & CẤU TRÚC 14 PHÂN HỆ
--  - cfg.data_domain / cfg.data_term: Phụ lục 01 (41 miền) & Phụ lục 02 (892 thuật ngữ)
--  - cfg.data_term_mapping: cột của hệ thống ↔ thuật ngữ chuẩn (nguồn: src/domain/dictionary/mapping.ts)
--  - Bổ sung cột chuẩn còn thiếu ở org.unit, org.class, iam.person_private
--  - cfg.my_modules(): danh sách phân hệ bật/tắt được theo registry mới (src/domain/modules.ts)
-- Dữ liệu từ điển nạp ở seed.sql (sinh từ src/domain/dictionary/qd2768.json).
-- =====================================================================

create table cfg.data_domain (
  code text primary key check (code ~ '^MOET[0-9]{2}$'),
  level int not null check (level between 1 and 3),
  grp text,
  name text not null,
  parent_name text,
  description text not null
);
comment on table cfg.data_domain is 'QĐ 2768/QĐ-BGDĐT Phụ lục 01 — Danh mục phân lớp đối tượng nghiệp vụ (Data Taxonomy)';

create table cfg.data_term (
  code text primary key check (code ~ '^BG_[0-9]{5}$'),
  name text not null,
  definition text not null,
  context text not null,
  domains text[] not null,
  technical_name text not null,
  data_type text not null,
  data_type_vi text not null,
  length text,
  core_code text
);
comment on table cfg.data_term is 'QĐ 2768/QĐ-BGDĐT Phụ lục 02 — Danh sách thuật ngữ ngành GDĐT (phiên bản 1.0)';
create index data_term_tech_idx on cfg.data_term (technical_name);

create table cfg.data_term_mapping (
  table_name text not null,
  column_name text not null,
  term_code text not null references cfg.data_term (code),
  status text not null check (status in ('EXACT', 'PARTIAL')),
  note text,
  primary key (table_name, column_name, term_code)
);
comment on table cfg.data_term_mapping is 'Ánh xạ cột dữ liệu của hệ thống ↔ thuật ngữ chuẩn. Dùng cho import/export, tích hợp, báo cáo.';

-- ---------- Cột chuẩn bổ sung ----------
alter table org.unit
  add column ma_dinh_danh text check (char_length(ma_dinh_danh) <= 35),
  add column loai_hinh_csgd text,
  add column tinh_thanh text;
alter table org.unit
  add constraint unit_ma_dinh_danh_truong check (type <> 'TRUONG' or ma_dinh_danh is null or char_length(ma_dinh_danh) <= 15);
create unique index unit_ma_dinh_danh_uq on org.unit (ma_dinh_danh) where ma_dinh_danh is not null;

alter table org.class add column ma_lop text check (char_length(ma_lop) <= 20);

alter table iam.person_private
  add column so_dinh_danh_ca_nhan text check (so_dinh_danh_ca_nhan ~ '^[0-9]{12}$'),
  add column dan_toc text check (char_length(dan_toc) <= 2),
  add column quoc_tich text check (char_length(quoc_tich) <= 2);

-- ---------- Ghi mã thuật ngữ chuẩn vào chú thích cột ----------
comment on column org.unit.ma_dinh_danh is 'BG_00419 truongId (trường, ≤15) / BG_00420 maDinhDanhToChuc (≤35)';
comment on column org.unit.name is 'BG_00421 tenCsgd';
comment on column org.unit.school_level is 'BG_00422 capHoc (giá trị nội bộ, chờ danh mục chuẩn)';
comment on column org.unit.loai_hinh_csgd is 'BG_00429 loaiHinhCsgd';
comment on column org.unit.tinh_thanh is 'BG_00426 tinhThanhCsgd (CDE-DC-001)';
comment on column org.unit.ward is 'BG_00427 xaPhuongCsgd (CDE-DC-003) — đang lưu tên; thuộc tính địa bàn, không phải cấp quản lý';
comment on column org.academic_year.code is 'BG_00821 tenNamHoc';
comment on column org.class.ma_lop is 'BG_00504 maLop';
comment on column org.class.name is 'BG_00505 tenLop';
comment on column org.class.grade is 'BG_00506 khoi';
comment on column iam.person.full_name is 'BG_00007 hoTenNh / BG_00238 hoVaTenDoiNgu';
comment on column iam.person.gender is 'BG_00010 gioiTinh (CDE-CN-002) — giá trị nội bộ cần quy đổi';
comment on column iam.person_private.birth_date is 'BG_00009 ngaySinhNh / BG_00239 ngaySinhDoiNgu';
comment on column iam.person_private.phone is 'BG_00043 soDienThoaiNh / BG_00243 soDienThoaiDn';
comment on column iam.person_private.so_dinh_danh_ca_nhan is 'BG_00011 soDinhDanhCaNhan (CDE-CN-001) — nhạy cảm';
comment on column iam.person_private.dan_toc is 'BG_00027 danToc (CDE-CN-004)';
comment on column iam.person_private.quoc_tich is 'BG_00026 quocTich (CDE-CN-003)';
comment on column org.enrollment.status is 'BG_00090 trangThaiNh (giá trị nội bộ)';

-- ---------- Danh sách phân hệ bật/tắt được (registry 14 phân hệ) ----------
create or replace function cfg.my_modules() returns table (module text, enabled boolean)
language sql stable security definer set search_path = '' as $$
  select m, cfg.module_enabled(coalesce(iam.school_of((iam.ctx()).scope_unit_id), (iam.ctx()).scope_unit_id), m)
  from unnest(array['training', 'program', 'resource', 'schedule', 'session', 'assess', 'survey', 'integration']) m
  where (iam.ctx()).assignment_id is not null
$$;

-- ---------- RLS & quyền ----------
alter table cfg.data_domain enable row level security;
alter table cfg.data_term enable row level security;
alter table cfg.data_term_mapping enable row level security;
-- Từ điển là thông tin công khai của ngành: mọi người dùng đã chọn ngữ cảnh đều đọc được
create policy data_domain_read on cfg.data_domain for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy data_term_read on cfg.data_term for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy data_term_mapping_read on cfg.data_term_mapping for select to authenticated using ((iam.ctx()).assignment_id is not null);
revoke all on cfg.data_domain, cfg.data_term, cfg.data_term_mapping from anon, authenticated;
grant select on cfg.data_domain, cfg.data_term, cfg.data_term_mapping to authenticated;
