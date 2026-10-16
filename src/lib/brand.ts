/** Áp màu/độ bo góc nhận diện của đơn vị lên tài liệu (CSS variables, xem src/index.css). */
import { onColor, type Brand } from "@/domain/branding";

const RADIUS = { sm: "0.375rem", md: "0.75rem", lg: "1.125rem" } as const;

export function applyBrand(b: Brand) {
  const st = document.documentElement.style;
  st.setProperty("--brand", b.primary);
  st.setProperty("--brand-fg", onColor(b.primary));
  st.setProperty("--brand-accent", b.accent);
  st.setProperty("--brand-accent-fg", onColor(b.accent));
  st.setProperty("--radius", RADIUS[b.radius ?? "md"]);
  document.title = b.appName;
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon && b.mark) icon.href = b.mark;
}
