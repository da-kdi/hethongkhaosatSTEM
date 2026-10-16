import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarRange, ChevronRight, LogOut, Menu, Moon, Repeat, Search, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { actions, TODAY, useStore } from "@/app/store";
import { PORTAL_STYLE } from "@/app/portal-style";
import { assignmentsOf, type AccessContext } from "@/domain/access";
import { buildMenu } from "@/domain/menu";
import { PORTAL_LABEL, ROLE_BY_CODE } from "@/domain/roles";
import { NavIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DATA_MODE } from "@/lib/config";
import { BrandLockup, useBrand } from "@/app/brand";
import { currentTheme, toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AppShell({ access, activeSlug, children }: { access: AccessContext; activeSlug: string; children: ReactNode }) {
  const { ds, session } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [theme, setTheme] = useState(currentTheme());
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const fullMenu = buildMenu(ds, access);
  const norm = (x: string) => x.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const menu = q.trim()
    ? fullMenu.map((g) => ({ ...g, items: g.items.filter((i) => norm(i.label).includes(norm(q.trim()))) })).filter((g) => g.items.length)
    : fullMenu;
  const activeGroup = fullMenu.find((g) => g.items.some((i) => i.slug === activeSlug));
  const activeItem = activeGroup?.items.find((i) => i.slug === activeSlug);
  const year = ds.years.find((y) => y.isCurrent);
  const person = ds.persons.find((p) => p.id === access.personId);
  const contexts = assignmentsOf(ds, session.accountId!, TODAY);
  const style = PORTAL_STYLE[access.role.portal];
  const brand = useBrand(access.configUnitId);

  const sidebar = (
    <nav aria-label="Menu chính" className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-4">
        <BrandLockup brand={brand} />
      </div>
      <div className="grid gap-2 px-3">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs">
          <CalendarRange className="size-3.5 text-primary" aria-hidden />
          <span className="font-semibold">Năm học {year?.code.replace("-", " – ")}</span>
          <span className="ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-primary">HK I</span>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chức năng…" aria-label="Tìm chức năng trong menu"
            className="h-8 w-full rounded-lg border bg-muted/50 pr-2 pl-8 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-card" />
        </label>
      </div>
      <button
        type="button"
        onClick={() => setSwitchOpen(true)}
        className="mx-3 mt-3 rounded-xl border bg-card px-3 py-2 text-left transition-colors hover:bg-accent"
      >
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", style.chip)}>
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          {PORTAL_LABEL[access.role.portal]}
        </span>
        <span className="mt-1 block truncate text-sm font-medium">{access.role.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{access.scopeUnit.name}</span>
        {contexts.length > 1 && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Repeat className="size-3" aria-hidden /> Đổi ngữ cảnh ({contexts.length})
          </span>
        )}
      </button>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {menu.length === 0 && <p className="px-2 text-xs text-muted-foreground">Không tìm thấy chức năng.</p>}
        {menu.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="px-2 pb-1.5 text-[10.5px] font-bold tracking-wider text-muted-foreground/80 uppercase">{g.label}</div>
            <ul>
              {g.items.map((it) => {
                const active = it.slug === activeSlug;
                return (
                  <li key={it.slug}>
                    <Link
                      to="/$portal/$page"
                      params={{ portal: access.role.portal, page: it.slug }}
                      onClick={() => setNavOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors",
                        active
                          ? "bg-accent font-semibold text-primary before:absolute before:top-1.5 before:bottom-1.5 before:-left-3 before:w-1 before:rounded-r-full before:bg-highlight"
                          : "font-medium text-foreground/75 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <NavIcon name={it.icon} className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.milestone !== "M0" && (
                        <span className={cn("rounded px-1 text-[10px] font-semibold", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                          {it.milestone}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 border-t p-3 text-xs text-muted-foreground">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {person?.fullName.split(" ").slice(-2).map((w) => w[0]).join("")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-foreground">{person?.fullName}</span>
          <span className="block truncate">{ds.accounts.find((a) => a.id === session.accountId)?.email}</span>
        </span>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] border-r bg-sidebar shadow-xl">
            <button type="button" aria-label="Đóng menu" onClick={() => setNavOpen(false)} className="absolute top-3 right-3 rounded-md p-1.5 hover:bg-accent">
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setNavOpen(true)}>
            <Menu />
          </Button>
          {brand.mark && <img src={brand.mark} alt="" className="size-7 rounded-md bg-white object-contain lg:hidden" />}
          <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="truncate">{access.scopeUnit.name}</span>
              {activeGroup && activeItem && activeSlug !== "tong-quan" && (
                <>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{activeGroup.label.replace(/^[\d.]+ · /, "")}</span>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate font-medium text-foreground">{activeItem.label}</span>
                </>
              )}
            </span>
          </div>
          {DATA_MODE === "demo" && (
            <span className="hidden rounded-full bg-highlight/25 px-2.5 py-1 text-xs font-medium text-foreground sm:inline">Chế độ demo · dữ liệu hư cấu</span>
          )}
          <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"} onClick={() => setTheme(toggleTheme())}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              actions.logout();
              navigate({ to: "/dang-nhap" });
            }}
          >
            <LogOut /> <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn ngữ cảnh làm việc</DialogTitle>
            <DialogDescription>Mỗi lúc chỉ một vai trò có hiệu lực — dữ liệu và menu thay đổi theo ngữ cảnh.</DialogDescription>
          </DialogHeader>
          <ContextList
            currentId={access.assignment.id}
            onPick={(id) => {
              actions.switchContext(id);
              setSwitchOpen(false);
              const role = ROLE_BY_CODE[ds.assignments.find((a) => a.id === id)!.roleCode];
              toast.success(`Đã chuyển sang: ${role.name}`);
              navigate({ to: "/$portal/$page", params: { portal: role.portal, page: "tong-quan" } });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ContextList({ currentId, onPick }: { currentId?: string | null; onPick: (assignmentId: string) => void }) {
  const { ds, session } = useStore();
  const contexts = assignmentsOf(ds, session.accountId!, TODAY);
  return (
    <ul className="grid gap-2">
      {contexts.map((a) => {
        const role = ROLE_BY_CODE[a.roleCode];
        const unit = ds.units.find((u) => u.id === a.scopeUnitId);
        const st = PORTAL_STYLE[role.portal];
        const current = a.id === currentId;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onPick(a.id)}
              disabled={current}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left transition-colors hover:border-primary hover:bg-accent disabled:cursor-default disabled:border-primary",
              )}
            >
              <span className={cn("size-2.5 shrink-0 rounded-full", st.dot)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{role.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {PORTAL_LABEL[role.portal]} · {role.portal === "ph" ? "Con đã liên kết" : unit?.name}
                </span>
              </span>
              {current && <span className="text-xs font-medium text-primary">Đang dùng</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
