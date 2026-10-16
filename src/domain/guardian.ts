/**
 * W8 · LIÊN KẾT PHỤ HUYNH (M2c-2) — mirror TS của RPC trong supabase/migrations/20261016001000_guardian_provider.sql.
 *
 *  Trường (QTV, quyền iam.guardian.approve) phát MÃ MỜI một lần cho một học sinh, có hạn 14 ngày,
 *  kèm (tùy chọn) SĐT phụ huynh trong hồ sơ trường. Chỉ lưu băm SHA-256 của mã; mã hiện MỘT lần khi phát.
 *  Phụ huynh nhập mã:
 *    - SĐT tài khoản PH (đã xác thực OTP khi đăng nhập) khớp SĐT trên mã mời → VERIFIED (INVITE_OTP)
 *    - không có/không khớp SĐT → PENDING, trường duyệt (TEACHER_APPROVAL) — phương án dự phòng (D5)
 *  Sai mã quá 5 lần/24 giờ → tạm khóa nhập mã. Liên kết có hạn tới 31/8 cuối năm học.
 *  Học sinh chuyển trường/tốt nghiệp → mọi liên kết bị thu hồi (trigger SQL / setStudentStatus).
 */
import { schoolOfUnit, subtreeIds, type AccessContext } from "./access.ts";
import type { Dataset, GuardianInvite, GuardianLink } from "./model.ts";
import { sha256Hex } from "./sha256.ts";

export class GuardianError extends Error {
  /** true = tính là một lần nhập sai mã (ghi nhật ký LINK_CODE_FAIL) */
  readonly countsAsFailure: boolean;
  constructor(message: string, countsAsFailure = false) {
    super(message);
    this.countsAsFailure = countsAsFailure;
  }
}
const fail = (msg: string, counts = false): never => {
  throw new GuardianError(msg, counts);
};

export const RELATION_LABEL: Record<GuardianLink["relation"], string> = { CHA: "Cha", ME: "Mẹ", NGUOI_GIAM_HO: "Người giám hộ" };
export const INVITE_DAYS = 14;
export const MAX_FAILURES_PER_DAY = 5;
/** Bảng chữ không gây nhầm (bỏ 0/O, 1/I/L) */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
export const hashCode = (code: string) => sha256Hex(normalizeCode(code));

export function generateCode(rand: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  // Lấy mẫu loại bỏ (rejection sampling) để không lệch phân phối
  const out: string[] = [];
  while (out.length < 8) {
    for (const b of rand(16)) if (b < 248 && out.length < 8) out.push(ALPHABET[b % 31]);
  }
  return `${out.slice(0, 4).join("")}-${out.slice(4).join("")}`;
}

const addDays = (day: string, n: number) => new Date(Date.parse(day) + n * 86_400_000).toISOString().slice(0, 10);
const normPhone = (p?: string) => (p ?? "").replace(/[^0-9]/g, "").replace(/^84/, "0");

/** Hạn liên kết: 31/8 của năm kết thúc năm học hiện hành */
export function linkExpiry(ds: Dataset): string {
  const y = ds.years.find((x) => x.isCurrent);
  return `${(y ? new Date(y.endDate) : new Date()).getUTCFullYear()}-08-31`;
}

/** Trường đang học hiện tại của học sinh (nếu có) */
export function studentSchool(ds: Dataset, studentPersonId: string): string | undefined {
  const e = ds.enrollments.find((x) => x.studentPersonId === studentPersonId && x.status === "STUDYING");
  return e && ds.classes.find((c) => c.id === e.classId)?.schoolId;
}

function assertApprover(ds: Dataset, a: AccessContext, studentPersonId: string): string {
  const school = studentSchool(ds, studentPersonId);
  if (!a.has("iam.guardian.approve") || !school || !subtreeIds(ds, a.scopeUnit.id).has(school)) fail("Không có quyền quản lý liên kết của học sinh này");
  return school!;
}

// ---------- Trường ----------
export interface InviteInput { studentPersonId: string; relation: GuardianLink["relation"]; phone?: string }

/** Phát mã mời. Trả mã gốc (chỉ hiển thị một lần) — dataset chỉ giữ băm. */
export function issueInvite(ds: Dataset, a: AccessContext, p: InviteInput, today: string, now: string, code = generateCode()): [Dataset, string, GuardianInvite] {
  assertApprover(ds, a, p.studentPersonId);
  if (!RELATION_LABEL[p.relation]) fail("Quan hệ không hợp lệ");
  const phone = normPhone(p.phone);
  if (p.phone && !/^0[0-9]{9,10}$/.test(phone)) fail("Số điện thoại phụ huynh không hợp lệ");
  const inv: GuardianInvite = {
    id: crypto.randomUUID(), studentPersonId: p.studentPersonId, codeHash: hashCode(code), relation: p.relation,
    phone: phone || undefined, expiresAt: addDays(today, INVITE_DAYS), createdAt: now, createdBy: a.assignment.accountId,
  };
  return [{ ...ds, guardianInvites: [inv, ...ds.guardianInvites] }, code, inv];
}

export function revokeInvite(ds: Dataset, a: AccessContext, inviteId: string, now: string): Dataset {
  const inv = ds.guardianInvites.find((i) => i.id === inviteId);
  if (!inv) return fail("Không tìm thấy mã mời");
  assertApprover(ds, a, inv.studentPersonId);
  if (inv.usedAt || inv.revokedAt) fail("Mã mời đã dùng hoặc đã thu hồi");
  return { ...ds, guardianInvites: ds.guardianInvites.map((i) => (i === inv ? { ...i, revokedAt: now } : i)) };
}

export function approveLink(ds: Dataset, a: AccessContext, linkId: string, now: string): Dataset {
  const l = ds.guardianLinks.find((x) => x.id === linkId);
  if (!l) return fail("Không tìm thấy liên kết");
  assertApprover(ds, a, l.studentPersonId);
  if (l.status !== "PENDING") fail("Chỉ duyệt được liên kết đang chờ");
  return { ...ds, guardianLinks: ds.guardianLinks.map((x) => (x === l
    ? { ...x, status: "VERIFIED", method: "TEACHER_APPROVAL", verifiedAt: now, verifiedBy: a.assignment.accountId, expiresAt: linkExpiry(ds), revokedAt: undefined }
    : x)) };
}

export function revokeLink(ds: Dataset, a: AccessContext, linkId: string, now: string): Dataset {
  const l = ds.guardianLinks.find((x) => x.id === linkId);
  if (!l) return fail("Không tìm thấy liên kết");
  assertApprover(ds, a, l.studentPersonId);
  if (l.status === "REVOKED") fail("Liên kết đã bị thu hồi");
  return { ...ds, guardianLinks: ds.guardianLinks.map((x) => (x === l ? { ...x, status: "REVOKED", revokedAt: now } : x)) };
}

/** Thu hồi mọi liên kết của học sinh (khi chuyển trường/tốt nghiệp) — mirror trigger org.revoke_guardian_links */
export function revokeAllLinksOf(ds: Dataset, studentPersonId: string, now: string): Dataset {
  if (!ds.guardianLinks.some((l) => l.studentPersonId === studentPersonId && l.status !== "REVOKED")) return ds;
  return {
    ...ds,
    guardianLinks: ds.guardianLinks.map((l) => (l.studentPersonId === studentPersonId && l.status !== "REVOKED" ? { ...l, status: "REVOKED", revokedAt: now } : l)),
    guardianInvites: ds.guardianInvites.map((i) => (i.studentPersonId === studentPersonId && !i.usedAt && !i.revokedAt ? { ...i, revokedAt: now } : i)),
  };
}

// ---------- Phụ huynh ----------
export interface RedeemResult { linkId: string; status: "VERIFIED" | "PENDING"; studentName: string }

export function redeemInvite(ds: Dataset, a: AccessContext, code: string, today: string, now: string, recentFailures: number): [Dataset, RedeemResult] {
  if (!a.has("iam.guardian.request") || a.role.scope !== "LINKED") fail("Chỉ tài khoản phụ huynh được nhập mã liên kết");
  if (recentFailures >= MAX_FAILURES_PER_DAY) fail("Đã nhập sai quá 5 lần trong 24 giờ. Vui lòng thử lại sau hoặc liên hệ nhà trường.");
  const norm = normalizeCode(code);
  if (norm.length !== 8) fail("Mã liên kết gồm 8 ký tự", true);
  const h = sha256Hex(norm);
  const inv = ds.guardianInvites.find((i) => i.codeHash === h);
  if (!inv || inv.revokedAt || inv.usedAt || inv.expiresAt < today) return fail("Mã không đúng, đã dùng hoặc đã hết hạn", true);
  if (!studentSchool(ds, inv.studentPersonId)) fail("Học sinh không còn theo học — liên hệ nhà trường");
  const me = ds.persons.find((p) => p.id === a.personId);
  const matched = !!inv.phone && normPhone(me?.phone) === inv.phone;
  const existing = ds.guardianLinks.find((l) => l.guardianPersonId === a.personId && l.studentPersonId === inv.studentPersonId);
  if (existing?.status === "VERIFIED") fail("Bạn đã liên kết với học sinh này");
  const link: GuardianLink = matched
    ? { id: existing?.id ?? crypto.randomUUID(), guardianPersonId: a.personId, studentPersonId: inv.studentPersonId, relation: inv.relation,
        status: "VERIFIED", method: "INVITE_OTP", verifiedAt: now, expiresAt: linkExpiry(ds) }
    : { id: existing?.id ?? crypto.randomUUID(), guardianPersonId: a.personId, studentPersonId: inv.studentPersonId, relation: inv.relation, status: "PENDING" };
  const links = existing ? ds.guardianLinks.map((l) => (l === existing ? link : l)) : [...ds.guardianLinks, link];
  const student = ds.persons.find((p) => p.id === inv.studentPersonId)!;
  return [
    { ...ds, guardianLinks: links, guardianInvites: ds.guardianInvites.map((i) => (i === inv ? { ...i, usedAt: now, usedByPersonId: a.personId } : i)) },
    { linkId: link.id, status: link.status as "VERIFIED" | "PENDING", studentName: student.fullName },
  ];
}

// ---------- Đọc (mirror RLS guardian_link_read / guardian_invite_read) ----------
export interface LinkRow { link: GuardianLink; studentName?: string; className?: string; guardianName?: string; active: boolean }

/** Liên kết của học sinh trong phạm vi người duyệt */
export function linksForApprover(ds: Dataset, a: AccessContext, today: string): LinkRow[] {
  if (!a.has("iam.guardian.approve")) return [];
  return ds.guardianLinks.filter((l) => a.canSeePerson(l.studentPersonId)).map((l) => rowOf(ds, l, today, true));
}

export function invitesForApprover(ds: Dataset, a: AccessContext): GuardianInvite[] {
  if (!a.has("iam.guardian.approve")) return [];
  return ds.guardianInvites.filter((i) => a.canSeePerson(i.studentPersonId));
}

/** Liên kết của chính phụ huynh; tên HS chỉ hiện khi liên kết đã xác minh và còn hạn (tối thiểu dữ liệu) */
export function myLinks(ds: Dataset, a: AccessContext, today: string): LinkRow[] {
  return ds.guardianLinks.filter((l) => l.guardianPersonId === a.personId).map((l) => {
    const r = rowOf(ds, l, today, false);
    return r.active ? r : { ...r, studentName: undefined, className: undefined };
  });
}

function rowOf(ds: Dataset, l: GuardianLink, today: string, withGuardian: boolean): LinkRow {
  const e = ds.enrollments.find((x) => x.studentPersonId === l.studentPersonId && x.status === "STUDYING");
  return {
    link: l,
    studentName: ds.persons.find((p) => p.id === l.studentPersonId)?.fullName,
    className: ds.classes.find((c) => c.id === e?.classId)?.name,
    guardianName: withGuardian ? ds.persons.find((p) => p.id === l.guardianPersonId)?.fullName : undefined,
    active: l.status === "VERIFIED" && (!l.expiresAt || l.expiresAt >= today),
  };
}

export const schoolOfContext = (ds: Dataset, a: AccessContext) => schoolOfUnit(ds, a.scopeUnit.id);
