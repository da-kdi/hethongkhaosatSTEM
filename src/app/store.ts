/**
 * Kho dữ liệu chế độ DEMO (chạy hoàn toàn trên trình duyệt, không cần backend).
 * - Dữ liệu khởi tạo từ src/demo/seed.ts (cùng nguồn với supabase/seed.sql).
 * - Mọi đọc dữ liệu đi qua bộ máy phạm vi src/domain/access.ts (mirror RLS).
 * - Mọi thay đổi ghi nhật ký (audit) như backend thật.
 * - Lưu localStorage để giữ phiên/cấu hình khi tải lại trang (bọc try/catch).
 *
 * M1: thêm SupabaseDataSource với cùng API, chọn theo VITE_SUPABASE_URL.
 */
import { useSyncExternalStore } from "react";
import { assignmentsOf, buildAccess, ancestorsOf, subtreeIds, type AccessContext } from "@/domain/access";
import { canWriteSetting } from "@/domain/config";
import { applyImport, type ImportInput } from "@/domain/catalog";
import * as org from "@/domain/orgOps";
import { exportTable, planImport, type ExchangeKind, type ImportPlan } from "@/domain/exchange";
import * as guardian from "@/domain/guardian";
import { upsertProviderProfile, type ProviderInput } from "@/domain/provider";
import type { AuditEntry, ConfigMode, Dataset } from "@/domain/model";
import { createDemoDataset, DEMO_TODAY } from "@/demo/seed";

export interface Session {
  accountId: string | null;
  assignmentId: string | null;
}

interface State {
  ds: Dataset;
  session: Session;
}

const STORAGE_KEY = "stem-demo-v2";

/** Phần dữ liệu demo lưu lại giữa các lần tải trang (dữ liệu hư cấu). */
const PERSISTED = ["settings", "audit", "catalog", "units", "classes", "persons", "staff", "teaching", "enrollments",
  "guardianLinks", "guardianInvites", "providerProfiles"] as const;
type PersistedKey = (typeof PERSISTED)[number];

function load(): State {
  const fresh: State = { ds: createDemoDataset(), session: { accountId: null, assignmentId: null } };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<Pick<Dataset, PersistedKey>> & { session?: Session };
    return {
      ds: { ...fresh.ds, ...Object.fromEntries(PERSISTED.filter((k) => saved[k] !== undefined).map((k) => [k, saved[k]])) },
      session: saved.session ?? fresh.session,
    };
  } catch {
    return fresh;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...Object.fromEntries(PERSISTED.map((k) => [k, state.ds[k]])), session: state.session }));
  } catch {
    /* trình duyệt chặn lưu trữ — vẫn chạy được trong bộ nhớ */
  }
}

function set(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** Snapshot trạng thái (ngoài React) — dùng trong test và hàm tiện ích. */
export function getState(): State {
  return state;
}

export const TODAY = DEMO_TODAY;

let auditSeq = 0;
function audit(ds: Dataset, session: Session, e: Omit<AuditEntry, "id" | "at" | "actorAccountId" | "activeAssignmentId">): AuditEntry[] {
  auditSeq += 1;
  const entry: AuditEntry = {
    id: `${Date.now()}-${auditSeq}`,
    at: new Date().toISOString(),
    actorAccountId: session.accountId,
    activeAssignmentId: session.assignmentId,
    ...e,
  };
  return [entry, ...ds.audit].slice(0, 500);
}

export function getAccess(s: State = state): AccessContext | null {
  if (!s.session.accountId || !s.session.assignmentId) return null;
  return buildAccess(s.ds, s.session.accountId, s.session.assignmentId, TODAY);
}

/** Ghi hồ sơ: chạy quy tắc (mirror RPC), ghi nhật ký (không lưu giá trị cá nhân). */
function mutateOrg(entity: string, action: string, fn: (ds: Dataset, a: AccessContext) => [Dataset, string], summary: string): string {
  const access = getAccess();
  if (!access) throw new Error("Chưa chọn ngữ cảnh");
  const [ds, id] = fn(state.ds, access);
  const unitId = access.configUnitId;
  set({ ...state, ds: { ...ds, audit: audit(ds, state.session, { action, entity, entityId: id, unitId, summary }) } });
  return id;
}

export const actions = {
  login(accountId: string) {
    const ctxs = assignmentsOf(state.ds, accountId, TODAY);
    const session = { accountId, assignmentId: ctxs.length === 1 ? ctxs[0].id : null };
    set({ ...state, session, ds: { ...state.ds, audit: audit(state.ds, session, { action: "LOGIN", entity: "iam.account", entityId: accountId, summary: "Đăng nhập (demo)" }) } });
  },
  switchContext(assignmentId: string) {
    const { accountId } = state.session;
    if (!accountId || !buildAccess(state.ds, accountId, assignmentId, TODAY)) throw new Error("Ngữ cảnh không hợp lệ");
    const session = { accountId, assignmentId };
    set({ ...state, session, ds: { ...state.ds, audit: audit(state.ds, session, { action: "CONTEXT_SWITCH", entity: "iam.role_assignment", entityId: assignmentId, summary: "Chuyển ngữ cảnh làm việc" }) } });
  },
  logout() {
    set({ ...state, session: { accountId: null, assignmentId: null } });
  },
  resetDemo() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
    set({ ds: createDemoDataset(), session: { accountId: null, assignmentId: null } });
  },
  // ---------- Phân hệ 4 · hồ sơ tổ chức dạy học (mirror RPC org.*) ----------
  upsertDepartment: (p: org.DepartmentInput) => mutateOrg("org.unit", p.id ? "UPDATE" : "INSERT", (ds, a) => org.upsertDepartment(ds, a, p), `Tổ: ${p.name}`),
  upsertTeacher: (p: org.TeacherInput) => mutateOrg("org.staff_membership", p.personId ? "UPDATE" : "INSERT", (ds, a) => org.upsertTeacher(ds, a, p), "Hồ sơ giáo viên"),
  upsertClass: (p: org.ClassInput) => mutateOrg("org.class", p.id ? "UPDATE" : "INSERT", (ds, a) => org.upsertClass(ds, a, p), `Lớp ${p.name}`),
  upsertStudent: (p: org.StudentInput) => mutateOrg("org.enrollment", p.personId ? "UPDATE" : "INSERT", (ds, a) => org.upsertStudent(ds, a, p), "Hồ sơ học sinh"),
  setTeaching: (p: org.TeachingInput) =>
    mutateOrg("org.teaching_assignment", p.remove ? "DELETE" : "INSERT", (ds, a) => [org.setTeaching(ds, a, p), p.classId], `Phân công ${p.subject}`),
  setStudentStatus: (personId: string, status: "STUDYING" | "TRANSFERRED" | "GRADUATED") =>
    mutateOrg("org.enrollment", "UPDATE", (ds, a) => [org.setStudentStatus(ds, a, personId, status), personId], `Trạng thái: ${status}`),
  // ---------- W8 · Liên kết phụ huynh (mirror RPC iam.issue_guardian_invite / redeem / approve / revoke) ----------
  /** Phát mã mời — trả mã gốc để hiển thị MỘT lần; nhật ký không ghi mã hay SĐT. */
  issueGuardianInvite(p: guardian.InviteInput): string {
    let code = "";
    mutateOrg("iam.guardian_invite", "INSERT", (ds, a) => {
      const [next, c, inv] = guardian.issueInvite(ds, a, p, TODAY, new Date().toISOString());
      code = c;
      return [next, inv.id];
    }, `Phát mã mời (${guardian.RELATION_LABEL[p.relation]}${p.phone ? ", có SĐT đối chiếu" : ""})`);
    return code;
  },
  revokeGuardianInvite: (id: string) =>
    mutateOrg("iam.guardian_invite", "UPDATE", (ds, a) => [guardian.revokeInvite(ds, a, id, new Date().toISOString()), id], "Thu hồi mã mời"),
  approveGuardianLink: (id: string) =>
    mutateOrg("iam.guardian_link", "UPDATE", (ds, a) => [guardian.approveLink(ds, a, id, new Date().toISOString()), id], "Duyệt liên kết phụ huynh"),
  revokeGuardianLink: (id: string) =>
    mutateOrg("iam.guardian_link", "UPDATE", (ds, a) => [guardian.revokeLink(ds, a, id, new Date().toISOString()), id], "Thu hồi liên kết phụ huynh"),
  /** Phụ huynh nhập mã. Sai mã → ghi LINK_CODE_FAIL (đếm để khóa sau 5 lần/24 giờ). */
  redeemGuardianCode(code: string): guardian.RedeemResult {
    const access = getAccess();
    if (!access) throw new Error("Chưa chọn ngữ cảnh");
    const since = Date.now() - 86_400_000;
    const failures = state.ds.audit.filter((e) => e.action === "LINK_CODE_FAIL" && e.actorAccountId === state.session.accountId && Date.parse(e.at) >= since).length;
    try {
      const [ds, r] = guardian.redeemInvite(state.ds, access, code, TODAY, new Date().toISOString(), failures);
      set({ ...state, ds: { ...ds, audit: audit(ds, state.session, { action: "UPDATE", entity: "iam.guardian_link", entityId: r.linkId, summary: r.status === "VERIFIED" ? "Liên kết bằng mã mời (đã xác minh)" : "Gửi yêu cầu liên kết (chờ trường duyệt)" }) } });
      return r;
    } catch (e) {
      if (e instanceof guardian.GuardianError && e.countsAsFailure) {
        set({ ...state, ds: { ...state.ds, audit: audit(state.ds, state.session, { action: "LINK_CODE_FAIL", entity: "iam.guardian_invite", entityId: "—", summary: `Nhập sai mã liên kết (lần ${failures + 1}/${guardian.MAX_FAILURES_PER_DAY})` }) } });
      }
      throw e;
    }
  },
  // ---------- Hồ sơ nhà cung cấp ----------
  upsertProviderProfile: (p: ProviderInput) =>
    mutateOrg("org.provider_profile", "UPDATE", (ds, a) => [upsertProviderProfile(ds, a, p, new Date().toISOString()), a.scopeUnit.id], "Cập nhật hồ sơ nhà cung cấp"),
  // ---------- Nhập/xuất hồ sơ theo tên kỹ thuật QĐ 2768 (mirror RPC org.import_* / org.log_export) ----------
  /** Chạy thử: không ghi gì, trả kế hoạch (số mới/cập nhật, lỗi theo dòng). */
  planImport(kind: ExchangeKind, table: string[][]): ImportPlan {
    const access = getAccess();
    if (!access || !access.has("org.person.manage")) throw new Error("Không có quyền nhập hồ sơ");
    return planImport(state.ds, access, kind, table);
  },
  /** Ghi cả lô — chỉ khi không có lỗi (tất cả hoặc không). */
  commitImport(kind: ExchangeKind, table: string[][], fileName?: string): ImportPlan {
    const plan = actions.planImport(kind, table);
    if (plan.errors.length || !plan.result) throw new Error(`Tệp còn ${plan.errors.length} lỗi, chưa ghi dữ liệu nào`);
    const access = getAccess()!;
    set({ ...state, ds: { ...plan.result, audit: audit(plan.result, state.session, {
      action: "IMPORT", entity: kind === "students" ? "org.enrollment" : "org.staff_membership", entityId: fileName ?? "tệp nhập",
      unitId: access.configUnitId, summary: `${plan.created} mới, ${plan.updated} cập nhật (${plan.total} dòng)` }) } });
    return plan;
  },
  /** Xuất dữ liệu trong phạm vi (dữ liệu cá nhân chỉ khi có quyền) — ghi nhật ký EXPORT. */
  exportRecords(kind: ExchangeKind): string[][] {
    const access = getAccess();
    if (!access || !access.has("report.export")) throw new Error("Không có quyền xuất dữ liệu");
    const table = exportTable(state.ds, access, kind);
    set({ ...state, ds: { ...state.ds, audit: audit(state.ds, state.session, {
      action: "EXPORT", entity: kind === "students" ? "org.enrollment" : "org.staff_membership", entityId: `${table.length - 2} dòng`,
      unitId: access.configUnitId, summary: `Xuất ${table.length - 2} hồ sơ ${kind === "students" ? "học sinh" : "giáo viên"}` }) } });
    return table;
  },
  /** Nạp danh mục — kiểm quyền giống catalog.import_code_list(): chỉ Quản trị nền tảng */
  importCodeList(input: ImportInput) {
    const access = getAccess();
    if (!access || access.role.scope !== "PLATFORM" || !access.has("cfg.catalog.manage")) {
      throw new Error("Chỉ Quản trị nền tảng được nạp danh mục");
    }
    const now = new Date().toISOString();
    const catalog = applyImport(state.ds.catalog, input, state.session.accountId ?? undefined, now);
    const b = catalog.batches[0];
    set({
      ...state,
      ds: { ...state.ds, catalog, audit: audit(state.ds, state.session, { action: "IMPORT", entity: "catalog.code_list", entityId: input.list, summary: `Phiên bản ${b.version} (${b.source}): +${b.inserted} mới, ${b.updated} cập nhật, ${b.deprecated} ngừng dùng` }) },
    });
    return b;
  },
  /** Ghi cấu hình — kiểm quyền giống cfg.set_setting() + trigger khóa MANDATORY */
  setSetting(unitId: string, key: string, value: unknown, mode: ConfigMode) {
    const access = getAccess();
    if (!access) throw new Error("Chưa chọn ngữ cảnh");
    if (!access.has("cfg.setting.manage") || !subtreeIds(state.ds, access.scopeUnit.id).has(unitId)) {
      throw new Error("Không có quyền sửa cấu hình đơn vị này");
    }
    const chain = ancestorsOf(state.ds, unitId);
    if (!canWriteSetting(state.ds.settings, chain, key)) throw new Error(`Cấu hình "${key}" đã bị cấp trên khóa`);
    const existing = state.ds.settings.find((s) => s.unitId === unitId && s.key === key);
    const settings = existing
      ? state.ds.settings.map((s) => (s === existing ? { ...s, value, mode, version: s.version + 1, updatedAt: new Date().toISOString(), updatedBy: state.session.accountId ?? undefined } : s))
      : [...state.ds.settings, { id: crypto.randomUUID(), unitId, key, value, mode, version: 1, updatedAt: new Date().toISOString(), updatedBy: state.session.accountId ?? undefined }];
    const unitName = state.ds.units.find((u) => u.id === unitId)?.name ?? unitId;
    set({
      ...state,
      ds: { ...state.ds, settings, audit: audit(state.ds, state.session, { action: existing ? "UPDATE" : "INSERT", entity: "cfg.setting", entityId: `${unitName} · ${key}`, unitId, summary: `${key} = ${JSON.stringify(value)} (${mode})` }) },
    });
  },
};
