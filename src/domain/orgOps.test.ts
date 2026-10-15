import { describe, expect, it } from "vitest";
import { buildAccess } from "./access.ts";
import * as org from "./orgOps.ts";
import { A, C, createDemoDataset, DEMO_TODAY, P, R, S, U } from "../demo/seed.ts";

const ds0 = createDemoDataset();
const ctx = (acc: string, asg: string, ds = ds0) => buildAccess(ds, acc, asg, DEMO_TODAY)!;
const admin = ctx(A.bmAdmin, R.bmAdmin);

describe("Phân hệ 4 · ghi hồ sơ (mirror RPC org.*)", () => {
  it("QTV trường thêm tổ, trùng tên bị chặn, tổ còn lớp thì không ngừng được", () => {
    const [ds, id] = org.upsertDepartment(ds0, admin, { schoolId: U.bm, name: "Tổ Ngữ văn" });
    expect(ds.units.find((u) => u.id === id)).toMatchObject({ type: "TO", parentId: U.bm, status: "ACTIVE" });
    expect(() => org.upsertDepartment(ds, admin, { schoolId: U.bm, name: "tổ ngữ văn" })).toThrow(/đã có tổ/);
    expect(() => org.upsertDepartment(ds0, admin, { id: U.bmKhtn, name: "Tổ KHTN", status: "INACTIVE" })).toThrow(/còn quản lý lớp/);
  });
  it("không thao tác được trên trường khác; BGH (không có quyền quản trị) bị chặn", () => {
    expect(() => org.upsertDepartment(ds0, admin, { schoolId: U.ts, name: "Tổ X" })).toThrow(/Không có quyền/);
    expect(() => org.upsertDepartment(ds0, ctx(A.bmPrincipal, R.bmPrincipal), { schoolId: U.bm, name: "Tổ X" })).toThrow(/Không có quyền/);
  });
  it("thêm giáo viên vào tổ rồi phân công dạy; không phân công được giáo viên trường khác", () => {
    const [ds1, gv] = org.upsertTeacher(ds0, admin, { unitId: U.bmToan, fullName: "  Trịnh   Văn  Bảo ", gender: "NAM", position: "Giáo viên" });
    expect(ds1.persons.find((p) => p.id === gv)?.fullName).toBe("Trịnh Văn Bảo");
    const ds2 = org.setTeaching(ds1, admin, { personId: gv, classId: C.bm9, subject: "Toán" });
    expect(ds2.teaching.some((t) => t.personId === gv && t.classId === C.bm9)).toBe(true);
    expect(() => org.setTeaching(ds2, admin, { personId: P.tsNgoc, classId: C.bm9, subject: "Vật lý" })).toThrow(/không thuộc trường/);
    expect(org.setTeaching(ds2, admin, { personId: gv, classId: C.bm9, subject: "Toán", remove: true }).teaching.some((t) => t.personId === gv)).toBe(false);
  });
  it("không sửa được giáo viên trường khác; số điện thoại sai bị chặn", () => {
    expect(() => org.upsertTeacher(ds0, admin, { personId: P.tsNgoc, unitId: U.bm, fullName: "Đinh Thị Ngọc" })).toThrow(/trường của bạn/);
    expect(() => org.upsertTeacher(ds0, admin, { unitId: U.bm, fullName: "Nguyễn A", phone: "abc" })).toThrow(/điện thoại/);
  });
  it("thêm lớp: trùng tên trong năm học bị chặn; tổ & GVCN phải thuộc trường", () => {
    const [ds, id] = org.upsertClass(ds0, admin, { schoolId: U.bm, name: "6A2", grade: 6, departmentId: U.bmKhtn, homeroomPersonId: P.bmHuong });
    expect(ds.classes.find((c) => c.id === id)).toMatchObject({ name: "6A2", grade: 6 });
    expect(() => org.upsertClass(ds, admin, { schoolId: U.bm, name: "6A2", grade: 6 })).toThrow(/đã có lớp/);
    expect(() => org.upsertClass(ds0, admin, { schoolId: U.bm, name: "6A3", grade: 6, departmentId: U.tsLy })).toThrow(/Tổ không thuộc trường/);
    expect(() => org.upsertClass(ds0, admin, { schoolId: U.bm, name: "6A3", grade: 6, homeroomPersonId: P.tsNgoc })).toThrow(/chủ nhiệm/);
    expect(() => org.upsertClass(ds0, admin, { schoolId: U.bm, name: "6A3", grade: 13 })).toThrow(/Khối/);
  });
  it("thêm học sinh: mã chuẩn hóa chữ hoa, trùng mã bị chặn; đổi lớp & chuyển trường giữ hồ sơ", () => {
    const [ds1, hs] = org.upsertStudent(ds0, admin, { classId: C.bm6, fullName: "Lê Minh Khang", gender: "NAM", studentCode: "hs9001" });
    expect(ds1.enrollments.find((e) => e.studentPersonId === hs)).toMatchObject({ studentCode: "HS9001", status: "STUDYING" });
    expect(() => org.upsertStudent(ds1, admin, { classId: C.bm7, fullName: "Ai Đó", studentCode: "HS9001" })).toThrow(/đã tồn tại/);
    const [ds2] = org.upsertStudent(ds1, admin, { personId: hs, classId: C.bm7, fullName: "Lê Minh Khang", studentCode: "HS9001" });
    expect(ds2.enrollments.find((e) => e.studentPersonId === hs)?.classId).toBe(C.bm7);
    const ds3 = org.setStudentStatus(ds2, admin, hs, "TRANSFERRED");
    expect(ds3.enrollments.find((e) => e.studentPersonId === hs)?.status).toBe("TRANSFERRED");
    expect(ds3.persons.some((p) => p.id === hs)).toBe(true);
  });
  it("không thêm học sinh vào lớp trường khác; không sửa học sinh trường khác", () => {
    expect(() => org.upsertStudent(ds0, admin, { classId: C.ts10, fullName: "Ai Đó", studentCode: "X999" })).toThrow(/Không có quyền/);
    expect(() => org.upsertStudent(ds0, admin, { personId: S.ts10First, classId: C.bm6, fullName: "Ai Đó", studentCode: "X999" })).toThrow(/trường của bạn/);
  });
});
