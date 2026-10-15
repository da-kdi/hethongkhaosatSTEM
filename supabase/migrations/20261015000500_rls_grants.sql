-- =====================================================================
-- 0005 · RLS & GRANTS
-- Mặc định: authenticated chỉ ĐỌC qua RLS; GHI chỉ qua RPC security definer
-- (kiểm quyền + workflow + audit tập trung). anon không có quyền gì.
-- =====================================================================

-- Bật RLS cho mọi bảng nghiệp vụ
alter table org.unit enable row level security;
alter table org.unit_closure enable row level security;
alter table org.academic_year enable row level security;
alter table org.class enable row level security;
alter table org.staff_membership enable row level security;
alter table org.teaching_assignment enable row level security;
alter table org.enrollment enable row level security;
alter table iam.person enable row level security;
alter table iam.person_private enable row level security;
alter table iam.account enable row level security;
alter table iam.permission enable row level security;
alter table iam.role enable row level security;
alter table iam.role_permission enable row level security;
alter table iam.role_assignment enable row level security;
alter table iam.guardian_link enable row level security;
alter table iam.provider_grant enable row level security;
alter table cfg.setting enable row level security;
alter table cfg.setting_history enable row level security;
alter table cfg.term_label enable row level security;
alter table audit.log enable row level security;

-- ---------- org ----------
create policy unit_read on org.unit for select to authenticated using (iam.can_see_unit(id));
create policy closure_read on org.unit_closure for select to authenticated using (iam.can_see_unit(descendant_id));
create policy year_read on org.academic_year for select to authenticated using ((iam.ctx()).assignment_id is not null);
create policy class_read on org.class for select to authenticated using (iam.can_see_class(id));
create policy staff_read on org.staff_membership for select to authenticated using (iam.can_see_person(person_id));
create policy teaching_read on org.teaching_assignment for select to authenticated using (iam.can_see_class(class_id));
create policy enrollment_read on org.enrollment for select to authenticated using (iam.can_see_person(student_person_id));

-- ---------- iam ----------
create policy person_read on iam.person for select to authenticated using (iam.can_see_person(id));
create policy person_private_read on iam.person_private for select to authenticated using (iam.can_see_personal(person_id));
create policy account_read on iam.account for select to authenticated
  using (id = auth.uid() or (iam.has_perm('iam.account.view') and iam.can_see_person(person_id)));
create policy permission_read on iam.permission for select to authenticated using (true);
create policy role_read on iam.role for select to authenticated using (true);
create policy role_permission_read on iam.role_permission for select to authenticated using (true);
create policy assignment_read on iam.role_assignment for select to authenticated
  using (account_id = auth.uid()
         or (iam.has_perm('iam.account.view') and iam.in_subtree((iam.ctx()).scope_unit_id, scope_unit_id)));
create policy guardian_link_read on iam.guardian_link for select to authenticated
  using (guardian_person_id = (iam.ctx()).person_id
         or (iam.has_perm('iam.guardian.approve') and iam.can_see_person(student_person_id)));
create policy grant_read on iam.provider_grant for select to authenticated
  using (((iam.ctx()).scope_kind = 'GRANT' and provider_unit_id = (iam.ctx()).scope_unit_id)
         or ((iam.ctx()).scope_kind = 'UNIT_SUBTREE' and iam.in_subtree((iam.ctx()).scope_unit_id, school_unit_id)));

-- ---------- cfg ----------
create policy setting_read on cfg.setting for select to authenticated
  using (iam.has_perm('cfg.setting.view') and iam.can_see_unit(unit_id));
create policy setting_history_read on cfg.setting_history for select to authenticated
  using (iam.has_perm('cfg.setting.view') and iam.can_see_unit(unit_id));
create policy term_label_read on cfg.term_label for select to authenticated using (iam.can_see_unit(unit_id));

-- ---------- audit ----------
create policy audit_read on audit.log for select to authenticated
  using (iam.has_perm('audit.log.view')
         and (actor_account = auth.uid()
              or (unit_id is not null and iam.in_subtree((iam.ctx()).scope_unit_id, unit_id))
              or (iam.ctx()).scope_kind = 'PLATFORM'));

-- ---------- GRANTS ----------
revoke all on all tables in schema org, iam, cfg, audit from anon, authenticated;
revoke all on all functions in schema org, iam, cfg, audit from public, anon;

grant usage on schema org, iam, cfg, audit to authenticated;
grant select on all tables in schema org, iam, cfg, audit to authenticated;

grant execute on function
  iam.my_contexts(), iam.switch_context(uuid), iam.ctx(), iam.has_perm(text),
  cfg.effective(uuid, text), cfg.module_enabled(uuid, text), cfg.set_setting(uuid, text, jsonb, text), cfg.my_modules()
  to authenticated;
-- Hàm phạm vi được policy gọi → cần execute cho authenticated
grant execute on function
  iam.today(), iam.in_subtree(uuid, uuid), iam.school_of(uuid), iam.student_class(uuid), iam.my_teaching_classes(),
  iam.linked_children(), iam.active_grants(), iam.can_see_unit(uuid), iam.can_see_class(uuid),
  iam.can_see_person(uuid), iam.can_see_personal(uuid)
  to authenticated;

-- Token hook chỉ dành cho Supabase Auth
grant usage on schema iam to supabase_auth_admin;
grant execute on function iam.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on iam.account, iam.role_assignment to supabase_auth_admin;
revoke execute on function iam.custom_access_token_hook(jsonb) from authenticated;
create policy hook_account_read on iam.account for select to supabase_auth_admin using (true);
create policy hook_assignment_read on iam.role_assignment for select to supabase_auth_admin using (true);
