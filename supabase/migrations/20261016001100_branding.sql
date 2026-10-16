-- =====================================================================
-- 0011 · GIAO DIỆN THEO ĐƠN VỊ (white-label) — cấu hình khóa 'ui.brand'
--  Mirror TS: src/domain/branding.ts (resolveBrand, validateBrand)
--  Kế thừa riêng: gốc → lá, tầng dưới ghi đè TỪNG thuộc tính nó khai báo; gặp MANDATORY thì dừng.
-- =====================================================================

create function cfg.check_brand() returns trigger
language plpgsql set search_path = '' as $$
declare k text; v text;
begin
  if new.key <> 'ui.brand' then return new; end if;
  if jsonb_typeof(new.value) <> 'object' then raise exception 'ui.brand phải là object' using errcode = '22023'; end if;
  for k, v in select key, value #>> '{}' from jsonb_each(new.value) loop
    if k not in ('appName', 'tagline', 'logo', 'mark', 'primary', 'accent', 'radius') then
      raise exception 'Thuộc tính không hỗ trợ: %', k using errcode = '22023';
    end if;
    if k in ('primary', 'accent') and v !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Màu phải ở dạng #RRGGBB' using errcode = '22023'; end if;
    if k = 'appName' and (length(trim(v)) < 2 or length(v) > 60) then raise exception 'Tên hiển thị 2–60 ký tự' using errcode = '22023'; end if;
    if k = 'tagline' and length(v) > 80 then raise exception 'Dòng phụ tối đa 80 ký tự' using errcode = '22023'; end if;
    if k in ('logo', 'mark') and (length(v) > 280000 or not (
         v ~ '^data:image/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$' or v ~ '^\./brand/[a-z0-9-]+\.(png|svg|webp)$')) then
      raise exception 'Logo phải là ảnh tải lên (PNG, JPG, WEBP, SVG) tối đa khoảng 200 KB' using errcode = '22023';
    end if;
    if k = 'radius' and v not in ('sm', 'md', 'lg') then raise exception 'Độ bo góc không hợp lệ' using errcode = '22023'; end if;
  end loop;
  return new;
end $$;
create trigger setting_check_brand before insert or update on cfg.setting
for each row execute function cfg.check_brand();

create function cfg.brand_for(p_unit uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r record; v jsonb := '{}'::jsonb;
begin
  for r in
    select s.value, s.mode from org.unit_closure c join cfg.setting s on s.unit_id = c.ancestor_id and s.key = 'ui.brand'
    where c.descendant_id = p_unit order by c.depth desc
  loop
    v := v || (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(r.value) e
               where e.value not in ('null'::jsonb, '""'::jsonb));
    exit when r.mode = 'MANDATORY';
  end loop;
  return v;
end $$;

-- Mọi người dùng đã chọn ngữ cảnh đều cần giao diện của đơn vị mình (kể cả HS/PH không có quyền xem cấu hình)
create function cfg.my_brand() returns jsonb
language sql stable security definer set search_path = '' as $$
  select cfg.brand_for(coalesce(iam.school_of((iam.ctx()).scope_unit_id), (iam.ctx()).scope_unit_id))
  where (iam.ctx()).assignment_id is not null
$$;

-- Trang đăng nhập (chưa có phiên): giao diện mặc định của nền tảng
create function cfg.platform_brand() returns jsonb
language sql stable security definer set search_path = '' as $$
  select cfg.brand_for((select id from org.unit where parent_id is null and type = 'PLATFORM' limit 1))
$$;

revoke all on function cfg.brand_for(uuid) from public, anon, authenticated;
grant execute on function cfg.my_brand() to authenticated;
grant execute on function cfg.platform_brand() to anon, authenticated;
