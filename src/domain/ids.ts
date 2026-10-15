/**
 * UUID có tính quyết định cho dữ liệu demo — để frontend demo và seed SQL dùng chung id.
 * Chữ số đầu = loại thực thể, 12 số cuối = số thứ tự.
 */
const PREFIX = {
  unit: "1",
  cls: "2",
  person: "3",
  account: "4",
  assign: "5",
  link: "6",
  grant: "7",
  setting: "8",
  year: "9",
} as const;

export type IdKind = keyof typeof PREFIX;

export function did(kind: IdKind, n: number): string {
  const tail = String(n).padStart(12, "0");
  return `${PREFIX[kind]}0000000-0000-4000-8000-${tail}`;
}
