import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, children, className, actions }: {
  title: string; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode;
}) {
  return (
    // min-w-0: là grid/flex item thì không bị bảng bên trong đẩy rộng quá màn hình (bảng tự cuộn ngang)
    <section className={cn("min-w-0 rounded-xl border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
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
  return <div className="relative -mx-4 overflow-x-auto px-4"><table className="w-full min-w-[560px] text-sm">{children}</table></div>;
}

export const th = "border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground";
export const td = "border-b px-2 py-2.5 align-top";
