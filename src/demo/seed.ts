/**
 * KỊCH BẢN DEMO XUYÊN SUỐT — dữ liệu HƯ CẤU, không dùng thông tin cá nhân thật.
 *
 * Tỉnh "An Hòa" là tỉnh giả định. Cấu trúc:
 *   Nền tảng
 *   ├─ Sở GD&ĐT tỉnh An Hòa
 *   │   ├─ THCS Bình Minh (Tổ KHTN, Tổ Toán–Tin)      ← trường chính của demo
 *   │   ├─ THPT Thanh Sơn (Tổ Vật lý–Công nghệ, Tổ Toán–Tin)
 *   │   └─ Tiểu học Sao Mai (Tổ khối 4–5)             ← tắt module Phòng & thiết bị
 *   ├─ KDI Education (nhà cung cấp, có grant với Bình Minh; grant Thanh Sơn đã hết hạn)
 *   └─ Robotic Việt (nhà cung cấp, chưa có grant)
 *
 * Tình huống kiểm thử quan trọng:
 *   - Đinh Thị Ngọc: GV ở THPT Thanh Sơn VÀ phụ huynh (đã xác minh) của 1 HS ở THCS Bình Minh
 *     → kiểm tra không trộn quyền giữa 2 ngữ cảnh.
 *   - Hồ Thị Thu: phụ huynh có 2 con ở 2 trường khác nhau.
 *   - Mai Văn Tùng: phụ huynh có liên kết đang CHỜ xác minh → không được xem gì.
 *   - Hoàng Thị Lan: vừa Tổ trưởng KHTN vừa Giáo viên ở Bình Minh.
 *
 * File này cũng là nguồn để scripts/gen-seed.ts sinh supabase/seed.sql.
 */
import { did } from "../domain/ids.ts";
import type {
  Account, ClassRoom, ConfigSetting, Dataset, DeAnProgress, Enrollment, GuardianLink, OrgUnit, Person,
  ProviderGrant, RoleAssignment, StaffMembership, TeachingAssignment, TodoItem,
} from "../domain/model.ts";

export const DEMO_TODAY = "2026-10-15";

// ---------- Đơn vị ----------
export const U = {
  platform: did("unit", 1),
  so: did("unit", 2),
  bm: did("unit", 10), // THCS Bình Minh
  bmKhtn: did("unit", 11),
  bmToan: did("unit", 12),
  ts: did("unit", 20), // THPT Thanh Sơn
  tsLy: did("unit", 21),
  tsToan: did("unit", 22),
  sm: did("unit", 30), // TH Sao Mai
  smK45: did("unit", 31),
  kdi: did("unit", 50),
  rbv: did("unit", 51),
};

const units: OrgUnit[] = [
  { id: U.platform, parentId: null, type: "PLATFORM", code: "ROOT", name: "Nền tảng Quản trị STEM", status: "ACTIVE" },
  { id: U.so, parentId: U.platform, type: "SO", code: "SO-AH", name: "Sở GD&ĐT tỉnh An Hòa", status: "ACTIVE" },
  { id: U.bm, parentId: U.so, type: "TRUONG", code: "THCS-BM", name: "Trường THCS Bình Minh", ward: "Phường Đông Thành", schoolLevel: "THCS", maDinhDanh: "AH00010201", loaiHinhCsgd: "Công lập", tinhThanh: "Tỉnh An Hòa (giả định)", status: "ACTIVE" },
  { id: U.bmKhtn, parentId: U.bm, type: "TO", code: "BM-KHTN", name: "Tổ Khoa học tự nhiên", status: "ACTIVE" },
  { id: U.bmToan, parentId: U.bm, type: "TO", code: "BM-TT", name: "Tổ Toán – Tin", status: "ACTIVE" },
  { id: U.ts, parentId: U.so, type: "TRUONG", code: "THPT-TS", name: "Trường THPT Thanh Sơn", ward: "Xã Phú Lộc", schoolLevel: "THPT", maDinhDanh: "AH00020301", loaiHinhCsgd: "Công lập", tinhThanh: "Tỉnh An Hòa (giả định)", status: "ACTIVE" },
  { id: U.tsLy, parentId: U.ts, type: "TO", code: "TS-LCN", name: "Tổ Vật lý – Công nghệ", status: "ACTIVE" },
  { id: U.tsToan, parentId: U.ts, type: "TO", code: "TS-TT", name: "Tổ Toán – Tin", status: "ACTIVE" },
  { id: U.sm, parentId: U.so, type: "TRUONG", code: "TH-SM", name: "Trường Tiểu học Sao Mai", ward: "Phường Tây An", schoolLevel: "TH", maDinhDanh: "AH00030101", loaiHinhCsgd: "Công lập", tinhThanh: "Tỉnh An Hòa (giả định)", status: "ACTIVE" },
  { id: U.smK45, parentId: U.sm, type: "TO", code: "SM-K45", name: "Tổ khối 4–5", status: "ACTIVE" },
  { id: U.kdi, parentId: U.platform, type: "NCC", code: "NCC-KDI", name: "KDI Education (demo)", status: "ACTIVE" },
  { id: U.rbv, parentId: U.platform, type: "NCC", code: "NCC-RBV", name: "Công ty Robotic Việt (demo)", status: "ACTIVE" },
];

const YEAR = did("year", 1);
const years = [{ id: YEAR, code: "2026-2027", startDate: "2026-09-05", endDate: "2027-05-31", isCurrent: true }];

// ---------- Người (nhân sự) ----------
let pn = 0;
const persons: Person[] = [];
function person(fullName: string, gender: "NAM" | "NU", birthYear: number): string {
  pn += 1;
  const id = did("person", pn);
  persons.push({
    id, fullName, gender,
    birthDate: `${birthYear}-0${(pn % 9) + 1}-1${pn % 9}`,
    phone: `09000${String(pn).padStart(5, "0")}`, // số giả định
  });
  return id;
}

export const P = {
  platformAdmin: person("Quản Trị Viên Nền Tảng", "NAM", 1990),
  soLeader: person("Nguyễn Văn Hải", "NAM", 1972),
  soSpecialist: person("Trần Thị Mai", "NU", 1985),
  soAdmin: person("Lê Minh Quân", "NAM", 1992),
  bmPrincipal: person("Phạm Thu Hà", "NU", 1976),
  bmAdmin: person("Đỗ Văn Kiên", "NAM", 1991),
  bmLan: person("Hoàng Thị Lan", "NU", 1983), // Tổ trưởng KHTN + GV
  bmAnh: person("Vũ Đức Anh", "NAM", 1988), // GV Toán–Tin
  bmHuong: person("Ngô Thị Hương", "NU", 1990), // GV KHTN
  tsPrincipal: person("Bùi Quang Huy", "NAM", 1975),
  tsNgoc: person("Đinh Thị Ngọc", "NU", 1984), // GV Vật lý + phụ huynh ở Bình Minh
  smPrincipal: person("Lý Thị Hoa", "NU", 1980),
  kdiAdmin: person("Trịnh Minh Khoa", "NAM", 1987),
  kdiExpert: person("Phan Hữu Nam", "NAM", 1993),
  phThu: person("Hồ Thị Thu", "NU", 1986),
  phTung: person("Mai Văn Tùng", "NAM", 1982),
};

// ---------- Lớp ----------
export const C = {
  bm6: did("cls", 1), bm7: did("cls", 2), bm8: did("cls", 3), bm9: did("cls", 4),
  ts10: did("cls", 5), ts11: did("cls", 6),
  sm4: did("cls", 7), sm5: did("cls", 8),
};
const classes: ClassRoom[] = [
  { id: C.bm6, schoolId: U.bm, departmentId: U.bmKhtn, academicYearId: YEAR, maLop: "BM-2627-6A1", name: "6A1", grade: 6, homeroomPersonId: P.bmHuong },
  { id: C.bm7, schoolId: U.bm, departmentId: U.bmToan, academicYearId: YEAR, maLop: "BM-2627-7A1", name: "7A1", grade: 7, homeroomPersonId: P.bmAnh },
  { id: C.bm8, schoolId: U.bm, departmentId: U.bmKhtn, academicYearId: YEAR, maLop: "BM-2627-8A1", name: "8A1", grade: 8, homeroomPersonId: P.bmLan },
  { id: C.bm9, schoolId: U.bm, departmentId: U.bmToan, academicYearId: YEAR, maLop: "BM-2627-9A1", name: "9A1", grade: 9 },
  { id: C.ts10, schoolId: U.ts, departmentId: U.tsLy, academicYearId: YEAR, maLop: "TS-2627-10A1", name: "10A1", grade: 10, homeroomPersonId: P.tsNgoc },
  { id: C.ts11, schoolId: U.ts, departmentId: U.tsToan, academicYearId: YEAR, maLop: "TS-2627-11A1", name: "11A1", grade: 11 },
  { id: C.sm4, schoolId: U.sm, departmentId: U.smK45, academicYearId: YEAR, maLop: "SM-2627-4A", name: "4A", grade: 4 },
  { id: C.sm5, schoolId: U.sm, departmentId: U.smK45, academicYearId: YEAR, maLop: "SM-2627-5A", name: "5A", grade: 5 },
];

// ---------- Học sinh (tên ghép ngẫu nhiên có quy tắc, hư cấu) ----------
const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const DEM = ["Minh", "Gia", "Bảo", "Khánh", "Thảo", "Ngọc", "Đức", "Hải"];
const TEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Huy", "Linh", "My", "Nam", "Phúc", "Quỳnh", "Sơn", "Trang", "Vy"];
const enrollments: Enrollment[] = [];
const studentsByClass: Record<string, string[]> = {};
let sn = 0;
for (const cls of classes) {
  studentsByClass[cls.id] = [];
  for (let i = 0; i < 5; i++) {
    sn += 1;
    const name = `${HO[sn % HO.length]} ${DEM[(sn * 3) % DEM.length]} ${TEN[(sn * 5) % TEN.length]}`;
    const id = person(name, sn % 2 ? "NAM" : "NU", 2026 - cls.grade - 6);
    studentsByClass[cls.id].push(id);
    enrollments.push({ studentPersonId: id, classId: cls.id, status: "STUDYING", studentCode: `HS${String(sn).padStart(4, "0")}` });
  }
}
export const S = {
  bm6First: studentsByClass[C.bm6][0],
  bm6Second: studentsByClass[C.bm6][1],
  bm8First: studentsByClass[C.bm8][0],
  ts10First: studentsByClass[C.ts10][0],
  sm4First: studentsByClass[C.sm4][0],
  all: studentsByClass,
};

// ---------- Tài khoản ----------
let an = 0;
const accounts: Account[] = [];
function account(personId: string, email: string): string {
  an += 1;
  const id = did("account", an);
  accounts.push({ id, personId, email, status: "ACTIVE" });
  return id;
}
export const A = {
  platformAdmin: account(P.platformAdmin, "admin@demo.stem.vn"),
  soLeader: account(P.soLeader, "hai.nv@so-anhoa.demo"),
  soSpecialist: account(P.soSpecialist, "mai.tt@so-anhoa.demo"),
  soAdmin: account(P.soAdmin, "quan.lm@so-anhoa.demo"),
  bmPrincipal: account(P.bmPrincipal, "ha.pt@binhminh.demo"),
  bmAdmin: account(P.bmAdmin, "kien.dv@binhminh.demo"),
  bmLan: account(P.bmLan, "lan.ht@binhminh.demo"),
  bmAnh: account(P.bmAnh, "anh.vd@binhminh.demo"),
  bmHuong: account(P.bmHuong, "huong.nt@binhminh.demo"),
  tsPrincipal: account(P.tsPrincipal, "huy.bq@thanhson.demo"),
  tsNgoc: account(P.tsNgoc, "ngoc.dt@thanhson.demo"),
  smPrincipal: account(P.smPrincipal, "hoa.lt@saomai.demo"),
  kdiAdmin: account(P.kdiAdmin, "khoa.tm@kdi.demo"),
  kdiExpert: account(P.kdiExpert, "nam.ph@kdi.demo"),
  phThu: account(P.phThu, "thu.ht@phuhuynh.demo"),
  phTung: account(P.phTung, "tung.mv@phuhuynh.demo"),
  hsBm6: account(S.bm6First, "hs0001@binhminh.demo"),
};

// ---------- Gán vai trò ----------
let rn = 0;
const assignments: RoleAssignment[] = [];
function assign(accountId: string, roleCode: string, scopeUnitId: string, validTo?: string): string {
  rn += 1;
  const id = did("assign", rn);
  assignments.push({ id, accountId, roleCode, scopeUnitId, status: "ACTIVE", validFrom: "2025-08-01", validTo });
  return id;
}
export const R = {
  platformAdmin: assign(A.platformAdmin, "PLATFORM_ADMIN", U.platform),
  soLeader: assign(A.soLeader, "SO_LEADER", U.so),
  soSpecialist: assign(A.soSpecialist, "SO_SPECIALIST", U.so),
  soAdmin: assign(A.soAdmin, "SO_ADMIN", U.so),
  bmPrincipal: assign(A.bmPrincipal, "SCHOOL_LEADER", U.bm),
  bmAdmin: assign(A.bmAdmin, "SCHOOL_ADMIN", U.bm),
  bmLanHead: assign(A.bmLan, "DEPT_HEAD", U.bmKhtn),
  bmLanTeacher: assign(A.bmLan, "TEACHER", U.bm),
  bmAnh: assign(A.bmAnh, "TEACHER", U.bm),
  bmHuong: assign(A.bmHuong, "TEACHER", U.bm),
  tsPrincipal: assign(A.tsPrincipal, "SCHOOL_LEADER", U.ts),
  tsNgocTeacher: assign(A.tsNgoc, "TEACHER", U.ts),
  tsNgocGuardian: assign(A.tsNgoc, "GUARDIAN", U.platform),
  smPrincipal: assign(A.smPrincipal, "SCHOOL_LEADER", U.sm),
  kdiAdmin: assign(A.kdiAdmin, "PROVIDER_ADMIN", U.kdi),
  kdiExpert: assign(A.kdiExpert, "PROVIDER_EXPERT", U.kdi),
  phThu: assign(A.phThu, "GUARDIAN", U.platform),
  phTung: assign(A.phTung, "GUARDIAN", U.platform),
  hsBm6: assign(A.hsBm6, "STUDENT", U.bm),
};

// ---------- Nhân sự thuộc đơn vị ----------
const staff: StaffMembership[] = [
  { personId: P.soLeader, unitId: U.so, position: "Phó Giám đốc Sở" },
  { personId: P.soSpecialist, unitId: U.so, position: "Chuyên viên phòng GDTrH" },
  { personId: P.soAdmin, unitId: U.so, position: "Quản trị hệ thống" },
  { personId: P.bmPrincipal, unitId: U.bm, position: "Hiệu trưởng" },
  { personId: P.bmAdmin, unitId: U.bm, position: "Quản trị CNTT" },
  { personId: P.bmLan, unitId: U.bmKhtn, position: "Tổ trưởng" },
  { personId: P.bmHuong, unitId: U.bmKhtn, position: "Giáo viên" },
  { personId: P.bmAnh, unitId: U.bmToan, position: "Giáo viên" },
  { personId: P.tsPrincipal, unitId: U.ts, position: "Hiệu trưởng" },
  { personId: P.tsNgoc, unitId: U.tsLy, position: "Giáo viên" },
  { personId: P.smPrincipal, unitId: U.sm, position: "Hiệu trưởng" },
  { personId: P.kdiAdmin, unitId: U.kdi, position: "Giám đốc triển khai" },
  { personId: P.kdiExpert, unitId: U.kdi, position: "Chuyên gia đào tạo" },
];

const teaching: TeachingAssignment[] = [
  { personId: P.bmHuong, classId: C.bm6, subject: "Khoa học tự nhiên" },
  { personId: P.bmLan, classId: C.bm8, subject: "Khoa học tự nhiên" },
  { personId: P.bmAnh, classId: C.bm7, subject: "Toán" },
  { personId: P.bmAnh, classId: C.bm9, subject: "Tin học" },
  { personId: P.tsNgoc, classId: C.ts10, subject: "Vật lý" },
];

// ---------- Liên kết phụ huynh ----------
const guardianLinks: GuardianLink[] = [
  { id: did("link", 1), guardianPersonId: P.phThu, studentPersonId: S.bm6First, relation: "ME", status: "VERIFIED", method: "INVITE_OTP", verifiedAt: "2026-09-10", expiresAt: "2027-08-31" },
  { id: did("link", 2), guardianPersonId: P.phThu, studentPersonId: S.ts10First, relation: "ME", status: "VERIFIED", method: "TEACHER_APPROVAL", verifiedAt: "2026-09-12", expiresAt: "2027-08-31" },
  { id: did("link", 3), guardianPersonId: P.tsNgoc, studentPersonId: S.bm8First, relation: "ME", status: "VERIFIED", method: "INVITE_OTP", verifiedAt: "2026-09-15", expiresAt: "2027-08-31" },
  { id: did("link", 4), guardianPersonId: P.phTung, studentPersonId: S.bm6Second, relation: "CHA", status: "PENDING" },
];

// ---------- Quyền dữ liệu cho nhà cung cấp ----------
const grants: ProviderGrant[] = [
  { id: did("grant", 1), providerUnitId: U.kdi, schoolUnitId: U.bm, programCode: "ROBOTICS-THCS", level: "AGGREGATE", validFrom: "2026-09-01", validTo: "2027-06-30" },
  { id: did("grant", 2), providerUnitId: U.kdi, schoolUnitId: U.ts, programCode: "IOT-THPT", level: "CLASS", validFrom: "2025-09-01", validTo: "2026-06-30" },
];

// ---------- Cấu hình theo tầng ----------
let cn = 0;
function setting(unitId: string, key: string, value: unknown, mode: ConfigSetting["mode"]): ConfigSetting {
  cn += 1;
  return { id: did("setting", cn), unitId, key, value, mode, version: 1, updatedAt: "2026-09-01T08:00:00+07:00" };
}
const settings: ConfigSetting[] = [
  // Mặc định nền tảng: mọi phân hệ bật được bật/tắt đều bật, cấp dưới tự chủ
  ...(["training", "program", "resource", "schedule", "session", "assess", "survey", "integration"] as const).map((m) =>
    setting(U.platform, `module.${m}`, { enabled: true }, "AUTONOMOUS")),
  // Sở bắt buộc: định hướng & kế hoạch, buổi dạy & điểm danh, khảo sát, báo cáo phải bật ở mọi trường
  setting(U.so, "module.plan", { enabled: true }, "MANDATORY"),
  setting(U.so, "module.session", { enabled: true }, "MANDATORY"),
  setting(U.so, "module.survey", { enabled: true }, "MANDATORY"),
  setting(U.so, "module.report", { enabled: true }, "MANDATORY"),
  // Danh mục loại hoạt động STEM: Sở ban hành, trường được thêm (EXTEND)
  setting(U.so, "catalog.activity_types", ["Bài học STEM", "Hoạt động trải nghiệm STEM", "Nghiên cứu khoa học kỹ thuật"], "EXTEND"),
  setting(U.bm, "catalog.activity_types", ["CLB Robotics"], "EXTEND"),
  // Quy trình duyệt buổi dạy & minh chứng: Sở cho phép trường tự quyết có bước Tổ rà soát hay không
  setting(U.so, "wf.session.dept_review", { enabled: true }, "AUTONOMOUS"),
  setting(U.ts, "wf.session.dept_review", { enabled: false }, "AUTONOMOUS"),
  // Tiểu học Sao Mai chưa có phòng STEM → tắt phân hệ Thiết bị, vật tư & phòng
  setting(U.sm, "module.resource", { enabled: false }, "AUTONOMOUS"),
];

const todos: TodoItem[] = [
  { id: "t1", unitId: U.so, portal: "so", title: "2 trường chưa nộp báo cáo tháng 9", detail: "THPT Thanh Sơn, TH Sao Mai — hạn 10/10/2026", due: "2026-10-10", severity: "danger" },
  { id: "t2", unitId: U.so, portal: "so", title: "1 học liệu chờ thẩm định (phân hệ 2)", detail: "KDI Education gửi 'Robotics cơ bản khối 6 — v2'", severity: "warning" },
  { id: "t3", unitId: U.bm, portal: "truong", title: "1 liên kết phụ huynh chờ xác minh", detail: "Mai Văn Tùng → học sinh lớp 6A1", severity: "warning" },
  { id: "t4", unitId: U.bm, portal: "truong", title: "Kế hoạch STEM HK1 chờ BGH duyệt", detail: "Tổ KHTN gửi 12/10/2026", due: "2026-10-20", severity: "info" },
  { id: "t5", unitId: U.bmKhtn, portal: "to", title: "3 minh chứng buổi dạy chờ tổ rà soát", detail: "Lớp 6A1, 8A1 — phân hệ 6", severity: "warning" },
  { id: "t6", unitId: U.bm, portal: "gv", title: "Nộp nhật ký & minh chứng buổi dạy 'Mạch điện đơn giản'", detail: "Lớp 6A1 — hạn 18/10", due: "2026-10-18", severity: "info" },
  { id: "t7", unitId: U.kdi, portal: "ncc", title: "Quyền dữ liệu tại THPT Thanh Sơn đã hết hạn", detail: "Hết hạn 30/06/2026 — đề nghị trường gia hạn", severity: "danger" },
];

// ---------- Tiến trình 5 bước triển khai đề án (dữ liệu MINH HỌA — tự động hóa ở M3) ----------
type Item = { label: string; module: string; done: boolean };
const it = (label: string, module: string, done: boolean): Item => ({ label, module, done });
const deAn: DeAnProgress[] = [
  {
    unitId: U.so, academicYearId: YEAR, steps: [
      { no: 1, status: "DONE", items: [it("Ban hành kế hoạch STEM năm học 2026-2027", "plan", true), it("Bộ chỉ số & giao chỉ tiêu cho 3 trường", "plan", true), it("Khảo sát hiện trạng cơ sở giáo dục", "survey", true), it("Khung chương trình STEM cấp tỉnh", "program", true)] },
      { no: 2, status: "IN_PROGRESS", items: [it("Duyệt kế hoạch STEM của trường (2/3)", "plan", false), it("Phê duyệt kế hoạch bồi dưỡng GV toàn tỉnh", "training", true)] },
      { no: 3, status: "IN_PROGRESS", items: [it("Tập huấn đợt 1 cho GV cốt cán", "training", true), it("Thẩm định học liệu nhà cung cấp", "program", false)] },
      { no: 4, status: "NOT_STARTED", items: [it("Giám sát buổi dạy & điểm danh", "session", false), it("Khảo sát mức độ hài lòng giữa kỳ", "survey", false)] },
      { no: 5, status: "NOT_STARTED", items: [it("Tổng hợp báo cáo học kỳ I", "report", false), it("Đề xuất cải tiến", "report", false)] },
    ],
  },
  {
    unitId: U.bm, academicYearId: YEAR, steps: [
      { no: 1, status: "DONE", items: [it("Tiếp nhận định hướng & chỉ tiêu của Sở", "plan", true), it("Trả lời khảo sát hiện trạng", "survey", true)] },
      { no: 2, status: "DONE", items: [it("Kế hoạch STEM năm học được Sở duyệt", "plan", true), it("Hồ sơ lớp, GV, HS, PH", "org", true), it("Kế hoạch & lịch dạy STEM HK I", "schedule", true), it("Kế hoạch thiết bị & vật tư", "resource", true)] },
      { no: 3, status: "IN_PROGRESS", items: [it("3/4 GV hoàn thành tập huấn đợt 1", "training", false), it("Phòng STEM sẵn sàng", "resource", true), it("Buổi dạy & điểm danh tuần 6", "session", false)] },
      { no: 4, status: "NOT_STARTED", items: [it("Đánh giá năng lực & sản phẩm HS giữa kỳ", "assess", false), it("Khảo sát hài lòng HS & PH", "survey", false)] },
      { no: 5, status: "NOT_STARTED", items: [it("Báo cáo định kỳ học kỳ I gửi Sở", "report", false)] },
    ],
  },
  {
    unitId: U.ts, academicYearId: YEAR, steps: [
      { no: 1, status: "DONE", items: [it("Tiếp nhận định hướng & chỉ tiêu của Sở", "plan", true), it("Trả lời khảo sát hiện trạng", "survey", true)] },
      { no: 2, status: "IN_PROGRESS", items: [it("Kế hoạch STEM năm học — Sở yêu cầu bổ sung", "plan", false), it("Hồ sơ lớp, GV, HS, PH", "org", true)] },
      { no: 3, status: "NOT_STARTED", items: [it("Tập huấn GV", "training", false)] },
      { no: 4, status: "NOT_STARTED", items: [] },
      { no: 5, status: "NOT_STARTED", items: [] },
    ],
  },
  {
    unitId: U.sm, academicYearId: YEAR, steps: [
      { no: 1, status: "DONE", items: [it("Tiếp nhận định hướng & chỉ tiêu của Sở", "plan", true)] },
      { no: 2, status: "IN_PROGRESS", items: [it("Kế hoạch STEM năm học (chưa nộp)", "plan", false)] },
      { no: 3, status: "NOT_STARTED", items: [] },
      { no: 4, status: "NOT_STARTED", items: [] },
      { no: 5, status: "NOT_STARTED", items: [] },
    ],
  },
];

export function createDemoDataset(): Dataset {
  return structuredClone({
    units, years, classes, persons, accounts, assignments, staff, teaching, enrollments, guardianLinks,
    grants, settings, labels: [{ unitId: U.ts, key: "unit.TO", label: "Tổ bộ môn" }], audit: [], todos, deAn,
  });
}
