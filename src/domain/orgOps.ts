/**
 * PHÂN HỆ 4 · TỔ CHỨC DẠY HỌC — thao tác ghi hồ sơ (M2b).
 * Bản phản chiếu TS của các RPC trong supabase/migrations/20261016000800_org_records.sql.
 * Mỗi hàm thuần: (dataset, ngữ cảnh, input) → dataset mới, hoặc ném lỗi với cùng thông điệp như SQL.
 */
import { schoolOfUnit, subtreeIds, type AccessContext } from "./access.ts";
import type { Permission } from "./permissions.ts";
import type { Dataset, Enrollment, Person } from "./model.ts";

export class OrgError extends Error {}

const fail = (msg: string): never => {
  throw new OrgError(msg);
};

function assertScope(ds: Dataset, a: AccessContext, unitId: string | undefined, perm: Permission): string {
  if (!unitId || !a.has(perm) || !subtreeIds(ds, a.scopeUnit.id).has(unitId)) fail("Không có quyền thao tác trên đơn vị này");
  const school = schoolOfUnit(ds, unitId!);
  if (!school) fail("Đơn vị không thuộc cơ sở giáo dục nào");
  return school!.id;
}

export function checkName(v: string | undefined, label: string): string {
  const s = (v ?? "").trim().replace(/\s+/g, " ");
  if (s.length < 2 || s.length > 120) fail(`${label} phải từ 2 đến 120 ký tự`);
  return s;
}

const staffSchool = (ds: Dataset, personId: string) => {
  const m = ds.staff.find((s) => s.personId === personId);
  return m ? schoolOfUnit(ds, m.unitId)?.id : undefined;
};

const newId = () => crypto.randomUUID();

// ---------- Tổ chuyên môn ----------
export interface DepartmentInput { id?: string; schoolId?: string; name: string; status?: "ACTIVE" | "INACTIVE" }

export function upsertDepartment(ds: Dataset, a: AccessContext, p: DepartmentInput): [Dataset, string] {
  const name = checkName(p.name, "Tên tổ");
  let schoolId = p.schoolId;
  if (p.id) {
    schoolId = ds.units.find((u) => u.id === p.id && u.type === "TO")?.parentId ?? undefined;
    if (!schoolId) fail("Không tìm thấy tổ");
  }
  assertScope(ds, a, schoolId, "org.unit.manage");
  if (ds.units.find((u) => u.id === schoolId)?.type !== "TRUONG") fail("Tổ chuyên môn phải thuộc một trường");
  const status = p.status ?? "ACTIVE";
  if (ds.units.some((u) => u.parentId === schoolId && u.type === "TO" && u.name.toLowerCase() === name.toLowerCase() && u.id !== p.id)) {
    fail(`Trường đã có tổ "${name}"`);
  }
  if (status === "INACTIVE" && ds.classes.some((c) => c.departmentId === p.id)) {
    fail("Tổ còn quản lý lớp, cần chuyển lớp sang tổ khác trước khi ngừng");
  }
  if (!p.id) {
    const id = newId();
    return [{ ...ds, units: [...ds.units, { id, parentId: schoolId!, type: "TO", code: `TO-${id.slice(0, 8)}`, name, status }] }, id];
  }
  return [{ ...ds, units: ds.units.map((u) => (u.id === p.id ? { ...u, name, status } : u)) }, p.id];
}

// ---------- Giáo viên ----------
export interface TeacherInput {
  personId?: string; unitId: string; fullName: string; gender?: "NAM" | "NU"; position?: string; birthDate?: string; phone?: string;
}

export function upsertTeacher(ds: Dataset, a: AccessContext, p: TeacherInput): [Dataset, string] {
  const name = checkName(p.fullName, "Họ và tên");
  const school = assertScope(ds, a, p.unitId, "org.person.manage");
  const unit = ds.units.find((u) => u.id === p.unitId);
  if (unit?.type !== "TRUONG" && unit?.type !== "TO") fail("Giáo viên phải thuộc trường hoặc tổ");
  if (p.phone && !/^[0-9+ ]{8,15}$/.test(p.phone)) fail("Số điện thoại không hợp lệ");
  const position = p.position?.trim() || "Giáo viên";
  let personId = p.personId;
  let persons: Person[];
  if (!personId) {
    personId = newId();
    persons = [...ds.persons, { id: personId, fullName: name, gender: p.gender, birthDate: p.birthDate || undefined, phone: p.phone || undefined }];
  } else {
    if (staffSchool(ds, personId) !== school) fail("Chỉ sửa được giáo viên thuộc trường của bạn");
    persons = ds.persons.map((x) => (x.id === personId ? { ...x, fullName: name, gender: p.gender, birthDate: p.birthDate || undefined, phone: p.phone || undefined } : x));
  }
  const staff = [
    ...ds.staff.filter((s) => !(s.personId === personId && schoolOfUnit(ds, s.unitId)?.id === school)),
    { personId: personId!, unitId: p.unitId, position },
  ];
  return [{ ...ds, persons, staff }, personId!];
}

// ---------- Phân công giảng dạy ----------
export interface TeachingInput { personId: string; classId: string; subject: string; remove?: boolean }

export function setTeaching(ds: Dataset, a: AccessContext, p: TeachingInput): Dataset {
  const cls = ds.classes.find((c) => c.id === p.classId);
  const school = assertScope(ds, a, cls?.schoolId, "org.class.manage");
  const subject = p.subject.trim();
  if (subject.length < 2 || subject.length > 80) fail("Tên môn phải từ 2 đến 80 ký tự");
  if (staffSchool(ds, p.personId) !== school) fail("Giáo viên không thuộc trường của lớp");
  const same = (t: { personId: string; classId: string; subject: string }) => t.personId === p.personId && t.classId === p.classId && t.subject === subject;
  if (p.remove) return { ...ds, teaching: ds.teaching.filter((t) => !same(t)) };
  if (ds.teaching.some(same)) return ds;
  return { ...ds, teaching: [...ds.teaching, { personId: p.personId, classId: p.classId, subject }] };
}

// ---------- Lớp ----------
export interface ClassInput {
  id?: string; schoolId?: string; departmentId?: string; name: string; grade: number; maLop?: string; homeroomPersonId?: string;
}

export function upsertClass(ds: Dataset, a: AccessContext, p: ClassInput): [Dataset, string] {
  const schoolId = p.id ? ds.classes.find((c) => c.id === p.id)?.schoolId : p.schoolId;
  assertScope(ds, a, schoolId, "org.class.manage");
  const name = p.name.trim();
  if (name.length < 1 || name.length > 20) fail("Tên lớp phải từ 1 đến 20 ký tự");
  if (!Number.isInteger(p.grade) || p.grade < 0 || p.grade > 12) fail("Khối không hợp lệ");
  if (p.departmentId && !ds.units.some((u) => u.id === p.departmentId && u.parentId === schoolId && u.type === "TO" && u.status === "ACTIVE")) {
    fail("Tổ không thuộc trường hoặc đã ngừng");
  }
  if (p.homeroomPersonId && staffSchool(ds, p.homeroomPersonId) !== schoolId) fail("Giáo viên chủ nhiệm không thuộc trường");
  const year = ds.years.find((y) => y.isCurrent)!;
  if (ds.classes.some((c) => c.schoolId === schoolId && c.academicYearId === year.id && c.name === name && c.id !== p.id)) {
    fail(`Trường đã có lớp "${name}" trong năm học này`);
  }
  const fields = { departmentId: p.departmentId || undefined, name, grade: p.grade, maLop: p.maLop?.trim() || undefined, homeroomPersonId: p.homeroomPersonId || undefined };
  if (!p.id) {
    const id = newId();
    return [{ ...ds, classes: [...ds.classes, { id, schoolId: schoolId!, academicYearId: year.id, ...fields }] }, id];
  }
  return [{ ...ds, classes: ds.classes.map((c) => (c.id === p.id ? { ...c, ...fields } : c)) }, p.id];
}

// ---------- Học sinh ----------
export interface StudentInput { personId?: string; classId: string; fullName: string; gender?: "NAM" | "NU"; birthDate?: string; studentCode: string }

export function upsertStudent(ds: Dataset, a: AccessContext, p: StudentInput): [Dataset, string] {
  const cls = ds.classes.find((c) => c.id === p.classId);
  const school = assertScope(ds, a, cls?.schoolId, "org.person.manage");
  const name = checkName(p.fullName, "Họ và tên");
  const code = p.studentCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) fail("Mã học sinh 3–30 ký tự (chữ, số, - _)");
  if (ds.enrollments.some((e) => e.studentCode === code && e.studentPersonId !== p.personId)) fail(`Mã học sinh "${code}" đã tồn tại`);
  if (!p.personId) {
    const id = newId();
    const enr: Enrollment = { studentPersonId: id, classId: p.classId, status: "STUDYING", studentCode: code };
    return [{ ...ds, persons: [...ds.persons, { id, fullName: name, gender: p.gender, birthDate: p.birthDate || undefined }], enrollments: [...ds.enrollments, enr] }, id];
  }
  const cur = ds.enrollments.find((e) => e.studentPersonId === p.personId && e.status === "STUDYING");
  if (!cur || ds.classes.find((c) => c.id === cur.classId)?.schoolId !== school) fail("Chỉ sửa được học sinh đang học tại trường của bạn");
  return [{
    ...ds,
    persons: ds.persons.map((x) => (x.id === p.personId ? { ...x, fullName: name, gender: p.gender, birthDate: p.birthDate || undefined } : x)),
    enrollments: ds.enrollments.map((e) => (e === cur ? { ...e, classId: p.classId, studentCode: code } : e)),
  }, p.personId];
}

export function setStudentStatus(ds: Dataset, a: AccessContext, personId: string, status: Enrollment["status"]): Dataset {
  const enr = [...ds.enrollments.filter((e) => e.studentPersonId === personId)].sort((x, y) => Number(y.status === "STUDYING") - Number(x.status === "STUDYING"))[0];
  assertScope(ds, a, ds.classes.find((c) => c.id === enr?.classId)?.schoolId, "org.person.manage");
  return { ...ds, enrollments: ds.enrollments.map((e) => (e === enr ? { ...e, status } : e)) };
}
