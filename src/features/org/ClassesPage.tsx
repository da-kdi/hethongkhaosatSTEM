import { useState } from "react";
import { ChevronDown, EyeOff } from "lucide-react";
import { useStore } from "@/app/store";
import { studentsOfClass, teachersOfClass, visibleClasses } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { cn } from "@/lib/utils";
import { Term } from "@/components/term";
import { GENDER_ISO_5218 } from "@/domain/dictionary/mapping";

export function ClassesPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const classes = visibleClasses(ds, access).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
  const [open, setOpen] = useState<string | null>(classes[0]?.id ?? null);
  const portal = access.role.portal;
  const title = portal === "gv" ? "Lớp của tôi" : portal === "to" ? "Lớp & giáo viên của tổ" : "Lớp & học sinh";

  return (
    <div>
      <PageHeader
        title={title}
        description={
          access.has("org.person.personal")
            ? "Bạn có quyền xem dữ liệu cá nhân chi tiết của học sinh trong phạm vi trường."
            : "Ngày sinh và số điện thoại được ẩn — vai trò này chỉ thấy thông tin cần cho giảng dạy."
        }
      />
      {classes.length === 0 ? <Empty title="Không có lớp trong phạm vi" /> : (
        <div className="grid gap-3">
          {classes.map((c) => {
            const students = studentsOfClass(ds, access, c.id);
            const teachers = teachersOfClass(ds, c.id);
            const homeroom = ds.persons.find((p) => p.id === c.homeroomPersonId);
            const isOpen = open === c.id;
            return (
              <Section
                key={c.id}
                title={`Lớp ${c.name}`}
                description={`${c.maLop ? `Mã lớp ${c.maLop} · ` : ""}${students.length} học sinh${homeroom ? ` · GVCN: ${homeroom.fullName}` : ""}${teachers.length ? ` · ${teachers.map((t) => `${t.subject}: ${t.name}`).join("; ")}` : ""}`}
                actions={
                  <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="rounded-md p-1 hover:bg-muted" aria-label={isOpen ? "Thu gọn" : "Mở rộng"}>
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                }
                className={cn(!isOpen && "[&>div]:hidden")}
              >
                <TableWrap>
                  <thead>
                    <tr>
                      <th className={th}>Mã HS</th>
                      <th className={th}><Term code="BG_00007">Họ và tên</Term></th>
                      <th className={th}><Term code="BG_00010">Giới tính</Term></th>
                      <th className={th}><Term code="BG_00009">Ngày sinh</Term></th>
                      <th className={th}><Term code="BG_00043">Điện thoại</Term></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(({ enrollment, person }) => {
                      const personal = access.canSeePersonal(person.id);
                      return (
                        <tr key={person.id}>
                          <td className={`${td} font-mono text-xs`}>{enrollment.studentCode}</td>
                          <td className={td}>{person.fullName}</td>
                          <td className={td} title={person.gender ? `gioiTinh = ${GENDER_ISO_5218[person.gender]} (ISO/IEC 5218)` : undefined}>{person.gender === "NU" ? "Nữ" : person.gender === "NAM" ? "Nam" : "—"}</td>
                          <td className={td}>{personal ? person.birthDate : <Hidden />}</td>
                          <td className={td}>{personal ? person.phone : <Hidden />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableWrap>
              </Section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Hidden() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Cần quyền xem dữ liệu cá nhân">
      <EyeOff className="size-3" aria-hidden /> Ẩn
    </span>
  );
}
