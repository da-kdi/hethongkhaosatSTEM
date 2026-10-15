import { describe, expect, it } from "vitest";
import { applyImport, initialCatalog, parseCodeCsv, toStandard } from "./catalog.ts";
import { loadDictionary } from "../../scripts/seed-sql.ts";

describe("Danh mục · đọc CSV", () => {
  it("bỏ BOM & dòng tiêu đề, nhận dấu ; và chuỗi có ngoặc kép", () => {
    const r = parseCodeCsv('﻿ma;ten;hieuLucTu\n01;"Kinh; Việt";2026-01-01\n02;Tày\n');
    expect(r.errors).toEqual([]);
    expect(r.rows.map((x) => [x.code, x.name, x.validFrom])).toEqual([["01", "Kinh; Việt", "2026-01-01"], ["02", "Tày", undefined]]);
  });
  it("báo lỗi theo dòng: thiếu tên, trùng mã, sai định dạng ngày", () => {
    const r = parseCodeCsv("A,Một\nB,\nA,Một lần nữa\nC,Ba,01/02/2026");
    expect(r.errors).toEqual([
      "Dòng 2: thiếu mã hoặc tên",
      'Dòng 3: mã "A" trùng với dòng 1',
      'Dòng 4: ngày hiệu lực "01/02/2026" phải dạng YYYY-MM-DD',
    ]);
  });
  it("file rỗng báo lỗi", () => expect(parseCodeCsv("\n\n").errors).toEqual(["File không có dòng dữ liệu"]));
});

describe("Danh mục · quy tắc nạp (mirror catalog.import_code_list)", () => {
  const now = "2026-10-16T10:00:00Z";
  it("thay danh mục tạm bằng CSDL ngành: thêm, cập nhật, giá trị biến mất chuyển ngừng dùng (không xóa)", () => {
    const s = applyImport(initialCatalog(), { list: "capHoc", version: "CSDL 10/2026", source: "CSDL_NGANH",
      values: [{ code: "THCS", name: "Trung học cơ sở" }, { code: "02", name: "Tiểu học" }] }, "u1", now);
    const vals = s.values.filter((x) => x.listCode === "capHoc");
    expect(s.batches[0]).toMatchObject({ inserted: 1, updated: 1, deprecated: 4, version: "CSDL 10/2026" });
    expect(vals).toHaveLength(6);
    expect(vals.find((x) => x.code === "TH")?.deprecated).toBe(true);
    expect(s.lists.find((l) => l.code === "capHoc")).toMatchObject({ source: "CSDL_NGANH", syncedAt: now });
    // Quy đổi trỏ tới mã đã ngừng dùng → không còn quy đổi được, cần cập nhật bảng quy đổi
    expect(toStandard(s, "org.unit", "school_level", "TH")).toBeUndefined();
    expect(toStandard(s, "org.unit", "school_level", "THCS")).toBe("THCS");
  });
  it("từ chối: danh mục không tồn tại, thiếu phiên bản, rỗng, trùng mã", () => {
    const c = initialCatalog();
    expect(() => applyImport(c, { list: "xyz", version: "1", source: "CSDL_NGANH", values: [{ code: "a", name: "b" }] }, undefined, now)).toThrow(/không tồn tại/);
    expect(() => applyImport(c, { list: "danToc", version: " ", source: "CSDL_NGANH", values: [{ code: "a", name: "b" }] }, undefined, now)).toThrow(/phiên bản/);
    expect(() => applyImport(c, { list: "danToc", version: "1", source: "CSDL_NGANH", values: [] }, undefined, now)).toThrow(/rỗng/);
    expect(() => applyImport(c, { list: "danToc", version: "1", source: "CSDL_NGANH", values: [{ code: "a", name: "b" }, { code: "a", name: "c" }] }, undefined, now)).toThrow(/trùng/);
  });
  it("giới tính quy đổi theo ISO/IEC 5218", () => {
    const c = initialCatalog();
    expect(toStandard(c, "iam.person", "gender", "NAM")).toBe("1");
    expect(toStandard(c, "iam.person", "gender", "NU")).toBe("2");
  });
  it("mọi danh mục gắn thuật ngữ có thật và mã danh mục = tên kỹ thuật của thuật ngữ", () => {
    const terms = new Map(loadDictionary().terms.map((t) => [t.code, t]));
    for (const l of initialCatalog().lists) expect(terms.get(l.termCode)?.technicalName, l.code).toBe(l.code);
  });
});
