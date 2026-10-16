import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { actions } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { COLUMNS, templateTable, type ExchangeKind, type ImportPlan } from "@/domain/exchange";
import { downloadXlsx, readSpreadsheet } from "@/lib/spreadsheet";
import { PageHeader, Section, Stat, TableWrap, td, th } from "@/components/layout/page";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ExchangeKind, string> = { students: "Học sinh", teachers: "Giáo viên" };
const SHOW_ERRORS = 200;

/** Phân hệ 4 · Nhập/xuất hồ sơ theo tên kỹ thuật QĐ 2768 (mirror RPC org.import_* / org.log_export). */
export function ExchangePage({ access }: { access: AccessContext }) {
  const [kind, setKind] = useState<ExchangeKind>("students");
  const [file, setFile] = useState<{ name: string; table: string[][]; plan: ImportPlan } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const canImport = access.has("org.person.manage");
  const canExport = access.has("report.export");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const pick = (f: File | undefined) => f && run(async () => {
    const table = await readSpreadsheet(f);
    setFile({ name: f.name, table, plan: actions.planImport(kind, table) });
  });

  const commit = () => file && run(async () => {
    const plan = actions.commitImport(kind, file.table, file.name);
    toast.success(`Đã nhập ${plan.created} hồ sơ mới, cập nhật ${plan.updated}`);
    setFile(null);
  });

  const exportNow = () => run(async () => {
    const table = actions.exportRecords(kind);
    await downloadXlsx(table, KIND_LABEL[kind], `ho-so-${kind === "students" ? "hoc-sinh" : "giao-vien"}.xlsx`);
    toast.success(`Đã xuất ${table.length - 2} dòng`);
  });

  const plan = file?.plan;
  return (
    <div>
      <PageHeader
        title="Nhập/xuất hồ sơ"
        description="Tệp Excel (.xlsx) hoặc CSV. Dòng 1 là tên kỹ thuật theo QĐ 2768/QĐ-BGDĐT, dòng 2 (tùy chọn) là tên nghiệp vụ. Hệ thống kiểm tra toàn bộ tệp trước; chỉ ghi khi không còn lỗi."
      />

      <div role="tablist" aria-label="Loại hồ sơ" className="mb-4 inline-flex rounded-lg border p-1">
        {(Object.keys(KIND_LABEL) as ExchangeKind[]).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setFile(null); }}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Cột dữ liệu" description="* bắt buộc. Cột không nhận diện được sẽ bị bỏ qua.">
          <TableWrap>
              <thead><tr><th className={th}>Tên kỹ thuật</th><th className={th}>Ý nghĩa</th></tr></thead>
              <tbody>
                {COLUMNS[kind].map((c) => (
                  <tr key={c.key}>
                    <td className={cn(td, "font-mono text-xs")}>{c.key}{c.required ? " *" : ""}</td>
                    <td className={cn(td, "min-w-44 whitespace-normal")}>
                      {c.term ? <Term code={c.term}>{c.label}</Term> : c.label}
                      {c.hint && <div className="text-xs text-muted-foreground">{c.hint}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
          </TableWrap>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => run(() => downloadXlsx(templateTable(kind), KIND_LABEL[kind], `mau-${kind === "students" ? "hoc-sinh" : "giao-vien"}.xlsx`))}>
              <FileSpreadsheet /> Tải tệp mẫu
            </Button>
            {canExport && <Button variant="outline" disabled={busy} onClick={exportNow}><Download /> Xuất dữ liệu hiện có</Button>}
          </div>
          {canExport && <p className="mt-2 text-xs text-muted-foreground">Xuất trong phạm vi được xem; ngày sinh, số điện thoại chỉ có khi bạn có quyền xem dữ liệu cá nhân. Mỗi lần xuất được ghi nhật ký.</p>}
        </Section>

        <Section title="Nhập tệp" description={canImport ? "Bước 1: chọn tệp → Bước 2: xem kết quả kiểm tra → Bước 3: ghi dữ liệu." : "Vai trò này chỉ được xuất dữ liệu."}>
          {canImport ? (
            <>
              <input ref={input} type="file" accept=".xlsx,.csv" className="sr-only" aria-label="Chọn tệp nhập"
                onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              <Button disabled={busy} onClick={() => input.current?.click()}><Upload /> Chọn tệp .xlsx / .csv</Button>
              {file && plan && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm"><span className="font-medium">{file.name}</span> · {plan.total} dòng dữ liệu</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Thêm mới" value={plan.errors.length ? "—" : plan.created} />
                    <Stat label="Cập nhật" value={plan.errors.length ? "—" : plan.updated} />
                    <Stat label="Lỗi" value={<span className={plan.errors.length ? "text-destructive" : ""}>{plan.errors.length}</span>} />
                  </div>
                  {plan.warnings.map((w) => (
                    <p key={w} className="flex gap-2 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="size-4 shrink-0" aria-hidden />{w}</p>
                  ))}
                  {plan.errors.length > 0 ? (
                    <>
                      <p className="text-sm text-destructive">Chưa ghi dữ liệu nào. Sửa các dòng dưới đây trong tệp rồi chọn lại tệp.</p>
                      <TableWrap>
                          <thead><tr><th className={th}>Dòng</th><th className={th}>Cột</th><th className={th}>Lỗi</th></tr></thead>
                          <tbody>
                            {plan.errors.slice(0, SHOW_ERRORS).map((e, i) => (
                              <tr key={i}><td className={td}>{e.row}</td><td className={cn(td, "font-mono text-xs")}>{e.column ?? "—"}</td><td className={cn(td, "min-w-48 whitespace-normal")}>{e.message}</td></tr>
                            ))}
                          </tbody>
                      </TableWrap>
                      {plan.errors.length > SHOW_ERRORS && <p className="text-xs text-muted-foreground">Hiển thị {SHOW_ERRORS}/{plan.errors.length} lỗi đầu tiên.</p>}
                    </>
                  ) : plan.total > 0 ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4" aria-hidden />Tệp hợp lệ.</p>
                      <Button disabled={busy} onClick={commit}>Ghi {plan.total} dòng</Button>
                      <Button variant="ghost" onClick={() => setFile(null)}>Hủy</Button>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Tệp không có dòng dữ liệu.</p>}
                </div>
              )}
            </>
          ) : null}
        </Section>
      </div>
    </div>
  );
}
