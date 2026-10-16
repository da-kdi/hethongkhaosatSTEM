/**
 * Giao diện theo đơn vị (white-label) — cấu hình khóa `ui.brand` trong cfg.setting.
 *
 * Quy tắc kế thừa riêng cho giao diện (mirror cfg.my_brand() trong migration 0011):
 *   Nền tảng (mặc định KDI) → Sở → Trường → Tổ: duyệt từ gốc xuống, tầng dưới GHI ĐÈ từng trường thông tin
 *   (màu, logo, tên…) mà nó khai báo; trường không khai báo thì giữ của tầng trên.
 *   Tầng nào đặt MANDATORY thì cấp dưới không đổi được (vd. Sở thống nhất nhận diện toàn tỉnh).
 *
 * Giá trị được kiểm ở cả client (validateBrand) và DB (trigger cfg.check_brand) — logo chỉ nhận data URL ảnh ≤ 200 KB
 * hoặc đường dẫn tương đối trong ứng dụng, không nhận URL ngoài (tránh theo dõi/nội dung không kiểm soát).
 */
import type { ConfigSetting, OrgUnit } from "./model.ts";

export const BRAND_KEY = "ui.brand";

export interface Brand {
  /** Tên hiển thị trên thanh bên & trang đăng nhập */
  appName: string;
  /** Dòng phụ dưới tên (vd. tên trường) */
  tagline?: string;
  /** Logo ngang (đầy đủ) */
  logo?: string;
  /** Biểu tượng vuông (thanh bên thu gọn, favicon) */
  mark?: string;
  /** Màu chính (nút, mục đang chọn) — hex #rrggbb */
  primary: string;
  /** Màu nhấn (điểm nhấn, biểu đồ, huy hiệu) — hex #rrggbb */
  accent: string;
  /** Độ bo góc: gọn | vừa | tròn */
  radius?: "sm" | "md" | "lg";
}

export const DEFAULT_BRAND: Brand = {
  appName: "Quản trị STEM",
  tagline: "KDI Education",
  logo: "./brand/kdi-logo.png",
  mark: "./brand/kdi-mark.png",
  primary: "#154B98",
  accent: "#F7A934",
  radius: "md",
};

/** Bảng màu gợi ý cho trường chọn nhanh */
export const BRAND_PRESETS: { name: string; primary: string; accent: string }[] = [
  { name: "KDI (mặc định)", primary: "#154B98", accent: "#F7A934" },
  { name: "Xanh lục học đường", primary: "#0F766E", accent: "#F59E0B" },
  { name: "Đỏ đô truyền thống", primary: "#9F1239", accent: "#EAB308" },
  { name: "Tím sáng tạo", primary: "#5B21B6", accent: "#22C55E" },
  { name: "Xanh biển", primary: "#0369A1", accent: "#F97316" },
  { name: "Than chì", primary: "#334155", accent: "#06B6D4" },
];

export interface ResolvedBrand {
  brand: Brand;
  /** Đơn vị khai báo từng trường thông tin */
  sourceOf: Partial<Record<keyof Brand, string>>;
  lockedByUnitId?: string;
}

export function resolveBrand(settings: readonly ConfigSetting[], chain: readonly OrgUnit[]): ResolvedBrand {
  let brand: Brand = { ...DEFAULT_BRAND };
  const sourceOf: ResolvedBrand["sourceOf"] = {};
  for (const unit of chain) {
    const s = settings.find((x) => x.unitId === unit.id && x.key === BRAND_KEY);
    if (!s || typeof s.value !== "object" || s.value === null) continue;
    for (const [k, v] of Object.entries(s.value as Partial<Brand>)) {
      if (v === undefined || v === null || v === "") continue;
      brand = { ...brand, [k]: v };
      sourceOf[k as keyof Brand] = unit.id;
    }
    if (s.mode === "MANDATORY") return { brand, sourceOf, lockedByUnitId: unit.id };
  }
  return { brand, sourceOf };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const IMG = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
export const MAX_LOGO_CHARS = 280_000; // ~200 KB ảnh sau base64

/** Kiểm giá trị cấu hình giao diện; trả thông báo lỗi tiếng Việt hoặc undefined */
export function validateBrand(v: Partial<Brand>): string | undefined {
  const allowed: (keyof Brand)[] = ["appName", "tagline", "logo", "mark", "primary", "accent", "radius"];
  for (const k of Object.keys(v)) if (!allowed.includes(k as keyof Brand)) return `Thuộc tính không hỗ trợ: ${k}`;
  if (v.appName !== undefined && (v.appName.trim().length < 2 || v.appName.length > 60)) return "Tên hiển thị 2–60 ký tự";
  if (v.tagline && v.tagline.length > 80) return "Dòng phụ tối đa 80 ký tự";
  for (const k of ["primary", "accent"] as const) if (v[k] && !HEX.test(v[k]!)) return "Màu phải ở dạng #RRGGBB";
  for (const k of ["logo", "mark"] as const) {
    const s = v[k];
    if (!s) continue;
    if (s.length > MAX_LOGO_CHARS) return "Ảnh logo tối đa khoảng 200 KB";
    if (!IMG.test(s) && !/^\.\/brand\/[a-z0-9-]+\.(png|svg|webp)$/.test(s)) return "Logo phải là ảnh tải lên (PNG, JPG, WEBP, SVG)";
  }
  if (v.radius && !["sm", "md", "lg"].includes(v.radius)) return "Độ bo góc không hợp lệ";
  if (v.primary && contrastRatio(v.primary, "#ffffff") < 3) return "Màu chính quá nhạt — chữ trắng trên nút sẽ khó đọc (cần độ tương phản ≥ 3:1)";
  return undefined;
}

// ---------- Màu ----------
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Màu chữ đặt trên nền `hex` */
export const onColor = (hex: string) => (contrastRatio(hex, "#ffffff") >= 3 ? "#ffffff" : "#111827");
