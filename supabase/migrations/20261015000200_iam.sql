-- =====================================================================
-- 0002 · IAM: tài khoản, vai trò, quyền, gán vai trò theo phạm vi,
--        ngữ cảnh làm việc (JWT claim), liên kết phụ huynh, grant NCC,
--        và các HÀM PHẠM VI dùng chung cho RLS.
--
-- ⚠️ Các hàm iam.can_see_* là bản chuẩn của src/domain/access.ts.
--    Test đối chiếu: supabase/tests/rls.test.ts (so sánh từng vai trò × từng bản ghi).
-- =====================================================================

create table iam.account (
  id uuid primary key references auth.users (id) on delete cascade,
  person_id uuid not null unique references iam.person (id),
  email text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'LOCKED')),
  current_assignment_id uuid,
  created_at timestamptz not null default now()
);
comment on column iam.account.current_assignment_id is 'Ngữ cảnh đang chọn — custom access token hook đưa vào JWT claim active_assignment_id';

create table iam.permission (
  code text primary key check (code ~ '^[a-z]+\.[a-z_]+(\.[a-z_]+)?$'),
  description text not null,
  module text generated always as (split_part(code, '.', 1)) stored
);

create table iam.role (
  code text primary key check (code ~ '^[A-Z_]+$'),
  name text not null,
  portal text not null check (portal in ('platform', 'so', 'truong', 'to', 'gv', 'hs', 'ph', 'ncc')),
  scope_kind text not null check (scope_kind in ('PLATFORM', 'UNIT_SUBTREE', 'TEACHING', 'SELF', 'LINKED', 'GRANT')),
  unit_types text[] not null,
  is_system boolean not null default true,
  owner_unit_id uuid references org.unit (id),
  constraint custom_role_has_owner check (is_system or owner_unit_id is not null)
);

create table iam.role_permission (
  role_code text not null references iam.role (code) on delete cascade,
  permission_code text not null references iam.permission (code) on delete cascade,
  primary key (role_code, permission_code)
);

create table iam.role_assignment (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references iam.account (id) on delete cascade,
  role_code text not null references iam.role (code),
  scope_unit_id uuid not null references org.unit (id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED')),
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);
create index role_assignment_account_idx on iam.role_assignment (account_id);

alter table iam.account
  add constraint account_current_assignment_fk foreign key (current_assignment_id) references iam.role_assignment (id) on delete set null;

-- Vai trò chỉ gán được vào loại đơn vị phù hợp
create function iam.check_assignment_unit() returns trigger
language plpgsql set search_path = '' as $$
declare v_types text[]; v_unit_type text;
begin
  select unit_types into v_types from iam.role where code = new.role_code;
  select type into v_unit_type from org.unit where id = new.scope_unit_id;
  if not (v_unit_type = any (v_types)) then
    raise exception 'Vai trò % không gán được vào đơn vị loại %', new.role_code, v_unit_type using errcode = '23514';
  end if;
  return new;
end $$;
create trigger role_assignment_unit_check before insert or update on iam.role_assignment
for each row execute function iam.check_assignment_unit();

create table iam.guardian_link (
  id uuid primary key default gen_random_uuid(),
  guardian_person_id uuid not null references iam.person (id) on delete cascade,
  student_person_id uuid not null references iam.person (id) on delete cascade,
  relation text not null check (relation in ('CHA', 'ME', 'NGUOI_GIAM_HO')),
  status text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'REVOKED')),
  method text check (method in ('INVITE_OTP', 'TEACHER_APPROVAL')),
  verified_at timestamptz,
  verified_by uuid references iam.account (id),
  expires_at date,
  unique (guardian_person_id, student_person_id),
  check (guardian_person_id <> student_person_id),
  check (status <> 'VERIFIED' or (method is not null and verified_at is not null))
);

create table iam.provider_grant (
  id uuid primary key default gen_random_uuid(),
  provider_unit_id uuid not null references org.unit (id),
  school_unit_id uuid not null references org.unit (id),
  program_code text,
  level text not null check (level in ('AGGREGATE', 'CLASS', 'NAMED')),
  valid_from date not null,
  valid_to date not null check (valid_to >= valid_from),
  granted_by uuid references iam.account (id),
  created_at timestamptz not null default now()
);
create index provider_grant_provider_idx on iam.provider_grant (provider_unit_id);

-- =====================================================================
-- HÀM NGỮ CẢNH & PHẠM VI (security definer, search_path rỗng)
-- =====================================================================

-- Ngày tham chiếu: cho phép test đặt app.today; mặc định ngày hiện tại
create function iam.today() returns date
language sql stable set search_path = '' as $$
  select coalesce(nullif(current_setting('app.today', true), '')::date, current_date)
$$;

create type iam.ctx_t as (
  assignment_id uuid,
  account_id uuid,
  person_id uuid,
  role_code text,
  scope_kind text,
  scope_unit_id uuid,
  scope_unit_type text
);

-- Ngữ cảnh đang hoạt động = assignment trong JWT claim, PHẢI thuộc auth.uid() và còn hiệu lực.
-- Claim giả mạo/hết hạn → mọi trường null → mọi policy trả false.
create function iam.ctx() returns iam.ctx_t
language plpgsql stable security definer set search_path = '' as $$
declare
  v_claim text := auth.jwt() ->> 'active_assignment_id';
  v_ctx iam.ctx_t;
begin
  if v_claim is null or v_claim !~ '^[0-9a-f-]{36}$' then return v_ctx; end if;
  select ra.id, ra.account_id, a.person_id, r.code, r.scope_kind, u.id, u.type
    into v_ctx
  from iam.role_assignment ra
  join iam.account a on a.id = ra.account_id and a.status = 'ACTIVE'
  join iam.role r on r.code = ra.role_code
  join org.unit u on u.id = ra.scope_unit_id
  where ra.id = v_claim::uuid
    and ra.account_id = auth.uid()
    and ra.status = 'ACTIVE'
    and ra.valid_from <= iam.today()
    and (ra.valid_to is null or ra.valid_to >= iam.today());
  return v_ctx;
end $$;

create function iam.has_perm(p_perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from iam.role_permission rp
    where rp.role_code = (iam.ctx()).role_code and rp.permission_code = p_perm
  )
$$;

create function iam.in_subtree(p_root uuid, p_unit uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from org.unit_closure where ancestor_id = p_root and descendant_id = p_unit)
$$;

create function iam.school_of(p_unit uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select c.ancestor_id from org.unit_closure c join org.unit u on u.id = c.ancestor_id
  where c.descendant_id = p_unit and u.type = 'TRUONG' limit 1
$$;

create function iam.student_class(p_person uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select class_id from org.enrollment where student_person_id = p_person and status = 'STUDYING' limit 1
$$;

create function iam.my_teaching_classes() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select class_id from org.teaching_assignment where person_id = (iam.ctx()).person_id
  union
  select id from org.class where homeroom_person_id = (iam.ctx()).person_id
$$;

create function iam.linked_children() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select student_person_id from iam.guardian_link
  where guardian_person_id = (iam.ctx()).person_id
    and status = 'VERIFIED'
    and (expires_at is null or expires_at >= iam.today())
$$;

create function iam.active_grants() returns setof iam.provider_grant
language sql stable security definer set search_path = '' as $$
  select g.* from iam.provider_grant g
  where (iam.ctx()).scope_kind = 'GRANT'
    and g.provider_unit_id = (iam.ctx()).scope_unit_id
    and g.valid_from <= iam.today() and g.valid_to >= iam.today()
$$;

-- ---------- can_see_unit ----------
create function iam.can_see_unit(p_unit uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare c iam.ctx_t := iam.ctx(); v_school uuid;
begin
  if c.assignment_id is null then return false; end if;
  case c.scope_kind
    when 'PLATFORM' then return true;
    when 'UNIT_SUBTREE' then
      if not iam.has_perm('org.unit.view') then return false; end if;
      -- cây con + chuỗi cha (để hiển thị đường dẫn), không thấy đơn vị ngang hàng
      return iam.in_subtree(c.scope_unit_id, p_unit) or iam.in_subtree(p_unit, c.scope_unit_id);
    when 'TEACHING', 'SELF' then
      v_school := iam.school_of(c.scope_unit_id);
      return v_school is not null and iam.in_subtree(v_school, p_unit);
    when 'LINKED' then
      return exists (
        select 1 from iam.linked_children() ch
        join org.class cl on cl.id = iam.student_class(ch)
        where cl.school_id = p_unit
      );
    when 'GRANT' then
      return p_unit = c.scope_unit_id or exists (select 1 from iam.active_grants() g where g.school_unit_id = p_unit);
    else return false;
  end case;
end $$;

-- ---------- can_see_class ----------
create function iam.can_see_class(p_class uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare c iam.ctx_t := iam.ctx(); cl org.class;
begin
  if c.assignment_id is null then return false; end if;
  select * into cl from org.class where id = p_class;
  if cl.id is null then return false; end if;
  case c.scope_kind
    when 'UNIT_SUBTREE' then
      return iam.has_perm('org.class.view') and (
        iam.in_subtree(c.scope_unit_id, cl.school_id)
        or (cl.department_id is not null and iam.in_subtree(c.scope_unit_id, cl.department_id)));
    when 'TEACHING' then return p_class in (select iam.my_teaching_classes());
    when 'SELF' then return iam.student_class(c.person_id) = p_class;
    when 'LINKED' then return exists (select 1 from iam.linked_children() ch where iam.student_class(ch) = p_class);
    when 'GRANT' then
      return exists (select 1 from iam.active_grants() g where g.school_unit_id = cl.school_id and g.level <> 'AGGREGATE');
    else return false; -- PLATFORM: không xem dữ liệu lớp/học sinh
  end case;
end $$;

-- ---------- can_see_person ----------
create function iam.can_see_person(p_person uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare c iam.ctx_t := iam.ctx(); v_class uuid; v_school uuid;
begin
  if c.assignment_id is null then return false; end if;
  if p_person = c.person_id then return true; end if;

  v_class := iam.student_class(p_person);
  if v_class is not null then
    -- HỌC SINH: dữ liệu trẻ em
    case c.scope_kind
      when 'UNIT_SUBTREE' then
        if c.scope_unit_type not in ('TRUONG', 'TO') then return false; end if; -- Sở: chỉ số liệu tổng hợp
        return iam.has_perm('org.person.view') and iam.can_see_class(v_class);
      when 'TEACHING' then return v_class in (select iam.my_teaching_classes());
      when 'LINKED' then return p_person in (select iam.linked_children());
      when 'GRANT' then
        return exists (select 1 from iam.active_grants() g join org.class cl on cl.id = v_class
                       where g.school_unit_id = cl.school_id and g.level = 'NAMED');
      else return false;
    end case;
  end if;

  -- NHÂN SỰ
  if not exists (select 1 from org.staff_membership where person_id = p_person) then return false; end if;
  case c.scope_kind
    when 'PLATFORM' then return true;
    when 'UNIT_SUBTREE' then
      return iam.has_perm('org.person.view') and exists (
        select 1 from org.staff_membership s where s.person_id = p_person and iam.in_subtree(c.scope_unit_id, s.unit_id));
    when 'TEACHING' then
      v_school := iam.school_of(c.scope_unit_id);
      return exists (select 1 from org.staff_membership s where s.person_id = p_person and iam.in_subtree(v_school, s.unit_id));
    when 'GRANT' then
      return exists (select 1 from org.staff_membership s where s.person_id = p_person and s.unit_id = c.scope_unit_id);
    else return false;
  end case;
end $$;

-- ---------- can_see_personal (ngày sinh, SĐT) ----------
create function iam.can_see_personal(p_person uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare c iam.ctx_t := iam.ctx();
begin
  if c.assignment_id is null then return false; end if;
  if p_person = c.person_id then return true; end if;
  if c.scope_kind = 'LINKED' then return p_person in (select iam.linked_children()); end if;
  return iam.has_perm('org.person.personal') and iam.can_see_person(p_person);
end $$;

-- =====================================================================
-- RPC NGỮ CẢNH
-- =====================================================================

-- Danh sách ngữ cảnh của người dùng hiện tại (cho màn chọn vai trò)
create function iam.my_contexts()
returns table (assignment_id uuid, role_code text, role_name text, portal text, scope_unit_id uuid, scope_unit_name text)
language sql stable security definer set search_path = '' as $$
  select ra.id, r.code, r.name, r.portal, u.id, u.name
  from iam.role_assignment ra
  join iam.role r on r.code = ra.role_code
  join org.unit u on u.id = ra.scope_unit_id
  where ra.account_id = auth.uid() and ra.status = 'ACTIVE'
    and ra.valid_from <= iam.today() and (ra.valid_to is null or ra.valid_to >= iam.today())
  order by r.portal, u.name
$$;

-- Chọn ngữ cảnh; client gọi supabase.auth.refreshSession() để nhận JWT mới
create function iam.switch_context(p_assignment uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not exists (select 1 from iam.my_contexts() where assignment_id = p_assignment) then
    raise exception 'Ngữ cảnh không hợp lệ' using errcode = '42501';
  end if;
  update iam.account set current_assignment_id = p_assignment where id = auth.uid();
  insert into audit.log (action, entity, entity_id, active_assignment, summary)
  values ('CONTEXT_SWITCH', 'iam.role_assignment', p_assignment::text, p_assignment, '{}'::jsonb);
end $$;

-- Supabase Custom Access Token Hook: thêm claim active_assignment_id
-- Bật trong Dashboard → Authentication → Hooks (hoặc config.toml [auth.hook.custom_access_token])
create function iam.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  v_assignment uuid;
begin
  select a.current_assignment_id into v_assignment
  from iam.account a
  join iam.role_assignment ra on ra.id = a.current_assignment_id
  where a.id = (event ->> 'user_id')::uuid and a.status = 'ACTIVE' and ra.status = 'ACTIVE'
    and ra.valid_from <= iam.today() and (ra.valid_to is null or ra.valid_to >= iam.today());
  if v_assignment is not null then
    v_claims := jsonb_set(v_claims, '{active_assignment_id}', to_jsonb(v_assignment::text));
  else
    v_claims := v_claims - 'active_assignment_id';
  end if;
  return jsonb_set(event, '{claims}', v_claims);
end $$;
