-- =====================================================================
-- 0007 · DANH MỤC DÙNG CHUNG (phân hệ 0.5) — ADR-013
--  Nguồn chính thức: CSDL ngành của Bộ GD&ĐT. Trong lúc chưa có file/kết nối, một số danh mục
--  ở trạng thái NOI_BO_TAM (giá trị nội bộ tạm). gioiTinh theo chuẩn quốc tế ISO/IEC 5218.
--  - catalog.code_list   : danh mục (gắn thuật ngữ QĐ 2768), nguồn, phiên bản
--  - catalog.code_value  : giá trị; giá trị biến mất ở phiên bản mới → đánh dấu ngừng dùng, KHÔNG xóa
--  - catalog.value_map   : giá trị nội bộ của từng cột → mã chuẩn
--  - catalog.import_batch: lịch sử nạp
--  Ghi chỉ qua catalog.import_code_list() — chỉ Quản trị nền tảng.
-- =====================================================================
create schema if not exists catalog;
comment on schema catalog is 'Phân hệ 0.5 — Danh mục dùng chung (nguồn CSDL ngành của Bộ)';

create table catalog.code_list (
  code text primary key check (code ~ '^[a-z][A-Za-z0-9]*$'),
  name text not null,
  term_code text references cfg.data_term (code),
  source text not null check (source in ('CSDL_NGANH', 'ISO_5218', 'NOI_BO_TAM')),
  version text,
  synced_at timestamptz,
  note text
);
comment on column catalog.code_list.code is 'Mã danh mục = tên kỹ thuật của thuật ngữ QĐ 2768 (vd. capHoc)';
comment on column catalog.code_list.source is 'CSDL_NGANH: chính thức từ Bộ · ISO_5218: chuẩn quốc tế được QĐ 2768 viện dẫn · NOI_BO_TAM: tạm thời, chờ thay';

create table catalog.code_value (
  list_code text not null references catalog.code_list (code) on delete cascade,
  code text not null check (char_length(code) between 1 and 50),
  name text not null check (char_length(name) between 1 and 255),
  sort int not null default 0,
  valid_from date,
  valid_to date,
  deprecated boolean not null default false,
  primary key (list_code, code),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table catalog.value_map (
  table_name text not null,
  column_name text not null,
  internal_value text not null,
  list_code text not null,
  code text not null,
  primary key (table_name, column_name, internal_value),
  foreign key (list_code, code) references catalog.code_value (list_code, code)
);
comment on table catalog.value_map is 'Quy đổi giá trị nội bộ → mã chuẩn khi trao đổi dữ liệu';

create table catalog.import_batch (
  id bigint generated always as identity primary key,
  list_code text not null references catalog.code_list (code),
  version text not null,
  source text not null,
  file_name text,
  inserted int not null,
  updated int not null,
  deprecated int not null,
  imported_by uuid default auth.uid(),
  imported_at timestamptz not null default now()
);

-- ---------- RPC nạp danh mục ----------
-- p = { "list": "capHoc", "version": "2026.10", "source": "CSDL_NGANH", "fileName": "...",
--       "values": [ { "code": "...", "name": "...", "validFrom": "YYYY-MM-DD"?, "validTo": ...? }, ... ] }
create function catalog.import_code_list(p jsonb) returns catalog.import_batch
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_list text := p ->> 'list';
  v_version text := nullif(trim(p ->> 'version'), '');
  v_source text := coalesce(p ->> 'source', 'CSDL_NGANH');
  v_values jsonb := p -> 'values';
  v_ins int := 0; v_upd int := 0; v_dep int := 0;
  v_batch catalog.import_batch;
begin
  if (iam.ctx()).scope_kind is distinct from 'PLATFORM' or not iam.has_perm('cfg.catalog.manage') then
    raise exception 'Chỉ Quản trị nền tảng được nạp danh mục' using errcode = '42501';
  end if;
  if not exists (select 1 from catalog.code_list where code = v_list) then
    raise exception 'Danh mục "%" không tồn tại', v_list using errcode = '22023';
  end if;
  if v_version is null then raise exception 'Thiếu phiên bản danh mục' using errcode = '22023'; end if;
  if v_source not in ('CSDL_NGANH', 'ISO_5218') then
    raise exception 'Nguồn nạp phải là CSDL_NGANH hoặc ISO_5218' using errcode = '22023';
  end if;
  if jsonb_typeof(v_values) <> 'array' or jsonb_array_length(v_values) = 0 then
    raise exception 'Danh sách giá trị rỗng' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(v_values) e
             where coalesce(trim(e ->> 'code'), '') = '' or coalesce(trim(e ->> 'name'), '') = '') then
    raise exception 'Có dòng thiếu mã hoặc tên' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(v_values)) <> (select count(distinct trim(e ->> 'code')) from jsonb_array_elements(v_values) e) then
    raise exception 'Có mã bị trùng trong file' using errcode = '22023';
  end if;

  with src as (
    select trim(e ->> 'code') as code, trim(e ->> 'name') as name, (ord - 1)::int as sort,
           nullif(e ->> 'validFrom', '')::date as vf, nullif(e ->> 'validTo', '')::date as vt
    from jsonb_array_elements(v_values) with ordinality as t(e, ord)
  ), up as (
    insert into catalog.code_value (list_code, code, name, sort, valid_from, valid_to, deprecated)
    select v_list, code, name, sort, vf, vt, false from src
    on conflict (list_code, code) do update
      set name = excluded.name, sort = excluded.sort, valid_from = excluded.valid_from,
          valid_to = excluded.valid_to, deprecated = false
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted) into v_ins, v_upd from up;

  update catalog.code_value set deprecated = true
  where list_code = v_list and not deprecated
    and code not in (select trim(e ->> 'code') from jsonb_array_elements(v_values) e);
  get diagnostics v_dep = row_count;

  update catalog.code_list set source = v_source, version = v_version, synced_at = now(), note = null where code = v_list;

  insert into catalog.import_batch (list_code, version, source, file_name, inserted, updated, deprecated)
  values (v_list, v_version, v_source, p ->> 'fileName', v_ins, v_upd, v_dep)
  returning * into v_batch;

  insert into audit.log (action, entity, entity_id, summary)
  values ('IMPORT', 'catalog.code_list', v_list,
          jsonb_build_object('version', v_version, 'source', v_source, 'inserted', v_ins, 'updated', v_upd, 'deprecated', v_dep));
  return v_batch;
end $$;

-- ---------- RLS & quyền ----------
alter table catalog.code_list enable row level security;
alter table catalog.code_value enable row level security;
alter table catalog.value_map enable row level security;
alter table catalog.import_batch enable row level security;
create policy code_list_read on catalog.code_list for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy code_value_read on catalog.code_value for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy value_map_read on catalog.value_map for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy import_batch_read on catalog.import_batch for select to authenticated using (iam.has_perm('cfg.setting.view'));

revoke all on all tables in schema catalog from anon, authenticated;
revoke all on all functions in schema catalog from public, anon;
grant usage on schema catalog to authenticated;
grant select on all tables in schema catalog to authenticated;
grant execute on function catalog.import_code_list(jsonb) to authenticated;
