/**
 * Giải cấu hình kế thừa theo tầng (mirror của cfg.effective() trong 0003_cfg.sql).
 *
 *   Nền tảng → Sở → (Đơn vị trực thuộc) → Trường → Tổ
 *
 * Duyệt từ GỐC xuống LÁ:
 *  - MANDATORY: giá trị bị khóa tại tầng đó, tầng dưới bị bỏ qua (và không được ghi — xem canWrite).
 *  - EXTEND:    mảng được hợp nhất (giữ phần tử của tầng trên, thêm phần tử tầng dưới);
 *               object được merge nông. Tầng dưới không xóa được phần tử tầng trên.
 *  - AUTONOMOUS: tầng dưới (nếu có) thay thế hoàn toàn.
 */
import type { ConfigMode, ConfigSetting, OrgUnit } from "./model.ts";

export interface ResolvedSetting<T = unknown> {
  value: T | undefined;
  /** Đơn vị quyết định giá trị cuối cùng */
  sourceUnitId: string | undefined;
  mode: ConfigMode | undefined;
  /** Đơn vị đã khóa (MANDATORY) — nếu có, cấp dưới không được sửa */
  lockedByUnitId: string | undefined;
  /** Phần tử bị khóa (EXTEND) — từ các tầng trên */
  lockedItems: unknown[];
}

export function resolveSetting<T = unknown>(
  settings: readonly ConfigSetting[],
  chain: readonly OrgUnit[],
  key: string,
): ResolvedSetting<T> {
  let value: unknown = undefined;
  let sourceUnitId: string | undefined;
  let mode: ConfigMode | undefined;
  const leafId = chain.at(-1)?.id;
  const lockedItems: unknown[] = [];

  for (const unit of chain) {
    const s = settings.find((x) => x.unitId === unit.id && x.key === key);
    if (!s) continue;
    if (mode === "EXTEND") {
      // Tầng dưới chỉ được THÊM vào tầng trên
      value = mergeExtend(value, s.value);
      if (s.mode === "MANDATORY") mode = "MANDATORY";
    } else {
      value = s.value;
      mode = s.mode;
    }
    sourceUnitId = unit.id;
    if (mode === "EXTEND" && unit.id !== leafId && Array.isArray(s.value)) {
      for (const item of s.value) if (!lockedItems.includes(item)) lockedItems.push(item);
    }
    if (mode === "MANDATORY") {
      return { value: value as T, sourceUnitId, mode, lockedByUnitId: unit.id, lockedItems: [] };
    }
  }
  return { value: value as T | undefined, sourceUnitId, mode, lockedByUnitId: undefined, lockedItems };
}

function mergeExtend(base: unknown, ext: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(ext)) return [...base, ...ext.filter((x) => !base.includes(x))];
  if (isObj(base) && isObj(ext)) return { ...ext, ...base }; // tầng trên thắng ở khóa trùng
  return base ?? ext;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Đơn vị `unitId` có được ghi cấu hình `key` không (không bị tầng trên khóa MANDATORY). */
export function canWriteSetting(settings: readonly ConfigSetting[], chain: readonly OrgUnit[], key: string): boolean {
  const ancestors = chain.slice(0, -1);
  return !ancestors.some((u) => settings.some((s) => s.unitId === u.id && s.key === key && s.mode === "MANDATORY"));
}

/** Module có bật cho đơn vị không. Mặc định (không có cấu hình) = bật. */
export function isModuleEnabled(settings: readonly ConfigSetting[], chain: readonly OrgUnit[], moduleCode: string): boolean {
  const r = resolveSetting<{ enabled?: boolean }>(settings, chain, `module.${moduleCode}`);
  return r.value?.enabled ?? true;
}
