import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { canEditProvider, PROVIDER_FIELDS, type ProviderInput } from "@/domain/provider";
import { Field } from "@/components/form";
import { PageHeader, Section } from "@/components/layout/page";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Hồ sơ nhà cung cấp — QTV NCC tự cập nhật; Sở/trường xem khi lựa chọn đối tác, cấp quyền dữ liệu. */
export function ProviderProfilePage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const unit = ds.units.find((u) => u.id === access.scopeUnit.id)!;
  const p = ds.providerProfiles.find((x) => x.unitId === unit.id);
  const editable = canEditProvider(access);
  const [f, setF] = useState<ProviderInput>(() => ({
    name: unit.name, maDinhDanhToChuc: p?.maDinhDanhToChuc ?? "", loaiToChuc: p?.loaiToChuc ?? "", address: p?.address ?? "",
    website: p?.website ?? "", contactName: p?.contactName ?? "", contactEmail: p?.contactEmail ?? "", contactPhone: p?.contactPhone ?? "",
    fields: p?.fields ?? [], description: p?.description ?? "",
  }));
  const [error, setError] = useState<string>();
  const set = (k: keyof ProviderInput) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      actions.upsertProviderProfile(f);
      setError(undefined);
      toast.success("Đã lưu hồ sơ");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="Hồ sơ nhà cung cấp"
        description={`Thông tin tổ chức hiển thị cho Sở và các trường khi lựa chọn đối tác, cấp quyền dữ liệu.${p?.updatedAt ? ` Cập nhật lần cuối ${new Date(p.updatedAt).toLocaleDateString("vi-VN")}.` : ""}`} />
      <form onSubmit={submit}>
        <fieldset disabled={!editable} className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Section title="Thông tin tổ chức">
            <div className="grid gap-3">
              <Field label="Tên đơn vị"><Input value={f.name} onChange={set("name")} required /></Field>
              <Field label={<Term code="BG_00420">Mã định danh tổ chức</Term>} hint="Mã định danh/mã số thuế do cơ quan có thẩm quyền cấp">
                <Input value={f.maDinhDanhToChuc} onChange={set("maDinhDanhToChuc")} maxLength={35} />
              </Field>
              <Field label={<Term code="BG_00811">Loại tổ chức</Term>}><Input value={f.loaiToChuc} onChange={set("loaiToChuc")} placeholder="VD: Doanh nghiệp giáo dục" /></Field>
              <Field label="Địa chỉ"><Input value={f.address} onChange={set("address")} /></Field>
              <Field label="Website"><Input value={f.website} onChange={set("website")} placeholder="https://" /></Field>
            </div>
          </Section>
          <Section title="Liên hệ & lĩnh vực">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Người liên hệ"><Input value={f.contactName} onChange={set("contactName")} /></Field>
                <Field label="Điện thoại"><Input inputMode="tel" value={f.contactPhone} onChange={set("contactPhone")} /></Field>
              </div>
              <Field label="Email"><Input type="email" value={f.contactEmail} onChange={set("contactEmail")} /></Field>
              <div className="grid gap-1 text-sm">
                <span className="font-medium">Lĩnh vực STEM</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lĩnh vực STEM">
                  {PROVIDER_FIELDS.map((x) => {
                    const on = f.fields.includes(x);
                    return (
                      <button key={x} type="button" aria-pressed={on}
                        onClick={() => setF({ ...f, fields: on ? f.fields.filter((y) => y !== x) : [...f.fields, x] })}
                        className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                        {x}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Giới thiệu ngắn"><Textarea value={f.description} onChange={set("description")} maxLength={1000} rows={4} /></Field>
            </div>
          </Section>
        </fieldset>
        {error && <p role="alert" className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {editable && <div className="mt-4"><Button type="submit">Lưu hồ sơ</Button></div>}
      </form>
    </div>
  );
}
