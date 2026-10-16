/**
 * Đặc tả màn hình XEM TRƯỚC (dữ liệu minh họa, hư cấu) cho các mục menu chưa triển khai nghiệp vụ.
 * Mục đích: mọi vai trò hình dung được màn hình trước khi build chi tiết theo milestone.
 * Khi một mục được build thật, đăng ký trang trong PageView.PAGES và đổi milestone sang READY — đặc tả này bị bỏ qua.
 */
export type Tone = "default" | "success" | "warning" | "danger" | "muted" | "info";

/** Ô bảng: chữ | huy hiệu | thanh tiến độ (%) */
export type Cell = string | number | { b: string; t?: Tone } | { p: number };

export type Block =
  | { kind: "table"; title: string; desc?: string; columns: string[]; rows: Cell[][]; span?: 2 }
  | { kind: "steps"; title: string; desc?: string; steps: { label: string; state: "done" | "current" | "todo"; note?: string }[]; span?: 2 }
  | { kind: "bars"; title: string; desc?: string; items: { label: string; value: number; max?: number; suffix?: string; tone?: Tone }[]; span?: 2 }
  | { kind: "cards"; title: string; desc?: string; items: { title: string; meta?: string; body?: string; badge?: { b: string; t?: Tone }; progress?: number }[]; span?: 2 }
  | { kind: "list"; title: string; desc?: string; items: { title: string; meta?: string; badge?: { b: string; t?: Tone } }[]; span?: 2 }
  | { kind: "week"; title: string; desc?: string; days: { day: string; items: { time: string; label: string; meta?: string; tone?: Tone }[] }[]; span?: 2 }
  | { kind: "form"; title: string; desc?: string; fields: { label: string; value?: string; wide?: boolean }[]; submit: string; span?: 2 }
  | { kind: "chat"; title: string; desc?: string; messages: { from: string; me?: boolean; text: string; at: string }[]; span?: 2 }
  | { kind: "note"; title: string; text: string; tone?: Tone; span?: 2 };

export interface PreviewSpec {
  /** Mô tả ngắn dưới tiêu đề */
  intro: string;
  /** Nút thao tác chính (chỉ minh họa) */
  actions?: string[];
  kpis?: { label: string; value: string | number; hint?: string }[];
  /** Bộ lọc minh họa (năm học, trường, khối…) */
  filters?: string[];
  blocks: Block[];
}
