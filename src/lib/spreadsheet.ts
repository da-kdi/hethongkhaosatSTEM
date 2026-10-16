/**
 * Đọc/ghi bảng tính cho nhập/xuất hồ sơ. exceljs được tải động (chỉ khi dùng) để không làm nặng bundle chính.
 * Thay cho xlsx@0.18.5 (lỗ hổng đã công bố) — ADR-008.
 */
import { splitCsvLine } from "@/domain/catalog";

const MAX_BYTES = 5_000_000;

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as { result?: unknown; richText?: { text: string }[]; text?: string };
    if (o.richText) return o.richText.map((r) => r.text).join("");
    if ("result" in o) return cellToString(o.result);
    if (typeof o.text === "string") return o.text;
  }
  return String(v).trim();
}

/** Đọc sheet đầu tiên của .xlsx hoặc tệp .csv thành bảng chuỗi. */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  if (file.size > MAX_BYTES) throw new Error("Tệp lớn hơn 5 MB");
  if (/\.csv$/i.test(file.name)) {
    const text = (await file.text()).replace(/^﻿/, "");
    const lines = text.split(/\r?\n/);
    const first = lines.find((l) => l.trim()) ?? "";
    const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
    return lines.map((l) => splitCsvLine(l, sep));
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Chỉ nhận tệp .xlsx hoặc .csv");
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Tệp không có trang tính");
  const out: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    const vals = (row.values as unknown[]).slice(1);
    out[n - 1] = vals.map(cellToString);
  });
  return Array.from(out, (r) => r ?? []);
}

/** Ghi bảng thành .xlsx (dòng 1 tên kỹ thuật in đậm, dòng 2 tên nghiệp vụ in nghiêng) và tải về. */
export async function downloadXlsx(table: string[][], sheetName: string, fileName: string): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Hệ thống quản trị STEM";
  const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 2 }] });
  table.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).font = { italic: true, color: { argb: "FF6B7280" } };
  ws.columns.forEach((c, i) => {
    c.width = Math.min(40, Math.max(12, ...table.map((r) => (r[i] ?? "").length + 2)));
    c.numFmt = "@"; // giữ dạng văn bản: mã học sinh, số điện thoại, ngày ISO
  });
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
