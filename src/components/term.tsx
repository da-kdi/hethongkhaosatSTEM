import type { ReactNode } from "react";
import { CORE_TERMS } from "@/domain/dictionary/core-terms";

/**
 * Nhãn gắn với thuật ngữ chuẩn QĐ 2768/QĐ-BGDĐT.
 * Rê chuột/nhấn giữ để xem mã từ vựng và tên kỹ thuật dùng khi trao đổi dữ liệu.
 */
export function Term({ code, children }: { code: string; children?: ReactNode }) {
  const t = CORE_TERMS[code];
  return (
    <abbr
      title={t ? `${t.name}\n${code} · ${t.tech} (QĐ 2768/QĐ-BGDĐT)` : code}
      className="cursor-help no-underline decoration-dotted underline-offset-2 hover:underline"
    >
      {children ?? t?.name ?? code}
    </abbr>
  );
}
