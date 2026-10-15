-- =====================================================================
-- 0004 · AUDIT: nhật ký append-only.
-- Nguyên tắc: KHÔNG lưu giá trị dữ liệu cá nhân — chỉ ghi tên cột thay đổi.
-- =====================================================================

-- Đọc claim ngữ cảnh an toàn (claim sai định dạng → null, không lỗi)
create function audit.claim_assignment() returns uuid
language sql stable set search_path = '' as $$
  select case when (auth.jwt() ->> 'active_assignment_id') ~ '^[0-9a-f-]{36}$'
              then (auth.jwt() ->> 'active_assignment_id')::uuid end
$$;

create table audit.log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_account uuid default auth.uid(),
  active_assignment uuid default audit.claim_assignment(),
  action text not null,
  entity text not null,
  entity_id text,
  unit_id uuid,
  summary jsonb not null default '{}'::jsonb
);
create index audit_log_unit_idx on audit.log (unit_id, at desc);

-- Chặn sửa/xóa (kể cả chủ sở hữu bảng)
create function audit.deny_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit.log là append-only' using errcode = '42501';
end $$;
create trigger audit_log_no_update before update or delete on audit.log
for each row execute function audit.deny_mutation();
create trigger audit_log_no_truncate before truncate on audit.log
for each statement execute function audit.deny_mutation();

-- Trigger ghi nhật ký chung.
--   TG_ARGV[0]: tên cột chứa unit_id (hoặc '-' nếu không có)
--   TG_ARGV[1]: 'pii' → chỉ ghi tên cột thay đổi, không ghi giá trị
create function audit.capture() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_unit uuid;
  v_summary jsonb;
  v_changed text[];
begin
  if tg_argv[0] <> '-' then v_unit := (v_row ->> tg_argv[0])::uuid; end if;
  select array_agg(k order by k) into v_changed
  from jsonb_object_keys(coalesce(v_new, '{}'::jsonb) || coalesce(v_old, '{}'::jsonb)) k
  where (v_new -> k) is distinct from (v_old -> k);
  if coalesce(tg_argv[1], '') = 'pii' then
    v_summary := jsonb_build_object('changed', to_jsonb(v_changed));
  else
    v_summary := jsonb_build_object('changed', to_jsonb(v_changed),
      'new', (select jsonb_object_agg(k, v_new -> k) from unnest(v_changed) k where v_new is not null));
  end if;
  insert into audit.log (action, entity, entity_id, unit_id, summary)
  values (tg_op, tg_table_schema || '.' || tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'person_id'), v_unit, v_summary);
  return null;
end $$;

create trigger audit_role_assignment after insert or update or delete on iam.role_assignment
for each row execute function audit.capture('scope_unit_id');
create trigger audit_role_permission after insert or delete on iam.role_permission
for each row execute function audit.capture('-');
create trigger audit_guardian_link after insert or update or delete on iam.guardian_link
for each row execute function audit.capture('-');
create trigger audit_provider_grant after insert or update or delete on iam.provider_grant
for each row execute function audit.capture('school_unit_id');
create trigger audit_setting after insert or update or delete on cfg.setting
for each row execute function audit.capture('unit_id');
create trigger audit_person_private after insert or update or delete on iam.person_private
for each row execute function audit.capture('-', 'pii');
create trigger audit_account after update of status on iam.account
for each row execute function audit.capture('-');
