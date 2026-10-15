import { Link } from "@tanstack/react-router";
import { ChevronRight, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { TODAY, useStore } from "@/app/store";
import { aggregateForUnit, grantsOfProvider, linkedChildren, studentsOfClass, teachersOfClass, visibleClasses, visibleSchools } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import { buildMenu } from "@/domain/menu";
import type { Dataset, TodoItem } from "@/domain/model";
import { Badge } from "@/components/ui/badge";
import { Empty, PageHeader, Section, Stat } from "@/components/layout/page";
import { cn } from "@/lib/utils";
import { DeAnStepper } from "@/features/plan/DeAnProgress";

const GREETING: Record<string, string> = {
  platform: "Quản trị cấu hình nền tảng — không mặc định xem dữ liệu cá nhân.",
  so: "Toàn cảnh triển khai STEM của tỉnh. Học sinh chỉ hiển thị dưới dạng số liệu tổng hợp.",
  truong: "Điều hành hoạt động STEM của trường: kế hoạch, nhân sự, tài nguyên và báo cáo.",
  to: "Điều phối chuyên môn của tổ: kế hoạch, rà soát, học liệu.",
  gv: "Lớp bạn dạy, việc đến hạn và hoạt động STEM.",
  hs: "Lịch học, nhiệm vụ và dự án STEM của em.",
  ph: "Theo dõi quá trình học tập của con — chỉ những học sinh đã được nhà trường xác minh liên kết.",
  ncc: "Chỉ hiển thị trường và mức dữ liệu đã được cấp quyền theo hợp tác.",
};

export function OverviewPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const portal = access.role.portal;
  const todos = ds.todos.filter((t) => t.portal === portal && access.canSeeUnit(t.unitId));
  const person = ds.persons.find((p) => p.id === access.personId);

  return (
    <div>
      <PageHeader title={`Xin chào, ${person?.fullName.split(" ").at(-1)}`} description={GREETING[portal]} />
      <Kpis ds={ds} access={access} />
      <ProgressStrip ds={ds} access={access} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-6">
          <PortalBody ds={ds} access={access} />
        </div>
        <div className="grid content-start gap-6">
          <Section title="Việc cần làm" description="Ưu tiên theo mức độ và hạn xử lý">
            {todos.length === 0 ? <Empty title="Không có việc tồn đọng" /> : <TodoList items={todos} />}
          </Section>
          <Roadmap ds={ds} access={access} />
        </div>
      </div>
    </div>
  );
}

function Kpis({ ds, access }: { ds: Dataset; access: AccessContext }) {
  const p = access.role.portal;
  if (p === "so" || p === "truong" || p === "to" || p === "platform") {
    const unitId = p === "platform" ? ds.units.find((u) => u.type === "SO")!.id : access.scopeUnit.id;
    const agg = aggregateForUnit(ds, unitId);
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {p === "so" || p === "platform" ? <Stat label="Trường" value={agg.schools} hint={`${agg.departments} tổ chuyên môn`} /> : <Stat label="Tổ chuyên môn" value={agg.departments} />}
        <Stat label="Lớp" value={agg.classes} />
        <Stat label="Nhân sự" value={agg.staff} />
        <Stat label="Học sinh" value={agg.students} hint={p === "so" ? "Số liệu tổng hợp" : undefined} />
      </div>
    );
  }
  if (p === "gv") {
    const classes = visibleClasses(ds, access);
    const students = classes.reduce((n, c) => n + studentsOfClass(ds, access, c.id).length, 0);
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Lớp phụ trách" value={classes.length} />
        <Stat label="Học sinh" value={students} />
        <Stat label="Hoạt động tuần này" value="—" hint="Có ở M3" />
        <Stat label="Bài chờ chấm" value="—" hint="Có ở M7" />
      </div>
    );
  }
  if (p === "ncc") {
    const grants = grantsOfProvider(ds, access.scopeUnit.id, TODAY);
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Trường đang hợp tác" value={grants.filter((g) => g.active).length} />
        <Stat label="Quyền đã hết hạn" value={grants.filter((g) => !g.active).length} />
        <Stat label="Học liệu đã công bố" value="—" hint="Có ở M6" />
        <Stat label="Yêu cầu hỗ trợ mở" value="—" hint="Có ở M6" />
      </div>
    );
  }
  return null;
}

function PortalBody({ ds, access }: { ds: Dataset; access: AccessContext }) {
  const p = access.role.portal;
  if (p === "ph") {
    const kids = linkedChildren(ds, access);
    return (
      <Section title="Con của tôi" description="Liên kết phải được nhà trường xác minh trước khi hiển thị thông tin">
        {kids.length === 0 ? <Empty title="Chưa có liên kết nào" /> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {kids.map((k) => (
              <li key={k.link.id} className="rounded-lg border p-3">
                {k.visible ? (
                  <>
                    <div className="font-medium">{k.name}</div>
                    <div className="text-sm text-muted-foreground">Lớp {k.className} · {k.schoolName}</div>
                    <Badge variant="success" className="mt-2">Đã xác minh</Badge>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Học sinh đang chờ xác minh</div>
                    <div className="text-sm text-muted-foreground">Thông tin sẽ hiển thị sau khi giáo viên chủ nhiệm hoặc nhà trường xác minh.</div>
                    <Badge variant="warning" className="mt-2">Chờ xác minh</Badge>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    );
  }
  if (p === "hs") {
    const cls = visibleClasses(ds, access)[0];
    const school = cls && ds.units.find((u) => u.id === cls.schoolId);
    return (
      <Section title="Lớp của em">
        {cls ? (
          <div>
            <div className="text-lg font-semibold">Lớp {cls.name}</div>
            <div className="text-sm text-muted-foreground">{school?.name}</div>
            <ul className="mt-3 grid gap-1 text-sm">
              {teachersOfClass(ds, cls.id).map((t) => <li key={t.subject}>{t.subject}: <span className="text-muted-foreground">{t.name}</span></li>)}
            </ul>
          </div>
        ) : <Empty title="Chưa được xếp lớp" />}
      </Section>
    );
  }
  if (p === "gv" || p === "to") {
    const classes = visibleClasses(ds, access);
    return (
      <Section title={p === "gv" ? "Lớp tôi phụ trách" : "Lớp do tổ quản lý"}
        actions={<Link to="/$portal/$page" params={{ portal: p, page: p === "gv" ? "lop-cua-toi" : "lop-cua-to" }} className="text-xs font-medium text-primary">Xem chi tiết</Link>}>
        {classes.length === 0 ? <Empty title="Chưa được phân công lớp" /> : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="font-medium">Lớp {c.name}</span>
                <span className="tabular text-sm text-muted-foreground">{studentsOfClass(ds, access, c.id).length} HS</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    );
  }
  if (p === "so") {
    const schools = visibleSchools(ds, access);
    return (
      <Section title="Trường trong phạm vi quản lý" description="Số liệu tổng hợp — nhấp để xem danh sách đầy đủ"
        actions={<Link to="/$portal/$page" params={{ portal: "so", page: "truong-hoc" }} className="text-xs font-medium text-primary">Danh sách trường</Link>}>
        <ul className="divide-y">
          {schools.map((s) => {
            const a = aggregateForUnit(ds, s.id);
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.ward}</div>
                </div>
                <div className="tabular shrink-0 text-right text-sm text-muted-foreground">{a.classes} lớp · {a.students} HS</div>
              </li>
            );
          })}
        </ul>
      </Section>
    );
  }
  if (p === "ncc") {
    return <GrantsSummary ds={ds} access={access} />;
  }
  if (p === "truong") {
    const deps = ds.units.filter((u) => u.parentId === access.scopeUnit.id && u.type === "TO");
    return (
      <Section title="Tổ chuyên môn">
        <ul className="grid gap-2 sm:grid-cols-2">
          {deps.map((d) => {
            const classes = ds.classes.filter((c) => c.departmentId === d.id).length;
            const staff = ds.staff.filter((s) => s.unitId === d.id).length;
            return (
              <li key={d.id} className="rounded-lg border px-3 py-2">
                <div className="font-medium">{d.name}</div>
                <div className="tabular text-xs text-muted-foreground">{staff} giáo viên · {classes} lớp</div>
              </li>
            );
          })}
        </ul>
      </Section>
    );
  }
  return (
    <Section title="Đơn vị trên nền tảng">
      <p className="text-sm text-muted-foreground">{ds.units.filter((u) => u.type === "SO").length} Sở, {ds.units.filter((u) => u.type === "NCC").length} nhà cung cấp, {ds.accounts.length} tài khoản.</p>
    </Section>
  );
}

function GrantsSummary({ ds, access }: { ds: Dataset; access: AccessContext }) {
  const grants = grantsOfProvider(ds, access.scopeUnit.id, TODAY);
  return (
    <Section title="Quyền dữ liệu theo hợp tác">
      <ul className="divide-y">
        {grants.map(({ grant, school, active }) => (
          <li key={grant.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className={cn("truncate font-medium", !active && "text-muted-foreground")}>{active ? school?.name : "Trường (đã hết quyền truy cập)"}</div>
              <div className="text-xs text-muted-foreground">{grant.programCode} · đến {grant.validTo}</div>
            </div>
            <Badge variant={active ? "success" : "danger"}>{active ? "Còn hiệu lực" : "Hết hạn"}</Badge>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ProgressStrip({ ds, access }: { ds: Dataset; access: AccessContext }) {
  const p = access.role.portal;
  if ((p !== "so" && p !== "truong") || !access.has("plan.plan.view")) return null;
  const progress = ds.deAn.find((d) => d.unitId === access.scopeUnit.id);
  if (!progress) return null;
  return (
    <Section
      className="mt-6"
      title="Tiến trình đề án năm học"
      description="Dữ liệu minh họa · 5 bước triển khai"
      actions={<Link to="/$portal/$page" params={{ portal: p, page: "tien-trinh" }} className="text-xs font-medium text-primary">Xem chi tiết</Link>}
    >
      <DeAnStepper progress={progress} compact />
    </Section>
  );
}

const SEVERITY_ICON = { danger: CircleAlert, warning: TriangleAlert, info: Info } as const;
const SEVERITY_CLASS = { danger: "text-destructive", warning: "text-warning", info: "text-primary" } as const;

function TodoList({ items }: { items: TodoItem[] }) {
  const order = { danger: 0, warning: 1, info: 2 };
  return (
    <ul className="grid gap-2">
      {[...items].sort((a, b) => order[a.severity] - order[b.severity]).map((t) => {
        const Icon = SEVERITY_ICON[t.severity];
        return (
          <li key={t.id} className="flex gap-3 rounded-lg border px-3 py-2.5">
            <Icon className={cn("mt-0.5 size-4 shrink-0", SEVERITY_CLASS[t.severity])} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.detail}</div>
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          </li>
        );
      })}
    </ul>
  );
}

function Roadmap({ ds, access }: { ds: Dataset; access: AccessContext }) {
  const upcoming = buildMenu(ds, access).flatMap((g) => g.items).filter((i) => i.milestone !== "M0");
  if (!upcoming.length) return null;
  return (
    <Section title="Sắp có cho vai trò này" description="Theo lộ trình MVP">
      <ul className="grid gap-1.5 text-sm">
        {upcoming.map((i) => (
          <li key={i.slug} className="flex items-center justify-between gap-2">
            <span className="truncate">{i.label}</span>
            <Badge variant="muted">{i.milestone}</Badge>
          </li>
        ))}
      </ul>
    </Section>
  );
}
