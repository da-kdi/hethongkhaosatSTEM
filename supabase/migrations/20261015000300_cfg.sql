-- =====================================================================
-- 0003 · CFG: cấu hình kế thừa theo tầng (mirror: src/domain/config.ts)
--   MANDATORY  — cấp dưới không được ghi (chặn bằng trigger, kể cả service role)
--   EXTEND     — cấp dưới chỉ THÊM phần tử (mảng) / khóa mới (object)
--   AUTONOMOUS — cấp dưới thay thế
-- =====================================================================

create table cfg.setting (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references org.unit (id) on delete cascade,
  key text not null check (key ~ '^[a-z_]+(\.[a-z_]+)+$'),
  value jsonb not null,
  mode text not null check (mode in ('MANDATORY', 'EXTEND', 'AUTONOMOUS')),
  version int not null default 1,
  effective_from date not null default current_date,
  updated_by uuid references iam.account (id),
  updated_at timestamptz not null default now(),
  unique (unit_id, key)
);

-- Lịch sử phiên bản cấu hình
create table cfg.setting_history (
  id bigint generated always as identity primary key,
  setting_id uuid not null,
  unit_id uuid not null,
  key text not null,
  value jsonb not null,
  mode text not null,
  version int not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create table cfg.term_label (
  unit_id uuid not null references org.unit (id) on delete cascade,
  key text not null,
  label text not null,
  primary key (unit_id, key)
);

-- Đơn vị tổ tiên đã khóa MANDATORY cho key này?
create function cfg.locked_by(p_unit uuid, p_key text) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.unit_id from cfg.setting s
  join org.unit_closure c on c.ancestor_id = s.unit_id and c.descendant_id = p_unit and c.depth > 0
  where s.key = p_key and s.mode = 'MANDATORY'
  order by c.depth desc limit 1
$$;

create function cfg.guard_setting() returns trigger
language plpgsql set search_path = '' as $$
declare v_lock uuid; v_parent_mode text; v_parent_value jsonb;
begin
  v_lock := cfg.locked_by(new.unit_id, new.key);
  if v_lock is not null then
    raise exception 'Cấu hình "%" đã bị cấp trên khóa (MANDATORY)', new.key using errcode = '42501';
  end if;
  -- EXTEND ở cấp trên: cấp dưới chỉ được thêm, kiểu dữ liệu phải khớp
  select r.mode, r.value into v_parent_mode, v_parent_value
  from cfg.effective((select parent_id from org.unit where id = new.unit_id), new.key) r;
  if v_parent_mode = 'EXTEND' and jsonb_typeof(new.value) <> jsonb_typeof(v_parent_value) then
    raise exception 'Cấu hình "%" là EXTEND: giá trị phải cùng kiểu với cấp trên', new.key using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
    new.updated_at := now();
  end if;
  insert into cfg.setting_history (setting_id, unit_id, key, value, mode, version, changed_by)
  values (new.id, new.unit_id, new.key, new.value, new.mode, new.version, auth.uid());
  return new;
end $$;

-- Hợp nhất EXTEND: mảng = hợp (giữ thứ tự cấp trên); object = merge, cấp trên thắng
create function cfg.merge_extend(p_base jsonb, p_ext jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case
    when jsonb_typeof(p_base) = 'array' and jsonb_typeof(p_ext) = 'array' then
      p_base || coalesce((select jsonb_agg(e) from jsonb_array_elements(p_ext) e where not p_base @> jsonb_build_array(e)), '[]'::jsonb)
    when jsonb_typeof(p_base) = 'object' and jsonb_typeof(p_ext) = 'object' then p_ext || p_base
    else coalesce(p_base, p_ext)
  end
$$;

-- Giá trị hiệu lực tại một đơn vị
create function cfg.effective(p_unit uuid, p_key text)
returns table (value jsonb, mode text, source_unit_id uuid, locked_by_unit_id uuid)
language plpgsql stable security definer set search_path = '' as $$
declare
  r record;
  v_value jsonb; v_mode text; v_source uuid;
begin
  if p_unit is null then return; end if;
  for r in
    select s.unit_id, s.value, s.mode from cfg.setting s
    join org.unit_closure c on c.ancestor_id = s.unit_id and c.descendant_id = p_unit
    where s.key = p_key
    order by c.depth desc -- gốc → lá
  loop
    if v_mode = 'EXTEND' then
      v_value := cfg.merge_extend(v_value, r.value);
      if r.mode = 'MANDATORY' then v_mode := 'MANDATORY'; end if;
    else
      v_value := r.value; v_mode := r.mode;
    end if;
    v_source := r.unit_id;
    if v_mode = 'MANDATORY' then
      value := v_value; mode := v_mode; source_unit_id := v_source; locked_by_unit_id := r.unit_id;
      return next; return;
    end if;
  end loop;
  value := v_value; mode := v_mode; source_unit_id := v_source; locked_by_unit_id := null;
  return next;
end $$;

create trigger setting_guard before insert or update on cfg.setting
for each row execute function cfg.guard_setting();

create function cfg.module_enabled(p_unit uuid, p_module text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(((select value from cfg.effective(p_unit, 'module.' || p_module)) ->> 'enabled')::boolean, true)
$$;

-- RPC ghi cấu hình (kiểm quyền + phạm vi)
create function cfg.set_setting(p_unit uuid, p_key text, p_value jsonb, p_mode text) returns cfg.setting
language plpgsql volatile security definer set search_path = '' as $$
declare v_row cfg.setting;
begin
  if not iam.has_perm('cfg.setting.manage') or not iam.in_subtree((iam.ctx()).scope_unit_id, p_unit) then
    raise exception 'Không có quyền sửa cấu hình đơn vị này' using errcode = '42501';
  end if;
  insert into cfg.setting (unit_id, key, value, mode, updated_by)
  values (p_unit, p_key, p_value, p_mode, auth.uid())
  on conflict (unit_id, key) do update set value = excluded.value, mode = excluded.mode, updated_by = excluded.updated_by
  returning * into v_row;
  return v_row;
end $$;

-- Module bật tại đơn vị của ngữ cảnh hiện tại (để dựng menu cho mọi vai trò)
create function cfg.my_modules() returns table (module text, enabled boolean)
language sql stable security definer set search_path = '' as $$
  select m, cfg.module_enabled(coalesce(iam.school_of((iam.ctx()).scope_unit_id), (iam.ctx()).scope_unit_id), m)
  from unnest(array['plan', 'activity', 'resource', 'assess', 'training', 'provider', 'portal', 'report']) m
  where (iam.ctx()).assignment_id is not null
$$;
