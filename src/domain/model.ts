/** Kiểu dữ liệu lõi — khớp 1-1 với các bảng trong supabase/migrations (xem docs/DATA_MODEL.md). */

export type UnitType = "PLATFORM" | "SO" | "DON_VI" | "TRUONG" | "TO" | "NCC";
export type SchoolLevel = "MN" | "TH" | "THCS" | "THPT" | "LIEN_CAP";

export interface OrgUnit {
  id: string;
  parentId: string | null;
  type: UnitType;
  code: string;
  name: string;
  /** Xã/phường — thuộc tính địa bàn để lọc, không phải cấp quản lý */
  ward?: string;
  schoolLevel?: SchoolLevel;
  /** BG_00419 truongId (trường, ≤15) / BG_00420 maDinhDanhToChuc */
  maDinhDanh?: string;
  /** BG_00429 loaiHinhCsgd — giá trị theo danh mục CSDL ngành của Bộ (M2) */
  loaiHinhCsgd?: string;
  /** BG_00426 tinhThanhCsgd */
  tinhThanh?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface AcademicYear {
  id: string;
  code: string; // "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  /** Tổ quản lý chuyên môn (nếu có) */
  departmentId?: string;
  academicYearId: string;
  /** BG_00504 maLop */
  maLop?: string;
  /** BG_00505 tenLop */
  name: string;
  /** BG_00506 khoi */
  grade: number;
  homeroomPersonId?: string;
}

export interface Person {
  id: string;
  fullName: string;
  /** Trường dữ liệu cá nhân — chỉ đọc khi có quyền org.person.personal hoặc là chính mình */
  birthDate?: string;
  phone?: string;
  gender?: "NAM" | "NU";
}

export interface Account {
  /** = auth.users.id */
  id: string;
  personId: string;
  email: string;
  status: "ACTIVE" | "LOCKED";
}

export interface RoleAssignment {
  id: string;
  accountId: string;
  roleCode: string;
  scopeUnitId: string;
  status: "ACTIVE" | "REVOKED";
  validFrom: string;
  validTo?: string;
}

/** Nhân sự thuộc đơn vị (Sở, trường, tổ, nhà cung cấp) */
export interface StaffMembership {
  personId: string;
  unitId: string;
  position: string;
}

export interface TeachingAssignment {
  personId: string;
  classId: string;
  subject: string;
}

export interface Enrollment {
  studentPersonId: string;
  classId: string;
  status: "STUDYING" | "TRANSFERRED" | "GRADUATED";
  studentCode: string;
}

export interface GuardianLink {
  id: string;
  guardianPersonId: string;
  studentPersonId: string;
  relation: "CHA" | "ME" | "NGUOI_GIAM_HO";
  status: "PENDING" | "VERIFIED" | "REVOKED";
  method?: "INVITE_OTP" | "TEACHER_APPROVAL";
  verifiedAt?: string;
  verifiedBy?: string;
  expiresAt?: string;
  revokedAt?: string;
}

/** Mã mời liên kết phụ huynh (W8): dùng một lần, có hạn, chỉ lưu băm SHA-256 của mã. */
export interface GuardianInvite {
  id: string;
  studentPersonId: string;
  codeHash: string;
  relation: GuardianLink["relation"];
  /** SĐT phụ huynh trường ghi nhận khi phát mã; khớp SĐT tài khoản PH → xác minh ngay, không khớp/không có → chờ trường duyệt */
  phone?: string;
  expiresAt: string;
  createdAt: string;
  createdBy?: string;
  usedAt?: string;
  usedByPersonId?: string;
  revokedAt?: string;
}

/** Hồ sơ nhà cung cấp (đơn vị loại NCC). Tên đơn vị nằm ở OrgUnit.name. */
export interface ProviderProfile {
  unitId: string;
  maDinhDanhToChuc?: string; // BG_00420
  loaiToChuc?: string; // BG_00811 loaiToChucHopTacDn
  address?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  fields: string[];
  description?: string;
  updatedAt?: string;
}

export type GrantLevel = "AGGREGATE" | "CLASS" | "NAMED";

export interface ProviderGrant {
  id: string;
  providerUnitId: string;
  schoolUnitId: string;
  programCode?: string;
  level: GrantLevel;
  validFrom: string;
  validTo: string;
}

export type ConfigMode = "MANDATORY" | "EXTEND" | "AUTONOMOUS";

export interface ConfigSetting {
  id: string;
  unitId: string;
  key: string;
  value: unknown;
  mode: ConfigMode;
  version: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface TermLabel {
  unitId: string;
  key: string;
  label: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorAccountId: string | null;
  activeAssignmentId: string | null;
  action: string;
  entity: string;
  entityId: string;
  /** Đơn vị liên quan — dùng để lọc nhật ký theo phạm vi */
  unitId?: string;
  /** Mô tả thay đổi đã che dữ liệu cá nhân */
  summary: string;
}

/** Việc cần làm (demo) — các module nghiệp vụ sẽ sinh ra ở M3/M4 */
export interface TodoItem {
  id: string;
  unitId: string;
  portal: string;
  title: string;
  detail: string;
  due?: string;
  severity: "info" | "warning" | "danger";
}

/** Tiến trình 5 bước triển khai đề án của một đơn vị trong năm học (P0 · Định hướng & kế hoạch). */
export type StepStatus = "DONE" | "IN_PROGRESS" | "NOT_STARTED";
export interface DeAnProgress {
  unitId: string;
  academicYearId: string;
  steps: { no: 1 | 2 | 3 | 4 | 5; status: StepStatus; items: { label: string; module: string; done: boolean }[] }[];
}

import type { CatalogState } from "./catalog.ts";

export interface Dataset {
  units: OrgUnit[];
  years: AcademicYear[];
  classes: ClassRoom[];
  persons: Person[];
  accounts: Account[];
  assignments: RoleAssignment[];
  staff: StaffMembership[];
  teaching: TeachingAssignment[];
  enrollments: Enrollment[];
  guardianLinks: GuardianLink[];
  guardianInvites: GuardianInvite[];
  grants: ProviderGrant[];
  providerProfiles: ProviderProfile[];
  settings: ConfigSetting[];
  labels: TermLabel[];
  audit: AuditEntry[];
  todos: TodoItem[];
  deAn: DeAnProgress[];
  catalog: CatalogState;
}
