import { useState } from "react";
import { Check, Copy, KeyRound, Link2Off, X } from "lucide-react";
import { toast } from "sonner";
import { actions, TODAY, useStore } from "@/app/store";
import { studentsOfClass, visibleClasses } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import { INVITE_DAYS, invitesForApprover, linksForApprover, RELATION_LABEL, type LinkRow } from "@/domain/guardian";
import type { GuardianLink } from "@/domain/model";
import { Field, FormDialog, selectCls } from "@/components/form";
import { Empty, PageHeader, Section, Stat, TableWrap, td, th } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const METHOD = { INVITE_OTP: "Mã mời + SĐT", TEACHER_APPROVAL: "Trường duyệt" } as const;
type InviteForm = { classId: string; studentPersonId: string; relation: GuardianLink["relation"]; phone: string };

/** W8 · Trường quản lý liên kết phụ huynh: phát mã mời, duyệt yêu cầu, thu hồi. */
export function GuardianLinksPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const rows = linksForApprover(ds, access, TODAY);
  const pending = rows.filter((r) => r.link.status === "PENDING");
  const active = rows.filter((r) => r.active);
  const invites = invitesForApprover(ds, access);
  const openInvites = invites.filter((i) => !i.usedAt && !i.revokedAt && i.expiresAt >= TODAY);
  const studentName = (id: string) => ds.persons.find((p) => p.id === id)?.fullName ?? "—";
  const [form, setForm] = useState<InviteForm | null>(null);
  const [issued, setIssued] = useState<{ code: string; student: string } | null>(null);

  const act = (fn: () => void, msg: string) => {
    try { fn(); toast.success(msg); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div>
      <PageHeader
        title="Liên kết phụ huynh"
        description="Trường phát mã mời dùng một lần cho từng học sinh. Phụ huynh nhập mã trong tài khoản của mình: nếu số điện thoại tài khoản khớp số trường ghi nhận thì liên kết được xác minh ngay, nếu không thì chờ trường duyệt."
        actions={<Button onClick={() => setForm({ classId: "", studentPersonId: "", relation: "ME", phone: "" })}><KeyRound /> Phát mã mời</Button>}
      />
      <div className="mb-4 grid grid-cols-3 gap-2 sm:max-w-xl">
        <Stat label="Chờ duyệt" value={pending.length} />
        <Stat label="Đang liên kết" value={active.length} />
        <Stat label="Mã mời còn hiệu lực" value={openInvites.length} />
      </div>

      <div className="grid gap-4">
        <Section title="Yêu cầu chờ duyệt" description="Kiểm tra với phụ huynh (gặp trực tiếp hoặc gọi số trong hồ sơ) trước khi duyệt.">
          {pending.length === 0 ? <Empty title="Không có yêu cầu chờ duyệt" /> : (
            <LinkTable rows={pending} actions={(r) => (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => act(() => actions.approveGuardianLink(r.link.id), "Đã duyệt liên kết")}><Check /> Duyệt</Button>
                <Button size="sm" variant="ghost" onClick={() => act(() => actions.revokeGuardianLink(r.link.id), "Đã từ chối")}><X /> Từ chối</Button>
              </div>
            )} />
          )}
        </Section>

        <Section title="Đang liên kết" description="Liên kết có hạn đến 31/8 cuối năm học; tự thu hồi khi học sinh chuyển trường hoặc tốt nghiệp.">
          {active.length === 0 ? <Empty title="Chưa có liên kết" /> : (
            <LinkTable rows={active} actions={(r) => (
              <Button size="sm" variant="ghost" onClick={() => act(() => actions.revokeGuardianLink(r.link.id), "Đã thu hồi liên kết")}><Link2Off /> Thu hồi</Button>
            )} />
          )}
        </Section>

        <Section title="Mã mời đã phát" description="Hệ thống chỉ lưu bản băm của mã; mã không xem lại được sau khi phát.">
          {invites.length === 0 ? <Empty title="Chưa phát mã mời nào" /> : (
            <TableWrap>
              <thead><tr>
                <th className={th}>Học sinh</th><th className={th}>Quan hệ</th><th className={th}>Đối chiếu SĐT</th>
                <th className={th}>Hạn dùng</th><th className={th}>Trạng thái</th><th className={th} />
              </tr></thead>
              <tbody>
                {invites.map((i) => {
                  const st = i.usedAt ? ["Đã dùng", "success"] : i.revokedAt ? ["Đã thu hồi", "muted"] : i.expiresAt < TODAY ? ["Hết hạn", "muted"] : ["Còn hiệu lực", "default"];
                  return (
                    <tr key={i.id}>
                      <td className={td}>{studentName(i.studentPersonId)}</td>
                      <td className={td}>{RELATION_LABEL[i.relation]}</td>
                      <td className={td}>{i.phone ? `•••${i.phone.slice(-3)}` : "Không — trường duyệt"}</td>
                      <td className={td}>{fmt(i.expiresAt)}</td>
                      <td className={td}><Badge variant={st[1] as "default"}>{st[0]}</Badge></td>
                      <td className={td}>{st[0] === "Còn hiệu lực" && (
                        <Button size="sm" variant="ghost" onClick={() => act(() => actions.revokeGuardianInvite(i.id), "Đã thu hồi mã")}>Thu hồi</Button>
                      )}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Section>
      </div>

      {form && (
        <FormDialog open onOpenChange={(v) => !v && setForm(null)} title="Phát mã mời liên kết" submitLabel="Phát mã"
          description={`Mã dùng một lần, hết hạn sau ${INVITE_DAYS} ngày. Mã chỉ hiển thị một lần ngay sau khi phát.`}
          onSubmit={() => {
            if (!form.studentPersonId) throw new Error("Chọn học sinh");
            const code = actions.issueGuardianInvite({ studentPersonId: form.studentPersonId, relation: form.relation, phone: form.phone || undefined });
            setIssued({ code, student: studentName(form.studentPersonId) });
            return "Đã phát mã mời";
          }}>
          <Field label="Lớp">
            <select className={selectCls} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, studentPersonId: "" })}>
              <option value="">— Chọn lớp —</option>
              {visibleClasses(ds, access).sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Học sinh">
            <select className={selectCls} value={form.studentPersonId} disabled={!form.classId} onChange={(e) => setForm({ ...form, studentPersonId: e.target.value })}>
              <option value="">— Chọn học sinh —</option>
              {form.classId && studentsOfClass(ds, access, form.classId).map(({ person }) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
            </select>
          </Field>
          <Field label="Quan hệ với học sinh">
            <select className={selectCls} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value as GuardianLink["relation"] })}>
              {Object.entries(RELATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="SĐT phụ huynh (tùy chọn)" hint="Có SĐT: xác minh tự động khi khớp tài khoản PH. Bỏ trống: trường duyệt thủ công.">
            <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" />
          </Field>
        </FormDialog>
      )}

      <Dialog open={!!issued} onOpenChange={(v) => !v && setIssued(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mã mời cho {issued?.student}</DialogTitle>
            <DialogDescription>Gửi mã này cho phụ huynh qua kênh chính thức của trường (phiếu giấy, sổ liên lạc). Đóng hộp thoại là không xem lại được.</DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border bg-muted py-4 text-center font-mono text-3xl tracking-[0.2em]" aria-label="Mã mời">{issued?.code}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => issued && navigator.clipboard?.writeText(issued.code).then(() => toast.success("Đã sao chép"), () => toast.error("Không sao chép được"))}><Copy /> Sao chép</Button>
            <Button onClick={() => setIssued(null)}>Đã ghi lại mã</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinkTable({ rows, actions: render }: { rows: LinkRow[]; actions: (r: LinkRow) => React.ReactNode }) {
  return (
    <TableWrap>
      <thead><tr>
        <th className={th}>Học sinh</th><th className={th}>Lớp</th><th className={th}>Phụ huynh</th><th className={th}>Quan hệ</th>
        <th className={th}>Cách xác minh</th><th className={th}>Hạn</th><th className={th} />
      </tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.link.id}>
            <td className={td}>{r.studentName}</td>
            <td className={td}>{r.className ?? "—"}</td>
            <td className={td}>{r.guardianName}</td>
            <td className={td}>{RELATION_LABEL[r.link.relation]}</td>
            <td className={td}>{r.link.method ? METHOD[r.link.method] : "Chờ duyệt"}</td>
            <td className={td}>{fmt(r.link.expiresAt)}</td>
            <td className={td}>{render(r)}</td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
