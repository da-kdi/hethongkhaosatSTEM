import { useState } from "react";
import { useStore } from "@/app/store";
import { subtreeIds, type AccessContext } from "@/domain/access";
import type { AuditEntry, Dataset } from "@/domain/model";
import { ROLE_BY_CODE } from "@/domain/roles";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";

const ACTION_LABEL: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "muted" }> = {
  LOGIN: { label: "Đăng nhập", variant: "muted" },
  CONTEXT_SWITCH: { label: "Đổi ngữ cảnh", variant: "muted" },
  INSERT: { label: "Tạo", variant: "success" },
  UPDATE: { label: "Sửa", variant: "warning" },
  DELETE: { label: "Xóa", variant: "danger" },
  IMPORT: { label: "Nhập dữ liệu", variant: "default" },
  EXPORT: { label: "Xuất dữ liệu", variant: "warning" },
};

const ENTITY_LABEL: Record<string, string> = {
  "iam.account": "Tài khoản",
  "iam.role_assignment": "Gán vai trò",
  "iam.role_permission": "Quyền của vai trò",
  "iam.guardian_link": "Liên kết phụ huynh",
  "iam.provider_grant": "Quyền dữ liệu NCC",
  "iam.person_private": "Dữ liệu cá nhân",
  "cfg.setting": "Cấu hình",
  "catalog.code_list": "Danh mục dùng chung",
};

/** Mirror policy audit_read (0005_rls_grants.sql). */
export function visibleAudit(ds: Dataset, access: AccessContext): AuditEntry[] {
  if (!access.has("audit.log.view")) return [];
  const scope = subtreeIds(ds, access.scopeUnit.id);
  return ds.audit.filter(
    (e) =>
      e.actorAccountId === access.assignment.accountId ||
      (e.unitId !== undefined && scope.has(e.unitId)) ||
      access.role.scope === "PLATFORM",
  );
}

export function AuditPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const [filter, setFilter] = useState<string>("ALL");
  const all = visibleAudit(ds, access);
  const rows = filter === "ALL" ? all : all.filter((e) => e.action === filter);

  const actorName = (accountId: string | null) => {
    const acc = ds.accounts.find((a) => a.id === accountId);
    return ds.persons.find((p) => p.id === acc?.personId)?.fullName ?? "Hệ thống";
  };
  const contextName = (assignmentId: string | null) => {
    const a = ds.assignments.find((x) => x.id === assignmentId);
    return a ? ROLE_BY_CODE[a.roleCode]?.name : "—";
  };

  return (
    <div>
      <PageHeader
        title="Nhật ký hệ thống"
        description="Ghi lại đăng nhập, đổi ngữ cảnh, thay đổi quyền, cấu hình và dữ liệu quan trọng. Nhật ký chỉ ghi thêm, không sửa hay xóa được, và không lưu giá trị dữ liệu cá nhân."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Hành động</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="ALL">Tất cả</option>
              {Object.entries(ACTION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <Section title={`${rows.length} bản ghi`} description="Trong phạm vi đơn vị của bạn, cùng các thao tác do chính bạn thực hiện.">
        {rows.length === 0 ? (
          <Empty title="Chưa có bản ghi">Thử bật/tắt một phân hệ ở trang “Phân hệ & cấu hình”, thao tác đó sẽ xuất hiện ở đây.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Thời gian</th>
                <th className={th}>Người thực hiện</th>
                <th className={th}>Hành động</th>
                <th className={th}>Đối tượng</th>
                <th className={th}>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const act = ACTION_LABEL[e.action] ?? { label: e.action, variant: "default" as const };
                return (
                  <tr key={e.id}>
                    <td className={`${td} tabular whitespace-nowrap text-muted-foreground`}>
                      {new Date(e.at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td className={td}>
                      <div className="font-medium">{actorName(e.actorAccountId)}</div>
                      <div className="text-xs text-muted-foreground">{contextName(e.activeAssignmentId)}</div>
                    </td>
                    <td className={td}>
                      <Badge variant={act.variant}>{act.label}</Badge>
                    </td>
                    <td className={td}>
                      <div>{ENTITY_LABEL[e.entity] ?? e.entity}</div>
                      <div className="text-xs text-muted-foreground">{e.entityId}</div>
                    </td>
                    <td className={`${td} max-w-sm text-muted-foreground`}>{e.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}
