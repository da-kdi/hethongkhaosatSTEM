import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AccessContext } from "@/domain/access";
import { FIELD_MAPPINGS } from "@/domain/dictionary/mapping";
import type { Dictionary } from "@/domain/dictionary/types";
import { Empty, PageHeader, Section, Stat, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE = 50;

/** Chuẩn hóa để tìm không dấu: "Cơ sở" ~ "co so" */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

const usage = new Map<string, string[]>();
for (const m of FIELD_MAPPINGS) for (const t of m.terms) usage.set(t, [...(usage.get(t) ?? []), `${m.table}.${m.column}`]);

export function DictionaryPage(_: { access: AccessContext }) {
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [onlyUsed, setOnlyUsed] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    import("@/domain/dictionary/qd2768.json")
      .then((m) => alive && setDict(m.default as unknown as Dictionary))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (!dict) return [];
    const k = fold(q.trim());
    return dict.terms.filter((t) =>
      (!domain || t.domains.includes(domain)) &&
      (!onlyUsed || usage.has(t.code)) &&
      (!k || fold(`${t.code} ${t.name} ${t.technicalName}`).includes(k)));
  }, [dict, q, domain, onlyUsed]);

  useEffect(() => setLimit(PAGE), [q, domain, onlyUsed]);

  return (
    <div>
      <PageHeader
        title="Từ điển dữ liệu ngành"
        description="Từ điển dữ liệu dùng chung ngành giáo dục và đào tạo, phiên bản 1.0 (QĐ 2768/QĐ-BGDĐT ngày 18/9/2026). Hệ thống dùng tên kỹ thuật chuẩn khi import/export, tích hợp và báo cáo."
      />
      {error ? <Empty title="Không tải được từ điển">Tải lại trang để thử lại.</Empty> : !dict ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Đang tải 892 thuật ngữ…</div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Miền dữ liệu" value={dict.domains.length} hint="Phụ lục 01 · MOET01–41" />
            <Stat label="Thuật ngữ" value={dict.terms.length} hint="Phụ lục 02 · BG_00001–00892" />
            <Stat label="Thuật ngữ hệ thống đang dùng" value={usage.size} hint={`${FIELD_MAPPINGS.length} cột đã ánh xạ`} />
            <Stat label="Có mã cốt lõi quốc gia" value={dict.terms.filter((t) => t.coreCode).length} hint="CDE-… (QĐ 2439/QĐ-TTg)" />
          </div>
          <p className="rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Lưu ý: văn bản chỉ định nghĩa thuật ngữ và kiểu dữ liệu, <strong>chưa ban hành danh sách giá trị</strong> cho các trường kiểu danh mục
            (cấp học, loại hình, khối, môn học…). Hệ thống tạm dùng giá trị nội bộ và đánh dấu ánh xạ “cần quy đổi”.
          </p>

          <Section
            title={`${rows.length} thuật ngữ`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã, tên kỹ thuật…" className="h-8 w-52" aria-label="Tìm thuật ngữ" />
                <select value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Miền dữ liệu" className="h-8 max-w-56 rounded-md border bg-background px-2 text-sm">
                  <option value="">Mọi miền dữ liệu</option>
                  {dict.domains.filter((d) => d.level === 3).map((d) => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={onlyUsed} onChange={(e) => setOnlyUsed(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                  Chỉ thuật ngữ đang dùng
                </label>
              </div>
            }
          >
            {rows.length === 0 ? <Empty title="Không có thuật ngữ phù hợp" /> : (
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <th className={th}>Mã</th>
                      <th className={th}>Tên nghiệp vụ · định nghĩa</th>
                      <th className={th}>Tên kỹ thuật</th>
                      <th className={th}>Kiểu</th>
                      <th className={th}>Miền</th>
                      <th className={th}>Dùng tại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, limit).map((t) => (
                      <tr key={t.code}>
                        <td className={`${td} font-mono text-xs whitespace-nowrap`}>{t.code}</td>
                        <td className={`${td} max-w-md`}>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.definition}</div>
                        </td>
                        <td className={`${td} font-mono text-xs`}>{t.technicalName}</td>
                        <td className={`${td} text-xs whitespace-nowrap`}>
                          {t.dataTypeVi}{t.length ? ` (${t.length})` : ""}
                          {t.coreCode && <div className="text-muted-foreground">{t.coreCode}</div>}
                        </td>
                        <td className={`${td} font-mono text-xs`}>{t.domains.join(", ")}</td>
                        <td className={td}>
                          {usage.get(t.code)?.map((u) => <Badge key={u} variant="success" className="mb-1 mr-1 font-mono">{u}</Badge>) ?? <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                {rows.length > limit && (
                  <div className="mt-3 text-center">
                    <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + PAGE)}>Xem thêm ({rows.length - limit})</Button>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="Ánh xạ cột của hệ thống" description="Trạng thái “cần quy đổi”: cùng nghĩa nhưng giá trị nội bộ khác chuẩn (chờ danh mục chính thức).">
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Bảng.cột</th>
                  <th className={th}>Thuật ngữ</th>
                  <th className={th}>Trạng thái</th>
                  <th className={th}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_MAPPINGS.map((m) => (
                  <tr key={`${m.table}.${m.column}`}>
                    <td className={`${td} font-mono text-xs`}>{m.table}.{m.column}</td>
                    <td className={`${td} text-xs`}>
                      {m.terms.map((c) => {
                        const t = dict.terms.find((x) => x.code === c);
                        return <div key={c}><span className="font-mono">{t?.technicalName}</span> <span className="text-muted-foreground">({c})</span></div>;
                      })}
                    </td>
                    <td className={td}>{m.status === "EXACT" ? <Badge variant="success">Khớp</Badge> : <Badge variant="warning">Cần quy đổi</Badge>}</td>
                    <td className={`${td} max-w-sm text-xs text-muted-foreground`}>{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>
        </div>
      )}
    </div>
  );
}
