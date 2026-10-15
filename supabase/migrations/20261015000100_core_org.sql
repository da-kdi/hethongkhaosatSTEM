-- =====================================================================
-- 0001 · CORE: schema theo module, tổ chức, con người, lớp học
-- Modular monolith: mỗi module một schema. Module khác chỉ dùng view/RPC công khai.
-- =====================================================================
create extension if not exists pgcrypto;

create schema if not exists org;   -- Tổ chức: đơn vị, lớp, nhân sự, ghi danh
create schema if not exists iam;   -- Danh tính & phân quyền
create schema if not exists cfg;   -- Cấu hình kế thừa
create schema if not exists audit; -- Nhật ký

comment on schema org is 'Module Tổ chức — cây đơn vị Sở → Trường → Tổ, lớp, nhân sự, ghi danh';
comment on schema iam is 'Module Danh tính & phân quyền — vai trò, phạm vi, ngữ cảnh, liên kết PH, grant NCC';
comment on schema cfg is 'Module Cấu hình — bật/tắt module, kế thừa MANDATORY/EXTEND/AUTONOMOUS';
comment on schema audit is 'Module Nhật ký — append-only, không lưu dữ liệu cá nhân thô';

-- ---------- Con người (PII tách bảng) ----------
create table iam.person (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  gender text check (gender in ('NAM', 'NU')),
  created_at timestamptz not null default now()
);
comment on table iam.person is 'Người (nhân sự, học sinh, phụ huynh). Chỉ chứa thông tin tối thiểu để hiển thị.';

create table iam.person_private (
  person_id uuid primary key references iam.person (id) on delete cascade,
  birth_date date,
  phone text check (phone ~ '^[0-9+ ]{8,15}$'),
  updated_at timestamptz not null default now()
);
comment on table iam.person_private is 'Dữ liệu cá nhân chi tiết — RLS chặt hơn (cần org.person.personal hoặc là chính mình / PH đã xác minh).';

-- ---------- Đơn vị ----------
create table org.unit (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references org.unit (id),
  type text not null check (type in ('PLATFORM', 'SO', 'DON_VI', 'TRUONG', 'TO', 'NCC')),
  code text not null unique,
  name text not null,
  ward text,
  school_level text check (school_level in ('MN', 'TH', 'THCS', 'THPT', 'LIEN_CAP')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  ext jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint unit_root_only_platform check ((parent_id is null) = (type = 'PLATFORM')),
  constraint unit_school_level check ((type = 'TRUONG') = (school_level is not null))
);
comment on column org.unit.ward is 'Xã/phường: thuộc tính địa bàn để lọc/xếp hạng, không phải cấp quản lý';
comment on column org.unit.ext is 'Trường mở rộng của đơn vị — validate bởi cfg.form_definition (M3); KHÔNG dùng cho báo cáo cấp tỉnh';

-- Ràng buộc cha–con hợp lệ
create function org.check_unit_parent() returns trigger
language plpgsql set search_path = '' as $$
declare p_type text;
begin
  if new.parent_id is null then return new; end if;
  select type into p_type from org.unit where id = new.parent_id;
  if not (
    (new.type = 'SO' and p_type = 'PLATFORM') or
    (new.type = 'NCC' and p_type = 'PLATFORM') or
    (new.type = 'DON_VI' and p_type = 'SO') or
    (new.type = 'TRUONG' and p_type in ('SO', 'DON_VI')) or
    (new.type = 'TO' and p_type = 'TRUONG')
  ) then
    raise exception 'Đơn vị % không thể nằm dưới %', new.type, p_type using errcode = '23514';
  end if;
  return new;
end $$;

create trigger unit_parent_check before insert or update of parent_id, type on org.unit
for each row execute function org.check_unit_parent();

-- Closure table: truy vấn cây con O(1) cho RLS
create table org.unit_closure (
  ancestor_id uuid not null references org.unit (id) on delete cascade,
  descendant_id uuid not null references org.unit (id) on delete cascade,
  depth int not null check (depth >= 0),
  primary key (ancestor_id, descendant_id)
);
create index unit_closure_desc_idx on org.unit_closure (descendant_id);

create function org.maintain_closure() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.parent_id is distinct from old.parent_id then
    raise exception 'Chuyển đơn vị sang đơn vị cha khác chưa được hỗ trợ (dùng RPC chuyên dụng ở M1)' using errcode = '0A000';
  end if;
  if tg_op = 'INSERT' then
    insert into org.unit_closure (ancestor_id, descendant_id, depth) values (new.id, new.id, 0);
    insert into org.unit_closure (ancestor_id, descendant_id, depth)
      select c.ancestor_id, new.id, c.depth + 1 from org.unit_closure c where c.descendant_id = new.parent_id;
  end if;
  return new;
end $$;

create trigger unit_closure_trg after insert or update of parent_id on org.unit
for each row execute function org.maintain_closure();

-- ---------- Năm học, lớp ----------
create table org.academic_year (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{4}-[0-9]{4}$'),
  start_date date not null,
  end_date date not null check (end_date > start_date),
  is_current boolean not null default false
);
create unique index academic_year_one_current on org.academic_year (is_current) where is_current;

create table org.class (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references org.unit (id),
  department_id uuid references org.unit (id),
  academic_year_id uuid not null references org.academic_year (id),
  name text not null,
  grade int not null check (grade between 0 and 12),
  homeroom_person_id uuid references iam.person (id),
  unique (school_id, academic_year_id, name)
);
create index class_school_idx on org.class (school_id);

-- ---------- Nhân sự, phân công, ghi danh ----------
create table org.staff_membership (
  person_id uuid not null references iam.person (id) on delete cascade,
  unit_id uuid not null references org.unit (id),
  position text not null,
  primary key (person_id, unit_id)
);
create index staff_unit_idx on org.staff_membership (unit_id);

create table org.teaching_assignment (
  person_id uuid not null references iam.person (id) on delete cascade,
  class_id uuid not null references org.class (id) on delete cascade,
  subject text not null,
  primary key (person_id, class_id, subject)
);

create table org.enrollment (
  student_person_id uuid not null references iam.person (id) on delete cascade,
  class_id uuid not null references org.class (id),
  status text not null default 'STUDYING' check (status in ('STUDYING', 'TRANSFERRED', 'GRADUATED')),
  student_code text not null unique,
  primary key (student_person_id, class_id)
);
create index enrollment_class_idx on org.enrollment (class_id);
