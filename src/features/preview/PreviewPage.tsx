import { Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import type { NavItem } from "@/domain/navigation";
import { MODULES, STEP_BY_NO } from "@/domain/modules";
import type { Portal } from "@/domain/roles";
import { PageHeader, Section, Stat, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { previewSpec } from "./specs/index";
import type { Block, Cell, Question, Tone } from "./types";

const BADGE: Record<Tone, "default" | "success" | "warning" | "danger" | "muted" | "outline"> = {
  default: "default", success: "success", warning: "warning", danger: "danger", muted: "muted", info: "outline",
};
const BAR: Record<Tone, string> = {
  default: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-destructive", muted: "bg-muted-foreground", info: "bg-highlight",
};

/** Trang xem trước cho mục menu chưa triển khai: bố cục & dữ liệu minh họa, mọi thao tác bị vô hiệu. */
export function PreviewPage({ portal, item }: { portal: Portal; item: NavItem }) {
  const spec = previewSpec(portal, item.slug);
  const mod = MODULES[item.module];
  const soon = () => toast.info(`Bản xem trước — chức năng hoàn thiện ở ${item.milestone}`);

  return (
    <div>
      <PageHeader
        title={item.label}
        description={spec?.intro ?? item.scope ?? mod.description}
        actions={spec?.actions?.length ? (
          <div className="flex flex-wrap gap-2">
            {spec.actions.map((a, i) => <Button key={a} variant={i === 0 ? "default" : "outline"} onClick={soon}>{a}</Button>)}
          </div>
        ) : undefined}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-highlight bg-highlight/10 px-3 py-2 text-xs">
        <Eye className="size-4 shrink-0 text-highlight" aria-hidden />
        <span className="font-medium">Bản xem trước · dữ liệu minh họa</span>
        <span className="text-muted-foreground">Phân hệ {mod.no} · {mod.name} — hoàn thiện ở {item.milestone}</span>
        <span className="flex flex-wrap gap-1">{mod.steps.map((n) => <Badge key={n} variant="outline">Bước {n} · {STEP_BY_NO[n].name}</Badge>)}</span>
      </div>

      {!spec ? (
        <Section title="Phạm vi màn hình"><ul className="list-disc pl-4 text-sm text-muted-foreground">{mod.features.map((f) => <li key={f}>{f}</li>)}</ul></Section>
      ) : (
        <>
          {spec.filters && (
            <div className="mb-4 flex flex-wrap gap-2" aria-label="Bộ lọc (minh họa)">
              {spec.filters.map((f) => (
                <button key={f} type="button" onClick={soon} className="rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">{f} ▾</button>
              ))}
            </div>
          )}
          {spec.kpis && (
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {spec.kpis.map((k) => <Stat key={k.label} label={k.label} value={k.value} hint={k.hint} />)}
            </div>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            {spec.blocks.map((b, i) => (
              <div key={i} className={cn("min-w-0", (b.span === 2 || b.kind === "table" || b.kind === "week") && "xl:col-span-2")}>
                <PreviewBlock block={b} onAction={soon} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CellView({ c }: { c: Cell }) {
  if (typeof c === "string" || typeof c === "number") return <>{c}</>;
  if ("b" in c) return <Badge variant={BADGE[c.t ?? "default"]}>{c.b}</Badge>;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, c.p)}%` }} /></span>
      <span className="text-xs tabular-nums">{c.p}%</span>
    </span>
  );
}

function PreviewBlock({ block: b, onAction }: { block: Block; onAction: () => void }) {
  switch (b.kind) {
    case "table":
      return (
        <Section title={b.title} description={b.desc}>
          <TableWrap>
            <thead><tr>{b.columns.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={td}><CellView c={c} /></td>)}</tr>)}</tbody>
          </TableWrap>
        </Section>
      );
    case "steps":
      return (
        <Section title={b.title} description={b.desc}>
          <ol className="grid gap-0">
            {b.steps.map((s, i) => (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < b.steps.length - 1 && <span aria-hidden className="absolute top-6 left-[11px] h-[calc(100%-1rem)] w-px bg-border" />}
                <span className={cn("relative grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                  s.state === "done" ? "border-success bg-success text-white" : s.state === "current" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
                  {s.state === "done" ? "✓" : i + 1}
                </span>
                <span className="pt-0.5 text-sm">
                  <span className={cn("font-medium", s.state === "todo" && "text-muted-foreground")}>{s.label}</span>
                  {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "bars":
      return (
        <Section title={b.title} description={b.desc}>
          <ul className="grid gap-2.5">
            {b.items.map((x) => {
              const pct = Math.round((x.value / (x.max ?? 100)) * 100);
              return (
                <li key={x.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
                  <span className="truncate">{x.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", BAR[x.tone ?? "default"])} style={{ width: `${Math.min(100, pct)}%` }} /></span>
                  <span className="text-xs tabular-nums text-muted-foreground">{x.value}{x.suffix ?? (x.max ? `/${x.max}` : "%")}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      );
    case "cards":
      return (
        <Section title={b.title} description={b.desc}>
          <div className="grid gap-3 sm:grid-cols-2">
            {b.items.map((c) => (
              <div key={c.title} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{c.title}</div>
                  {c.badge && <Badge variant={BADGE[c.badge.t ?? "default"]}>{c.badge.b}</Badge>}
                </div>
                {c.meta && <div className="mt-0.5 text-xs text-muted-foreground">{c.meta}</div>}
                {c.body && <p className="mt-2 text-sm text-foreground/80">{c.body}</p>}
                {c.progress !== undefined && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-highlight" style={{ width: `${c.progress}%` }} /></div>
                )}
              </div>
            ))}
          </div>
        </Section>
      );
    case "list":
      return (
        <Section title={b.title} description={b.desc}>
          <ul className="divide-y">
            {b.items.map((x) => (
              <li key={x.title} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 text-sm"><span className="font-medium">{x.title}</span>{x.meta && <span className="block text-xs text-muted-foreground">{x.meta}</span>}</span>
                {x.badge && <Badge variant={BADGE[x.badge.t ?? "default"]} className="shrink-0">{x.badge.b}</Badge>}
              </li>
            ))}
          </ul>
        </Section>
      );
    case "week":
      return (
        <Section title={b.title} description={b.desc}>
          <div className="relative -mx-5 overflow-x-auto px-5">
            <div className="grid min-w-[700px] gap-2" style={{ gridTemplateColumns: `repeat(${b.days.length}, minmax(0, 1fr))` }}>
              {b.days.map((d) => (
                <div key={d.day} className="rounded-lg bg-muted/50 p-2">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">{d.day}</div>
                  <div className="grid gap-1.5">
                    {d.items.map((x, i) => (
                      <div key={i} className={cn("rounded-md border-l-[3px] bg-card px-2 py-1.5 text-xs shadow-sm",
                        x.tone === "danger" ? "border-destructive" : x.tone === "warning" ? "border-warning" : x.tone === "info" ? "border-highlight" : "border-primary")}>
                        <div className="font-medium">{x.time}</div>
                        <div>{x.label}</div>
                        {x.meta && <div className="text-muted-foreground">{x.meta}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      );
    case "form":
      return (
        <Section title={b.title} description={b.desc}>
          <fieldset disabled className="grid min-w-0 gap-3 sm:grid-cols-2">
            {b.fields.map((f) => (
              <label key={f.label} className={cn("grid gap-1 text-sm", f.wide && "sm:col-span-2")}>
                <span className="font-medium">{f.label}</span>
                <Input defaultValue={f.value} />
              </label>
            ))}
          </fieldset>
          <Button className="mt-3" onClick={onAction}><Lock /> {b.submit}</Button>
        </Section>
      );
    case "chat":
      return (
        <Section title={b.title} description={b.desc}>
          <div className="grid gap-2">
            {b.messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.me ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                <div className={cn("text-xs", m.me ? "text-primary-foreground/80" : "text-muted-foreground")}>{m.from} · {m.at}</div>
                {m.text}
              </div>
            ))}
            <div className="mt-1 flex gap-2"><Input disabled placeholder="Nhập tin nhắn…" /><Button onClick={onAction}>Gửi</Button></div>
          </div>
        </Section>
      );
    case "chips":
      return (
        <Section title={b.title} description={b.desc}>
          <div className="grid gap-3">
            {b.groups.map((g) => (
              <div key={g.label}>
                <div className="mb-1.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{g.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((x) => <span key={x} className="rounded-lg border bg-card px-2.5 py-1 text-xs font-medium">{x}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    case "questions":
      return (
        <Section title={b.title} description={b.desc}>
          {b.progress !== undefined && (
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${b.progress}%` }} /></span>
              {b.progress}%
            </div>
          )}
          <ol className="grid grid-cols-[minmax(0,1fr)] gap-5">
            {b.questions.map((q, i) => <QuestionView key={i} q={q} n={i + 1} />)}
          </ol>
          {b.submit && <Button className="mt-5" onClick={onAction}>{b.submit}</Button>}
        </Section>
      );
    case "note":
      return (
        <div className={cn("rounded-xl border p-4 text-sm", b.tone === "warning" ? "border-warning/50 bg-warning/10" : b.tone === "danger" ? "border-destructive/40 bg-destructive/5" : "bg-card")}>
          <div className="font-semibold">{b.title}</div>
          <p className="mt-1 text-muted-foreground">{b.text}</p>
        </div>
      );
  }
}

function QuestionView({ q, n }: { q: Question; n: number }) {
  const head = (
    <div className="mb-2 text-sm font-medium">
      {n}. {q.title}{q.required && <span className="text-destructive"> *</span>}
      {q.logic && <span className="ml-2 rounded bg-highlight/20 px-1.5 py-0.5 text-[10px] font-semibold">Hiện khi: {q.logic}</span>}
    </div>
  );
  switch (q.type) {
    case "single":
    case "multi":
      return (
        <li>{head}
          <div className="grid gap-1.5 sm:grid-cols-2">
            {q.options.map((o, i) => {
              const on = q.selected?.includes(i);
              return (
                <span key={o} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", on && "border-primary bg-accent")}>
                  <span className={cn("grid size-4 shrink-0 place-items-center border", q.type === "single" ? "rounded-full" : "rounded", on ? "border-primary bg-primary" : "border-input")}>
                    {on && <span className={cn("bg-primary-foreground", q.type === "single" ? "size-1.5 rounded-full" : "size-2 rounded-[2px]")} />}
                  </span>{o}
                </span>
              );
            })}
          </div>
        </li>
      );
    case "rating":
      return (
        <li>{head}
          <div className="flex gap-1.5">
            {Array.from({ length: q.max }, (_, i) => (
              <span key={i} className={cn("grid size-9 place-items-center rounded-lg border text-lg", q.value && i < q.value ? "border-highlight bg-highlight/20 text-[color-mix(in_oklch,var(--brand-accent)_75%,black)]" : "text-muted-foreground")}>★</span>
            ))}
          </div>
        </li>
      );
    case "nps":
      return (
        <li>{head}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className={cn("grid size-8 place-items-center rounded-md border text-xs font-semibold", q.value === i ? "border-primary bg-primary text-primary-foreground" : i <= 6 ? "text-destructive" : i <= 8 ? "text-muted-foreground" : "text-success")}>{i}</span>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Không</span><span>Chắc chắn</span></div>
        </li>
      );
    case "matrix":
      return (
        <li>{head}
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[480px] text-xs">
              <thead><tr><th />{q.cols.map((c) => <th key={c} className="px-1 py-1.5 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>
                {q.rows.map((r, ri) => (
                  <tr key={r} className="border-t">
                    <td className="py-2 pr-2 text-sm">{r}</td>
                    {q.cols.map((c, ci) => (
                      <td key={c} className="text-center"><span className={cn("inline-block size-4 rounded-full border", q.picks?.[ri] === ci ? "border-primary bg-primary" : "border-input")} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
      );
    case "text":
      return (
        <li>{head}
          <div className={cn("rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground", q.long && "min-h-20")}>{q.placeholder ?? "Câu trả lời…"}</div>
        </li>
      );
  }
}
