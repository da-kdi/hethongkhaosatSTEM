import { PERMISSIONS } from "../src/domain/permissions.ts";
import { SYSTEM_ROLES } from "../src/domain/roles.ts";
import { createDemoDataset } from "../src/demo/seed.ts";
import { readFileSync } from "node:fs";
import { FIELD_MAPPINGS } from "../src/domain/dictionary/mapping.ts";
import type { Dictionary } from "../src/domain/dictionary/types.ts";

export function loadDictionary(): Dictionary {
  return JSON.parse(readFileSync(new URL("../src/domain/dictionary/qd2768.json", import.meta.url), "utf8")) as Dictionary;
}

export const DEMO_PASSWORD = "Demo@2026";

function lit(v: unknown): string {
  if (v === undefined || v === null) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replaceAll("'", "''")}'`;
}
function json(v: unknown): string {
  return `${lit(JSON.stringify(v))}::jsonb`;
}
function rows(table: string, cols: string[], values: unknown[][]): string {
  if (values.length === 0) return "";
  const body = values.map((r) => `  (${r.join(", ")})`).join(",\n");
  return `insert into ${table} (${cols.join(", ")}) values\n${body};\n`;
}

export function buildSeedSql(): string {
  const ds = createDemoDataset();
  const dict = loadDictionary();
  const parts: string[] = [
    "-- =====================================================================",
    "-- FILE SINH TỰ ĐỘNG bởi scripts/gen-seed.ts — KHÔNG SỬA TAY.",
    "-- Dữ liệu demo HƯ CẤU. Mật khẩu demo chỉ dùng cho local/dev.",
    "-- =====================================================================",
    "begin;",
    "",
    "-- Danh mục quyền & vai trò hệ thống",
    rows("iam.permission", ["code", "description"], Object.entries(PERMISSIONS).map(([c, d]) => [lit(c), lit(d)])),
    rows("iam.role", ["code", "name", "portal", "scope_kind", "unit_types", "is_system"],
      SYSTEM_ROLES.map((r) => [lit(r.code), lit(r.name), lit(r.portal), lit(r.scope), `array[${r.unitTypes.map(lit).join(", ")}]`, "true"])),
    rows("iam.role_permission", ["role_code", "permission_code"],
      SYSTEM_ROLES.flatMap((r) => [...new Set(r.permissions)].map((p) => [lit(r.code), lit(p)]))),
    "",
    "-- Từ điển dữ liệu dùng chung ngành GDĐT — QĐ 2768/QĐ-BGDĐT (phiên bản 1.0)",
    rows("cfg.data_domain", ["code", "level", "grp", "name", "parent_name", "description"],
      dict.domains.map((d) => [lit(d.code), lit(d.level), lit(d.group), lit(d.name), lit(d.parent), lit(d.description)])),
    rows("cfg.data_term", ["code", "name", "definition", "context", "domains", "technical_name", "data_type", "data_type_vi", "length", "core_code"],
      dict.terms.map((t) => [lit(t.code), lit(t.name), lit(t.definition), lit(t.context), `array[${t.domains.map(lit).join(", ")}]::text[]`,
        lit(t.technicalName), lit(t.dataType), lit(t.dataTypeVi), lit(t.length), lit(t.coreCode)])),
    rows("cfg.data_term_mapping", ["table_name", "column_name", "term_code", "status", "note"],
      FIELD_MAPPINGS.flatMap((m) => m.terms.map((t) => [lit(m.table), lit(m.column), lit(t), lit(m.status), lit(m.note)]))),
    "",
    "-- Danh mục dùng chung (ADR-013) — trạng thái khởi tạo; nguồn chính thức nạp từ CSDL ngành",
    rows("catalog.code_list", ["code", "name", "term_code", "source", "version", "note"],
      ds.catalog.lists.map((l) => [lit(l.code), lit(l.name), lit(l.termCode), lit(l.source), lit(l.version), lit(l.note)])),
    rows("catalog.code_value", ["list_code", "code", "name", "sort", "deprecated"],
      ds.catalog.values.map((x) => [lit(x.listCode), lit(x.code), lit(x.name), lit(x.sort), lit(x.deprecated)])),
    rows("catalog.value_map", ["table_name", "column_name", "internal_value", "list_code", "code"],
      ds.catalog.maps.map((m) => [lit(m.table), lit(m.column), lit(m.internalValue), lit(m.listCode), lit(m.code)])),
    "",
    "-- Người & dữ liệu cá nhân (giả định)",
    rows("iam.person", ["id", "full_name", "gender"], ds.persons.map((p) => [lit(p.id), lit(p.fullName), lit(p.gender)])),
    rows("iam.person_private", ["person_id", "birth_date", "phone"],
      ds.persons.map((p) => [lit(p.id), lit(p.birthDate), lit(p.phone)])),
    "",
    "-- Đơn vị (cha trước con — trigger tự dựng closure)",
  ];
  const ordered: typeof ds.units = [];
  const pending = [...ds.units];
  while (pending.length) {
    const i = pending.findIndex((u) => !u.parentId || ordered.some((o) => o.id === u.parentId));
    ordered.push(...pending.splice(i, 1));
  }
  for (const u of ordered) {
    parts.push(rows("org.unit", ["id", "parent_id", "type", "code", "name", "ward", "school_level", "ma_dinh_danh", "loai_hinh_csgd", "tinh_thanh", "status"],
      [[lit(u.id), lit(u.parentId), lit(u.type), lit(u.code), lit(u.name), lit(u.ward), lit(u.schoolLevel), lit(u.maDinhDanh), lit(u.loaiHinhCsgd), lit(u.tinhThanh), lit(u.status)]]).trimEnd());
  }
  parts.push(
    "",
    rows("org.academic_year", ["id", "code", "start_date", "end_date", "is_current"],
      ds.years.map((y) => [lit(y.id), lit(y.code), lit(y.startDate), lit(y.endDate), lit(y.isCurrent)])),
    rows("org.class", ["id", "school_id", "department_id", "academic_year_id", "ma_lop", "name", "grade", "homeroom_person_id"],
      ds.classes.map((c) => [lit(c.id), lit(c.schoolId), lit(c.departmentId), lit(c.academicYearId), lit(c.maLop), lit(c.name), lit(c.grade), lit(c.homeroomPersonId)])),
    rows("org.staff_membership", ["person_id", "unit_id", "position"], ds.staff.map((s) => [lit(s.personId), lit(s.unitId), lit(s.position)])),
    rows("org.teaching_assignment", ["person_id", "class_id", "subject"], ds.teaching.map((t) => [lit(t.personId), lit(t.classId), lit(t.subject)])),
    rows("org.enrollment", ["student_person_id", "class_id", "status", "student_code"],
      ds.enrollments.map((e) => [lit(e.studentPersonId), lit(e.classId), lit(e.status), lit(e.studentCode)])),
    "",
    "-- Tài khoản (auth.users + iam.account)",
    rows("auth.users", ["instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at"],
      ds.accounts.map((a) => ["'00000000-0000-0000-0000-000000000000'", lit(a.id), "'authenticated'", "'authenticated'", lit(a.email),
        `crypt(${lit(DEMO_PASSWORD)}, gen_salt('bf'))`, "now()", json({ provider: "email", providers: ["email"] }), "'{}'::jsonb", "now()", "now()"])),
    // Supabase Auth cần auth.identities để đăng nhập email/mật khẩu; Postgres thuần (test) không có bảng này
    "do $$ begin",
    "  if to_regclass('auth.identities') is not null then",
    "    execute $q$",
    "      insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)",
    "      select gen_random_uuid(), u.id, u.id::text, 'email', jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()",
    "      from auth.users u where u.email like '%.demo' or u.email like '%@demo.stem.vn'",
    "      on conflict do nothing",
    "    $q$;",
    "  end if;",
    "end $$;",
    rows("iam.account", ["id", "person_id", "email", "status"], ds.accounts.map((a) => [lit(a.id), lit(a.personId), lit(a.email), lit(a.status)])),
    rows("iam.role_assignment", ["id", "account_id", "role_code", "scope_unit_id", "status", "valid_from", "valid_to"],
      ds.assignments.map((r) => [lit(r.id), lit(r.accountId), lit(r.roleCode), lit(r.scopeUnitId), lit(r.status), lit(r.validFrom), lit(r.validTo)])),
    rows("iam.guardian_link", ["id", "guardian_person_id", "student_person_id", "relation", "status", "method", "verified_at", "expires_at"],
      ds.guardianLinks.map((l) => [lit(l.id), lit(l.guardianPersonId), lit(l.studentPersonId), lit(l.relation), lit(l.status), lit(l.method), lit(l.verifiedAt), lit(l.expiresAt)])),
    rows("org.provider_profile", ["unit_id", "ma_dinh_danh_to_chuc", "loai_to_chuc", "address", "website", "contact_name", "contact_email", "contact_phone", "fields", "description"],
      ds.providerProfiles.map((p) => [lit(p.unitId), lit(p.maDinhDanhToChuc), lit(p.loaiToChuc), lit(p.address), lit(p.website), lit(p.contactName),
        lit(p.contactEmail), lit(p.contactPhone), `array[${p.fields.map((f) => lit(f)).join(", ")}]::text[]`, lit(p.description)])),
    rows("iam.provider_grant", ["id", "provider_unit_id", "school_unit_id", "program_code", "level", "valid_from", "valid_to"],
      ds.grants.map((g) => [lit(g.id), lit(g.providerUnitId), lit(g.schoolUnitId), lit(g.programCode), lit(g.level), lit(g.validFrom), lit(g.validTo)])),
    "",
    "-- Cấu hình theo tầng (cha trước con để trigger kiểm EXTEND/MANDATORY đúng)",
  );
  const depth = (id: string): number => {
    const u = ds.units.find((x) => x.id === id);
    return u?.parentId ? 1 + depth(u.parentId) : 0;
  };
  const settings = [...ds.settings].sort((a, b) => depth(a.unitId) - depth(b.unitId));
  parts.push(
    rows("cfg.setting", ["id", "unit_id", "key", "value", "mode"], settings.map((s) => [lit(s.id), lit(s.unitId), lit(s.key), json(s.value), lit(s.mode)])),
    rows("cfg.term_label", ["unit_id", "key", "label"], ds.labels.map((l) => [lit(l.unitId), lit(l.key), lit(l.label)])),
    "commit;",
    "",
  );
  return parts.filter((p) => p !== undefined).join("\n");
}
