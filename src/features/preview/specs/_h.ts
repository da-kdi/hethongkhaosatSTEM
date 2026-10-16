import type { Tone } from "../types";
/** Huy hiệu ngắn gọn cho ô bảng */
export const b = (text: string, t: Tone = "default") => ({ b: text, t });
export const ok = (text: string) => b(text, "success");
export const warn = (text: string) => b(text, "warning");
export const bad = (text: string) => b(text, "danger");
export const mute = (text: string) => b(text, "muted");
export const pct = (p: number) => ({ p });
