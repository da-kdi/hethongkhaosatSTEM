import { useStore, TODAY } from "@/app/store";
import { aggregateForUnit, grantsOfProvider, SCHOOL_LEVEL_LABEL } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import type { GrantLevel } from "@/domain/model";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";

const LEVEL: Record<GrantLevel, { label: string; detail: string }> = {
  AGGREGATE: { label: "Tổng hợp", detail: "Chỉ số liệu tổng hợp (số lớp, số học sinh), không xem danh sách lớp hay học sinh" },
  CLASS: { label: "Theo lớp", detail: "Xem lớp tham gia chương trình, không xem tên học sinh" },
  NAMED: { label: "Có tên", detail: "Xem danh sách học sinh tham gia, chỉ khi hợp đồng ghi rõ và trường cấp" },
};

const fmt = (d: string) => new Date(d).toLocaleDateString("vi-VN");

export function GrantsPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const rows = grantsOfProvider(ds, access.scopeUnit.id, TODAY);
  const active = rows.filter((r) => r.active);

  return (
    <div>
      <PageHeader
        title="Trường được cấp quyền"
        description="Nhà cung cấp chỉ xem được dữ liệu của trường đã cấp quyền theo hợp tác, ở mức độ ghi trong quyền và trong thời hạn hiệu lực. Hết hạn thì mất quyền ngay."
      />
      <div className="grid gap-4">
        <Section title={`${active.length} quyền đang hiệu lực · ${rows.length - active.length} đã hết hạn`}>
          {rows.length === 0 ? (
            <Empty title="Chưa có trường nào cấp quyền">Trường cấp quyền ở mục “Nhà cung cấp & cấp quyền” sau khi hai bên ký hợp tác.</Empty>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Trường</th>
                  <th className={th}>Chương trình</th>
                  <th className={th}>Mức dữ liệu</th>
                  <th className={th}>Hiệu lực</th>
                  <th className={th}>Số liệu tổng hợp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ grant, school, active: on }) => {
                  const agg = on && school ? aggregateForUnit(ds, school.id) : null;
                  return (
                    <tr key={grant.id} className={on ? undefined : "opacity-60"}>
                      <td className={td}>
                        <div className="font-medium">{school?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {school?.schoolLevel && SCHOOL_LEVEL_LABEL[school.schoolLevel]} · {school?.ward}
                        </div>
                      </td>
                      <td className={`${td} font-mono text-xs`}>{grant.programCode ?? "—"}</td>
                      <td className={td}>
                        <Badge variant="outline">{LEVEL[grant.level].label}</Badge>
                        <div className="mt-1 max-w-56 text-xs text-muted-foreground">{LEVEL[grant.level].detail}</div>
                      </td>
                      <td className={`${td} tabular whitespace-nowrap`}>
                        <div>
                          {fmt(grant.validFrom)} – {fmt(grant.validTo)}
                        </div>
                        {on ? <Badge variant="success">Đang hiệu lực</Badge> : <Badge variant="danger">Đã hết hạn</Badge>}
                      </td>
                      <td className={`${td} tabular`}>
                        {agg ? (
                          <span>
                            {agg.classes} lớp · {agg.students} học sinh
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Không còn quyền xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Section>
        <p className="text-xs text-muted-foreground">
          Danh mục sản phẩm, gửi thẩm định, hợp đồng và báo cáo triển khai sẽ có ở M6.
        </p>
      </div>
    </div>
  );
}
