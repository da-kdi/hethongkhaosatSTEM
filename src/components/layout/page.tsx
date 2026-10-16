import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</div>}
        <h1 className="text-[1.65rem] leading-tight font-bold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, children, className, actions, icon }: {
  title: string; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; icon?: ReactNode;
}) {
  return (
    // min-w-0: là grid/flex item thì không bị bảng bên trong đẩy rộng quá màn hình (bảng tự cuộn ngang)
    <section className={cn("shadow-card min-w-0 rounded-2xl border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary [&_svg]:size-4">{icon}</span>}
          <div className="min-w-0">
            <h2 className="text-[0.95rem] font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "info";
export const TONE_TILE: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-highlight/20 text-[color-mix(in_oklch,var(--brand-accent)_70%,black)] dark:text-highlight",
  success: "bg-success/12 text-success",
  warning: "bg-warning/18 text-[oklch(0.5_0.12_65)] dark:text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

export function Stat({ label, value, hint, icon, tone = "primary", delta }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; delta?: string;
}) {
  const down = delta?.startsWith("-");
  return (
    <div className="shadow-card min-w-0 rounded-2xl border bg-card px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        {icon ? <span className={cn("grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]", TONE_TILE[tone])}>{icon}</span>
          : <div className="text-xs font-medium text-muted-foreground">{label}</div>}
        {delta && <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", down ? "bg-destructive/10 text-destructive" : "bg-success/12 text-success")}>{delta}</span>}
      </div>
      <div className={cn("tabular text-[1.6rem] leading-tight font-bold tracking-tight", icon ? "mt-2.5" : "mt-1")}>{value}</div>
      {icon && <div className="text-[13px] font-medium">{label}</div>}
      {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

/** Bảng cuộn ngang trên màn hình hẹp, không làm tràn trang */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="relative -mx-5 overflow-x-auto px-5"><table className="w-full min-w-[560px] text-sm">{children}</table></div>;
}

export const th = "border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground";
export const td = "border-b px-2 py-2.5 align-top";
