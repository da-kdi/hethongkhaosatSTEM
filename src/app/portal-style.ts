import type { Portal } from "@/domain/roles";

/** Màu nhận diện ngữ cảnh — giúp người nhiều vai trò luôn biết mình đang ở "cổng" nào. */
export const PORTAL_STYLE: Record<Portal, { chip: string; dot: string }> = {
  platform: { chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", dot: "bg-slate-500" },
  so: { chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200", dot: "bg-indigo-500" },
  truong: { chip: "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200", dot: "bg-teal-600" },
  to: { chip: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200", dot: "bg-cyan-600" },
  gv: { chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", dot: "bg-emerald-600" },
  hs: { chip: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200", dot: "bg-amber-500" },
  ph: { chip: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200", dot: "bg-rose-500" },
  ncc: { chip: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200", dot: "bg-violet-500" },
};
