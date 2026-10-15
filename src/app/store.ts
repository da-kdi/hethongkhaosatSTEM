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

const STORAGE_KEY = "stem-demo-v1";

function load(): State {
  const fresh: State = { ds: createDemoDataset(), session: { accountId: null, assignmentId: null } };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<Pick<Dataset, "settings" | "audit">> & { session?: Session };
    return {
      ds: { ...fresh.ds, settings: saved.settings ?? fresh.ds.settings, audit: saved.audit ?? [] },
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: state.ds.settings, audit: state.ds.audit, session: state.session }));
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
