import { useStore } from "@/app/store";
import { SCHOOL_LEVEL_LABEL, term, UNIT_TYPE_LABEL, visibleUnits } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import type { OrgUnit } from "@/domain/model";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Section } from "@/components/layout/page";

export function UnitsPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const units = visibleUnits(ds, access);
  const ids = new Set(units.map((u) => u.id));
  const roots = units.filter((u) => !u.parentId || !ids.has(u.parentId));

  const render = (u: OrgUnit, depth: number) => {
    const children = units.filter((c) => c.parentId === u.id);
    const typeLabel = u.type === "TO" ? term(ds, u.id, "unit.TO", "Tổ chuyên môn") : UNIT_TYPE_LABEL[u.type];
    return (
      <li key={u.id}>
        <div className="flex flex-wrap items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-muted" style={{ paddingLeft: depth * 20 + 8 }}>
          <span className="font-medium">{u.name}</span>
          <Badge variant="outline">{typeLabel}</Badge>
          {u.schoolLevel && <Badge variant="muted">{SCHOOL_LEVEL_LABEL[u.schoolLevel]}</Badge>}
          {u.ward && <span className="text-xs text-muted-foreground">{u.ward}</span>}
          <span className="ml-auto font-mono text-xs text-muted-foreground">{u.code}</span>
        </div>
        {children.length > 0 && <ul>{children.map((c) => render(c, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Đơn vị"
        description="Cây tổ chức trong phạm vi của bạn. Xã/phường là thuộc tính địa bàn để lọc và tổng hợp, không phải cấp quản lý."
      />
      <Section title={`${units.length} đơn vị`} description="Tạo/sửa đơn vị và import danh sách từ Excel sẽ có ở M2">
        <ul className="text-sm">{roots.map((r) => render(r, 0))}</ul>
      </Section>
    </div>
  );
}
