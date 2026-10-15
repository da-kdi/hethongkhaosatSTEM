import { beforeEach, describe, expect, it } from "vitest";
import { actions, getAccess, getState } from "./store";
import { visibleAudit } from "@/features/audit/AuditPage";
import { ancestorsOf } from "@/domain/access";
import { isModuleEnabled } from "@/domain/config";
import { A, R, U } from "@/demo/seed";

const ds = () => getState().ds;

function loginAs(accountId: string, assignmentId: string) {
  actions.login(accountId);
  actions.switchContext(assignmentId);
  const a = getAccess();
  if (!a) throw new Error("Không dựng được ngữ cảnh");
  return a;
}

describe("Kho demo · ghi cấu hình (mirror cfg.set_setting)", () => {
  beforeEach(() => actions.resetDemo());

  it("QTV trường tắt module trong trường mình → tổ thừa hưởng, trường khác không ảnh hưởng, có nhật ký", () => {
    const access = loginAs(A.bmAdmin, R.bmAdmin);
    actions.setSetting(U.bm, "module.assess", { enabled: false }, "AUTONOMOUS");
    expect(isModuleEnabled(ds().settings, ancestorsOf(ds(), U.bmKhtn), "assess")).toBe(false);
    expect(isModuleEnabled(ds().settings, ancestorsOf(ds(), U.ts), "assess")).toBe(true);
    expect(visibleAudit(ds(), access).some((e) => e.entity === "cfg.setting" && e.unitId === U.bm)).toBe(true);
  });

  it("không tắt được module Sở đã khóa bắt buộc", () => {
    loginAs(A.bmAdmin, R.bmAdmin);
    expect(() => actions.setSetting(U.bm, "module.plan", { enabled: false }, "AUTONOMOUS")).toThrow(/khóa/);
  });

  it("không sửa được cấu hình trường khác", () => {
    loginAs(A.bmAdmin, R.bmAdmin);
    expect(() => actions.setSetting(U.ts, "module.assess", { enabled: false }, "AUTONOMOUS")).toThrow(/Không có quyền/);
  });

  it("vai trò không có cfg.setting.manage (BGH) không ghi được", () => {
    loginAs(A.bmPrincipal, R.bmPrincipal);
    expect(() => actions.setSetting(U.bm, "module.assess", { enabled: false }, "AUTONOMOUS")).toThrow(/Không có quyền/);
  });

  it("QTV Sở đặt bắt buộc → trường không tự tắt được nữa", () => {
    loginAs(A.soAdmin, R.soAdmin);
    actions.setSetting(U.so, "module.resource", { enabled: true }, "MANDATORY");
    loginAs(A.bmAdmin, R.bmAdmin);
    expect(() => actions.setSetting(U.bm, "module.resource", { enabled: false }, "AUTONOMOUS")).toThrow(/khóa/);
  });

  it("không đổi được sang ngữ cảnh của người khác", () => {
    actions.login(A.bmAnh);
    expect(() => actions.switchContext(R.bmPrincipal)).toThrow(/không hợp lệ/);
  });

  it("nhật ký: GV không xem được; QTV trường không thấy thao tác ở trường khác", () => {
    loginAs(A.soAdmin, R.soAdmin);
    actions.setSetting(U.ts, "module.assess", { enabled: false }, "AUTONOMOUS");
    expect(visibleAudit(ds(), loginAs(A.bmAnh, R.bmAnh))).toEqual([]);
    expect(visibleAudit(ds(), loginAs(A.bmAdmin, R.bmAdmin)).some((e) => e.unitId === U.ts)).toBe(false);
  });

  it("nạp danh mục: chỉ Quản trị nền tảng; QTV Sở bị từ chối; có nhật ký", () => {
    const input = { list: "danToc", version: "CSDL 10/2026", source: "CSDL_NGANH" as const, values: [{ code: "01", name: "Kinh" }] };
    loginAs(A.soAdmin, R.soAdmin);
    expect(() => actions.importCodeList(input)).toThrow(/Chỉ Quản trị nền tảng/);
    loginAs(A.platformAdmin, R.platformAdmin);
    expect(actions.importCodeList(input)).toMatchObject({ inserted: 1 });
    expect(ds().catalog.values.filter((x) => x.listCode === "danToc")).toHaveLength(1);
    expect(ds().audit[0]).toMatchObject({ action: "IMPORT", entity: "catalog.code_list", entityId: "danToc" });
  });
});
