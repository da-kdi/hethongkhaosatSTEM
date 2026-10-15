import { useState } from "react";
import { ChevronDown, EyeOff, Pencil, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import { studentsOfClass, teachersOfClass, visibleClasses } from "@/app/queries";
import { schoolOfUnit, type AccessContext } from "@/domain/access";
import type { ClassRoom, Dataset } from "@/domain/model";
import { GENDER_ISO_5218 } from "@/domain/dictionary/mapping";
import { Field, FormDialog, selectCls } from "@/components/form";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ClassForm = { id?: string; name: string; grade: string; maLop: string; departmentId: string; homeroomPersonId: string };
type StudentForm = { personId?: string; classId: string; fullName: string; gender: "" | "NAM" | "NU"; birthDate: string; studentCode: string };

const STATUS_LABEL = { STUDYING: "Đang học", TRANSFERRED: "Chuyển trường", GRADUATED: "Đã tốt nghiệp" } as const;

export function ClassesPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const classes = visibleClasses(ds, access).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
  const [open, setOpen] = useState<string | null>(classes[0]?.id ?? null);
  const [classForm, setClassForm] = useState<ClassForm | null>(null);
  const [studentForm, setStudentForm] = useState<StudentForm | null>(null);
  const portal = access.role.portal;
  const title = portal === "gv" ? "Lớp của tôi" : portal === "to" ? "Lớp & giáo viên của tổ" : "Lớp & học sinh";
  const school = portal === "truong" ? schoolOfUnit(ds, access.scopeUnit.id) : undefined;
  const canClass = !!school && access.has("org.class.manage");
  const canStudent = !!school && access.has("org.person.manage");

  const editClass = (c?: ClassRoom) => setClassForm(c
    ? { id: c.id, name: c.name, grade: String(c.grade), maLop: c.maLop ?? "", departmentId: c.departmentId ?? "", homeroomPersonId: c.homeroomPersonId ?? "" }
    : { name: "", grade: "6", maLop: "", departmentId: "", homeroomPersonId: "" });

  return (
    <div>
      <PageHeader
        title={title}
        description={
          access.has("org.person.personal")
            ? "Bạn có quyền xem dữ liệu cá nhân chi tiết của học sinh trong phạm vi trường."
            : "Ngày sinh và số điện thoại được ẩn — vai trò này chỉ thấy thông tin cần cho giảng dạy."
        }
        actions={canClass ? <Button onClick={() => editClass()}><Plus /> Thêm lớp</Button> : undefined}
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
                  <div className="flex items-center gap-1">
                    {canStudent && (
                      <Button size="sm" variant="ghost" onClick={() => { setOpen(c.id); setStudentForm({ classId: c.id, fullName: "", gender: "", birthDate: "", studentCode: "" }); }}>
                        <UserPlus /> <span className="hidden sm:inline">Học sinh</span>
                      </Button>
                    )}
                    {canClass && <Button size="icon" variant="ghost" aria-label={`Sửa lớp ${c.name}`} onClick={() => editClass(c)}><Pencil /></Button>}
                    <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="rounded-md p-1 hover:bg-muted" aria-label={isOpen ? "Thu gọn" : "Mở rộng"}>
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>
                }
                className={cn(!isOpen && "[&>div]:hidden")}
              >
                {students.length === 0 ? <Empty title="Lớp chưa có học sinh" /> : (
                  <TableWrap>
                    <thead>
                      <tr>
                        <th className={th}>Mã HS</th>
                        <th className={th}><Term code="BG_00007">Họ và tên</Term></th>
                        <th className={th}><Term code="BG_00010">Giới tính</Term></th>
                        <th className={th}><Term code="BG_00009">Ngày sinh</Term></th>
                        <th className={th}><Term code="BG_00043">Điện thoại</Term></th>
                        {canStudent && <th className={th}><Term code="BG_00090">Trạng thái</Term></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(({ enrollment, person }) => {
                        const personal = access.canSeePersonal(person.id);
                        return (
                          <tr key={person.id}>
                            <td className={`${td} font-mono text-xs`}>{enrollment.studentCode}</td>
                            <td className={td}>
                              {canStudent ? (
                                <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setStudentForm({
                                  personId: person.id, classId: c.id, fullName: person.fullName, gender: person.gender ?? "", birthDate: person.birthDate ?? "", studentCode: enrollment.studentCode,
                                })}>{person.fullName}</button>
                              ) : person.fullName}
                            </td>
                            <td className={td} title={person.gender ? `gioiTinh = ${GENDER_ISO_5218[person.gender]} (ISO/IEC 5218)` : undefined}>{person.gender === "NU" ? "Nữ" : person.gender === "NAM" ? "Nam" : "—"}</td>
                            <td className={td}>{personal ? person.birthDate : <Hidden />}</td>
                            <td className={td}>{personal ? person.phone ?? "—" : <Hidden />}</td>
                            {canStudent && (
                              <td className={td}>
                                <select aria-label={`Trạng thái của ${person.fullName}`} className="h-8 rounded-md border bg-background px-1.5 text-xs" value={enrollment.status}
                                  onChange={(e) => {
                                    const st = e.target.value as keyof typeof STATUS_LABEL;
                                    try { actions.setStudentStatus(person.id, st); toast.success(`${person.fullName}: ${STATUS_LABEL[st]}`); } catch (err) { toast.error((err as Error).message); }
                                  }}>
                                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableWrap>
                )}
              </Section>
            );
          })}
        </div>
      )}

      {classForm && school && <ClassDialog ds={ds} schoolId={school.id} form={classForm} setForm={setClassForm} />}
      {studentForm && school && <StudentDialog ds={ds} schoolId={school.id} form={studentForm} setForm={setStudentForm} />}
    </div>
  );
}

function ClassDialog({ ds, schoolId, form, setForm }: { ds: Dataset; schoolId: string; form: ClassForm; setForm: (f: ClassForm | null) => void }) {
  const depts = ds.units.filter((u) => u.parentId === schoolId && u.type === "TO" && u.status === "ACTIVE");
  const schoolUnits = new Set([schoolId, ...ds.units.filter((u) => u.parentId === schoolId).map((u) => u.id)]);
  const teachers = ds.staff.filter((s) => schoolUnits.has(s.unitId)).map((s) => ds.persons.find((p) => p.id === s.personId)!);
  const grades = ds.catalog.values.filter((v) => v.listCode === "khoi" && !v.deprecated);
  return (
    <FormDialog open onOpenChange={(v) => !v && setForm(null)} title={form.id ? `Sửa lớp ${form.name}` : "Thêm lớp"} description="Lớp thuộc năm học hiện hành."
      onSubmit={() => {
        actions.upsertClass({ id: form.id, schoolId, name: form.name, grade: Number(form.grade), maLop: form.maLop, departmentId: form.departmentId || undefined, homeroomPersonId: form.homeroomPersonId || undefined });
        return form.id ? "Đã cập nhật lớp" : `Đã thêm lớp ${form.name}`;
      }}>
      <Field label={<Term code="BG_00505">Tên lớp</Term>}>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={20} autoFocus placeholder="vd. 6A2" />
      </Field>
      <Field label={<Term code="BG_00504">Mã lớp</Term>}>
        <Input value={form.maLop} onChange={(e) => setForm({ ...form, maLop: e.target.value })} maxLength={20} />
      </Field>
      <Field label={<Term code="BG_00506">Khối</Term>} hint="Theo danh mục Khối">
        <select className={selectCls} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
          {grades.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
        </select>
      </Field>
      <Field label="Tổ quản lý">
        <select className={selectCls} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">—</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field label={<Term code="BG_00311">Giáo viên chủ nhiệm</Term>} className="sm:col-span-2">
        <select className={selectCls} value={form.homeroomPersonId} onChange={(e) => setForm({ ...form, homeroomPersonId: e.target.value })}>
          <option value="">—</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
        </select>
      </Field>
    </FormDialog>
  );
}

function StudentDialog({ ds, schoolId, form, setForm }: { ds: Dataset; schoolId: string; form: StudentForm; setForm: (f: StudentForm | null) => void }) {
  const classes = ds.classes.filter((c) => c.schoolId === schoolId).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
  return (
    <FormDialog open onOpenChange={(v) => !v && setForm(null)} title={form.personId ? "Sửa hồ sơ học sinh" : "Thêm học sinh"}
      description="Đổi lớp trong cùng trường bằng ô Lớp. Chuyển trường/tốt nghiệp dùng cột Trạng thái."
      onSubmit={() => {
        actions.upsertStudent({ ...form, gender: form.gender || undefined });
        return form.personId ? "Đã cập nhật hồ sơ" : `Đã thêm ${form.fullName}`;
      }}>
      <Field label={<Term code="BG_00007">Họ và tên</Term>} className="sm:col-span-2">
        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required maxLength={120} autoFocus />
      </Field>
      <Field label="Mã học sinh" hint="3–30 ký tự: chữ, số, - _">
        <Input value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} required maxLength={30} />
      </Field>
      <Field label={<Term code="BG_00505">Lớp</Term>}>
        <select className={selectCls} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label={<Term code="BG_00010">Giới tính</Term>}>
        <select className={selectCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as StudentForm["gender"] })}>
          <option value="">—</option><option value="NAM">Nam</option><option value="NU">Nữ</option>
        </select>
      </Field>
      <Field label={<Term code="BG_00009">Ngày sinh</Term>}>
        <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
      </Field>
    </FormDialog>
  );
}

function Hidden() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Cần quyền xem dữ liệu cá nhân">
      <EyeOff className="size-3" aria-hidden /> Ẩn
    </span>
  );
}
