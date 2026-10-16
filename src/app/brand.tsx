import { useEffect } from "react";
import { ancestorsOf } from "@/domain/access";
import { resolveBrand, type Brand } from "@/domain/branding";
import type { Dataset } from "@/domain/model";
import { applyBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useStore } from "./store";

/** Giao diện hiệu lực của đơn vị (mirror cfg.my_brand()). Không có đơn vị → mặc định nền tảng. */
export function brandOf(ds: Dataset, unitId?: string) {
  const root = ds.units.find((u) => u.parentId === null);
  return resolveBrand(ds.settings, ancestorsOf(ds, unitId ?? root?.id ?? ""));
}

export function useBrand(unitId?: string): Brand {
  const { ds } = useStore();
  const { brand } = brandOf(ds, unitId);
  useEffect(() => applyBrand(brand), [brand]);
  return brand;
}

/** Khối nhận diện: biểu tượng + tên, hoặc logo ngang nếu đơn vị chỉ có logo */
export function BrandLockup({ brand, className, invert }: { brand: Brand; className?: string; invert?: boolean }) {
  if (brand.mark) {
    return (
      <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
        <img src={brand.mark} alt="" className={cn("size-9 shrink-0 rounded-lg object-contain p-0.5", invert ? "bg-white" : "bg-white ring-1 ring-border")} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-semibold">{brand.appName}</span>
          {brand.tagline && <span className={cn("block truncate text-xs", invert ? "text-white/75" : "text-muted-foreground")}>{brand.tagline}</span>}
        </span>
      </span>
    );
  }
  if (brand.logo) return <img src={brand.logo} alt={brand.appName} className={cn("h-9 max-w-[180px] rounded bg-white object-contain px-1", className)} />;
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground">{brand.appName.slice(0, 1)}</span>
      <span className="truncate font-semibold">{brand.appName}</span>
    </span>
  );
}
