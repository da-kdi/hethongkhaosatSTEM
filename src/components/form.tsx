import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const selectCls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function Field({ label, children, hint, className }: { label: ReactNode; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/**
 * Hộp thoại form: gọi onSubmit; lỗi nghiệp vụ (quyền, trùng, sai định dạng) hiển thị ngay trong form.
 */
export function FormDialog({ open, onOpenChange, title, description, onSubmit, submitLabel = "Lưu", children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string;
  onSubmit: () => string | void; submitLabel?: string; children: ReactNode;
}) {
  const [error, setError] = useState<string>();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const msg = onSubmit();
      setError(undefined);
      onOpenChange(false);
      toast.success(msg || "Đã lưu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { setError(undefined); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">{children}</div>
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
