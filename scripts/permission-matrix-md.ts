/**
 * Sinh docs/PERMISSION_MATRIX.md từ nguồn chân lý (permissions.ts + roles.ts).
 * Chạy: npm run gen:docs   (test báo lỗi nếu tài liệu lệch so với code)
 */
import { PERMISSIONS, type Permission } from "../src/domain/permissions.ts";
import { PORTAL_LABEL, SYSTEM_ROLES } from "../src/domain/roles.ts";

const SCOPE: Record<string, string> = {
  PLATFORM: "Nền tảng: cấu hình, **không** mặc định xem dữ liệu cá nhân",
  UNIT_SUBTREE: "Đơn vị được gán và mọi đơn vị cấp dưới",
  TEACHING: "Lớp được phân công dạy/chủ nhiệm trong trường",
  SELF: "Chỉ bản thân",
  LINKED: "Học sinh đã liên kết **và xác minh**, còn hạn",
  GRANT: "Trường/chương trình được cấp quyền theo hợp tác, trong thời hạn, theo mức AGGREGATE/CLASS/NAMED",
};

export function buildPermissionMatrixMd(): string {
  const out: string[] = [
    "# Ma trận phân quyền & phạm vi dữ liệu",
    "",
    "> FILE SINH TỰ ĐỘNG bởi `npm run gen:docs` từ `src/domain/permissions.ts` và `src/domain/roles.ts`. Không sửa tay.",
    "> Cùng nguồn này sinh `supabase/seed.sql` (bảng `iam.role_permission`), nên tài liệu, giao diện và RLS luôn khớp nhau.",
    "",
    "## 1. Nguyên tắc",
    "",
    "- **Quyền = vai trò × phạm vi dữ liệu × quan hệ.** Có quyền chức năng chưa đủ; bản ghi còn phải nằm trong phạm vi của ngữ cảnh đang chọn.",
    "- **Một ngữ cảnh tại một thời điểm.** Người nhiều vai trò chọn một `role_assignment`. Lựa chọn này nằm trong JWT claim `active_assignment_id` và RLS chỉ xét đúng assignment đó (ADR-002).",
    "- **Kiểm tra ở Postgres** (RLS + RPC `security definer`). Ẩn menu ở giao diện chỉ để trải nghiệm tốt hơn, không phải lớp bảo mật.",
    "- **Dữ liệu trẻ em:** dữ liệu cá nhân chi tiết (`iam.person_private`) cần quyền `org.person.personal`. Cấp Sở và nhà cung cấp mặc định chỉ thấy số liệu tổng hợp.",
    "",
    "## 2. Vai trò hệ thống & phạm vi",
    "",
    "| Mã | Vai trò | Cổng | Gán vào đơn vị | Phạm vi dữ liệu |",
    "|---|---|---|---|---|",
    ...SYSTEM_ROLES.map((r) => `| \`${r.code}\` | ${r.name} | ${PORTAL_LABEL[r.portal]} | ${r.unitTypes.join(", ")} | ${SCOPE[r.scope]} |`),
    "",
    "## 3. Vai trò × quyền",
    "",
    `| Quyền | ${SYSTEM_ROLES.map((r) => r.code).join(" | ")} |`,
    `|---|${SYSTEM_ROLES.map(() => ":-:").join("|")}|`,
  ];
  let mod = "";
  for (const [code, desc] of Object.entries(PERMISSIONS) as [Permission, string][]) {
    const m = code.split(".")[0];
    if (m !== mod) {
      mod = m;
      out.push(`| **${m}** |${SYSTEM_ROLES.map(() => " ").join("|")}|`);
    }
    out.push(`| ${desc} <br>\`${code}\` | ${SYSTEM_ROLES.map((r) => (r.permissions.includes(code) ? "✓" : "")).join(" | ")} |`);
  }
  out.push(
    "",
    "## 4. Hàm phạm vi (supabase/migrations/20261015000200_iam.sql)",
    "",
    "| Hàm | Trả true khi |",
    "|---|---|",
    "| `iam.ctx()` | Trả assignment trong JWT nếu thuộc `auth.uid()`, đang ACTIVE, còn hiệu lực; ngược lại trả rỗng, nên mọi policy đều false |",
    "| `iam.has_perm(p)` | Vai trò của ngữ cảnh có quyền `p` |",
    "| `iam.can_see_unit(u)` | Theo phạm vi: cây con (+ chuỗi cha), trường của GV/HS, trường có con (PH), trường được grant (NCC) |",
    "| `iam.can_see_class(c)` | Lớp thuộc cây con / lớp dạy / lớp của mình / lớp của con / grant mức ≥ CLASS |",
    "| `iam.can_see_person(p)` | Học sinh: chỉ trường/tổ/GV dạy/PH đã xác minh/NCC mức NAMED, **Sở không thấy**. Nhân sự: theo cây đơn vị |",
    "| `iam.can_see_personal(p)` | Bản thân, PH với con đã xác minh, hoặc có `org.person.personal` và thấy người đó |",
    "",
    "Bản phản chiếu TS: `src/domain/access.ts`. Test đối chiếu: `supabase/tests/rls.test.ts`.",
    "",
  );
  return out.join("\n");
}
