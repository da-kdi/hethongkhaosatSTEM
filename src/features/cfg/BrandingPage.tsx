import { useState, type CSSProperties } from "react";
import { Check, ImageUp, Lock, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import { brandOf, BrandLockup } from "@/app/brand";
import { ancestorsOf, type AccessContext } from "@/domain/access";
import { BRAND_KEY, BRAND_PRESETS, DEFAULT_BRAND, contrastRatio, onColor, validateBrand, type Brand } from "@/domain/branding";
import type { ConfigMode } from "@/domain/model";
import { Field } from "@/components/form";
import { PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_FILE = 200_000;
const RADIUS_LABEL = { sm: "Gọn", md: "Vừa", lg: "Tròn" } as const;

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return reject(new Error("Chỉ nhận ảnh PNG, JPG, WEBP hoặc SVG"));
    if (file.size > MAX_FILE) return reject(new Error("Ảnh tối đa 200 KB"));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Không đọc được ảnh"));
    r.readAsDataURL(file);
  });
}

/** Giao diện đơn vị: mỗi Sở/trường tự đặt logo, màu, tên hiển thị; cấp trên có thể khóa để thống nhất. */
export function BrandingPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const unit = access.scopeUnit;
  const chain = ancestorsOf(ds, unit.id);
  const parentBrand = unit.parentId ? brandOf(ds, unit.parentId) : { brand: DEFAULT_BRAND };
  const resolved = brandOf(ds, unit.id);
  const own = ds.settings.find((s) => s.unitId === unit.id && s.key === BRAND_KEY);
  const lockedBy = chain.slice(0, -1).find((u) => ds.settings.some((s) => s.unitId === u.id && s.key === BRAND_KEY && s.mode === "MANDATORY"));
  const canLockChildren = unit.type === "SO" || unit.type === "PLATFORM";

  const [draft, setDraft] = useState<Partial<Brand>>(() => ({ ...(own?.value as Partial<Brand> | undefined) }));
  const [mode, setMode] = useState<ConfigMode>(own?.mode === "MANDATORY" ? "MANDATORY" : "AUTONOMOUS");
  const preview: Brand = { ...parentBrand.brand, ...Object.fromEntries(Object.entries(draft).filter(([, v]) => v)) } as Brand;
  const error = validateBrand(Object.fromEntries(Object.entries(draft).filter(([, v]) => v)));
  const upd = (patch: Partial<Brand>) => setDraft((d) => ({ ...d, ...patch }));
  const pick = (k: "logo" | "mark") => async (f?: File) => {
    if (!f) return;
    try { upd({ [k]: await readImage(f) }); } catch (e) { toast.error((e as Error).message); }
  };

  const save = () => {
    try {
      actions.setBrand(unit.id, draft, mode);
      toast.success("Đã áp dụng giao diện");
    } catch (e) { toast.error((e as Error).message); }
  };
  const reset = () => {
    try {
      actions.setSetting(unit.id, BRAND_KEY, {}, "AUTONOMOUS");
      setDraft({});
      toast.success("Đã quay về giao diện của cấp trên");
    } catch (e) { toast.error((e as Error).message); }
  };

  if (lockedBy) {
    return (
      <div>
        <PageHeader title="Giao diện đơn vị" />
        <Section title="Giao diện đang được áp dụng thống nhất">
          <p className="flex items-start gap-2 text-sm text-muted-foreground"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {lockedBy.name} đã khóa giao diện cho toàn bộ đơn vị trực thuộc. Liên hệ đơn vị này nếu cần thay đổi.</p>
          <div className="mt-4"><BrandLockup brand={resolved.brand} /></div>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Giao diện đơn vị"
        description={`Logo, màu nhận diện và tên hiển thị cho mọi người dùng thuộc ${unit.name}. Thuộc tính để trống sẽ dùng theo cấp trên${unit.parentId ? ` (${ds.units.find((u) => u.id === unit.parentId)?.name})` : ""}.`}
        actions={own && Object.keys(own.value as object).length > 0 ? <Button variant="outline" onClick={reset}><RotateCcw /> Dùng giao diện cấp trên</Button> : undefined}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-4">
          <Section title="Tên & logo">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tên hiển thị" hint={`Cấp trên: ${parentBrand.brand.appName}`}>
                <Input value={draft.appName ?? ""} placeholder={parentBrand.brand.appName} maxLength={60} onChange={(e) => upd({ appName: e.target.value })} />
              </Field>
              <Field label="Dòng phụ" hint="VD: tên trường, khẩu hiệu">
                <Input value={draft.tagline ?? ""} placeholder={parentBrand.brand.tagline} maxLength={80} onChange={(e) => upd({ tagline: e.target.value })} />
              </Field>
              <ImageField label="Biểu tượng vuông" hint="Hiện cạnh tên ở thanh bên, biểu tượng tab. ≤ 200 KB" value={draft.mark} fallback={parentBrand.brand.mark}
                onPick={pick("mark")} onClear={() => upd({ mark: undefined })} square />
              <ImageField label="Logo ngang" hint="Dùng khi không có biểu tượng vuông. ≤ 200 KB" value={draft.logo} fallback={parentBrand.brand.logo}
                onPick={pick("logo")} onClear={() => upd({ logo: undefined })} />
            </div>
          </Section>
          <Section title="Màu sắc & hình khối">
            <div className="grid gap-4">
              <div>
                <div className="mb-1.5 text-sm font-medium">Bảng màu gợi ý</div>
                <div className="flex flex-wrap gap-2">
                  {BRAND_PRESETS.map((p) => {
                    const on = preview.primary.toLowerCase() === p.primary.toLowerCase() && preview.accent.toLowerCase() === p.accent.toLowerCase();
                    return (
                      <button key={p.name} type="button" onClick={() => upd({ primary: p.primary, accent: p.accent })} aria-pressed={on}
                        className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted", on && "border-primary ring-1 ring-primary")}>
                        <span className="flex"><span className="size-4 rounded-l" style={{ background: p.primary }} /><span className="size-4 rounded-r" style={{ background: p.accent }} /></span>
                        {p.name}
                        {on && <Check className="size-3" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField label="Màu chính" hint="Nút, mục menu đang chọn" value={preview.primary} onChange={(v) => upd({ primary: v })} />
                <ColorField label="Màu nhấn" hint="Điểm nhấn, huy hiệu, biểu đồ" value={preview.accent} onChange={(v) => upd({ accent: v })} />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium">Độ bo góc</div>
                <div className="inline-flex rounded-lg border p-1">
                  {(Object.keys(RADIUS_LABEL) as (keyof typeof RADIUS_LABEL)[]).map((r) => (
                    <button key={r} type="button" aria-pressed={(preview.radius ?? "md") === r} onClick={() => upd({ radius: r })}
                      className={cn("rounded-md px-3 py-1 text-sm", (preview.radius ?? "md") === r ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                      {RADIUS_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
              {canLockChildren && (
                <Field label="Phạm vi áp dụng">
                  <select className="h-9 w-full min-w-0 rounded-md border bg-background px-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value as ConfigMode)}>
                    <option value="AUTONOMOUS">Mặc định — đơn vị trực thuộc được tự đổi</option>
                    <option value="MANDATORY">Thống nhất — khóa, đơn vị trực thuộc không đổi được</option>
                  </select>
                </Field>
              )}
            </div>
          </Section>
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div><Button onClick={save} disabled={!!error}>Lưu & áp dụng</Button></div>
        </div>
        <Section title="Xem trước" description="Giao diện người dùng của đơn vị sẽ thấy sau khi lưu.">
          <BrandPreview brand={preview} />
        </Section>
      </div>
    </div>
  );
}

function ImageField({ label, hint, value, fallback, onPick, onClear, square }: {
  label: string; hint: string; value?: string; fallback?: string; onPick: (f?: File) => void; onClear: () => void; square?: boolean;
}) {
  const shown = value || fallback;
  return (
    <div className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("grid h-12 shrink-0 place-items-center overflow-hidden rounded-md border bg-white", square ? "w-12" : "w-28")}>
          {shown ? <img src={shown} alt="" className="max-h-full max-w-full object-contain p-1" /> : <span className="text-xs text-muted-foreground">Không có</span>}
        </span>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium hover:bg-muted">
          <ImageUp className="size-3.5" aria-hidden /> Tải ảnh
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only"
            onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {value && <Button size="icon" variant="ghost" aria-label={`Bỏ ${label}`} onClick={onClear}><Trash2 /></Button>}
      </div>
      <span className="text-xs text-muted-foreground">{value ? "Riêng của đơn vị" : "Theo cấp trên"} · {hint}</span>
    </div>
  );
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); setText(value); }
  const ratio = contrastRatio(value, "#ffffff");
  return (
    <div className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border bg-background p-0.5" />
        <Input className="font-mono uppercase" value={text} maxLength={7}
          onChange={(e) => { setText(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }} />
      </div>
      <span className="text-xs text-muted-foreground">{hint}{label === "Màu chính" ? ` · tương phản với chữ trắng ${ratio.toFixed(1)}:1` : ""}</span>
    </div>
  );
}

/** Khung ứng dụng thu nhỏ — đặt biến màu cục bộ để xem trước mà không đổi giao diện đang dùng */
export function BrandPreview({ brand }: { brand: Brand }) {
  const vars = {
    "--brand": brand.primary, "--brand-fg": onColor(brand.primary), "--brand-accent": brand.accent, "--brand-accent-fg": onColor(brand.accent),
    "--primary": "var(--brand)", "--primary-foreground": "var(--brand-fg)", "--highlight": "var(--brand-accent)",
    "--accent": "color-mix(in oklch, var(--brand) 9%, white)", "--radius": { sm: "0.375rem", md: "0.75rem", lg: "1.125rem" }[brand.radius ?? "md"],
  } as CSSProperties;
  return (
    <div style={vars} className="overflow-hidden rounded-[var(--radius)] border bg-background text-foreground">
      <div className="grid grid-cols-[112px_minmax(0,1fr)] text-xs sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="border-r bg-sidebar p-3">
          <BrandLockup brand={brand} className="text-sm" />
          <div className="mt-4 grid gap-1">
            {["Tổng quan", "Kế hoạch STEM", "Lịch dạy", "Báo cáo"].map((x, i) => (
              <div key={x} className={cn("rounded-[calc(var(--radius)-4px)] px-2 py-1.5", i === 1 ? "bg-primary text-primary-foreground shadow-[inset_3px_0_0_var(--brand-accent)]" : "text-foreground/70")}>{x}</div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-3 p-3">
          <div className="text-sm font-semibold">Kế hoạch STEM năm học</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius)] border bg-card p-2"><div className="text-muted-foreground">Hoạt động</div><div className="text-lg font-semibold">48</div></div>
            <div className="rounded-[var(--radius)] border bg-card p-2"><div className="text-muted-foreground">Hoàn thành</div><div className="text-lg font-semibold text-primary">72%</div></div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[72%] rounded-full bg-highlight" /></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[calc(var(--radius)-2px)] bg-primary px-3 py-1.5 font-medium text-primary-foreground">Gửi duyệt</span>
            <span className="rounded-[calc(var(--radius)-2px)] border px-3 py-1.5">Lưu nháp</span>
            <Badge className="bg-highlight text-highlight-foreground">Mới</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
