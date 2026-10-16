import { describe, expect, it } from "vitest";
import { NAVIGATION, READY } from "../../domain/navigation.ts";
import type { Portal } from "../../domain/roles.ts";
import { previewSpec, SPECS } from "./specs/index.ts";

describe("Màn hình xem trước", () => {
  it("mọi mục menu chưa triển khai, ở mọi vai trò, đều có nội dung xem trước", () => {
    const missing: string[] = [];
    for (const [portal, groups] of Object.entries(NAVIGATION)) {
      for (const g of groups) for (const i of g.items) if (i.milestone !== READY && !previewSpec(portal as Portal, i.slug)) missing.push(`${portal}:${i.slug}`);
    }
    expect(missing).toEqual([]);
  });
  it("không có đặc tả thừa (khóa phải ứng với một mục menu)", () => {
    const keys = new Set<string>();
    for (const [portal, groups] of Object.entries(NAVIGATION)) for (const g of groups) for (const i of g.items) { keys.add(`${portal}:${i.slug}`); keys.add(i.slug); }
    expect(Object.keys(SPECS).filter((k) => !keys.has(k))).toEqual([]);
  });
});
