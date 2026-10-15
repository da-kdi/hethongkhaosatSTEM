import { useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { parseCodeCsv, SOURCE_LABEL, type CatalogSource, type ParseResult } from "@/domain/catalog";
import { Empty, PageHeader, Section, Stat, TableWrap, td, th } from "@/components/layout/page";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOURCE_VARIANT: Record<CatalogSource, "success" | "default" | "warning"> = {
  CSDL_NGANH: "success",
  ISO_5218: "default",
  NOI_BO_TAM: "warning",
};

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—");

export function CatalogPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const cat = ds.catalog;
  const [selected, setSelected] = useState(cat.lists[0]?.code ?? "");
  const canImport = access.role.scope === "PLATFORM" && access.has("cfg.catalog.manage");
  const list = cat.lists.find((l) => l.code === selected);
  const values = cat.values.filter((x) => x.listCode === selected);
  const maps = cat.maps.filter((m) => m.listCode === selected);
  const official = cat.lists.filter((l) => l.source !== "NOI_BO_TAM").length;
  const brokenMaps = cat.maps.filter((m) => cat.values.find((x) => x.listCode === m.listCode && x.code === m.code)?.deprecated).length;

  return (
    <div>
      <PageHeader
        title="Danh mục dùng chung"
        description="Giá trị chuẩn cho các trường kiểu danh mục của Từ điển dữ liệu ngành. Nguồn chính thức: CSDL ngành của Bộ GD&ĐT. Danh mục “nội bộ tạm” sẽ được thay khi nạp file từ CSDL ngành."
      />
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Danh mục" value={cat.lists.length} />
          <Stat label="Đã có nguồn chuẩn" value={`${official}/${cat.lists.length}`} hint="CSDL ngành hoặc ISO" />
          <Stat label="Quy đổi nội bộ → chuẩn" value={cat.maps.length} hint={brokenMaps ? `${brokenMaps} trỏ tới mã đã ngừng dùng` : "Tất cả còn hiệu lực"} />
          <Stat label="Lần nạp" value={cat.batches.length} hint={cat.batches[0] ? `Gần nhất ${fmt(cat.batches[0].importedAt)}` : "Chưa nạp từ CSDL ngành"} />
        </div>

        <Section title="Danh sách danh mục" description="Chọn một danh mục để xem giá trị và bảng quy đổi.">
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Danh mục</th>
                <th className={th}>Thuật ngữ QĐ 2768</th>
                <th className={th}>Nguồn</th>
                <th className={th}>Phiên bản</th>
                <th className={`${th} text-right`}>Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {cat.lists.map((l) => {
                const vals = cat.values.filter((x) => x.listCode === l.code);
                const active = vals.filter((x) => !x.deprecated).length;
                return (
                  <tr key={l.code} className={l.code === selected ? "bg-secondary" : undefined}>
                    <td className={td}>
                      <button type="button" className="text-left font-medium text-primary underline-offset-2 hover:underline" onClick={() => setSelected(l.code)}>
                        {l.name}
                      </button>
                      {l.note && <div className="text-xs text-muted-foreground">{l.note}</div>}
                    </td>
                    <td className={`${td} text-xs`}><Term code={l.termCode}><span className="font-mono">{l.code}</span></Term> <span className="text-muted-foreground">({l.termCode})</span></td>
                    <td className={td}><Badge variant={SOURCE_VARIANT[l.source]}>{SOURCE_LABEL[l.source]}</Badge></td>
                    <td className={`${td} text-xs`}>{l.version ?? "—"}{l.syncedAt && <div className="text-muted-foreground">{fmt(l.syncedAt)}</div>}</td>
                    <td className={`${td} tabular text-right`}>{active}{vals.length > active && <span className="text-xs text-muted-foreground"> (+{vals.length - active} ngừng)</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        {list && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={`Giá trị · ${list.name}`} description={`${values.length} giá trị`}>
              {values.length === 0 ? <Empty title="Chưa có giá trị">Cần nạp file danh mục từ CSDL ngành.</Empty> : (
                <TableWrap>
                  <thead><tr><th className={th}>Mã</th><th className={th}>Tên</th><th className={th}>Trạng thái</th></tr></thead>
                  <tbody>
                    {values.map((x) => (
                      <tr key={x.code} className={x.deprecated ? "opacity-60" : undefined}>
                        <td className={`${td} font-mono text-xs`}>{x.code}</td>
                        <td className={td}>{x.name}</td>
                        <td className={td}>{x.deprecated ? <Badge variant="muted">Ngừng dùng</Badge> : <Badge variant="success">Hiệu lực</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Section>
            <Section title="Quy đổi giá trị nội bộ → mã chuẩn" description="Dùng khi xuất dữ liệu, báo cáo, tích hợp theo tên kỹ thuật QĐ 2768.">
              {maps.length === 0 ? <Empty title="Chưa có quy đổi cho danh mục này" /> : (
                <TableWrap>
                  <thead><tr><th className={th}>Cột</th><th className={th}>Giá trị nội bộ</th><th className={th}>Mã chuẩn</th></tr></thead>
                  <tbody>
                    {maps.map((m) => {
                      const target = cat.values.find((x) => x.listCode === m.listCode && x.code === m.code);
                      return (
                        <tr key={`${m.table}.${m.column}.${m.internalValue}`}>
                          <td className={`${td} font-mono text-xs`}>{m.table}.{m.column}</td>
                          <td className={td}>{m.internalValue}</td>
                          <td className={td}>
                            <span className="font-mono text-xs">{m.code}</span>
                            {target?.deprecated && <Badge variant="danger" className="ml-1">Cần cập nhật</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableWrap>
              )}
            </Section>
          </div>
        )}

        {canImport ? <ImportPanel defaultList={selected} /> : (
          <p className="text-xs text-muted-foreground">Chỉ Quản trị nền tảng được nạp danh mục mới. Các đơn vị dùng chung danh mục này.</p>
        )}

        {cat.batches.length > 0 && (
          <Section title="Lịch sử nạp">
            <TableWrap>
              <thead><tr><th className={th}>Thời gian</th><th className={th}>Danh mục</th><th className={th}>Phiên bản · nguồn</th><th className={th}>Tệp</th><th className={`${th} text-right`}>Mới / cập nhật / ngừng</th></tr></thead>
              <tbody>
                {cat.batches.map((b) => (
                  <tr key={b.id}>
                    <td className={`${td} tabular whitespace-nowrap`}>{fmt(b.importedAt)}</td>
                    <td className={`${td} font-mono text-xs`}>{b.listCode}</td>
                    <td className={`${td} text-xs`}>{b.version} · {SOURCE_LABEL[b.source]}</td>
                    <td className={`${td} text-xs`}>{b.fileName ?? "—"}</td>
                    <td className={`${td} tabular text-right`}>{b.inserted} / {b.updated} / {b.deprecated}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>
        )}
      </div>
    </div>
  );
}

function ImportPanel({ defaultList }: { defaultList: string }) {
  const { ds } = useStore();
  const [list, setList] = useState(defaultList);
  const [version, setVersion] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [parsed, setParsed] = useState<ParseResult>();
  const ready = !!parsed && parsed.errors.length === 0 && parsed.rows.length > 0 && version.trim() !== "";
  const current = ds.catalog.values.filter((x) => x.listCode === list && !x.deprecated);
  const willDeprecate = parsed ? current.filter((x) => !parsed.rows.some((r) => r.code === x.code)).length : 0;

  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) return void toast.error("Tệp lớn hơn 2 MB");
    setFileName(f.name);
    setParsed(parseCodeCsv(await f.text()));
  };

  const submit = () => {
    if (!parsed) return;
    try {
      const b = actions.importCodeList({ list, version, source: list === "gioiTinh" ? "ISO_5218" : "CSDL_NGANH", fileName,
        values: parsed.rows.map(({ code, name, validFrom, validTo }) => ({ code, name, validFrom, validTo })) });
      toast.success(`Đã nạp ${list}: ${b.inserted} mới, ${b.updated} cập nhật, ${b.deprecated} ngừng dùng`);
      setParsed(undefined);
      setFileName(undefined);
      setVersion("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không nạp được danh mục");
    }
  };

  return (
    <Section title="Nạp danh mục từ CSDL ngành" description="Tệp CSV UTF-8 (Excel: Lưu thành CSV UTF-8). Cột: mã, tên, [hiệu lực từ YYYY-MM-DD], [hiệu lực đến]. Giá trị không còn trong tệp sẽ được đánh dấu ngừng dùng, không bị xóa.">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Danh mục</span>
          <select value={list} onChange={(e) => { setList(e.target.value); setParsed(undefined); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {ds.catalog.lists.map((l) => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Phiên bản</span>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="vd. CSDL ngành 10/2026" maxLength={60} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Tệp CSV</span>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])}
            className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm file:mr-2 file:rounded file:border-0 file:bg-secondary file:px-2 file:text-sm" />
        </label>
        <Button onClick={submit} disabled={!ready}><FileUp /> Nạp</Button>
      </div>
      {parsed && (
        <div className="mt-4 grid gap-2 text-sm">
          {parsed.errors.length > 0 ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <div className="font-medium text-destructive">{parsed.errors.length} lỗi — chưa thể nạp</div>
              <ul className="mt-1 list-disc pl-5 text-xs">{parsed.errors.slice(0, 20).map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted p-3 text-xs">
              Đọc được <strong>{parsed.rows.length}</strong> giá trị. Sau khi nạp: {willDeprecate > 0 ? <strong className="text-destructive">{willDeprecate} giá trị hiện có sẽ chuyển sang ngừng dùng</strong> : "không có giá trị nào bị ngừng dùng"}.
              <div className="mt-1 text-muted-foreground">Xem trước: {parsed.rows.slice(0, 5).map((r) => `${r.code} – ${r.name}`).join(" · ")}{parsed.rows.length > 5 ? " …" : ""}</div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
