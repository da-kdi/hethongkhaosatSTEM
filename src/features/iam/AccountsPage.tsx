import { useStore } from "@/app/store";
import { PORTAL_STYLE } from "@/app/portal-style";
import { subtreeIds, type AccessContext } from "@/domain/access";
import { ROLE_BY_CODE } from "@/domain/roles";
import { PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { cn } from "@/lib/utils";

export function AccountsPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const scope = subtreeIds(ds, access.scopeUnit.id);
  const isPlatform = access.role.scope === "PLATFORM";

  // Mirror policy assignment_read: chỉ thấy gán vai trò trong cây phạm vi
  const rows = ds.accounts
    .map((acc) => ({
      acc,
      person: ds.persons.find((p) => p.id === acc.personId)!,
      assignments: ds.assignments.filter((a) => a.accountId === acc.id && a.status === "ACTIVE" && (isPlatform || scope.has(a.scopeUnitId))),
    }))
    .filter((r) => r.assignments.length > 0 && access.canSeePerson(r.person.id));

  return (
    <div>
      <PageHeader
        title="Tài khoản & vai trò"
        description="Một người có thể có nhiều vai trò; mỗi vai trò gắn với một đơn vị phạm vi. Danh sách chỉ gồm các gán vai trò thuộc phạm vi của bạn."
      />
      <Section title={`${rows.length} tài khoản`} description="Tạo tài khoản, gán/thu hồi vai trò, import Excel: M1–M2">
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Họ tên</th>
              <th className={th}>Email</th>
              <th className={th}>Vai trò · phạm vi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ acc, person, assignments }) => (
              <tr key={acc.id}>
                <td className={`${td} font-medium`}>{person.fullName}</td>
                <td className={`${td} text-muted-foreground`}>{acc.email}</td>
                <td className={td}>
                  <ul className="grid gap-1">
                    {assignments.map((a) => {
                      const role = ROLE_BY_CODE[a.roleCode];
                      return (
                        <li key={a.id} className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PORTAL_STYLE[role.portal].chip)}>{role.name}</span>
                          <span className="text-xs text-muted-foreground">{ds.units.find((u) => u.id === a.scopeUnitId)?.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>
    </div>
  );
}
