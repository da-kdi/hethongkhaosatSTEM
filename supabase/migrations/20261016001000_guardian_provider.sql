-- =====================================================================
-- 0010 · W8 LIÊN KẾT PHỤ HUYNH + HỒ SƠ NHÀ CUNG CẤP (M2c-2)
--  Mirror TS: src/domain/guardian.ts, src/domain/provider.ts
--  Quyết định D5: mã mời một lần + đối chiếu SĐT (đã xác thực OTP khi PH đăng nhập); trường duyệt là dự phòng.
-- =====================================================================

-- ---------- Mã mời ----------
create table iam.guardian_invite (
  id uuid primary key default gen_random_uuid(),
  student_person_id uuid not null references iam.person (id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'), -- SHA-256 của mã đã chuẩn hóa; không lưu mã gốc
  relation text not null check (relation in ('CHA', 'ME', 'NGUOI_GIAM_HO')),
  phone text check (phone ~ '^0[0-9]{9,10}$'),
  expires_at date not null,
  created_at timestamptz not null default now(),
  created_by uuid references iam.account (id) default auth.uid(),
  used_at timestamptz,
  used_by_person_id uuid references iam.person (id),
  revoked_at timestamptz
);
create index guardian_invite_student_idx on iam.guardian_invite (student_person_id);

alter table iam.guardian_link add column revoked_at timestamptz;

-- ---------- Hồ sơ nhà cung cấp ----------
create table org.provider_profile (
  unit_id uuid primary key references org.unit (id) on delete cascade,
  ma_dinh_danh_to_chuc text check (ma_dinh_danh_to_chuc ~ '^[0-9A-Za-z-]{6,35}$'),
  loai_to_chuc text check (length(loai_to_chuc) <= 100),
  address text check (length(address) <= 200),
  website text check (website ~ '^https://\S+$'),
  contact_name text check (length(contact_name) <= 120),
  contact_email text check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text check (contact_phone ~ '^[0-9+ ]{8,15}$'),
  fields text[] not null default '{}',
  description text check (length(description) <= 1000),
  updated_at timestamptz not null default now(),
  updated_by uuid references iam.account (id) default auth.uid()
);
comment on column org.provider_profile.ma_dinh_danh_to_chuc is 'BG_00420 maDinhDanhToChuc';
comment on column org.provider_profile.loai_to_chuc is 'BG_00811 loaiToChucHopTacDn';

create function org.provider_profile_unit_check() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from org.unit where id = new.unit_id and type = 'NCC') then
    raise exception 'Hồ sơ nhà cung cấp chỉ gắn với đơn vị loại NCC' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger provider_profile_unit_check before insert or update on org.provider_profile
for each row execute function org.provider_profile_unit_check();

-- ---------- RLS ----------
alter table iam.guardian_invite enable row level security;
alter table org.provider_profile enable row level security;

create policy guardian_invite_read on iam.guardian_invite for select to authenticated
  using (iam.has_perm('iam.guardian.approve') and iam.can_see_person(student_person_id));

create policy provider_profile_read on org.provider_profile for select to authenticated
  using (((iam.ctx()).scope_kind = 'GRANT' and unit_id = (iam.ctx()).scope_unit_id)
         or (iam.ctx()).scope_kind in ('PLATFORM', 'UNIT_SUBTREE'));

-- Không cấp đọc cột code_hash (chống dò mã ngoại tuyến), kể cả với người phát mã
revoke all on iam.guardian_invite from anon, authenticated;
grant select (id, student_person_id, relation, phone, expires_at, created_at, created_by, used_at, used_by_person_id, revoked_at)
  on iam.guardian_invite to authenticated;
revoke all on org.provider_profile from anon;
grant select on org.provider_profile to authenticated;

-- ---------- Hàm hỗ trợ ----------
create function iam.student_school(p_student uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select c.school_id from org.enrollment e join org.class c on c.id = e.class_id
  where e.student_person_id = p_student and e.status = 'STUDYING' limit 1
$$;

create function iam.assert_link_approver(p_student uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_school uuid := iam.student_school(p_student);
begin
  if not iam.has_perm('iam.guardian.approve') or v_school is null
     or (iam.ctx()).scope_kind <> 'UNIT_SUBTREE' or not iam.in_subtree((iam.ctx()).scope_unit_id, v_school) then
    raise exception 'Không có quyền quản lý liên kết của học sinh này' using errcode = '42501';
  end if;
  return v_school;
end $$;

-- 31/8 của năm kết thúc năm học hiện hành
create function iam.link_expiry() returns date
language sql stable security definer set search_path = '' as $$
  select make_date(extract(year from coalesce((select end_date from org.academic_year where is_current), iam.today()))::int, 8, 31)
$$;

create function iam.norm_code(p text) returns text
language sql immutable set search_path = '' as $$ select regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g') $$;

create function iam.hash_code(p text) returns text
language sql immutable set search_path = '' as $$ select encode(sha256(convert_to(iam.norm_code(p), 'UTF8')), 'hex') $$;

-- Mã 8 ký tự từ bảng chữ không gây nhầm, lấy mẫu loại bỏ trên byte ngẫu nhiên (gen_random_uuid dùng CSPRNG)
create function iam.generate_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea; i int; v int; out text := '';
begin
  while length(out) < 8 loop
    b := uuid_send(gen_random_uuid());
    foreach i in array array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15] loop -- bỏ byte 6, 8 (bit phiên bản/biến thể)
      v := get_byte(b, i);
      if v < 248 and length(out) < 8 then out := out || substr(a, (v % 31) + 1, 1); end if;
    end loop;
  end loop;
  return substr(out, 1, 4) || '-' || substr(out, 5, 4);
end $$;

-- ---------- RPC phía trường ----------
-- p = { studentPersonId, relation, phone? } → trả mã gốc (hiển thị một lần)
create function iam.issue_guardian_invite(p jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_student uuid := (p ->> 'studentPersonId')::uuid;
  v_phone text := nullif(regexp_replace(regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9]', '', 'g'), '^84', '0'), '');
  v_code text;
begin
  perform iam.assert_link_approver(v_student);
  if coalesce(p ->> 'relation', '') not in ('CHA', 'ME', 'NGUOI_GIAM_HO') then raise exception 'Quan hệ không hợp lệ' using errcode = '22023'; end if;
  if nullif(p ->> 'phone', '') is not null and v_phone !~ '^0[0-9]{9,10}$' then
    raise exception 'Số điện thoại phụ huynh không hợp lệ' using errcode = '22023';
  end if;
  v_code := iam.generate_code();
  insert into iam.guardian_invite (student_person_id, code_hash, relation, phone, expires_at)
  values (v_student, iam.hash_code(v_code), p ->> 'relation', v_phone, iam.today() + 14);
  return v_code;
end $$;

create function iam.revoke_guardian_invite(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v iam.guardian_invite;
begin
  select * into v from iam.guardian_invite where id = p_id;
  if v.id is null then raise exception 'Không tìm thấy mã mời' using errcode = 'P0002'; end if;
  perform iam.assert_link_approver(v.student_person_id);
  if v.used_at is not null or v.revoked_at is not null then raise exception 'Mã mời đã dùng hoặc đã thu hồi' using errcode = '22023'; end if;
  update iam.guardian_invite set revoked_at = now() where id = p_id;
end $$;

create function iam.approve_guardian_link(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v iam.guardian_link;
begin
  select * into v from iam.guardian_link where id = p_id;
  if v.id is null then raise exception 'Không tìm thấy liên kết' using errcode = 'P0002'; end if;
  perform iam.assert_link_approver(v.student_person_id);
  if v.status <> 'PENDING' then raise exception 'Chỉ duyệt được liên kết đang chờ' using errcode = '22023'; end if;
  update iam.guardian_link set status = 'VERIFIED', method = 'TEACHER_APPROVAL', verified_at = now(),
    verified_by = (iam.ctx()).account_id, expires_at = iam.link_expiry(), revoked_at = null where id = p_id;
end $$;

create function iam.revoke_guardian_link(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v iam.guardian_link;
begin
  select * into v from iam.guardian_link where id = p_id;
  if v.id is null then raise exception 'Không tìm thấy liên kết' using errcode = 'P0002'; end if;
  perform iam.assert_link_approver(v.student_person_id);
  if v.status = 'REVOKED' then raise exception 'Liên kết đã bị thu hồi' using errcode = '22023'; end if;
  update iam.guardian_link set status = 'REVOKED', revoked_at = now() where id = p_id;
end $$;

-- Danh sách liên kết cho người duyệt, kèm tên phụ huynh (RLS iam.person không cho trường xem người ngoài trường;
-- tên PH là tối thiểu cần thiết để duyệt). Mirror: linksForApprover()
create function iam.guardian_links_for_approver()
returns table (id uuid, student_person_id uuid, guardian_person_id uuid, guardian_name text, relation text, status text,
               method text, verified_at timestamptz, expires_at date)
language sql stable security definer set search_path = '' as $$
  select l.id, l.student_person_id, l.guardian_person_id, g.full_name, l.relation, l.status, l.method, l.verified_at, l.expires_at
  from iam.guardian_link l join iam.person g on g.id = l.guardian_person_id
  where iam.has_perm('iam.guardian.approve') and iam.can_see_person(l.student_person_id)
$$;

-- ---------- RPC phía phụ huynh ----------
-- Sai mã KHÔNG raise (để giữ dòng nhật ký LINK_CODE_FAIL dùng đếm khóa) mà trả { error }.
create function iam.redeem_guardian_code(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  c iam.ctx_t := iam.ctx();
  v_fail int;
  v iam.guardian_invite;
  v_phone text;
  v_existing iam.guardian_link;
  v_status text;
  v_link uuid;
begin
  if not iam.has_perm('iam.guardian.request') or c.scope_kind <> 'LINKED' then
    raise exception 'Chỉ tài khoản phụ huynh được nhập mã liên kết' using errcode = '42501';
  end if;
  select count(*) into v_fail from audit.log
  where action = 'LINK_CODE_FAIL' and actor_account = c.account_id and at > now() - interval '24 hours';
  if v_fail >= 5 then
    raise exception 'Đã nhập sai quá 5 lần trong 24 giờ. Vui lòng thử lại sau hoặc liên hệ nhà trường.' using errcode = '42501';
  end if;
  select * into v from iam.guardian_invite where code_hash = iam.hash_code(p_code)
    and length(iam.norm_code(p_code)) = 8 and used_at is null and revoked_at is null and expires_at >= iam.today();
  if v.id is null then
    insert into audit.log (action, entity, entity_id, summary)
    values ('LINK_CODE_FAIL', 'iam.guardian_invite', '—', jsonb_build_object('attempt', v_fail + 1));
    return jsonb_build_object('error', 'Mã không đúng, đã dùng hoặc đã hết hạn');
  end if;
  if iam.student_school(v.student_person_id) is null then
    raise exception 'Học sinh không còn theo học — liên hệ nhà trường' using errcode = '22023';
  end if;
  select * into v_existing from iam.guardian_link where guardian_person_id = c.person_id and student_person_id = v.student_person_id;
  if v_existing.status = 'VERIFIED' then raise exception 'Bạn đã liên kết với học sinh này' using errcode = '23505'; end if;
  select regexp_replace(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '^84', '0') into v_phone
  from iam.person_private where person_id = c.person_id;
  v_status := case when v.phone is not null and v_phone = v.phone then 'VERIFIED' else 'PENDING' end;
  if v_existing.id is null then
    insert into iam.guardian_link (guardian_person_id, student_person_id, relation, status, method, verified_at, expires_at)
    values (c.person_id, v.student_person_id, v.relation, v_status,
            case when v_status = 'VERIFIED' then 'INVITE_OTP' end,
            case when v_status = 'VERIFIED' then now() end,
            case when v_status = 'VERIFIED' then iam.link_expiry() end)
    returning id into v_link;
  else
    update iam.guardian_link set relation = v.relation, status = v_status,
      method = case when v_status = 'VERIFIED' then 'INVITE_OTP' end,
      verified_at = case when v_status = 'VERIFIED' then now() end, verified_by = null,
      expires_at = case when v_status = 'VERIFIED' then iam.link_expiry() end, revoked_at = null
    where id = v_existing.id returning id into v_link;
  end if;
  update iam.guardian_invite set used_at = now(), used_by_person_id = c.person_id where id = v.id;
  return jsonb_build_object('linkId', v_link, 'status', v_status,
    'studentName', (select full_name from iam.person where id = v.student_person_id));
end $$;

-- ---------- Chuyển trường/tốt nghiệp → thu hồi liên kết ----------
create function org.revoke_guardian_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'STUDYING' and not exists (
    select 1 from org.enrollment where student_person_id = new.student_person_id and status = 'STUDYING') then
    update iam.guardian_link set status = 'REVOKED', revoked_at = now()
    where student_person_id = new.student_person_id and status <> 'REVOKED';
    update iam.guardian_invite set revoked_at = now()
    where student_person_id = new.student_person_id and used_at is null and revoked_at is null;
  end if;
  return null;
end $$;
create trigger enrollment_revoke_guardian_links after update of status on org.enrollment
for each row when (old.status is distinct from new.status) execute function org.revoke_guardian_links();

-- ---------- Hồ sơ nhà cung cấp ----------
create function org.upsert_provider_profile(p jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  c iam.ctx_t := iam.ctx();
  v_name text := org.check_name(p ->> 'name', 'Tên đơn vị');
  v_fields text[] := array(select distinct x from jsonb_array_elements_text(coalesce(p -> 'fields', '[]')) x
    where x in ('Robotics', 'Lập trình', 'IoT', 'Trí tuệ nhân tạo', 'Khoa học tự nhiên', 'Toán học ứng dụng', 'Kỹ thuật – Cơ khí', 'Thiết bị', 'Đào tạo giáo viên'));
begin
  if not iam.has_perm('org.provider.manage') or c.scope_kind <> 'GRANT' or c.scope_unit_type <> 'NCC' then
    raise exception 'Chỉ quản trị nhà cung cấp được sửa hồ sơ của đơn vị mình' using errcode = '42501';
  end if;
  update org.unit set name = v_name where id = c.scope_unit_id;
  insert into org.provider_profile as t (unit_id, ma_dinh_danh_to_chuc, loai_to_chuc, address, website, contact_name,
    contact_email, contact_phone, fields, description)
  values (c.scope_unit_id, nullif(trim(p ->> 'maDinhDanhToChuc'), ''), nullif(trim(p ->> 'loaiToChuc'), ''), nullif(trim(p ->> 'address'), ''),
    nullif(trim(p ->> 'website'), ''), nullif(trim(p ->> 'contactName'), ''), nullif(trim(p ->> 'contactEmail'), ''),
    nullif(trim(p ->> 'contactPhone'), ''), v_fields, nullif(trim(p ->> 'description'), ''))
  on conflict (unit_id) do update set ma_dinh_danh_to_chuc = excluded.ma_dinh_danh_to_chuc, loai_to_chuc = excluded.loai_to_chuc,
    address = excluded.address, website = excluded.website, contact_name = excluded.contact_name,
    contact_email = excluded.contact_email, contact_phone = excluded.contact_phone, fields = excluded.fields,
    description = excluded.description, updated_at = now(), updated_by = auth.uid();
exception when check_violation then
  raise exception 'Dữ liệu hồ sơ không hợp lệ (mã định danh, website https://, email hoặc số điện thoại)' using errcode = '23514';
end $$;

-- ---------- Nhật ký ----------
create trigger audit_guardian_invite after insert or update on iam.guardian_invite
for each row execute function audit.capture('-', 'pii');
create trigger audit_provider_profile after insert or update on org.provider_profile
for each row execute function audit.capture('unit_id', 'pii');

revoke all on function iam.student_school(uuid), iam.assert_link_approver(uuid), iam.link_expiry(), iam.generate_code(),
  iam.norm_code(text), iam.hash_code(text) from public, anon, authenticated;
grant execute on function iam.guardian_links_for_approver(), iam.issue_guardian_invite(jsonb), iam.revoke_guardian_invite(uuid), iam.approve_guardian_link(uuid),
  iam.revoke_guardian_link(uuid), iam.redeem_guardian_code(text), org.upsert_provider_profile(jsonb) to authenticated;
