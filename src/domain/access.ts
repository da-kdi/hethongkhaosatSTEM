/**
 * Bộ máy phạm vi dữ liệu (client mirror).
 *
 * ⚠️ Đây là BẢN PHẢN CHIẾU của các hàm RLS trong supabase/migrations/0002_iam.sql.
 * Bảo mật thật nằm ở Postgres. Bản TS này dùng cho:
 *   - chế độ demo (không có backend),
 *   - ẩn/hiện menu, nút,
 *   - test đối chiếu (tests chạy cùng kịch bản trên cả TS và SQL).
 * Khi đổi quy tắc ở một bên, PHẢI đổi bên kia và chạy `npm test`.
 */
import type { Permission } from "./permissions.ts";
import { ROLE_BY_CODE, type RoleDef } from "./roles.ts";
import type { Dataset, OrgUnit, RoleAssignment } from "./model.ts";

export interface AccessContext {
  readonly assignment: RoleAssignment;
  readonly role: RoleDef;
  readonly scopeUnit: OrgUnit;
  readonly personId: string;
  has(perm: Permission): boolean;
  canSeeUnit(unitId: string): boolean;
  canSeeClass(classId: string): boolean;
  canSeePerson(personId: string): boolean;
  canSeePersonal(personId: string): boolean;
  /** Đơn vị trường mà ngữ cảnh đang thuộc về (nếu có) — dùng để giải cấu hình module */
  configUnitId: string;
}

export function subtreeIds(ds: Dataset, rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const u of ds.units) {
      if (u.parentId && out.has(u.parentId) && !out.has(u.id)) {
        out.add(u.id);
        grew = true;
      }
    }
  }
  return out;
}

export function ancestorsOf(ds: Dataset, unitId: string): OrgUnit[] {
  const byId = new Map(ds.units.map((u) => [u.id, u]));
  const chain: OrgUnit[] = [];
  let cur = byId.get(unitId);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain; // gốc → lá
}

export function schoolOfUnit(ds: Dataset, unitId: string): OrgUnit | undefined {
  return ancestorsOf(ds, unitId).find((u) => u.type === "TRUONG");
}

/** Assignment có hợp lệ tại ngày `today` không (trạng thái, hiệu lực, chủ sở hữu). */
export function isAssignmentActive(a: RoleAssignment, accountId: string, today: string): boolean {
  return a.accountId === accountId && a.status === "ACTIVE" && a.validFrom <= today && (!a.validTo || a.validTo >= today);
}

export function assignmentsOf(ds: Dataset, accountId: string, today: string): RoleAssignment[] {
  return ds.assignments.filter((a) => isAssignmentActive(a, accountId, today) && ROLE_BY_CODE[a.roleCode]);
}

/**
 * Tạo ngữ cảnh truy cập cho MỘT assignment đang hoạt động.
 * Trả về null nếu assignment không thuộc tài khoản / hết hiệu lực (chống giả mạo ngữ cảnh).
 */
export function buildAccess(ds: Dataset, accountId: string, assignmentId: string, today: string): AccessContext | null {
  const assignment = ds.assignments.find((a) => a.id === assignmentId);
  if (!assignment || !isAssignmentActive(assignment, accountId, today)) return null;
  const role = ROLE_BY_CODE[assignment.roleCode];
  const maybeUnit = ds.units.find((u) => u.id === assignment.scopeUnitId);
  const account = ds.accounts.find((a) => a.id === accountId && a.status === "ACTIVE");
  if (!role || !maybeUnit || !account) return null;
  const scopeUnit: OrgUnit = maybeUnit;

  const perms = new Set<Permission>(role.permissions);
  const has = (p: Permission) => perms.has(p);
  const me = account.personId;
  const subtree = subtreeIds(ds, scopeUnit.id);
  const school = schoolOfUnit(ds, scopeUnit.id);

  const classById = new Map(ds.classes.map((c) => [c.id, c]));
  const myTeachingClasses = new Set(ds.teaching.filter((t) => t.personId === me).map((t) => t.classId));
  for (const c of ds.classes) if (c.homeroomPersonId === me) myTeachingClasses.add(c.id);

  // Phụ huynh: chỉ liên kết VERIFIED, còn hạn
  const linkedChildren = new Set(
    ds.guardianLinks
      .filter((l) => l.guardianPersonId === me && l.status === "VERIFIED" && (!l.expiresAt || l.expiresAt >= today))
      .map((l) => l.studentPersonId),
  );

  const activeGrants = (refDay: string): typeof ds.grants =>
    ds.grants.filter((g) => g.providerUnitId === scopeUnit.id && g.validFrom <= refDay && g.validTo >= refDay);

  const studentClass = (personId: string) =>
    ds.enrollments.find((e) => e.studentPersonId === personId && e.status === "STUDYING")?.classId;
  const staffUnits = (personId: string) => ds.staff.filter((s) => s.personId === personId).map((s) => s.unitId);

  const refDay = today;

  function canSeeUnit(unitId: string): boolean {
    switch (role.scope) {
      case "PLATFORM":
        return true;
      case "UNIT_SUBTREE":
        // Thấy cây con + chuỗi cha (để hiển thị đường dẫn), nhưng không thấy đơn vị ngang hàng
        if (!has("org.unit.view")) return false;
        return subtree.has(unitId) || ancestorsOf(ds, scopeUnit.id).some((u) => u.id === unitId);
      case "TEACHING":
      case "SELF":
        return !!school && (subtreeIds(ds, school.id).has(unitId));
      case "LINKED": {
        for (const child of linkedChildren) {
          const cls = studentClass(child);
          if (cls && classById.get(cls)?.schoolId === unitId) return true;
        }
        return false;
      }
      case "GRANT":
        return unitId === scopeUnit.id || activeGrants(refDay).some((g) => g.schoolUnitId === unitId);
    }
  }

  function canSeeClass(classId: string): boolean {
    const cls = classById.get(classId);
    if (!cls) return false;
    switch (role.scope) {
      case "PLATFORM":
        return false;
      case "UNIT_SUBTREE":
        return has("org.class.view") && (subtree.has(cls.schoolId) || (!!cls.departmentId && subtree.has(cls.departmentId)));
      case "TEACHING":
        return myTeachingClasses.has(classId);
      case "SELF":
        return studentClass(me) === classId;
      case "LINKED":
        return [...linkedChildren].some((c) => studentClass(c) === classId);
      case "GRANT":
        return activeGrants(refDay).some((g) => g.schoolUnitId === cls.schoolId && g.level !== "AGGREGATE");
    }
  }

  function canSeePerson(personId: string): boolean {
    if (personId === me) return true;
    const cls = studentClass(personId);
    if (cls) {
      // HỌC SINH — dữ liệu trẻ em: chỉ cấp trường/tổ/GV dạy/PH đã xác minh/NCC mức NAMED
      switch (role.scope) {
        case "UNIT_SUBTREE":
          if (scopeUnit.type !== "TRUONG" && scopeUnit.type !== "TO") return false; // Sở: chỉ số liệu tổng hợp
          return has("org.person.view") && canSeeClass(cls);
        case "TEACHING":
          return myTeachingClasses.has(cls);
        case "LINKED":
          return linkedChildren.has(personId);
        case "GRANT":
          return activeGrants(refDay).some((g) => g.schoolUnitId === classById.get(cls)?.schoolId && g.level === "NAMED");
        default:
          return false;
      }
    }
    // NHÂN SỰ
    const units = staffUnits(personId);
    if (units.length === 0) return false;
    switch (role.scope) {
      case "PLATFORM":
        return true;
      case "UNIT_SUBTREE":
        return has("org.person.view") && units.some((u) => subtree.has(u));
      case "TEACHING":
        return !!school && units.some((u) => subtreeIds(ds, school.id).has(u));
      case "GRANT":
        return units.includes(scopeUnit.id);
      default:
        return false;
    }
  }

  function canSeePersonal(personId: string): boolean {
    if (personId === me) return true;
    if (role.scope === "LINKED") return linkedChildren.has(personId);
    return has("org.person.personal") && canSeePerson(personId);
  }

  return {
    assignment, role, scopeUnit, personId: me, has, canSeeUnit, canSeeClass, canSeePerson, canSeePersonal,
    configUnitId: school?.id ?? scopeUnit.id,
  };
}
