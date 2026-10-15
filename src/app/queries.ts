/**
 * Truy vấn có phạm vi (demo). Mỗi hàm nhận AccessContext và CHỈ trả dữ liệu ngữ cảnh được phép thấy
 * — tương đương select qua RLS. Hàm "aggregate*" trả số liệu tổng hợp (không lộ cá nhân).
 */
import { ancestorsOf, subtreeIds, type AccessContext } from "@/domain/access";
import type { Dataset, OrgUnit } from "@/domain/model";

export const visibleUnits = (ds: Dataset, a: AccessContext) => ds.units.filter((u) => a.canSeeUnit(u.id));
export const visibleSchools = (ds: Dataset, a: AccessContext) => visibleUnits(ds, a).filter((u) => u.type === "TRUONG");
export const visibleClasses = (ds: Dataset, a: AccessContext) => ds.classes.filter((c) => a.canSeeClass(c.id));

export function studentsOfClass(ds: Dataset, a: AccessContext, classId: string) {
  return ds.enrollments
    .filter((e) => e.classId === classId && e.status === "STUDYING" && a.canSeePerson(e.studentPersonId))
    .map((e) => ({ enrollment: e, person: ds.persons.find((p) => p.id === e.studentPersonId)! }));
}

export function teachersOfClass(ds: Dataset, classId: string) {
  return ds.teaching.filter((t) => t.classId === classId).map((t) => ({
    subject: t.subject,
    name: ds.persons.find((p) => p.id === t.personId)?.fullName ?? "—",
  }));
}

/** Số liệu TỔNG HỢP của một đơn vị — cho phép cả khi không thấy dữ liệu cá nhân (Sở, NCC mức AGGREGATE). */
export function aggregateForUnit(ds: Dataset, unitId: string) {
  const sub = subtreeIds(ds, unitId);
  const classes = ds.classes.filter((c) => sub.has(c.schoolId));
  const classIds = new Set(classes.map((c) => c.id));
  const students = ds.enrollments.filter((e) => classIds.has(e.classId) && e.status === "STUDYING").length;
  const staff = new Set(ds.staff.filter((s) => sub.has(s.unitId)).map((s) => s.personId)).size;
  const schools = ds.units.filter((u) => u.type === "TRUONG" && sub.has(u.id)).length;
  const departments = ds.units.filter((u) => u.type === "TO" && sub.has(u.id)).length;
  return { schools, departments, classes: classes.length, students, staff };
}

export function linkedChildren(ds: Dataset, a: AccessContext) {
  return ds.guardianLinks
    .filter((l) => l.guardianPersonId === a.personId && l.status !== "REVOKED")
    .map((l) => {
      const visible = a.canSeePerson(l.studentPersonId);
      const enr = ds.enrollments.find((e) => e.studentPersonId === l.studentPersonId && e.status === "STUDYING");
      const cls = visible && enr ? ds.classes.find((c) => c.id === enr.classId) : undefined;
      const school = cls ? ds.units.find((u) => u.id === cls.schoolId) : undefined;
      return {
        link: l,
        visible,
        name: visible ? ds.persons.find((p) => p.id === l.studentPersonId)?.fullName : undefined,
        className: cls?.name,
        schoolName: school?.name,
      };
    });
}

export function grantsOfProvider(ds: Dataset, providerUnitId: string, today: string) {
  return ds.grants.filter((g) => g.providerUnitId === providerUnitId).map((g) => ({
    grant: g,
    school: ds.units.find((u) => u.id === g.schoolUnitId),
    active: g.validFrom <= today && g.validTo >= today,
  }));
}

export function unitPath(ds: Dataset, unitId: string): OrgUnit[] {
  return ancestorsOf(ds, unitId).filter((u) => u.type !== "PLATFORM");
}

/** Thuật ngữ cấu hình được theo đơn vị (vd. "Tổ" ↔ "Tổ bộ môn"/"Khoa"). */
export function term(ds: Dataset, unitId: string, key: string, fallback: string): string {
  for (const u of [...ancestorsOf(ds, unitId)].reverse()) {
    const l = ds.labels.find((x) => x.unitId === u.id && x.key === key);
    if (l) return l.label;
  }
  return fallback;
}

export const UNIT_TYPE_LABEL: Record<string, string> = {
  PLATFORM: "Nền tảng", SO: "Sở GD&ĐT", DON_VI: "Đơn vị trực thuộc", TRUONG: "Trường", TO: "Tổ chuyên môn", NCC: "Nhà cung cấp",
};
export const SCHOOL_LEVEL_LABEL: Record<string, string> = {
  MN: "Mầm non", TH: "Tiểu học", THCS: "THCS", THPT: "THPT", LIEN_CAP: "Liên cấp",
};
