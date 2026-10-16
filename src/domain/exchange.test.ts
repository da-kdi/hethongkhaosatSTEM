import { describe, expect, it } from "vitest";
import { buildAccess } from "./access.ts";
import { exportTable, normDate, normGender, planImport, templateTable } from "./exchange.ts";
import { A, createDemoDataset, DEMO_TODAY, R, U } from "../demo/seed.ts";

const ds0 = createDemoDataset();
const ctx = (acc: string, asg: string) => buildAccess(ds0, acc, asg, DEMO_TODAY)!;
const admin = ctx(A.bmAdmin, R.bmAdmin);
const H = ["maHocSinh", "hoTenNh", "gioiTinh", "ngaySinhNh", "tenLop", "trangThaiNh"];

describe("Nhập/xuất hồ sơ theo tên kỹ thuật QĐ 2768", () => {
  it("chuẩn hóa ngày & giới tính (ISO/IEC 5218)", () => {
    expect(normDate("05/09/2014")).toBe("2014-09-05");
    expect(normDate("2014-02-30")).toBeNull();
    expect(normDate("")).toBeUndefined();
    expect([normGender("1"), normGender("Nữ"), normGender("x")]).toEqual(["NAM", "NU", null]);
  });
  it("tệp mẫu nhập được ngay (bỏ qua dòng tên nghiệp vụ)", () => {
    const plan = planImport(ds0, admin, "students", templateTable("students"));
    expect(plan).toMatchObject({ total: 1, created: 1, errors: [] });
    expect(planImport(ds0, admin, "teachers", templateTable("teachers"))).toMatchObject({ created: 1, errors: [] });
  });
  it("thiếu cột bắt buộc → lỗi dòng 1, không đọc dữ liệu", () => {
    const plan = planImport(ds0, admin, "students", [["hoTenNh", "tenLop"], ["A", "6A1"]]);
    expect(plan.errors[0]).toMatchObject({ row: 1 });
    expect(plan.result).toBeUndefined();
  });
  it("1000 dòng, 5% lỗi: báo đúng từng dòng/cột, không ghi gì (tất cả hoặc không)", () => {
    const rows = Array.from({ length: 1000 }, (_, i) => {
      const bad = i % 20 === 7;
      return [`HS${String(i).padStart(5, "0")}`, `Học Sinh Số ${i}`, i % 2 ? "2" : "1", bad ? "31/02/2014" : "2014-01-15", "6A1", ""];
    });
    const plan = planImport(ds0, admin, "students", [H, ...rows]);
    expect(plan.total).toBe(1000);
    expect(plan.errors).toHaveLength(50);
    expect(plan.errors.every((e) => e.column === "ngaySinhNh")).toBe(true);
    expect(plan.errors[0].row).toBe(9); // i = 7 → dòng 9 trong tệp
    expect(plan.result).toBeUndefined();
  });
  it("trùng mã trong tệp, lớp không có, trạng thái ngoài danh mục đều bị bắt", () => {
    const plan = planImport(ds0, admin, "students", [H,
      ["HS1", "Ân", "1", "", "6A1", ""], ["hs1", "Bình", "1", "", "6A1", ""], ["HS2", "Chi", "", "", "10A1", ""], ["HS3", "Dũng", "", "", "6A1", "NGHI"]]);
    expect(plan.errors.map((e) => [e.row, e.column])).toEqual([[3, "maHocSinh"], [4, "tenLop"], [5, "trangThaiNh"]]);
  });
  it("xuất rồi nhập lại = toàn cập nhật; vai trò không có quyền cá nhân thì không xuất ngày sinh", () => {
    const out = exportTable(ds0, admin, "students");
    expect(out.length).toBeGreaterThan(2);
    const plan = planImport(ds0, admin, "students", out);
    expect(plan).toMatchObject({ created: 0, errors: [] });
    expect(plan.updated).toBe(out.length - 2);
    const t = planImport(ds0, admin, "teachers", exportTable(ds0, admin, "teachers"));
    expect(t).toMatchObject({ created: 0, errors: [] });
    const gv = ctx(A.bmLan, R.bmLanTeacher);
    expect(exportTable(ds0, gv, "students").slice(2).every((r) => r[3] === "")).toBe(true);
  });
  it("ngoài ngữ cảnh trường không nhập được; trường khác không ảnh hưởng", () => {
    const so = ctx(A.soAdmin, R.soAdmin);
    expect(planImport(ds0, so, "students", templateTable("students")).errors[0].message).toMatch(/ngữ cảnh một trường/);
    expect(exportTable(ds0, admin, "teachers").slice(2).every((r) => ds0.staff.some((s) => s.personId === r[0] && s.unitId !== U.ts))).toBe(true);
  });
});
