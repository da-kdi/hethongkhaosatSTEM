import { Check } from "lucide-react";
import type { AccessContext } from "@/domain/access";
import { PERMISSION_GROUP_LABEL } from "@/domain/modules";
import { ALL_PERMISSIONS, PERMISSIONS } from "@/domain/permissions";
import { SYSTEM_ROLES } from "@/domain/roles";
import { PageHeader, Section } from "@/components/layout/page";
import { cn } from "@/lib/utils";

const MODULE_LABEL = PERMISSION_GROUP_LABEL;

const SCOPE_LABEL: Record<string, string> = {
  PLATFORM: "Nền tảng", UNIT_SUBTREE: "Đơn vị & cấp dưới", TEACHING: "Lớp được phân công", SELF: "Bản thân",
  LINKED: "Con đã xác minh", GRANT: "Theo hợp tác",
};

export function RolesPage({ access }: { access: AccessContext }) {
  const groups = [...new Set(ALL_PERMISSIONS.map((p) => p.split(".")[0]))];
  return (
    <div>
      <PageHeader
        title="Ma trận quyền"
        description="Quyền = vai trò × phạm vi dữ liệu × quan hệ. Ma trận này là nguồn chân lý dùng chung cho giao diện và chính sách RLS trong cơ sở dữ liệu."
      />
      <Section title="Vai trò hệ thống × quyền" description="Cột được tô là vai trò bạn đang dùng. Vai trò tùy chỉnh theo trường có ở M1.">
        <div className="relative -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b bg-card px-2 py-2 text-left font-medium text-muted-foreground">Quyền</th>
                {SYSTEM_ROLES.map((r) => (
                  <th key={r.code} className={cn("border-b px-1 py-2 text-center align-bottom font-medium", r.code === access.role.code && "bg-secondary")}>
                    <div className="mx-auto w-16 leading-tight">{r.name}</div>
                    <div className="mt-1 font-normal text-muted-foreground">{SCOPE_LABEL[r.scope]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <ModuleRows key={g} module={g} activeRole={access.role.code} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function ModuleRows({ module, activeRole }: { module: string; activeRole: string }) {
  const perms = ALL_PERMISSIONS.filter((p) => p.startsWith(`${module}.`));
  return (
    <>
      <tr>
        <td colSpan={SYSTEM_ROLES.length + 1} className="border-b bg-muted px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
          {MODULE_LABEL[module] ?? module}
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p}>
          <td className="sticky left-0 z-10 border-b bg-card px-2 py-1.5">
            <div>{PERMISSIONS[p]}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{p}</div>
          </td>
          {SYSTEM_ROLES.map((r) => (
            <td key={r.code} className={cn("border-b text-center", r.code === activeRole && "bg-secondary")}>
              {r.permissions.includes(p) ? <Check className="mx-auto size-3.5 text-primary" aria-label="Có quyền" /> : <span className="sr-only">Không</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
