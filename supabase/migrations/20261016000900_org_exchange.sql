-- =====================================================================
-- 0009 · NHẬP/XUẤT HỒ SƠ THEO TÊN KỸ THUẬT QĐ 2768 (M2c-1)
--  Client đọc tệp, chuẩn hóa ô (ngày ISO, giới tính NAM/NU) rồi gửi cả lô.
--  Server KHÔNG tin client: mỗi dòng đi qua đúng RPC ghi hồ sơ (org.upsert_*), tra lớp/tổ theo tên
--  trong trường của ngữ cảnh. Lỗi một dòng → hủy cả lô (tất cả hoặc không), thông báo kèm số dòng.
--  Mirror TS: src/domain/exchange.ts
-- =====================================================================

create function org.my_school() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v uuid := iam.school_of((iam.ctx()).scope_unit_id);
begin
  if v is null then raise exception 'Chỉ nhập hồ sơ trong ngữ cảnh một trường' using errcode = '42501'; end if;
  return v;
end $$;

-- p = { fileName, rows: [ { row, maHocSinh, hoTenNh, gioiTinh (NAM|NU|null), ngaySinhNh, tenLop, trangThaiNh? } ] }
create function org.import_students(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_school uuid := org.my_school();
  r jsonb; v_row int; v_class uuid; v_person uuid; v_existing uuid; v_code text;
  v_created int := 0; v_updated int := 0;
begin
  if not iam.has_perm('org.person.manage') then raise exception 'Không có quyền nhập hồ sơ' using errcode = '42501'; end if;
  if jsonb_array_length(coalesce(p -> 'rows', '[]')) > 5000 then raise exception 'Vượt giới hạn 5000 dòng mỗi lần nhập' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p -> 'rows') loop
    v_row := (r ->> 'row')::int;
    begin
      v_code := upper(trim(coalesce(r ->> 'maHocSinh', '')));
      select id into v_class from org.class where school_id = v_school and lower(name) = lower(trim(r ->> 'tenLop'));
      if v_class is null then raise exception 'Không có lớp "%" trong trường', r ->> 'tenLop'; end if;
      select student_person_id into v_existing from org.enrollment where student_code = v_code;
      v_person := org.upsert_student(jsonb_build_object('personId', v_existing, 'classId', v_class, 'fullName', r ->> 'hoTenNh',
        'gender', r ->> 'gioiTinh', 'birthDate', r ->> 'ngaySinhNh', 'studentCode', v_code));
      if coalesce(nullif(r ->> 'trangThaiNh', ''), 'STUDYING') <> 'STUDYING' then
        perform org.set_student_status(v_person, r ->> 'trangThaiNh');
      end if;
      if v_existing is null then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    exception when others then
      raise exception 'Dòng %: %', v_row, sqlerrm using errcode = sqlstate;
    end;
  end loop;
  insert into audit.log (action, entity, entity_id, unit_id, summary)
  values ('IMPORT', 'org.enrollment', p ->> 'fileName', v_school, jsonb_build_object('created', v_created, 'updated', v_updated));
  return jsonb_build_object('created', v_created, 'updated', v_updated);
end $$;

-- p = { fileName, rows: [ { row, idHeThong?, hoVaTenDoiNgu, gioiTinh, ngaySinhDoiNgu, soDienThoaiDn, chucVuTaiCoQuanCongTac, toChuyenMon } ] }
create function org.import_teachers(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_school uuid := org.my_school();
  r jsonb; v_row int; v_unit uuid; v_id uuid;
  v_created int := 0; v_updated int := 0;
begin
  if not iam.has_perm('org.person.manage') then raise exception 'Không có quyền nhập hồ sơ' using errcode = '42501'; end if;
  if jsonb_array_length(coalesce(p -> 'rows', '[]')) > 5000 then raise exception 'Vượt giới hạn 5000 dòng mỗi lần nhập' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p -> 'rows') loop
    v_row := (r ->> 'row')::int;
    begin
      v_unit := v_school;
      if nullif(trim(r ->> 'toChuyenMon'), '') is not null then
        select id into v_unit from org.unit where parent_id = v_school and type = 'TO' and status = 'ACTIVE'
          and lower(name) = lower(trim(r ->> 'toChuyenMon'));
        if v_unit is null then raise exception 'Không có tổ "%" đang hoạt động', r ->> 'toChuyenMon'; end if;
      end if;
      v_id := nullif(r ->> 'idHeThong', '')::uuid;
      perform org.upsert_teacher(jsonb_build_object('personId', v_id, 'unitId', v_unit, 'fullName', r ->> 'hoVaTenDoiNgu',
        'gender', r ->> 'gioiTinh', 'birthDate', r ->> 'ngaySinhDoiNgu', 'phone', r ->> 'soDienThoaiDn',
        'position', r ->> 'chucVuTaiCoQuanCongTac'));
      if v_id is null then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    exception when others then
      raise exception 'Dòng %: %', v_row, sqlerrm using errcode = sqlstate;
    end;
  end loop;
  insert into audit.log (action, entity, entity_id, unit_id, summary)
  values ('IMPORT', 'org.staff_membership', p ->> 'fileName', v_school, jsonb_build_object('created', v_created, 'updated', v_updated));
  return jsonb_build_object('created', v_created, 'updated', v_updated);
end $$;

-- Xuất dữ liệu đọc qua RLS ở client; RPC này ghi nhật ký EXPORT (yêu cầu brief: audit xuất dữ liệu)
create function org.log_export(p_kind text, p_count int) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not iam.has_perm('report.export') then raise exception 'Không có quyền xuất dữ liệu' using errcode = '42501'; end if;
  if p_kind not in ('students', 'teachers') then raise exception 'Loại dữ liệu không hợp lệ' using errcode = '22023'; end if;
  insert into audit.log (action, entity, entity_id, unit_id, summary)
  values ('EXPORT', case p_kind when 'students' then 'org.enrollment' else 'org.staff_membership' end,
          p_count::text || ' dòng', iam.school_of((iam.ctx()).scope_unit_id), jsonb_build_object('rows', p_count));
end $$;

revoke all on function org.my_school() from public, anon, authenticated;
grant execute on function org.import_students(jsonb), org.import_teachers(jsonb), org.log_export(text, int) to authenticated;
