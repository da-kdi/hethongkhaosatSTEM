import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, LogOut, Menu, Moon, Repeat, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { actions, TODAY, useStore } from "@/app/store";
import { PORTAL_STYLE } from "@/app/portal-style";
import { assignmentsOf, type AccessContext } from "@/domain/access";
import { buildMenu } from "@/domain/menu";
import { PORTAL_LABEL, ROLE_BY_CODE } from "@/domain/roles";
import { NavIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_NAME, DATA_MODE } from "@/lib/config";
import { currentTheme, toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AppShell({ access, activeSlug, children }: { access: AccessContext; activeSlug: string; children: ReactNode }) {
  const { ds, session } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [theme, setTheme] = useState(currentTheme());
  const navigate = useNavigate();
  const menu = buildMenu(ds, access);
  const person = ds.persons.find((p) => p.id === access.personId);
  const contexts = assignmentsOf(ds, session.accountId!, TODAY);
  const style = PORTAL_STYLE[access.role.portal];

  const sidebar = (
    <nav aria-label="Menu chính" className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <FlaskConical className="size-4" aria-hidden />
        </span>
        <span className="font-semibold">{APP_NAME}</span>
      </div>
      <button
        type="button"
        onClick={() => setSwitchOpen(true)}
        className="mx-3 mt-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-accent"
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
        {menu.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</div>
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
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <NavIcon name={it.icon} className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.milestone !== "M0" && (
                        <span className={cn("rounded px-1 text-[10px] font-medium", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>
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
      <div className="border-t p-3 text-xs text-muted-foreground">
        <div className="truncate font-medium text-foreground">{person?.fullName}</div>
        <div className="truncate">{ds.accounts.find((a) => a.id === session.accountId)?.email}</div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>

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
          <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            <span className="hidden sm:inline">{access.scopeUnit.name}</span>
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
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
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
