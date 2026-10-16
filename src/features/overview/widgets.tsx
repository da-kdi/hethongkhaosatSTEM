import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Băng chào đầu dashboard — nền dải màu nhận diện của đơn vị */
export function Hero({ eyebrow, title, subtitle, aside, children }: { eyebrow: string; title: string; subtitle: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative mb-5 overflow-hidden rounded-2xl bg-[linear-gradient(120deg,var(--brand)_0%,color-mix(in_oklch,var(--brand)_70%,black)_100%)] p-5 text-white shadow-md sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/6" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-[var(--brand-accent)]/10" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            <span className="size-1.5 rounded-full bg-[var(--brand-accent)]" />{eyebrow}
          </span>
          <h1 className="mt-2.5 text-2xl leading-tight font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
          {children && <div className="mt-4 flex flex-wrap gap-2.5">{children}</div>}
        </div>
        {aside}
      </div>
    </section>
  );
}

/** Ô số liệu trong băng chào */
export function HeroMetric({ value, unit, label }: { value: ReactNode; unit?: string; label: string }) {
  return (
    <div className="min-w-[7.5rem] rounded-xl bg-white/12 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur">
      <div className="tabular text-2xl leading-none font-bold">{value}<span className="ml-1 text-xs font-medium text-white/70">{unit}</span></div>
      <div className="mt-1 text-[11px] font-medium text-[var(--brand-accent)]">{label}</div>
    </div>
  );
}

/** Vòng tiến độ */
export function Ring({ value, size = 112, label, tone = "var(--success)" }: { value: number; size?: number; label?: string; tone?: string }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <div className="text-center">
        <div className="tabular text-xl leading-none font-bold">{value}%</div>
        {label && <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>}
      </div>
    </div>
  );
}

/** Thanh tiến độ có nhãn */
export function Meter({ label, used, total, tone = "bg-primary" }: { label: string; used: number; total: number; tone?: string }) {
  const pct = total ? Math.round((used / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span><span className="tabular font-semibold">{pct}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} /></div>
      <div className="tabular mt-0.5 text-xs text-muted-foreground">{used} / {total}</div>
    </div>
  );
}

/** Biểu đồ cột đơn giản (một chuỗi số liệu theo tháng) */
export function Columns({ data, unit }: { data: { m: string; v: number }[]; unit: string }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  const peak = data.reduce((a, b) => (b.v > a.v ? b : a));
  return (
    <figure>
      <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`Số ${unit} theo tháng: ${data.map((d) => `${d.m} ${d.v}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="tabular text-[11px] font-semibold text-muted-foreground">{d.v}</span>
            <div className={cn("w-full max-w-10 rounded-t-md", d === peak ? "bg-primary" : "bg-primary/35")} style={{ height: `${Math.max(2, (d.v / max) * 85)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 border-t pt-1.5 sm:gap-3">
        {data.map((d) => <span key={d.m} className="flex-1 text-center text-[11px] text-muted-foreground">{d.m}</span>)}
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">Cao nhất {peak.v} {unit} ({peak.m})</figcaption>
    </figure>
  );
}
