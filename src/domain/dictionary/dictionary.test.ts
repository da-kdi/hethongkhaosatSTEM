import { describe, expect, it } from "vitest";
import { loadDictionary } from "../../../scripts/seed-sql.ts";
import { CORE_TERMS } from "./core-terms.ts";
import { FIELD_MAPPINGS } from "./mapping.ts";

const dict = loadDictionary();
const byCode = new Map(dict.terms.map((t) => [t.code, t]));

describe("Từ điển dữ liệu QĐ 2768", () => {
  it("đủ 41 miền và 892 thuật ngữ, mã không trùng, liên tục BG_00001–BG_00892", () => {
    expect(dict.domains).toHaveLength(41);
    expect(dict.terms).toHaveLength(892);
    expect(new Set(dict.terms.map((t) => t.code)).size).toBe(892);
    expect(dict.terms.map((t) => t.code)).toEqual(Array.from({ length: 892 }, (_, i) => `BG_${String(i + 1).padStart(5, "0")}`));
  });
  it("mọi thuật ngữ thuộc miền hợp lệ và có tên kỹ thuật dạng camelCase", () => {
    const domains = new Set(dict.domains.map((d) => d.code));
    for (const t of dict.terms) {
      expect(t.domains.length, t.code).toBeGreaterThan(0);
      for (const d of t.domains) expect(domains, t.code).toContain(d);
      expect(t.technicalName, t.code).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    }
  });
  it("ánh xạ cột chỉ dùng mã thuật ngữ có thật", () => {
    for (const m of FIELD_MAPPINGS) for (const c of m.terms) expect(byCode.has(c), `${m.table}.${m.column} → ${c}`).toBe(true);
  });
  it("CORE_TERMS (dùng ở giao diện) khớp tên & tên kỹ thuật trong từ điển", () => {
    for (const [code, t] of Object.entries(CORE_TERMS)) {
      expect(byCode.get(code)?.technicalName, code).toBe(t.tech);
      expect(byCode.get(code)?.name, code).toBe(t.name);
    }
  });
  it("giới tính quy đổi theo ISO/IEC 5218 như định nghĩa của BG_00010", () => {
    expect(byCode.get("BG_00010")?.definition).toMatch(/ISO\/IEC 5218/);
    const m = FIELD_MAPPINGS.find((x) => x.table === "iam.person" && x.column === "gender");
    expect(m?.valueMap).toEqual({ NAM: "1", NU: "2" });
  });
  it("thuật ngữ cốt lõi định danh cá nhân giữ đúng mã CDE", () => {
    expect(byCode.get("BG_00011")).toMatchObject({ technicalName: "soDinhDanhCaNhan", coreCode: "CDE-CN-001", length: "12" });
    expect(byCode.get("BG_00419")).toMatchObject({ technicalName: "truongId", length: "15" });
  });
});
