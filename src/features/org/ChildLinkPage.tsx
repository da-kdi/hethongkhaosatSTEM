import { useState, type FormEvent } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { actions, TODAY, useStore } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { myLinks, RELATION_LABEL } from "@/domain/guardian";
import { Empty, PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

/** W8 · Phụ huynh nhập mã mời do trường phát để liên kết với con. */
export function ChildLinkPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const links = myLinks(ds, access, TODAY);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = actions.redeemGuardianCode(code);
      setError(undefined);
      setCode("");
      toast.success(r.status === "VERIFIED" ? `Đã liên kết với ${r.studentName}` : `Đã gửi yêu cầu liên kết với ${r.studentName} — chờ nhà trường xác nhận`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="Liên kết với con" description="Nhập mã mời 8 ký tự nhà trường gửi (phiếu giấy hoặc sổ liên lạc). Mỗi mã dùng một lần cho một học sinh." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Section title="Nhập mã mời">
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Mã mời</span>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: ABCD-2345" autoComplete="off"
                maxLength={12} className="font-mono tracking-widest" aria-invalid={!!error} />
            </label>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={code.replace(/[^A-Z0-9]/gi, "").length !== 8}><Link2 /> Liên kết</Button>
            <p className="text-xs text-muted-foreground">
              Nếu số điện thoại đăng nhập của bạn trùng số nhà trường ghi nhận, liên kết có hiệu lực ngay. Nếu không, nhà trường sẽ xác nhận.
              Nhập sai 5 lần trong 24 giờ sẽ bị tạm khóa.
            </p>
          </form>
        </Section>
        <Section title="Liên kết của bạn">
          {links.length === 0 ? <Empty title="Chưa có liên kết" /> : (
            <ul className="grid gap-2">
              {links.map((r) => (
                <li key={r.link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{r.studentName ?? "Học sinh (chờ nhà trường xác nhận)"}</div>
                    <div className="text-xs text-muted-foreground">
                      {RELATION_LABEL[r.link.relation]}{r.className ? ` · Lớp ${r.className}` : ""}{r.active ? ` · Hiệu lực đến ${fmt(r.link.expiresAt)}` : ""}
                    </div>
                  </div>
                  {r.active ? <Badge variant="success">Đã xác minh</Badge>
                    : r.link.status === "PENDING" ? <Badge variant="warning">Chờ xác nhận</Badge>
                    : <Badge variant="muted">{r.link.status === "REVOKED" ? "Đã thu hồi" : "Hết hạn"}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
