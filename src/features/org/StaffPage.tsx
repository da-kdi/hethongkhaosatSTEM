import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import { schoolOfUnit, subtreeIds, type AccessContext } from "@/domain/access";
import type { Dataset } from "@/domain/model";
import { Field, FormDialog, selectCls } from "@/components/form";
import { Empty, PageHeader, Section, TableWrap, td, th } from "@/components/layout/page";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TeacherForm = { personId?: string; unitId: string; fullName: string; gender: "" | "NAM" | "NU"; position: string; birthDate: string; phone: string };

function useSchool(ds: Dataset, access: AccessContext) {
  const school = schoolOfUnit(ds, access.scopeUnit.id) ?? ds.units.find((u) => u.id === access.configUnitId)!;
  const scope = subtreeIds(ds, school.id);
  const departments = ds.units.filter((u) => u.parentId === school.id && u.type === "TO");
  const teachers = ds.staff
    .filter((s) => scope.has(s.unitId))
    .map((s) => ({ s, person: ds.persons.find((p) => p.id === s.personId)!, unit: ds.units.find((u) => u.id === s.unitId)! }))
    .sort((a, b) => a.person.fullName.localeCompare(b.person.fullName, "vi"));
  return { school, departments, teachers };
}

export function StaffPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const { school, departments, teachers } = useSchool(ds, access);
  const canDept = access.has("org.unit.manage");
  const canPerson = access.has("org.person.manage");
  const canAssign = access.has("org.class.manage");
  const showPersonal = access.has("org.person.personal");

  const [dept, setDept] = useState<{ id?: string; name: string } | null>(null);
  const [teacher, setTeacher] = useState<TeacherForm | null>(null);
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const classesOf = (personId: string) => ds.teaching.filter((t) => t.personId === personId)
    .map((t) => ({ ...t, cls: ds.classes.find((c) => c.id === t.classId) }));

  return (
    <div>
      <PageHeader
        title="Giáo viên & tổ chuyên môn"
        description={`Hồ sơ cán bộ/nhà giáo, tổ chuyên môn và phân công giảng dạy của ${school.name}. Không xóa cứng: tổ được chuyển sang "ngừng hoạt động".`}
        actions={canPerson ? (
          <Button onClick={() => setTeacher({ unitId: departments.find((d) => d.status === "ACTIVE")?.id ?? school.id, fullName: "", gender: "", position: "Giáo viên", birthDate: "", phone: "" })}>
            <Plus /> Thêm giáo viên
          </Button>
        ) : undefined}
      />
      <div className="grid gap-4">
        <Section
          title={`${departments.length} tổ chuyên môn`}
          actions={canDept ? <Button size="sm" variant="outline" onClick={() => setDept({ name: "" })}><Plus /> Thêm tổ</Button> : undefined}
        >
          {departments.length === 0 ? <Empty title="Chưa có tổ chuyên môn" /> : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => {
                const members = teachers.filter((t) => t.unit.id === d.id).length;
                const classes = ds.classes.filter((c) => c.departmentId === d.id).length;
                return (
                  <li key={d.id} className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium">{d.name}</div>
                      <div className="tabular text-xs text-muted-foreground">{members} giáo viên · {classes} lớp</div>
                      {d.status === "INACTIVE" && <Badge variant="muted" className="mt-1">Ngừng hoạt động</Badge>}
                    </div>
                    {canDept && (
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Đổi tên ${d.name}`} onClick={() => setDept({ id: d.id, name: d.name })}><Pencil /></Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          try {
                            actions.upsertDepartment({ id: d.id, name: d.name, status: d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
                            toast.success(d.status === "ACTIVE" ? `Đã ngừng ${d.name}` : `Đã mở lại ${d.name}`);
                          } catch (e) { toast.error((e as Error).message); }
                        }}>{d.status === "ACTIVE" ? "Ngừng" : "Mở lại"}</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title={`${teachers.length} cán bộ/nhà giáo`} description="Rê chuột lên tiêu đề cột để xem thuật ngữ chuẩn QĐ 2768.">
          {teachers.length === 0 ? <Empty title="Chưa có hồ sơ" /> : (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}><Term code="BG_00238">Họ và tên</Term></th>
                  <th className={th}>Tổ / đơn vị</th>
                  <th className={th}><Term code="BG_00326">Chức vụ</Term></th>
                  <th className={th}><Term code="BG_00297">Phân công giảng dạy</Term></th>
                  {(canPerson || canAssign) && <th className={th}><span className="sr-only">Thao tác</span></th>}
                </tr>
              </thead>
              <tbody>
                {teachers.map(({ s, person, unit }) => (
                  <tr key={`${s.personId}-${s.unitId}`}>
                    <td className={td}>
                      <div className="font-medium">{person.fullName}</div>
                      {showPersonal && person.phone && <div className="text-xs text-muted-foreground">{person.phone}</div>}
                    </td>
                    <td className={td}>{unit.type === "TO" ? unit.name : "Trực thuộc trường"}</td>
                    <td className={td}>{s.position}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {classesOf(person.id).map((t) => (
                          <Badge key={`${t.classId}-${t.subject}`} variant="outline">
                            {t.cls?.name} · {t.subject}
                            {canAssign && (
                              <button type="button" aria-label={`Bỏ phân công ${t.subject} lớp ${t.cls?.name}`} className="rounded-full hover:text-destructive"
                                onClick={() => { try { actions.setTeaching({ personId: person.id, classId: t.classId, subject: t.subject, remove: true }); } catch (e) { toast.error((e as Error).message); } }}>
                                <X className="size-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        {classesOf(person.id).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    {(canPerson || canAssign) && (
                      <td className={`${td} whitespace-nowrap text-right`}>
                        {canAssign && <Button size="sm" variant="ghost" onClick={() => setAssignFor(person.id)}><Plus /> Phân công</Button>}
                        {canPerson && (
                          <Button size="icon" variant="ghost" aria-label={`Sửa ${person.fullName}`} onClick={() => setTeacher({
                            personId: person.id, unitId: unit.id, fullName: person.fullName, gender: person.gender ?? "", position: s.position,
                            birthDate: person.birthDate ?? "", phone: person.phone ?? "",
                          })}><Pencil /></Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Section>
      </div>

      {dept && (
        <FormDialog open onOpenChange={(v) => !v && setDept(null)} title={dept.id ? "Đổi tên tổ" : "Thêm tổ chuyên môn"}
          onSubmit={() => { actions.upsertDepartment({ id: dept.id, schoolId: school.id, name: dept.name }); return dept.id ? "Đã đổi tên tổ" : "Đã thêm tổ"; }}>
          <Field label="Tên tổ" className="sm:col-span-2">
            <Input value={dept.name} onChange={(e) => setDept({ ...dept, name: e.target.value })} autoFocus required maxLength={120} placeholder="vd. Tổ Khoa học tự nhiên" />
          </Field>
        </FormDialog>
      )}

      {teacher && (
        <FormDialog open onOpenChange={(v) => !v && setTeacher(null)} title={teacher.personId ? "Sửa hồ sơ giáo viên" : "Thêm giáo viên"}
          description="Dữ liệu cá nhân (ngày sinh, điện thoại) chỉ người có quyền xem dữ liệu cá nhân mới thấy."
          onSubmit={() => {
            actions.upsertTeacher({ ...teacher, gender: teacher.gender || undefined });
            return teacher.personId ? "Đã cập nhật hồ sơ" : "Đã thêm giáo viên";
          }}>
          <Field label={<Term code="BG_00238">Họ và tên</Term>} className="sm:col-span-2">
            <Input value={teacher.fullName} onChange={(e) => setTeacher({ ...teacher, fullName: e.target.value })} required maxLength={120} autoFocus />
          </Field>
          <Field label={<Term code="BG_00010">Giới tính</Term>}>
            <select className={selectCls} value={teacher.gender} onChange={(e) => setTeacher({ ...teacher, gender: e.target.value as TeacherForm["gender"] })}>
              <option value="">—</option><option value="NAM">Nam</option><option value="NU">Nữ</option>
            </select>
          </Field>
          <Field label="Tổ / đơn vị">
            <select className={selectCls} value={teacher.unitId} onChange={(e) => setTeacher({ ...teacher, unitId: e.target.value })}>
              <option value={school.id}>Trực thuộc trường</option>
              {departments.filter((d) => d.status === "ACTIVE").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label={<Term code="BG_00326">Chức vụ</Term>} hint="Sẽ chọn theo danh mục CSDL ngành khi đã nạp">
            <Input value={teacher.position} onChange={(e) => setTeacher({ ...teacher, position: e.target.value })} maxLength={80} />
          </Field>
          <Field label={<Term code="BG_00239">Ngày sinh</Term>}>
            <Input type="date" value={teacher.birthDate} onChange={(e) => setTeacher({ ...teacher, birthDate: e.target.value })} />
          </Field>
          <Field label={<Term code="BG_00243">Điện thoại</Term>} className="sm:col-span-2">
            <Input value={teacher.phone} onChange={(e) => setTeacher({ ...teacher, phone: e.target.value })} inputMode="tel" maxLength={15} />
          </Field>
        </FormDialog>
      )}

      {assignFor && <AssignDialog ds={ds} schoolId={school.id} personId={assignFor} onClose={() => setAssignFor(null)} />}
    </div>
  );
}

function AssignDialog({ ds, schoolId, personId, onClose }: { ds: Dataset; schoolId: string; personId: string; onClose: () => void }) {
  const classes = ds.classes.filter((c) => c.schoolId === schoolId).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const name = ds.persons.find((p) => p.id === personId)?.fullName;
  return (
    <FormDialog open onOpenChange={(v) => !v && onClose()} title="Phân công giảng dạy" description={name} submitLabel="Phân công"
      onSubmit={() => { actions.setTeaching({ personId, classId, subject }); return `Đã phân công ${subject}`; }}>
      <Field label={<Term code="BG_00505">Lớp</Term>}>
        <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label={<Term code="BG_00297">Môn dạy</Term>} hint="Sẽ chọn theo danh mục môn học CSDL ngành khi đã nạp">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={80} placeholder="vd. Khoa học tự nhiên" />
      </Field>
    </FormDialog>
  );
}
