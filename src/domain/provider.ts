/**
 * Hồ sơ nhà cung cấp (M2c-2) — mirror TS của org.upsert_provider_profile + RLS provider_profile_read.
 * Nhà cung cấp tự cập nhật hồ sơ của mình; Sở/trường/tổ (cán bộ quản lý) xem được để lựa chọn, cấp quyền hợp tác.
 * Hồ sơ là thông tin tổ chức, không chứa dữ liệu học sinh.
 */
import type { AccessContext } from "./access.ts";
import type { Dataset, ProviderProfile } from "./model.ts";
import { checkName, OrgError } from "./orgOps.ts";

/** Lĩnh vực STEM (danh mục nội bộ; chuyển sang danh mục dùng chung khi có trong CSDL ngành) */
export const PROVIDER_FIELDS = ["Robotics", "Lập trình", "IoT", "Trí tuệ nhân tạo", "Khoa học tự nhiên", "Toán học ứng dụng", "Kỹ thuật – Cơ khí", "Thiết bị", "Đào tạo giáo viên"] as const;

const fail = (m: string): never => { throw new OrgError(m); };

export interface ProviderInput extends Omit<ProviderProfile, "unitId" | "updatedAt"> { name: string }

export function canEditProvider(a: AccessContext): boolean {
  return a.has("org.provider.manage") && a.role.scope === "GRANT" && a.scopeUnit.type === "NCC";
}

export function upsertProviderProfile(ds: Dataset, a: AccessContext, p: ProviderInput, now: string): Dataset {
  if (!canEditProvider(a)) fail("Chỉ quản trị nhà cung cấp được sửa hồ sơ của đơn vị mình");
  const name = checkName(p.name, "Tên đơn vị");
  const t = (v?: string, max = 200) => {
    const s = (v ?? "").trim();
    if (s.length > max) fail(`Giá trị vượt quá ${max} ký tự`);
    return s || undefined;
  };
  const prof: ProviderProfile = {
    unitId: a.scopeUnit.id,
    maDinhDanhToChuc: t(p.maDinhDanhToChuc, 35),
    loaiToChuc: t(p.loaiToChuc, 100),
    address: t(p.address),
    website: t(p.website),
    contactName: t(p.contactName, 120),
    contactEmail: t(p.contactEmail, 120),
    contactPhone: t(p.contactPhone, 15),
    fields: [...new Set(p.fields)].filter((f) => (PROVIDER_FIELDS as readonly string[]).includes(f)),
    description: t(p.description, 1000),
    updatedAt: now,
  };
  if (prof.maDinhDanhToChuc && !/^[0-9A-Za-z-]{6,35}$/.test(prof.maDinhDanhToChuc)) fail("Mã định danh tổ chức không hợp lệ");
  if (prof.website && !/^https:\/\/[^\s]+$/.test(prof.website)) fail("Website phải bắt đầu bằng https://");
  if (prof.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(prof.contactEmail)) fail("Email liên hệ không hợp lệ");
  if (prof.contactPhone && !/^[0-9+ ]{8,15}$/.test(prof.contactPhone)) fail("Số điện thoại liên hệ không hợp lệ");
  const exists = ds.providerProfiles.some((x) => x.unitId === prof.unitId);
  return {
    ...ds,
    units: ds.units.map((u) => (u.id === prof.unitId ? { ...u, name } : u)),
    providerProfiles: exists ? ds.providerProfiles.map((x) => (x.unitId === prof.unitId ? prof : x)) : [...ds.providerProfiles, prof],
  };
}

/** Ai xem được hồ sơ NCC: chính NCC đó; cán bộ cấp Nền tảng/Sở/trường/tổ (phạm vi PLATFORM hoặc UNIT_SUBTREE) */
export function canSeeProviderProfile(a: AccessContext, unitId: string): boolean {
  if (a.role.scope === "GRANT") return a.scopeUnit.id === unitId;
  return a.role.scope === "PLATFORM" || a.role.scope === "UNIT_SUBTREE";
}

export function visibleProviders(ds: Dataset, a: AccessContext) {
  return ds.units.filter((u) => u.type === "NCC" && u.status === "ACTIVE" && canSeeProviderProfile(a, u.id))
    .map((u) => ({ unit: u, profile: ds.providerProfiles.find((p) => p.unitId === u.id) }));
}
