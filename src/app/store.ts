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
const PERSISTED = ["settings", "audit", "catalog", "units", "classes", "persons", "staff", "teaching", "enrollments"] as const;
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
