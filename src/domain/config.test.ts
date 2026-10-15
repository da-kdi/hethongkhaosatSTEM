import { describe, expect, it } from "vitest";
import { ancestorsOf } from "./access.ts";
import { canWriteSetting, isModuleEnabled, resolveSetting } from "./config.ts";
import { createDemoDataset, U } from "../demo/seed.ts";

const ds = createDemoDataset();
const chain = (id: string) => ancestorsOf(ds, id);

describe("Cấu hình kế thừa", () => {
  it("MANDATORY ở Sở khóa module Kế hoạch cho mọi trường", () => {
    const r = resolveSetting(ds.settings, chain(U.sm), "module.plan");
    expect(r.mode).toBe("MANDATORY");
    expect(r.lockedByUnitId).toBe(U.so);
    expect(canWriteSetting(ds.settings, chain(U.sm), "module.plan")).toBe(false);
    expect(canWriteSetting(ds.settings, chain(U.sm), "module.resource")).toBe(true);
  });
  it("EXTEND: trường thêm loại hoạt động riêng, không mất danh mục của Sở", () => {
    const r = resolveSetting<string[]>(ds.settings, chain(U.bm), "catalog.activity_types");
    expect(r.value).toEqual(["Bài học STEM", "Hoạt động trải nghiệm STEM", "Nghiên cứu khoa học kỹ thuật", "CLB Robotics"]);
    expect(r.lockedItems).toHaveLength(3);
    const other = resolveSetting<string[]>(ds.settings, chain(U.ts), "catalog.activity_types");
    expect(other.value).not.toContain("CLB Robotics");
  });
  it("AUTONOMOUS: trường tự tắt bước tổ duyệt", () => {
    expect(resolveSetting<{ enabled: boolean }>(ds.settings, chain(U.ts), "wf.activity.dept_review").value?.enabled).toBe(false);
    expect(resolveSetting<{ enabled: boolean }>(ds.settings, chain(U.bm), "wf.activity.dept_review").value?.enabled).toBe(true);
  });
  it("Tổ thừa hưởng trạng thái module của trường", () => {
    expect(isModuleEnabled(ds.settings, chain(U.smK45), "resource")).toBe(false);
    expect(isModuleEnabled(ds.settings, chain(U.bmKhtn), "resource")).toBe(true);
  });
});
