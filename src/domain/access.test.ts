import { describe, expect, it } from "vitest";
import { buildAccess, assignmentsOf } from "./access.ts";
import { buildMenu } from "./menu.ts";
import { createDemoDataset, A, C, DEMO_TODAY, P, R, S, U } from "../demo/seed.ts";

const ds = createDemoDataset();
const ctx = (accountId: string, assignmentId: string, today = DEMO_TODAY) => {
  const a = buildAccess(ds, accountId, assignmentId, today);
  if (!a) throw new Error("context null");
  return a;
};
const slugs = (accountId: string, assignmentId: string) =>
  buildMenu(ds, ctx(accountId, assignmentId)).flatMap((g) => g.items.map((i) => i.slug));

describe("Ngữ cảnh làm việc", () => {
  it("từ chối assignment không thuộc tài khoản (giả mạo ngữ cảnh)", () => {
    expect(buildAccess(ds, A.bmAnh, R.bmPrincipal, DEMO_TODAY)).toBeNull();
  });
  it("người nhiều vai trò thấy đủ các ngữ cảnh của mình", () => {
    expect(assignmentsOf(ds, A.tsNgoc, DEMO_TODAY).map((a) => a.roleCode).sort()).toEqual(["GUARDIAN", "TEACHER"]);
    expect(assignmentsOf(ds, A.bmLan, DEMO_TODAY).map((a) => a.roleCode).sort()).toEqual(["DEPT_HEAD", "TEACHER"]);
  });
});

describe("Phạm vi dữ liệu", () => {
  it("Sở thấy mọi trường nhưng KHÔNG thấy dữ liệu cá nhân học sinh", () => {
    const so = ctx(A.soSpecialist, R.soSpecialist);
    expect(so.canSeeUnit(U.bm) && so.canSeeUnit(U.ts) && so.canSeeUnit(U.sm)).toBe(true);
    expect(so.canSeeClass(C.bm6)).toBe(true);
    expect(so.canSeePerson(S.bm6First)).toBe(false);
    expect(so.canSeePerson(P.bmPrincipal)).toBe(true);
    expect(so.canSeeUnit(U.kdi)).toBe(false);
  });
  it("BGH trường A không thấy lớp/học sinh trường B", () => {
    const bgh = ctx(A.bmPrincipal, R.bmPrincipal);
    expect(bgh.canSeeClass(C.bm6)).toBe(true);
    expect(bgh.canSeePerson(S.bm6First)).toBe(true);
    expect(bgh.canSeePersonal(S.bm6First)).toBe(true);
    expect(bgh.canSeeClass(C.ts10)).toBe(false);
    expect(bgh.canSeePerson(S.ts10First)).toBe(false);
    expect(bgh.canSeeUnit(U.ts)).toBe(false);
  });
  it("Giáo viên chỉ thấy học sinh lớp mình dạy, không thấy dữ liệu cá nhân chi tiết", () => {
    const gv = ctx(A.bmHuong, R.bmHuong);
    expect(gv.canSeeClass(C.bm6)).toBe(true);
    expect(gv.canSeeClass(C.bm7)).toBe(false);
    expect(gv.canSeePerson(S.bm6First)).toBe(true);
    expect(gv.canSeePersonal(S.bm6First)).toBe(false);
    expect(gv.canSeePerson(S.bm8First)).toBe(false);
  });
  it("Tổ trưởng thấy lớp do tổ quản lý, không thấy lớp tổ khác", () => {
    const to = ctx(A.bmLan, R.bmLanHead);
    expect(to.canSeeClass(C.bm6)).toBe(true);
    expect(to.canSeeClass(C.bm8)).toBe(true);
    expect(to.canSeeClass(C.bm7)).toBe(false);
  });
  it("Phụ huynh chỉ thấy con đã xác minh; liên kết đang chờ thì không thấy gì", () => {
    const thu = ctx(A.phThu, R.phThu);
    expect(thu.canSeePerson(S.bm6First) && thu.canSeePerson(S.ts10First)).toBe(true);
    expect(thu.canSeePerson(S.bm6Second)).toBe(false);
    const tung = ctx(A.phTung, R.phTung);
    expect(tung.canSeePerson(S.bm6Second)).toBe(false);
    expect(tung.canSeeUnit(U.bm)).toBe(false);
  });
  it("Một người hai vai trò không bị trộn quyền giữa hai ngữ cảnh", () => {
    const asTeacher = ctx(A.tsNgoc, R.tsNgocTeacher);
    const asGuardian = ctx(A.tsNgoc, R.tsNgocGuardian);
    // Con của chị Ngọc học ở Bình Minh (8A1)
    expect(asGuardian.canSeePerson(S.bm8First)).toBe(true);
    expect(asTeacher.canSeePerson(S.bm8First)).toBe(false);
    // Học sinh lớp chị dạy ở Thanh Sơn
    expect(asTeacher.canSeePerson(S.ts10First)).toBe(true);
    expect(asGuardian.canSeePerson(S.ts10First)).toBe(false);
  });
  it("Học sinh chỉ thấy bản thân", () => {
    const hs = ctx(A.hsBm6, R.hsBm6);
    expect(hs.canSeePerson(S.bm6First)).toBe(true);
    expect(hs.canSeePerson(S.bm6Second)).toBe(false);
    expect(hs.canSeeClass(C.bm6)).toBe(true);
  });
  it("Nhà cung cấp: grant AGGREGATE thấy trường nhưng không thấy lớp/học sinh; grant hết hạn mất quyền", () => {
    const kdi = ctx(A.kdiAdmin, R.kdiAdmin);
    expect(kdi.canSeeUnit(U.bm)).toBe(true);
    expect(kdi.canSeeClass(C.bm6)).toBe(false);
    expect(kdi.canSeePerson(S.bm6First)).toBe(false);
    expect(kdi.canSeeUnit(U.ts)).toBe(false); // grant hết hạn 30/06/2026
    expect(kdi.canSeeUnit(U.sm)).toBe(false);
    // Trước ngày hết hạn thì còn quyền mức CLASS
    const kdiJune = ctx(A.kdiAdmin, R.kdiAdmin, "2026-06-01");
    expect(kdiJune.canSeeClass(C.ts10)).toBe(true);
    expect(kdiJune.canSeePerson(S.ts10First)).toBe(false);
  });
});

describe("Menu động", () => {
  it("menu khác nhau theo vai trò", () => {
    expect(slugs(A.soLeader, R.soLeader)).toContain("truong-hoc");
    expect(slugs(A.bmHuong, R.bmHuong)).toContain("lop-cua-toi");
    expect(slugs(A.bmHuong, R.bmHuong)).not.toContain("tai-khoan");
    expect(slugs(A.phThu, R.phThu)).toEqual(["tong-quan", "trao-doi", "dang-ky"]);
  });
  it("tắt module Phòng & thiết bị ở TH Sao Mai → ẩn menu ở Sao Mai, không ảnh hưởng Bình Minh", () => {
    expect(slugs(A.smPrincipal, R.smPrincipal)).not.toContain("phong-thiet-bi");
    expect(slugs(A.bmPrincipal, R.bmPrincipal)).toContain("dat-lich");
  });
});
