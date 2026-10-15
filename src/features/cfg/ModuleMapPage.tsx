import { ArrowRight, Check } from "lucide-react";
import { useStore } from "@/app/store";
import { ancestorsOf, type AccessContext } from "@/domain/access";
import { isModuleEnabled } from "@/domain/config";
import { DE_AN_STEPS, MODULE_LIST, MODULES, TIERS, type ModuleDef } from "@/domain/modules";
import { PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LAYERS = [
  { name: "Tầng trên · Giao diện", items: ["Web app responsive (đang có)", "Ứng dụng di động dạng PWA, làm việc ngoại tuyến cho điểm danh (M7)", "Dashboard/BI trong ứng dụng + kết nối Power BI qua kho phân tích (M9)"] },
  { name: "Tầng giữa · Xử lý nghiệp vụ", items: ["Nghiệp vụ & API: 14 phân hệ = schema Postgres + RPC security definer", "Tích hợp hệ thống: Edge Functions + ánh xạ theo QĐ 2768 (LMS, CSDL ngành, nội bộ)", "Tác vụ nền: thông báo, sinh báo cáo, đồng bộ (pg_cron + Edge Functions)"] },
  { name: "Tầng dưới · Dữ liệu dùng chung", items: ["Cơ sở dữ liệu PostgreSQL (Supabase / Cloud SQL)", "Kho tài liệu: object storage + CDN (minh chứng, học liệu)", "Kho phân tích: schema dw dạng star schema → BI"] },
  { name: "Nền tảng", items: ["Định danh & bảo mật: đăng nhập, RLS theo phạm vi, ngữ cảnh vai trò, nhật ký, bảo vệ dữ liệu trẻ em", "Hạ tầng vận hành: CI/CD, giám sát, sao lưu (PITR)"] },
];

function ModuleCard({ m, enabled }: { m: ModuleDef; enabled: boolean }) {
  return (
    <div className={cn("flex h-full flex-col rounded-lg border bg-card p-3", !enabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-primary">Phân hệ {m.no}</div>
          <div className="text-sm font-semibold leading-snug">{m.name}</div>
        </div>
        {m.milestone === "M0"
          ? <Badge variant="success">Đang có</Badge>
          : <Badge variant="muted">{m.milestone}</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer font-medium text-foreground/80">Chi tiết ({m.features.length})</summary>
        <ul className="mt-1 list-disc pl-4 text-muted-foreground">
          {m.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
        {m.partners && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground/80">Đối tác:</span> {m.partners}</p>}
        {m.dataDomains.length > 0 && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{m.dataDomains.join(" · ")}</p>}
      </details>
      <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
        {m.steps.map((s) => <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">B{s}</span>)}
        {!enabled && <Badge variant="warning">Đang tắt</Badge>}
        {m.inputs && <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">từ {m.inputs.map((i) => MODULES[i].no).join(", ")} <ArrowRight className="size-3" aria-hidden /></span>}
      </div>
    </div>
  );
}

export function ModuleMapPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const unit = ds.units.find((u) => u.id === access.configUnitId);
  const chain = ancestorsOf(ds, access.configUnitId);
  const enabled = (m: ModuleDef) => !m.canDisable || isModuleEnabled(ds.settings, chain, m.code);

  return (
    <div>
      <PageHeader
        title="Bản đồ phân hệ"
        description={`14 phân hệ chia theo 5 tầng nghiệp vụ, phục vụ quy trình 5 bước triển khai đề án, liên thông Sở ↔ Trường. Trạng thái bật/tắt tính tại: ${unit?.name ?? ""}.`}
      />
      <div className="grid gap-4">
        <Section title="Phân hệ theo tầng" description="Luồng chính tầng 4: 4 Tổ chức dạy học → 5 Kế hoạch & lịch dạy (nhận đầu vào từ 2 và 3) → 6 Buổi dạy & điểm danh → 7 Đánh giá. Phân hệ 8 áp dụng xuyên suốt.">
          <div className="grid gap-4">
            {TIERS.map((t, i) => {
              const mods = MODULE_LIST.filter((m) => m.tier === t.code);
              return (
                <div key={t.code}>
                  <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t.code === "X" ? "Xuyên suốt" : `Tầng ${i}`} · {t.name}
                  </div>
                  <div className={cn("grid gap-3", mods.length > 2 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
                    {mods.map((m) => <ModuleCard key={m.code} m={m} enabled={enabled(m)} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Phân hệ × 5 bước triển khai đề án" description="Ô đánh dấu là bước phân hệ tham gia.">
          <div className="relative -mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground">Phân hệ</th>
                  {DE_AN_STEPS.map((s) => (
                    <th key={s.no} className="border-b px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                      <div>B{s.no}</div>
                      <div className="mx-auto max-w-24 font-normal leading-tight">{s.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_LIST.map((m) => (
                  <tr key={m.code}>
                    <td className="border-b px-2 py-1.5"><span className="font-medium">{m.no}</span> · {m.name}</td>
                    {DE_AN_STEPS.map((s) => (
                      <td key={s.no} className="border-b text-center">
                        {m.steps.includes(s.no) ? <Check className="mx-auto size-4 text-primary" aria-label="Có" /> : <span className="sr-only">Không</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Kiến trúc tổng thể" description="Ánh xạ các tầng kiến trúc sang công nghệ đang dùng.">
          <div className="grid gap-3 md:grid-cols-2">
            {LAYERS.map((l) => (
              <div key={l.name} className="rounded-lg border p-3">
                <div className="text-sm font-semibold">{l.name}</div>
                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">{l.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
