-- =====================================================================
-- 0008 · PHÂN HỆ 4 · TỔ CHỨC DẠY HỌC — ghi hồ sơ (M2b)
--  RPC security definer: tổ chuyên môn, giáo viên (cán bộ/nhà giáo), phân công giảng dạy, lớp, học sinh.
--  Mọi hàm: kiểm quyền + đơn vị đích nằm trong phạm vi ngữ cảnh + nhất quán (cùng trường).
--  Không xóa cứng: tổ → INACTIVE; học sinh → trạng thái (chuyển trường/tốt nghiệp).
--  Mirror TS: src/domain/orgOps.ts (test đối chiếu quy tắc).
-- =====================================================================

-- Kiểm quyền + phạm vi, trả về trường chứa đơn vị
create function org.assert_scope(p_unit uuid, p_perm text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_school uuid;
begin
  if p_unit is null or not iam.has_perm(p_perm) or not iam.in_subtree((iam.ctx()).scope_unit_id, p_unit) then
    raise exception 'Không có quyền thao tác trên đơn vị này' using errcode = '42501';
  end if;
  v_school := iam.school_of(p_unit);
  if v_school is null then raise exception 'Đơn vị không thuộc cơ sở giáo dục nào' using errcode = '22023'; end if;
  return v_school;
end $$;

create function org.check_name(p text, p_label text) returns text
language plpgsql immutable set search_path = '' as $$
begin
  if p is null or char_length(trim(p)) not between 2 and 120 then
    raise exception '% phải từ 2 đến 120 ký tự', p_label using errcode = '22023';
  end if;
  return regexp_replace(trim(p), '\s+', ' ', 'g');
end $$;

-- ---------- Tổ chuyên môn ----------
-- p = { id?, schoolId, name, code?, status? }
create function org.upsert_department(p jsonb) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_school uuid := nullif(p ->> 'schoolId', '')::uuid;
  v_name text := org.check_name(p ->> 'name', 'Tên tổ');
  v_status text := coalesce(p ->> 'status', 'ACTIVE');
begin
  if v_id is not null then
    select parent_id into v_school from org.unit where id = v_id and type = 'TO';
    if v_school is null then raise exception 'Không tìm thấy tổ' using errcode = '22023'; end if;
  end if;
  perform org.assert_scope(v_school, 'org.unit.manage');
  if (select type from org.unit where id = v_school) <> 'TRUONG' then
    raise exception 'Tổ chuyên môn phải thuộc một trường' using errcode = '22023';
  end if;
  if v_status not in ('ACTIVE', 'INACTIVE') then raise exception 'Trạng thái không hợp lệ' using errcode = '22023'; end if;
  if exists (select 1 from org.unit where parent_id = v_school and type = 'TO' and lower(name) = lower(v_name) and id is distinct from v_id) then
    raise exception 'Trường đã có tổ "%"', v_name using errcode = '23505';
  end if;
  if v_status = 'INACTIVE' and exists (select 1 from org.class where department_id = v_id) then
    raise exception 'Tổ còn quản lý lớp, cần chuyển lớp sang tổ khác trước khi ngừng' using errcode = '22023';
  end if;
  if v_id is null then
    insert into org.unit (parent_id, type, code, name, status)
    values (v_school, 'TO', coalesce(nullif(trim(p ->> 'code'), ''), 'TO-' || substr(gen_random_uuid()::text, 1, 8)), v_name, v_status)
    returning id into v_id;
  else
    update org.unit set name = v_name, status = v_status where id = v_id;
  end if;
  return v_id;
end $$;

-- ---------- Giáo viên (cán bộ/nhà giáo) ----------
-- p = { personId?, unitId (trường hoặc tổ), fullName, gender, position, birthDate?, phone? }
create function org.upsert_teacher(p jsonb) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_person uuid := nullif(p ->> 'personId', '')::uuid;
  v_unit uuid := nullif(p ->> 'unitId', '')::uuid;
  v_name text := org.check_name(p ->> 'fullName', 'Họ và tên');
  v_gender text := nullif(p ->> 'gender', '');
  v_position text := coalesce(nullif(trim(p ->> 'position'), ''), 'Giáo viên');
  v_school uuid := org.assert_scope(v_unit, 'org.person.manage');
  v_old_school uuid;
begin
  if v_gender is not null and v_gender not in ('NAM', 'NU') then raise exception 'Giới tính không hợp lệ' using errcode = '22023'; end if;
  if (select type from org.unit where id = v_unit) not in ('TRUONG', 'TO') then
    raise exception 'Giáo viên phải thuộc trường hoặc tổ' using errcode = '22023';
  end if;
  if nullif(p ->> 'phone', '') is not null and p ->> 'phone' !~ '^[0-9+ ]{8,15}$' then
    raise exception 'Số điện thoại không hợp lệ' using errcode = '22023';
  end if;
  if v_person is null then
    insert into iam.person (full_name, gender) values (v_name, v_gender) returning id into v_person;
    insert into iam.person_private (person_id, birth_date, phone)
    values (v_person, nullif(p ->> 'birthDate', '')::date, nullif(p ->> 'phone', ''));
  else
    select iam.school_of(s.unit_id) into v_old_school from org.staff_membership s where s.person_id = v_person limit 1;
    if v_old_school is distinct from v_school then
      raise exception 'Chỉ sửa được giáo viên thuộc trường của bạn' using errcode = '42501';
    end if;
    update iam.person set full_name = v_name, gender = v_gender where id = v_person;
    update iam.person_private set birth_date = nullif(p ->> 'birthDate', '')::date, phone = nullif(p ->> 'phone', ''),
      updated_at = now() where person_id = v_person;
    delete from org.staff_membership where person_id = v_person and iam.school_of(unit_id) = v_school;
  end if;
  insert into org.staff_membership (person_id, unit_id, position) values (v_person, v_unit, v_position);
  return v_person;
end $$;

-- ---------- Phân công giảng dạy ----------
-- p = { personId, classId, subject, remove? }
create function org.set_teaching(p jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_person uuid := (p ->> 'personId')::uuid;
  v_class uuid := (p ->> 'classId')::uuid;
  v_subject text := trim(coalesce(p ->> 'subject', ''));
  v_school uuid;
begin
  select school_id into v_school from org.class where id = v_class;
  perform org.assert_scope(v_school, 'org.class.manage');
  if char_length(v_subject) not between 2 and 80 then raise exception 'Tên môn phải từ 2 đến 80 ký tự' using errcode = '22023'; end if;
  if not exists (select 1 from org.staff_membership s where s.person_id = v_person and iam.school_of(s.unit_id) = v_school) then
    raise exception 'Giáo viên không thuộc trường của lớp' using errcode = '22023';
  end if;
  if coalesce((p ->> 'remove')::boolean, false) then
    delete from org.teaching_assignment where person_id = v_person and class_id = v_class and subject = v_subject;
  else
    insert into org.teaching_assignment (person_id, class_id, subject) values (v_person, v_class, v_subject)
    on conflict do nothing;
  end if;
end $$;

-- ---------- Lớp ----------
-- p = { id?, schoolId, departmentId?, name, grade, maLop?, homeroomPersonId? }
create function org.upsert_class(p jsonb) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_school uuid := nullif(p ->> 'schoolId', '')::uuid;
  v_dept uuid := nullif(p ->> 'departmentId', '')::uuid;
  v_home uuid := nullif(p ->> 'homeroomPersonId', '')::uuid;
  v_name text := trim(coalesce(p ->> 'name', ''));
  v_grade int := (p ->> 'grade')::int;
  v_year uuid;
begin
  if v_id is not null then select school_id into v_school from org.class where id = v_id; end if;
  perform org.assert_scope(v_school, 'org.class.manage');
  if char_length(v_name) not between 1 and 20 then raise exception 'Tên lớp phải từ 1 đến 20 ký tự' using errcode = '22023'; end if;
  if v_grade is null or v_grade not between 0 and 12 then raise exception 'Khối không hợp lệ' using errcode = '22023'; end if;
  if v_dept is not null and not exists (select 1 from org.unit where id = v_dept and parent_id = v_school and type = 'TO' and status = 'ACTIVE') then
    raise exception 'Tổ không thuộc trường hoặc đã ngừng' using errcode = '22023';
  end if;
  if v_home is not null and not exists (select 1 from org.staff_membership s where s.person_id = v_home and iam.school_of(s.unit_id) = v_school) then
    raise exception 'Giáo viên chủ nhiệm không thuộc trường' using errcode = '22023';
  end if;
  select id into v_year from org.academic_year where is_current;
  if v_id is null then
    insert into org.class (school_id, department_id, academic_year_id, name, grade, ma_lop, homeroom_person_id)
    values (v_school, v_dept, v_year, v_name, v_grade, nullif(trim(p ->> 'maLop'), ''), v_home) returning id into v_id;
  else
    update org.class set department_id = v_dept, name = v_name, grade = v_grade,
      ma_lop = nullif(trim(p ->> 'maLop'), ''), homeroom_person_id = v_home where id = v_id;
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'Trường đã có lớp "%" trong năm học này', v_name using errcode = '23505';
end $$;

-- ---------- Học sinh ----------
-- p = { personId?, classId, fullName, gender, birthDate?, studentCode }
create function org.upsert_student(p jsonb) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_person uuid := nullif(p ->> 'personId', '')::uuid;
  v_class uuid := (p ->> 'classId')::uuid;
  v_name text := org.check_name(p ->> 'fullName', 'Họ và tên');
  v_gender text := nullif(p ->> 'gender', '');
  v_code text := upper(trim(coalesce(p ->> 'studentCode', '')));
  v_school uuid;
  v_old_class uuid;
begin
  select school_id into v_school from org.class where id = v_class;
  perform org.assert_scope(v_school, 'org.person.manage');
  if v_gender is not null and v_gender not in ('NAM', 'NU') then raise exception 'Giới tính không hợp lệ' using errcode = '22023'; end if;
  if v_code !~ '^[A-Z0-9_-]{3,30}$' then raise exception 'Mã học sinh 3–30 ký tự (chữ, số, - _)' using errcode = '22023'; end if;
  if exists (select 1 from org.enrollment where student_code = v_code and student_person_id is distinct from v_person) then
    raise exception 'Mã học sinh "%" đã tồn tại', v_code using errcode = '23505';
  end if;
  if v_person is null then
    insert into iam.person (full_name, gender) values (v_name, v_gender) returning id into v_person;
    insert into iam.person_private (person_id, birth_date) values (v_person, nullif(p ->> 'birthDate', '')::date);
    insert into org.enrollment (student_person_id, class_id, status, student_code) values (v_person, v_class, 'STUDYING', v_code);
  else
    select e.class_id into v_old_class from org.enrollment e where e.student_person_id = v_person and e.status = 'STUDYING';
    if v_old_class is null or (select school_id from org.class where id = v_old_class) <> v_school then
      raise exception 'Chỉ sửa được học sinh đang học tại trường của bạn' using errcode = '42501';
    end if;
    update iam.person set full_name = v_name, gender = v_gender where id = v_person;
    update iam.person_private set birth_date = nullif(p ->> 'birthDate', '')::date, updated_at = now() where person_id = v_person;
    update org.enrollment set class_id = v_class, student_code = v_code where student_person_id = v_person and class_id = v_old_class;
  end if;
  return v_person;
end $$;

-- Đổi trạng thái học sinh (chuyển trường / tốt nghiệp / học lại) — không xóa hồ sơ
create function org.set_student_status(p_person uuid, p_status text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_class uuid;
begin
  select class_id into v_class from org.enrollment where student_person_id = p_person
  order by (status = 'STUDYING') desc limit 1;
  perform org.assert_scope((select school_id from org.class where id = v_class), 'org.person.manage');
  if p_status not in ('STUDYING', 'TRANSFERRED', 'GRADUATED') then raise exception 'Trạng thái không hợp lệ' using errcode = '22023'; end if;
  update org.enrollment set status = p_status where student_person_id = p_person and class_id = v_class;
end $$;

-- ---------- Nhật ký ----------
create trigger audit_unit after insert or update or delete on org.unit
for each row execute function audit.capture('parent_id');
create trigger audit_class after insert or update or delete on org.class
for each row execute function audit.capture('school_id');
create trigger audit_staff after insert or update or delete on org.staff_membership
for each row execute function audit.capture('unit_id');
create trigger audit_teaching after insert or update or delete on org.teaching_assignment
for each row execute function audit.capture('-');
create trigger audit_enrollment after insert or update or delete on org.enrollment
for each row execute function audit.capture('-', 'pii');
create trigger audit_person after insert or update or delete on iam.person
for each row execute function audit.capture('-', 'pii');

-- ---------- Quyền gọi ----------
revoke all on function org.assert_scope(uuid, text), org.check_name(text, text) from public, anon, authenticated;
grant execute on function
  org.upsert_department(jsonb), org.upsert_teacher(jsonb), org.set_teaching(jsonb), org.upsert_class(jsonb),
  org.upsert_student(jsonb), org.set_student_status(uuid, text)
  to authenticated;
