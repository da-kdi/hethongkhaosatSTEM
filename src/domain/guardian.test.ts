import { describe, expect, it } from "vitest";
import { buildAccess } from "./access.ts";
import * as g from "./guardian.ts";
import { setStudentStatus } from "./orgOps.ts";
import { upsertProviderProfile, visibleProviders } from "./provider.ts";
import { sha256Hex } from "./sha256.ts";
import { A, createDemoDataset, DEMO_TODAY, P, R, S, U } from "../demo/seed.ts";
import type { Dataset } from "./model.ts";

const ds0 = createDemoDataset();
const ctx = (acc: string, asg: string, ds: Dataset = ds0) => buildAccess(ds, acc, asg, DEMO_TODAY)!;
const admin = ctx(A.bmAdmin, R.bmAdmin);
const NOW = "2026-10-16T02:00:00.000Z";
const phonePerson = (ds: Dataset, id: string) => ds.persons.find((p) => p.id === id)!.phone!;

describe("W8 · Liên kết phụ huynh", () => {
  it("SHA-256 đúng chuẩn (khớp Postgres sha256())", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("mã 8 ký tự, không có ký tự dễ nhầm; chỉ lưu băm", () => {
    for (let i = 0; i < 50; i++) expect(g.generateCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    const [ds, code, inv] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6Second, relation: "CHA" }, DEMO_TODAY, NOW);
    expect(JSON.stringify(ds.guardianInvites)).not.toContain(code);
    expect(inv).toMatchObject({ codeHash: g.hashCode(code), expiresAt: "2026-10-29" });
  });
  it("SĐT khớp → xác minh ngay; dùng lại mã bị chặn", () => {
    const [ds1, code] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6Second, relation: "CHA", phone: phonePerson(ds0, P.phTung) }, DEMO_TODAY, NOW);
    const tung = ctx(A.phTung, R.phTung, ds1);
    const [ds2, r] = g.redeemInvite(ds1, tung, code.toLowerCase().replace("-", " "), DEMO_TODAY, NOW, 0);
    expect(r).toMatchObject({ status: "VERIFIED" });
    expect(ds2.guardianLinks.find((l) => l.id === r.linkId)).toMatchObject({ method: "INVITE_OTP", expiresAt: "2027-08-31" });
    // liên kết PENDING sẵn có của PH Tùng được nâng lên, không tạo bản trùng
    expect(ds2.guardianLinks.filter((l) => l.guardianPersonId === P.phTung && l.studentPersonId === S.bm6Second)).toHaveLength(1);
    expect(ctx(A.phTung, R.phTung, ds2).canSeePerson(S.bm6Second)).toBe(true);
    expect(() => g.redeemInvite(ds2, ctx(A.phThu, R.phThu, ds2), code, DEMO_TODAY, NOW, 0)).toThrow(/đã dùng/);
  });
  it("không có SĐT → chờ trường duyệt; PH chưa thấy tên HS trong danh sách của mình", () => {
    const [ds1, code] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6First, relation: "NGUOI_GIAM_HO" }, DEMO_TODAY, NOW);
    const tung = ctx(A.phTung, R.phTung, ds1);
    const [ds2, r] = g.redeemInvite(ds1, tung, code, DEMO_TODAY, NOW, 0);
    expect(r.status).toBe("PENDING");
    expect(g.myLinks(ds2, tung, DEMO_TODAY).find((x) => x.link.id === r.linkId)?.studentName).toBeUndefined();
    const ds3 = g.approveLink(ds2, admin, r.linkId, NOW);
    expect(ds3.guardianLinks.find((l) => l.id === r.linkId)).toMatchObject({ status: "VERIFIED", method: "TEACHER_APPROVAL" });
    const ds4 = g.revokeLink(ds3, admin, r.linkId, NOW);
    expect(ctx(A.phTung, R.phTung, ds4).canSeePerson(S.bm6First)).toBe(false);
  });
  it("sai mã được đếm; đủ 5 lần thì khóa kể cả mã đúng", () => {
    const [ds1, code] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6Second, relation: "CHA" }, DEMO_TODAY, NOW);
    const tung = ctx(A.phTung, R.phTung, ds1);
    try { g.redeemInvite(ds1, tung, "AAAA-AAAA", DEMO_TODAY, NOW, 0); } catch (e) { expect((e as g.GuardianError).countsAsFailure).toBe(true); }
    expect(() => g.redeemInvite(ds1, tung, code, DEMO_TODAY, NOW, 5)).toThrow(/quá 5 lần/);
  });
  it("mã hết hạn / bị thu hồi không dùng được; chỉ phụ huynh được nhập mã", () => {
    const [ds1, code, inv] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6Second, relation: "CHA" }, DEMO_TODAY, NOW);
    const tung = ctx(A.phTung, R.phTung, ds1);
    expect(() => g.redeemInvite(ds1, tung, code, "2026-10-30", NOW, 0)).toThrow(/hết hạn/);
    expect(() => g.redeemInvite(g.revokeInvite(ds1, admin, inv.id, NOW), tung, code, DEMO_TODAY, NOW, 0)).toThrow(/thu hồi|hết hạn/);
    expect(() => g.redeemInvite(ds1, admin, code, DEMO_TODAY, NOW, 0)).toThrow(/Chỉ tài khoản phụ huynh/);
  });
  it("trường khác / vai trò không có quyền không phát mã, không duyệt được", () => {
    expect(() => g.issueInvite(ds0, admin, { studentPersonId: S.ts10First, relation: "ME" }, DEMO_TODAY, NOW)).toThrow(/Không có quyền/);
    expect(() => g.issueInvite(ds0, ctx(A.bmPrincipal, R.bmPrincipal), { studentPersonId: S.bm6First, relation: "ME" }, DEMO_TODAY, NOW)).toThrow(/Không có quyền/);
    const pending = ds0.guardianLinks.find((l) => l.status === "PENDING")!;
    expect(() => g.approveLink(ds0, ctx(A.tsPrincipal, R.tsPrincipal), pending.id, NOW)).toThrow(/Không có quyền/);
    expect(g.linksForApprover(ds0, admin, DEMO_TODAY).every((r) => r.className)).toBe(true);
  });
  it("chuyển trường → thu hồi mọi liên kết và mã mời chưa dùng", () => {
    const [ds1] = g.issueInvite(ds0, admin, { studentPersonId: S.bm6First, relation: "CHA" }, DEMO_TODAY, NOW);
    const ds2 = setStudentStatus(ds1, admin, S.bm6First, "TRANSFERRED");
    expect(ds2.guardianLinks.filter((l) => l.studentPersonId === S.bm6First).every((l) => l.status === "REVOKED")).toBe(true);
    expect(ds2.guardianInvites.every((i) => i.revokedAt)).toBe(true);
  });
});

describe("Hồ sơ nhà cung cấp", () => {
  const kdi = ctx(A.kdiAdmin, R.kdiAdmin);
  const base = { name: "KDI Education (demo)", fields: ["Robotics", "Không hợp lệ"], website: "https://kdi.demo" };
  it("QTV NCC sửa hồ sơ của mình; lĩnh vực ngoài danh mục bị loại; dữ liệu sai bị chặn", () => {
    const ds = upsertProviderProfile(ds0, kdi, base, NOW);
    expect(ds.providerProfiles.find((p) => p.unitId === U.kdi)?.fields).toEqual(["Robotics"]);
    expect(() => upsertProviderProfile(ds0, kdi, { ...base, website: "http://x" }, NOW)).toThrow(/https/);
    expect(() => upsertProviderProfile(ds0, kdi, { ...base, contactEmail: "abc" }, NOW)).toThrow(/Email/);
  });
  it("chuyên gia NCC, QTV trường không sửa được; NCC chỉ thấy hồ sơ mình, trường thấy mọi NCC", () => {
    expect(() => upsertProviderProfile(ds0, ctx(A.kdiExpert, R.kdiExpert), base, NOW)).toThrow(/Chỉ quản trị nhà cung cấp/);
    expect(() => upsertProviderProfile(ds0, admin, base, NOW)).toThrow(/Chỉ quản trị nhà cung cấp/);
    expect(visibleProviders(ds0, kdi).map((x) => x.unit.id)).toEqual([U.kdi]);
    expect(visibleProviders(ds0, admin).length).toBe(2);
    expect(visibleProviders(ds0, ctx(A.phThu, R.phThu))).toEqual([]);
  });
});
