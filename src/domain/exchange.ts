/**
 * TRAO ĐỔI DỮ LIỆU HỒ SƠ (phân hệ 4, M2c) — import/export theo TÊN KỸ THUẬT chuẩn QĐ 2768.
 *
 * Định dạng tệp (Excel hoặc CSV):
 *   - Dòng 1: tên kỹ thuật (bắt buộc, dùng để nhận diện cột — thứ tự cột tự do)
 *   - Dòng 2: tên nghiệp vụ tiếng Việt (tùy chọn; có trong tệp mẫu, bị bỏ qua khi nhập)
 * Nhập theo nguyên tắc "tất cả hoặc không": chạy thử cả lô qua đúng quy tắc ghi hồ sơ (orgOps / RPC org.*),
 * chỉ ghi khi không có dòng lỗi. Lỗi báo theo dòng & cột.
 */
import { schoolOfUnit, subtreeIds, type AccessContext } from "./access.ts";
import { toStandard } from "./catalog.ts";
import type { Dataset } from "./model.ts";
import { OrgError, upsertStudent, upsertTeacher, setStudentStatus } from "./orgOps.ts";

export type ExchangeKind = "students" | "teachers";

export interface ColumnSpec {
  key: string; // tên kỹ thuật
  label: string;
  term?: string; // mã BG nếu là thuật ngữ chuẩn
  required?: boolean;
  hint?: string;
}

export const COLUMNS: Record<ExchangeKind, ColumnSpec[]> = {
  students: [
    { key: "maHocSinh", label: "Mã học sinh (nội bộ)", required: true, hint: "Khóa để cập nhật; 3–30 ký tự" },
    { key: "hoTenNh", label: "Họ và tên người học", term: "BG_00007", required: true },
    { key: "gioiTinh", label: "Giới tính", term: "BG_00010", hint: "1 = Nam, 2 = Nữ (ISO/IEC 5218)" },
    { key: "ngaySinhNh", label: "Ngày sinh", term: "BG_00009", hint: "YYYY-MM-DD hoặc dd/mm/yyyy" },
    { key: "tenLop", label: "Tên lớp", term: "BG_00505", required: true, hint: "Lớp phải có sẵn trong trường" },
    { key: "trangThaiNh", label: "Trạng thái người học", term: "BG_00090", hint: "Mã danh mục trangThaiNh; trống = Đang học" },
  ],
  teachers: [
    { key: "idHeThong", label: "Mã hệ thống (để trống khi thêm mới)", hint: "Có khi xuất dữ liệu; dùng để cập nhật" },
    { key: "hoVaTenDoiNgu", label: "Họ và tên cán bộ/nhà giáo", term: "BG_00238", required: true },
    { key: "gioiTinh", label: "Giới tính", term: "BG_00010", hint: "1 = Nam, 2 = Nữ (ISO/IEC 5218)" },
    { key: "ngaySinhDoiNgu", label: "Ngày sinh", term: "BG_00239", hint: "YYYY-MM-DD hoặc dd/mm/yyyy" },
    { key: "soDienThoaiDn", label: "Số điện thoại", term: "BG_00243" },
    { key: "chucVuTaiCoQuanCongTac", label: "Chức vụ", term: "BG_00326" },
    { key: "toChuyenMon", label: "Tổ chuyên môn (nội bộ)", hint: "Tên tổ có sẵn; trống = trực thuộc trường" },
  ],
};

export const MAX_ROWS = 5000;

export interface RowError { row: number; column?: string; message: string }
export interface ImportPlan {
  kind: ExchangeKind;
  total: number;
  created: number;
  updated: number;
  errors: RowError[];
  /** Cảnh báo không chặn nhập (vd. cột lạ bị bỏ qua) */
  warnings: string[];
  /** Dataset sau khi áp dụng (chỉ dùng khi errors rỗng) */
  result?: Dataset;
}

// ---------- Chuẩn hóa giá trị ô ----------
export function normDate(v: string): string | undefined | null {
  const s = v.trim();
  if (!s) return undefined;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s))) [d, mo, y] = [+m[1], +m[2], +m[3]];
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || y < 1900 || y > 2100) return null;
  return dt.toISOString().slice(0, 10);
}

export function normGender(v: string): "NAM" | "NU" | undefined | null {
  const s = v.trim().toLowerCase();
  if (!s) return undefined;
  if (s === "1" || s === "nam") return "NAM";
  if (s === "2" || s === "nữ" || s === "nu") return "NU";
  return null;
}

/** Tách bảng thô thành các dòng {cột: giá trị}; nhận diện cột theo tên kỹ thuật ở dòng 1. */
export function readTable(kind: ExchangeKind, table: string[][]): { rows: { row: number; data: Record<string, string> }[]; errors: RowError[]; warnings: string[] } {
  const errors: RowError[] = [];
  const warnings: string[] = [];
  const specs = COLUMNS[kind];
  const header = (table[0] ?? []).map((h) => h.trim());
  const missing = specs.filter((c) => c.required && !header.includes(c.key));
  if (missing.length) {
    errors.push({ row: 1, message: `Thiếu cột bắt buộc: ${missing.map((c) => c.key).join(", ")} (dòng 1 phải là tên kỹ thuật)` });
    return { rows: [], errors, warnings };
  }
  const unknown = header.filter((h) => h && !specs.some((c) => c.key === h));
  if (unknown.length) warnings.push(`Cột không nhận diện, sẽ bỏ qua: ${unknown.join(", ")}`);
  const labelRow = (table[1] ?? []).map((x) => x.trim());
  const skipLabel = specs.some((c) => labelRow[header.indexOf(c.key)] === c.label);
  const rows: { row: number; data: Record<string, string> }[] = [];
  for (let i = skipLabel ? 2 : 1; i < table.length; i++) {
    const cells = table[i] ?? [];
    if (cells.every((c) => !String(c ?? "").trim())) continue;
    const data: Record<string, string> = {};
    header.forEach((h, j) => { if (specs.some((c) => c.key === h)) data[h] = String(cells[j] ?? "").trim(); });
    rows.push({ row: i + 1, data });
  }
  if (rows.length > MAX_ROWS) errors.push({ row: 1, message: `Tệp có ${rows.length} dòng, vượt giới hạn ${MAX_ROWS} dòng mỗi lần nhập` });
  return { rows, errors, warnings };
}

// ---------- Lập kế hoạch nhập (chạy thử) ----------
export function planImport(ds: Dataset, a: AccessContext, kind: ExchangeKind, table: string[][]): ImportPlan {
  const { rows, errors, warnings } = readTable(kind, table);
  const plan: ImportPlan = { kind, total: rows.length, created: 0, updated: 0, errors: [...errors], warnings };
  if (errors.length) return plan;
  const school = schoolOfUnit(ds, a.scopeUnit.id);
  if (!school) return { ...plan, errors: [{ row: 1, message: "Chỉ nhập hồ sơ trong ngữ cảnh một trường" }] };
  const scope = subtreeIds(ds, school.id);
  let cur = ds;
  const seen = new Map<string, number>();

  for (const { row, data } of rows) {
    const err = (column: string | undefined, message: string) => plan.errors.push({ row, column, message });
    const before = plan.errors.length;
    try {
      if (kind === "students") {
        const code = (data.maHocSinh ?? "").toUpperCase();
        if (seen.has(code)) err("maHocSinh", `Trùng với dòng ${seen.get(code)} trong tệp`);
        seen.set(code, row);
        const gender = normGender(data.gioiTinh ?? "");
        if (gender === null) err("gioiTinh", `Giá trị "${data.gioiTinh}" không hợp lệ (1 = Nam, 2 = Nữ)`);
        const birth = normDate(data.ngaySinhNh ?? "");
        if (birth === null) err("ngaySinhNh", `Ngày "${data.ngaySinhNh}" không hợp lệ`);
        const cls = cur.classes.filter((c) => c.schoolId === school.id && c.name.toLowerCase() === (data.tenLop ?? "").toLowerCase());
        if (cls.length !== 1) err("tenLop", cls.length ? `Có nhiều lớp tên "${data.tenLop}"` : `Không có lớp "${data.tenLop}" trong trường`);
        const status = (data.trangThaiNh ?? "").trim();
        const validStatus = !status || cur.catalog.values.some((v) => v.listCode === "trangThaiNh" && v.code === status && !v.deprecated);
        if (!validStatus) err("trangThaiNh", `Mã trạng thái "${status}" không có trong danh mục trangThaiNh`);
        if (plan.errors.length > before) continue;
        const existing = cur.enrollments.find((e) => e.studentCode === code);
        const [next, id] = upsertStudent(cur, a, {
          personId: existing?.studentPersonId, classId: cls[0].id, fullName: data.hoTenNh ?? "",
          gender: gender ?? undefined, birthDate: birth ?? undefined, studentCode: code,
        });
        cur = status && status !== "STUDYING" ? setStudentStatus(next, a, id, status as "TRANSFERRED" | "GRADUATED") : next;
        if (existing) plan.updated++; else plan.created++;
      } else {
        const gender = normGender(data.gioiTinh ?? "");
        if (gender === null) err("gioiTinh", `Giá trị "${data.gioiTinh}" không hợp lệ (1 = Nam, 2 = Nữ)`);
        const birth = normDate(data.ngaySinhDoiNgu ?? "");
        if (birth === null) err("ngaySinhDoiNgu", `Ngày "${data.ngaySinhDoiNgu}" không hợp lệ`);
        let unitId = school.id;
        if (data.toChuyenMon) {
          const d = cur.units.find((u) => u.parentId === school.id && u.type === "TO" && u.status === "ACTIVE" && u.name.toLowerCase() === data.toChuyenMon.toLowerCase());
          if (!d) err("toChuyenMon", `Không có tổ "${data.toChuyenMon}" đang hoạt động`);
          else unitId = d.id;
        }
        const id = data.idHeThong || undefined;
        if (id && !cur.staff.some((s) => s.personId === id && scope.has(s.unitId))) err("idHeThong", "Mã hệ thống không thuộc giáo viên của trường");
        if (id && seen.has(id)) err("idHeThong", `Trùng với dòng ${seen.get(id)} trong tệp`);
        if (id) seen.set(id, row);
        if (plan.errors.length > before) continue;
        [cur] = upsertTeacher(cur, a, {
          personId: id, unitId, fullName: data.hoVaTenDoiNgu ?? "", gender: gender ?? undefined, birthDate: birth ?? undefined,
          phone: data.soDienThoaiDn || undefined, position: data.chucVuTaiCoQuanCongTac || undefined,
        });
        if (id) plan.updated++; else plan.created++;
      }
    } catch (e) {
      if (e instanceof OrgError) err(undefined, e.message);
      else throw e;
    }
  }
  if (plan.errors.length === 0) plan.result = cur;
  return plan;
}

// ---------- Xuất ----------
/** Bảng xuất (dòng 1 tên kỹ thuật, dòng 2 tên nghiệp vụ). Dữ liệu cá nhân chỉ xuất khi có quyền xem. */
export function exportTable(ds: Dataset, a: AccessContext, kind: ExchangeKind): string[][] {
  const specs = COLUMNS[kind];
  const out: string[][] = [specs.map((c) => c.key), specs.map((c) => c.label)];
  const school = schoolOfUnit(ds, a.scopeUnit.id);
  if (!school) return out;
  if (kind === "students") {
    const classes = ds.classes.filter((c) => c.schoolId === school.id && a.canSeeClass(c.id));
    for (const c of classes) {
      for (const e of ds.enrollments.filter((x) => x.classId === c.id && x.status === "STUDYING" && a.canSeePerson(x.studentPersonId))) {
        const p = ds.persons.find((x) => x.id === e.studentPersonId)!;
        const personal = a.canSeePersonal(p.id);
        out.push([e.studentCode, p.fullName, p.gender ? toStandard(ds.catalog, "iam.person", "gender", p.gender) ?? "" : "",
          personal ? p.birthDate ?? "" : "", c.name, toStandard(ds.catalog, "org.enrollment", "status", e.status) ?? e.status]);
      }
    }
  } else {
    const scope = subtreeIds(ds, school.id);
    for (const s of ds.staff.filter((x) => scope.has(x.unitId) && a.canSeePerson(x.personId))) {
      const p = ds.persons.find((x) => x.id === s.personId)!;
      const personal = a.canSeePersonal(p.id);
      const unit = ds.units.find((u) => u.id === s.unitId)!;
      out.push([p.id, p.fullName, p.gender ? toStandard(ds.catalog, "iam.person", "gender", p.gender) ?? "" : "",
        personal ? p.birthDate ?? "" : "", personal ? p.phone ?? "" : "", s.position, unit.type === "TO" ? unit.name : ""]);
    }
  }
  return out;
}

/** Tệp mẫu: tiêu đề + 1 dòng ví dụ */
export function templateTable(kind: ExchangeKind): string[][] {
  const specs = COLUMNS[kind];
  const sample = kind === "students"
    ? ["HS2026001", "Nguyễn Văn An", "1", "2014-05-20", "6A1", ""]
    : ["", "Trần Thị Bình", "2", "1990-03-15", "0901234567", "Giáo viên", "Tổ Khoa học tự nhiên"];
  return [specs.map((c) => c.key), specs.map((c) => c.label), sample];
}
