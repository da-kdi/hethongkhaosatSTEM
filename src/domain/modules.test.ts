import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DE_AN_STEPS, MODULE_LIST, MODULES, TIERS } from "./modules.ts";
import { NAVIGATION } from "./navigation.ts";
import { PERMISSIONS } from "./permissions.ts";
import { SYSTEM_ROLES } from "./roles.ts";
import { loadDictionary } from "../../scripts/seed-sql.ts";

const dict = loadDictionary();
const termCodes = new Set(dict.terms.map((t) => t.code));
const domainCodes = new Set(dict.domains.map((d) => d.code));

describe("Registry 14 phân hệ", () => {
  it("đủ 14 phân hệ, số hiệu không trùng, mọi tầng đều có phân hệ", () => {
    expect(MODULE_LIST).toHaveLength(14);
    expect(new Set(MODULE_LIST.map((m) => m.no)).size).toBe(14);
    for (const t of TIERS) expect(MODULE_LIST.some((m) => m.tier === t.code)).toBe(true);
  });
  it("mỗi bước đề án có ít nhất 2 phân hệ tham gia; mỗi phân hệ tham gia ít nhất 1 bước", () => {
    for (const s of DE_AN_STEPS) expect(MODULE_LIST.filter((m) => m.steps.includes(s.no)).length).toBeGreaterThanOrEqual(2);
    for (const m of MODULE_LIST) expect(m.steps.length).toBeGreaterThan(0);
  });
  it("mã miền & thuật ngữ khai báo đều có trong QĐ 2768", () => {
    for (const m of MODULE_LIST) {
      for (const d of m.dataDomains) expect(domainCodes, `${m.code}:${d}`).toContain(d);
      for (const t of m.keyTerms) expect(termCodes, `${m.code}:${t}`).toContain(t);
    }
  });
  it("mọi mục menu thuộc phân hệ có thật; quyền yêu cầu có trong registry và có vai trò nắm giữ", () => {
    const held = new Set(SYSTEM_ROLES.flatMap((r) => r.permissions));
    for (const groups of Object.values(NAVIGATION)) for (const g of groups) for (const item of g.items) {
      expect(MODULES[item.module], item.slug).toBeDefined();
      for (const p of item.perms ?? []) {
        expect(PERMISSIONS, p).toHaveProperty([p]);
        expect(held.has(p), `${item.slug} cần ${p} nhưng không vai trò nào có`).toBe(true);
      }
    }
  });
  it("mọi quyền đều thuộc một phân hệ hoặc nhóm nền tảng", () => {
    const prefixes = new Set([...MODULE_LIST.map((m) => m.code), "org", "iam", "cfg", "audit"]);
    for (const p of Object.keys(PERMISSIONS)) expect(prefixes, p).toContain(p.split(".")[0]);
  });
  it("danh sách phân hệ bật/tắt được trong SQL cfg.my_modules() khớp registry", () => {
    const dir = new URL("../../supabase/migrations/", import.meta.url);
    const last = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
      .map((f) => readFileSync(new URL(f, dir), "utf8")).filter((s) => s.includes("function cfg.my_modules")).at(-1)!;
    const list = [...last.slice(last.lastIndexOf("function cfg.my_modules")).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(new Set(list)).toEqual(new Set(MODULE_LIST.filter((m) => m.canDisable).map((m) => m.code)));
  });
});
