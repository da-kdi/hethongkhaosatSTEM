import { Check, Circle, CircleDot } from "lucide-react";
import { useStore } from "@/app/store";
import { visibleSchools } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import type { DeAnProgress, StepStatus } from "@/domain/model";
import { DE_AN_STEPS, MODULES, type ModuleCode } from "@/domain/modules";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS: Record<StepStatus, { label: string; variant: "success" | "warning" | "muted" }> = {
  DONE: { label: "Hoàn thành", variant: "success" },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "warning" },
  NOT_STARTED: { label: "Chưa bắt đầu", variant: "muted" },
};

function StepIcon({ status, no }: { status: StepStatus; no: number }) {
  if (status === "DONE") return <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" aria-hidden /></span>;
  if (status === "IN_PROGRESS") return <span className="grid size-8 place-items-center rounded-full border-2 border-primary bg-card text-sm font-semibold text-primary">{no}</span>;
  return <span className="grid size-8 place-items-center rounded-full border bg-card text-sm text-muted-foreground">{no}</span>;
}

/** Thanh 5 bước — dạng ngang trên màn rộng, dọc trên điện thoại. */
export function DeAnStepper({ progress, compact = false }: { progress: DeAnProgress; compact?: boolean }) {
  return (
    <ol className="grid gap-3 md:grid-cols-5 md:gap-2">
      {DE_AN_STEPS.map((step) => {
        const st = progress.steps.find((s) => s.no === step.no);
        const status = st?.status ?? "NOT_STARTED";
        const items = st?.items ?? [];
        const done = items.filter((i) => i.done).length;
        return (
          <li key={step.no} className="flex gap-3 md:flex-col md:gap-2">
            <div className="flex items-center gap-2 md:w-full">
              <StepIcon status={status} no={step.no} />
              <div className={cn("hidden h-0.5 flex-1 rounded md:block", status === "DONE" ? "bg-primary" : "bg-border", step.no === 5 && "md:invisible")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground">Bước {step.no}</div>
              <div className="text-sm font-semibold leading-snug text-balance">{step.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
                {items.length > 0 && <span className="tabular text-xs text-muted-foreground">{done}/{items.length}</span>}
              </div>
              {!compact && items.length > 0 && (
                <ul className="mt-2 grid gap-1">
                  {items.map((i) => (
                    <li key={i.label} className="flex items-start gap-1.5 text-xs">
                      {i.done
                        ? <Check className="mt-0.5 size-3 shrink-0 text-success" aria-label="Đã xong" />
                        : status === "IN_PROGRESS"
                          ? <CircleDot className="mt-0.5 size-3 shrink-0 text-warning" aria-label="Đang làm" />
                          : <Circle className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-label="Chưa làm" />}
                      <span className={cn("min-w-0", i.done && "text-muted-foreground")}>
                        {i.label}
                        <span className="ml-1 whitespace-nowrap text-muted-foreground">· PH {MODULES[i.module as ModuleCode]?.no ?? i.module}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function currentStep(p: DeAnProgress): number {
  const active = p.steps.find((s) => s.status === "IN_PROGRESS");
  if (active) return active.no;
  const done = p.steps.filter((s) => s.status === "DONE").length;
  return Math.min(done + 1, 5);
}

export function DeAnProgressPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const year = ds.years.find((y) => y.isCurrent);
  const own = ds.deAn.find((d) => d.unitId === access.configUnitId || d.unitId === access.scopeUnit.id);
  const schools = access.role.portal === "so" ? visibleSchools(ds, access) : [];

  return (
    <div>
      <PageHeader
        title="Tiến trình triển khai đề án"
        description={`Năm học ${year?.code ?? ""} · 5 bước: Định hướng từ Tỉnh/Sở → Lập kế hoạch → Đào tạo và triển khai → Đánh giá vận hành → Tổng hợp báo cáo và đề xuất cải tiến.`}
        actions={<Badge variant="outline">Dữ liệu minh họa · tự động hóa ở M3</Badge>}
      />
      <div className="grid gap-4">
        <Section title={own ? ds.units.find((u) => u.id === own.unitId)?.name ?? "Đơn vị" : "Đơn vị của bạn"} description="Mỗi bước gồm các đầu ra cụ thể, gắn với phân hệ thực hiện (PH).">
          {own ? <DeAnStepper progress={own} /> : <Empty title="Chưa có kế hoạch đề án cho năm học này" />}
        </Section>

        {schools.length > 0 && (
          <Section title="Tiến trình theo cơ sở giáo dục" description="Sở theo dõi trường đang ở bước nào để hỗ trợ kịp thời.">
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Cơ sở giáo dục</th>
                  {DE_AN_STEPS.map((s) => <th key={s.no} className={`${th} text-center`}>B{s.no}</th>)}
                  <th className={th}>Đang ở</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((sc) => {
                  const p = ds.deAn.find((d) => d.unitId === sc.id);
                  return (
                    <tr key={sc.id}>
                      <td className={`${td} font-medium`}>{sc.name}</td>
                      {DE_AN_STEPS.map((s) => {
                        const st = p?.steps.find((x) => x.no === s.no)?.status ?? "NOT_STARTED";
                        return (
                          <td key={s.no} className={`${td} text-center`}>
                            {st === "DONE" ? <Check className="mx-auto size-4 text-success" aria-label="Hoàn thành" />
                              : st === "IN_PROGRESS" ? <CircleDot className="mx-auto size-4 text-warning" aria-label="Đang thực hiện" />
                                : <Circle className="mx-auto size-4 text-border" aria-label="Chưa bắt đầu" />}
                          </td>
                        );
                      })}
                      <td className={`${td} text-sm`}>{p ? `Bước ${currentStep(p)} · ${DE_AN_STEPS[currentStep(p) - 1].name}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </Section>
        )}

        <Section title="Đầu ra từng bước & phân hệ phụ trách">
          <ol className="grid gap-3 md:grid-cols-5">
            {DE_AN_STEPS.map((s) => (
              <li key={s.no} className="rounded-lg border p-3">
                <div className="text-xs font-medium text-muted-foreground">Bước {s.no} · {s.owner}</div>
                <div className="text-sm font-semibold">{s.name}</div>
                <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
                  {s.outputs.map((o) => <li key={o}>{o}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
