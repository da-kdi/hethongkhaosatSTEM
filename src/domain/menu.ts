import type { AccessContext } from "./access.ts";
import { ancestorsOf } from "./access.ts";
import { isModuleEnabled } from "./config.ts";
import type { Dataset } from "./model.ts";
import { MODULES } from "./modules.ts";
import { NAVIGATION, type NavGroup, type NavItem } from "./navigation.ts";

export function isNavItemAllowed(ds: Dataset, access: AccessContext, item: NavItem): boolean {
  if (item.perms && !item.perms.some((p) => access.has(p))) return false;
  // Phân hệ nền tảng (không tắt được) luôn hiển thị
  if (!MODULES[item.module].canDisable) return true;
  const chain = ancestorsOf(ds, access.configUnitId);
  return isModuleEnabled(ds.settings, chain, item.module);
}

export function buildMenu(ds: Dataset, access: AccessContext): NavGroup[] {
  return NAVIGATION[access.role.portal]
    .map((g) => ({ ...g, items: g.items.filter((it) => isNavItemAllowed(ds, access, it)) }))
    .filter((g) => g.items.length > 0);
}
