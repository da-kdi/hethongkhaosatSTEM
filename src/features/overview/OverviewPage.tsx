import { Link } from "@tanstack/react-router";
import {
  Activity, CalendarCheck, ChartColumn, ChevronRight, CircleAlert, DoorOpen, FlaskConical, Gauge, GraduationCap, Info, ListChecks,
  Map as MapIcon, School, TriangleAlert, Trophy, Users, Zap,
} from "lucide-react";
import { TODAY, useStore } from "@/app/store";
import { aggregateForUnit, grantsOfProvider, linkedChildren, studentsOfClass, teachersOfClass, visibleClasses, visibleSchools } from "@/app/queries";
import type { AccessContext } from "@/domain/access";
import { buildMenu } from "@/domain/menu";
import type { Dataset, TodoItem } from "@/domain/model";
import { Badge } from "@/components/ui/badge";
import { Empty, Section, Stat } from "@/components/layout/page";
import { cn } from "@/lib/utils";
import { DeAnStepper } from "@/features/plan/DeAnProgress";
import { NavIcon } from "@/components/icons";
import { LEVEL_LABEL, LEVEL_RULE, PROVINCE, SCHOOL_RANKING, schoolInsight, WARDS, type Level } from "@/demo/insights";
import { Columns, Hero, HeroMetric, Meter, Ring } from "./widgets";

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
  const today = new Date(`${TODAY}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hello = `Xin chào, ${person?.fullName ?? ""}`;

  if (portal === "so" || portal === "truong") {
    return portal === "so"
      ? <SoDashboard ds={ds} access={access} hello={hello} today={today} todos={todos} />
      : <SchoolDashboard ds={ds} access={access} hello={hello} today={today} todos={todos} />;
  }

  return (
    <div>
      <Hero eyebrow={PORTAL_EYEBROW[portal]} title={hello} subtitle={`${access.scopeUnit.name} · ${today}`}>
        <p className="max-w-2xl text-sm text-white/80">{GREETING[portal]}</p>
      </Hero>
      <Kpis ds={ds} access={access} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-6">
          <PortalBody ds={ds} access={access} />
        </div>
        <div className="grid content-start gap-6">
          <Section title="Việc cần làm" description="Ưu tiên theo mức độ và hạn xử lý" icon={<ListChecks />}>
            {todos.length === 0 ? <Empty title="Không có việc tồn đọng" /> : <TodoList items={todos} />}
          </Section>
          <Roadmap ds={ds} access={access} />
        </div>
      </div>
    </div>
  );
}

const PORTAL_EYEBROW: Record<string, string> = {
  platform: "Quản trị nền tảng", so: "Bảng điều hành Sở", truong: "Bảng điều hành nhà trường", to: "Tổ chuyên môn",
  gv: "Không gian giáo viên", hs: "Góc học tập STEM", ph: "Đồng hành cùng con", ncc: "Cổng nhà cung cấp",
};

interface DashProps { ds: Dataset; access: AccessContext; hello: string; today: string; todos: TodoItem[] }

function QuickActions({ ds, access, slugs }: { ds: Dataset; access: AccessContext; slugs: string[] }) {
  const items = buildMenu(ds, access).flatMap((g) => g.items).filter((i) => slugs.includes(i.slug));
  return (
    <Section title="Thao tác nhanh" icon={<Zap />}>
      <ul className="grid gap-2">
        {items.map((i) => (
          <li key={i.slug}>
            <Link to="/$portal/$page" params={{ portal: access.role.portal, page: i.slug }}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary"><NavIcon name={i.icon} className="size-4" /></span>
              <span className="flex-1">{i.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SoDashboard({ ds, access, hello, today, todos }: DashProps) {
  return (
    <div>
      <Hero eyebrow="Bảng điều hành Sở" title={hello} subtitle={`${access.scopeUnit.name} · ${today}`}
        aside={
          <div className="flex flex-wrap gap-2.5">
            <HeroMetric value={PROVINCE.coverage} unit="%" label="Bao phủ STEM" />
            <HeroMetric value={PROVINCE.trained} unit="%" label="GV đã bồi dưỡng" />
            <HeroMetric value={PROVINCE.alerts} label="Trường cần hỗ trợ" />
          </div>
        }>
        <span className="text-sm text-white/80">Đề án đang ở <b className="text-white">Bước 3 · Đào tạo và triển khai</b> · số liệu minh họa toàn tỉnh</span>
      </Hero>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<School />} label="Cơ sở giáo dục" value={PROVINCE.schools} hint={`${PROVINCE.wards} xã/phường`} />
        <Stat icon={<FlaskConical />} tone="accent" label="Phòng STEM" value={PROVINCE.rooms} hint="đang hoạt động" delta="+8" />
        <Stat icon={<GraduationCap />} tone="success" label="GV đã bồi dưỡng" value="1.430" hint="trên 2.196 GV dạy STEM" delta="+12%" />
        <Stat icon={<CalendarCheck />} tone="info" label="Buổi STEM tháng 10" value="1.240" hint={`TB ${PROVINCE.sessionsPerWeek} buổi/trường/tuần`} delta="+44%" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <WardMap />
        <div className="grid content-start gap-5">
          <Section title="Cần xử lý" description="Việc đang chờ Sở" icon={<ListChecks />} actions={<Badge variant="danger">{todos.length}</Badge>}>
            {todos.length === 0 ? <Empty title="Không có việc tồn đọng" /> : <TodoList items={todos} />}
          </Section>
          <QuickActions ds={ds} access={access} slugs={["giao-chi-tieu", "ky-bao-cao", "canh-bao", "khao-sat", "xep-hang"]} />
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Xếp hạng chỉ số STEM theo trường" description="Thang 100 · so với kỳ trước" icon={<Trophy />}
          actions={<Link to="/$portal/$page" params={{ portal: "so", page: "xep-hang" }} className="text-xs font-semibold text-primary">Xem tất cả</Link>}>
          <ol className="grid gap-1">
            {SCHOOL_RANKING.map((r, i) => (
              <li key={r.name} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold", i < 3 ? "bg-highlight/25" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{r.name}</span><span className="text-xs text-muted-foreground">{r.ward}</span></span>
                <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block"><span className="block h-full rounded-full bg-primary" style={{ width: `${r.index}%` }} /></span>
                <span className="tabular w-8 text-right text-sm font-bold">{r.index}</span>
                <span className={cn("tabular w-9 text-right text-xs font-semibold", r.delta < 0 ? "text-destructive" : "text-success")}>{r.delta > 0 ? "+" : ""}{r.delta}</span>
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Buổi dạy STEM toàn tỉnh" description="6 tháng gần nhất" icon={<ChartColumn />}>
          <Columns data={PROVINCE.monthly} unit="buổi" />
        </Section>
      </div>
      <ProgressStrip ds={ds} access={access} />
    </div>
  );
}

const LEVEL_TILE: Record<Level, string> = {
  3: "bg-success text-white", 2: "bg-primary text-primary-foreground", 1: "bg-highlight text-highlight-foreground", 0: "bg-destructive text-white",
};

function WardMap() {
  const counts = ([3, 2, 1, 0] as Level[]).map((l) => ({ l, n: WARDS.filter((w) => w.level === l).length }));
  return (
    <Section title="Mức triển khai STEM theo xã/phường" description="Mỗi ô là một xã/phường · màu theo mức phân loại · rê chuột để xem chi tiết" icon={<MapIcon />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {WARDS.map((w) => (
              <li key={w.name} title={`${w.name} · ${w.schools} trường · bao phủ ${w.coverage}% · GV ${w.trained}% · ${LEVEL_LABEL[w.level]}`}
                className={cn("flex aspect-[4/3] flex-col justify-between rounded-lg p-1.5 text-[10px] leading-tight", LEVEL_TILE[w.level])}>
                <span className="line-clamp-2 font-semibold">{w.name.replace(/^(Phường|Xã) /, "")}</span>
                <span className="tabular text-[13px] font-bold">{w.coverage}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {counts.map(({ l, n }) => (
              <span key={l} className="flex items-center gap-1.5" title={LEVEL_RULE[l]}><span className={cn("size-2.5 rounded-sm", LEVEL_TILE[l])} />{LEVEL_LABEL[l]} · {n}</span>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-accent p-3"><div className="tabular text-xl font-bold text-primary">{PROVINCE.coverage}%</div><div className="text-[11px] text-muted-foreground">Bao phủ STEM</div></div>
            <div className="rounded-xl bg-accent p-3"><div className="tabular text-xl font-bold text-primary">{PROVINCE.trained}%</div><div className="text-[11px] text-muted-foreground">GV đã bồi dưỡng</div></div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Phòng STEM theo loại</div>
            {PROVINCE.roomsByType.map((r) => (
              <div key={r.label} className="mb-1.5 grid grid-cols-[5rem_1fr_2rem] items-center gap-2 text-xs">
                <span>{r.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-highlight" style={{ width: `${(r.value / PROVINCE.rooms) * 100}%` }} /></span>
                <span className="tabular text-right font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Trường theo cấp học</div>
            {PROVINCE.byLevel.map((r) => (
              <div key={r.label} className="mb-1.5 grid grid-cols-[5rem_1fr_2rem] items-center gap-2 text-xs">
                <span>{r.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(r.value / PROVINCE.schools) * 100}%` }} /></span>
                <span className="tabular text-right font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function SchoolDashboard({ ds, access, hello, today, todos }: DashProps) {
  const school = access.scopeUnit;
  const si = schoolInsight(school.id);
  const agg = aggregateForUnit(ds, school.id);
  const use = Math.round((si.periodsWeek.used / si.periodsWeek.available) * 100);
  return (
    <div>
      <Hero eyebrow="Bảng điều hành nhà trường" title={hello} subtitle={`${school.name} · ${today}`}
        aside={
          <div className="grid gap-2.5 sm:grid-cols-[auto_auto_minmax(0,16rem)]">
            <HeroMetric value={si.index} unit={`/100 · ${si.grade}`} label="Chỉ số STEM" />
            <HeroMetric value={use} unit="%" label={`Sử dụng phòng · ${si.periodsWeek.used}/${si.periodsWeek.available} tiết`} />
            <div className="rounded-xl bg-white/12 px-3.5 py-2.5 ring-1 ring-white/15">
              <div className="flex items-center justify-between text-[11px] font-semibold"><span>Tiết STEM hôm nay</span><span className="rounded-full bg-[var(--brand-accent)] px-1.5 text-[var(--brand-accent-fg)]">{si.today.length}</span></div>
              <ul className="mt-1.5 grid gap-1">
                {si.today.slice(0, 2).map((t) => <li key={t.time} className="truncate text-xs"><b className="tabular">{t.time}</b> · {t.label}</li>)}
              </ul>
            </div>
          </div>
        } />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CalendarCheck />} label="Tiết STEM tuần này" value={si.periodsWeek.used} hint={`trên ${si.periodsWeek.available} tiết khả dụng`} delta="+18%" />
        <Stat icon={<FlaskConical />} tone="accent" label="Phòng hoạt động" value={`${si.rooms.filter((r) => r.status === "ok").length}/${si.rooms.length}`} hint="phòng STEM sẵn sàng" />
        <Stat icon={<Users />} tone="success" label="Học sinh · lớp" value={agg.students} hint={`${agg.classes} lớp · ${agg.departments} tổ chuyên môn`} />
        <Stat icon={<GraduationCap />} tone="info" label="Giáo viên STEM" value={si.teachersUsing.total} hint={`${si.teachersUsing.used} GV đang dùng phòng`} delta="+2" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <Section title="Vận hành tuần này" description="Hiệu quả sử dụng phòng & mức tham gia" icon={<Activity />}>
            <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-2">
                <Ring value={use} label="Sử dụng" />
                <Badge variant={use >= 60 ? "success" : "warning"}>{use >= 60 ? "Tốt" : "Cần tăng"}</Badge>
              </div>
              <div className="grid gap-3">
                <Meter label="GV dùng phòng STEM" {...si.teachersUsing} tone="bg-success" />
                <Meter label="HS tham gia hoạt động STEM" {...si.studentsJoined} tone="bg-success" />
                <Meter label="Kế hoạch tổ đã duyệt" {...si.plansApproved} tone="bg-primary" />
              </div>
            </div>
          </Section>
          <Section title="Tiết STEM theo tháng" description="6 tháng gần nhất" icon={<ChartColumn />}>
            <Columns data={si.monthly} unit="tiết" />
          </Section>
        </div>
        <div className="grid content-start gap-5">
          <Section title="Cần làm" description="Việc đang chờ xử lý" icon={<ListChecks />} actions={<Badge variant="danger">{todos.length}</Badge>}>
            {todos.length === 0 ? <Empty title="Không có việc tồn đọng" /> : <TodoList items={todos} />}
          </Section>
          <QuickActions ds={ds} access={access} slugs={["nhan-su", "ke-hoach", "dat-lich", "bao-tri", "khao-sat"]} />
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Chỉ số STEM nhà trường" description="Tổng hợp 6 trụ cột · thang 100" icon={<Gauge />}>
          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-accent px-6 py-4">
              <span className="tabular text-4xl font-extrabold text-primary">{si.index}</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">/ 100 điểm · hạng {si.grade}</span>
              <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", si.delta < 0 ? "bg-destructive/10 text-destructive" : "bg-success/12 text-success")}>
                {si.delta > 0 ? "+" : ""}{si.delta} so với kỳ trước
              </span>
              <span className="text-[11px] text-muted-foreground">Cao hơn {si.percentile}% trường trong tỉnh</span>
            </div>
            <div className="grid gap-2">
              {si.pillars.map((pl) => (
                <div key={pl.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2 text-sm">
                  <span className="truncate">{pl.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", pl.value >= 75 ? "bg-success" : pl.value >= 65 ? "bg-highlight" : "bg-warning")} style={{ width: `${pl.value}%` }} /></span>
                  <span className="tabular text-right font-semibold">{pl.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section title="Phòng STEM" description={`${si.rooms.filter((r) => r.status === "ok").length}/${si.rooms.length} phòng đang hoạt động`} icon={<FlaskConical />}
          actions={<Link to="/$portal/$page" params={{ portal: "truong", page: "phong-thiet-bi" }} className="text-xs font-semibold text-primary">Chi tiết</Link>}>
          <ul className="grid gap-2">
            {si.rooms.map((r) => (
              <li key={r.name} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                <span className={cn("grid size-9 place-items-center rounded-lg", r.status === "ok" ? "bg-success/12 text-success" : "bg-warning/18 text-warning")}><DoorOpen className="size-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{r.name}</span><span className="text-xs text-muted-foreground">{r.meta}</span></span>
                <Badge variant={r.status === "ok" ? "success" : "warning"}>{r.status === "ok" ? "Hoạt động" : "Bảo trì"}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <ProgressStrip ds={ds} access={access} />
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
        {p === "so" || p === "platform" ? <Stat icon={<School />} label="Trường" value={agg.schools} hint={`${agg.departments} tổ chuyên môn`} /> : <Stat icon={<School />} label="Tổ chuyên môn" value={agg.departments} />}
        <Stat icon={<Users />} tone="accent" label="Lớp" value={agg.classes} />
        <Stat icon={<GraduationCap />} tone="success" label="Nhân sự" value={agg.staff} />
        <Stat icon={<Users />} tone="info" label="Học sinh" value={agg.students} hint={p === "so" ? "Số liệu tổng hợp" : undefined} />
      </div>
    );
  }
  if (p === "gv") {
    const classes = visibleClasses(ds, access);
    const students = classes.reduce((n, c) => n + studentsOfClass(ds, access, c.id).length, 0);
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<School />} label="Lớp phụ trách" value={classes.length} />
        <Stat icon={<Users />} tone="success" label="Học sinh" value={students} />
        <Stat icon={<CalendarCheck />} tone="accent" label="Tiết STEM tuần này" value={3} hint="minh họa · M6" />
        <Stat icon={<ListChecks />} tone="info" label="Bài chờ chấm" value={5} hint="minh họa · M7" />
      </div>
    );
  }
  if (p === "ncc") {
    const grants = grantsOfProvider(ds, access.scopeUnit.id, TODAY);
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<School />} label="Trường đang hợp tác" value={grants.filter((g) => g.active).length} />
        <Stat icon={<CircleAlert />} tone="danger" label="Quyền đã hết hạn" value={grants.filter((g) => !g.active).length} />
        <Stat icon={<GraduationCap />} tone="accent" label="Học liệu đã công bố" value={2} hint="minh họa · M5" />
        <Stat icon={<Activity />} tone="info" label="Yêu cầu hỗ trợ mở" value={5} hint="minh họa · M6" />
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
      className="mt-5"
      icon={<Activity />}
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
const SEVERITY_BORDER = { danger: "border-l-destructive", warning: "border-l-warning", info: "border-l-primary" } as const;

function TodoList({ items }: { items: TodoItem[] }) {
  const order = { danger: 0, warning: 1, info: 2 };
  return (
    <ul className="grid gap-2">
      {[...items].sort((a, b) => order[a.severity] - order[b.severity]).map((t) => {
        const Icon = SEVERITY_ICON[t.severity];
        return (
          <li key={t.id} className={cn("flex gap-3 rounded-xl border border-l-[3px] px-3 py-2.5", SEVERITY_BORDER[t.severity])}>
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
