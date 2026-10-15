import { useMemo, useState } from "react";
import { useStore } from "@/app/store";
import { aggregateForUnit, SCHOOL_LEVEL_LABEL, visibleSchools } from "@/app/queries";
import { ancestorsOf, type AccessContext } from "@/domain/access";
import { isModuleEnabled } from "@/domain/config";
import { MODULES, type ModuleCode } from "@/domain/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Term } from "@/components/term";

const TRACKED: ModuleCode[] = ["training", "program", "resource", "schedule", "session", "assess", "survey"];

export function SchoolsPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const schools = visibleSchools(ds, access);
  const rows = useMemo(
    () => schools
      .filter((s) => (!level || s.schoolLevel === level) && `${s.name} ${s.ward}`.toLowerCase().includes(q.trim().toLowerCase()))
      .map((s) => ({ s, agg: aggregateForUnit(ds, s.id), chain: ancestorsOf(ds, s.id) })),
    [ds, schools, q, level],
  );

  return (
    <div>
      <PageHeader title="Danh sách cơ sở giáo dục" description="Số liệu tổng hợp theo cơ sở giáo dục, trường dữ liệu theo Từ điển dữ liệu ngành (QĐ 2768). Dữ liệu cá nhân học sinh không hiển thị ở cấp Sở." />
      <Section
        title={`${rows.length}/${schools.length} cơ sở giáo dục`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên trường, xã/phường…" className="h-8 w-48" aria-label="Tìm trường" />
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Cấp học" className="h-8 rounded-md border bg-background px-2 text-sm">
              <option value="">Mọi cấp học</option>
              {Object.entries(SCHOOL_LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <th className={th}><Term code="BG_00421">Cơ sở giáo dục</Term></th>
              <th className={th}><Term code="BG_00419">Mã định danh</Term></th>
              <th className={th}><Term code="BG_00422">Cấp học</Term> · <Term code="BG_00429">Loại hình</Term></th>
              <th className={`${th} text-right`}>Lớp</th>
              <th className={`${th} text-right`}>Nhân sự</th>
              <th className={`${th} text-right`}>Học sinh</th>
              <th className={th}>Phân hệ đang tắt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, agg, chain }) => {
              const off = TRACKED.filter((m) => !isModuleEnabled(ds.settings, chain, m));
              return (
                <tr key={s.id}>
                  <td className={td}>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground"><Term code="BG_00427">{s.ward}</Term></div>
                  </td>
                  <td className={`${td} font-mono text-xs`}>{s.maDinhDanh ?? "—"}</td>
                  <td className={td}>
                    {s.schoolLevel && SCHOOL_LEVEL_LABEL[s.schoolLevel]}
                    {s.loaiHinhCsgd && <div className="text-xs text-muted-foreground">{s.loaiHinhCsgd}</div>}
                  </td>
                  <td className={`${td} tabular text-right`}>{agg.classes}</td>
                  <td className={`${td} tabular text-right`}>{agg.staff}</td>
                  <td className={`${td} tabular text-right`}>{agg.students}</td>
                  <td className={td}>
                    {off.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : off.map((m) => <Badge key={m} variant="warning" className="mr-1 mb-1">{MODULES[m].no} · {MODULES[m].short}</Badge>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>
    </div>
  );
}
