import { useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { BrandLockup, useBrand } from "@/app/brand";
import { actions, TODAY, useStore } from "@/app/store";
import { PORTAL_STYLE } from "@/app/portal-style";
import { assignmentsOf } from "@/domain/access";
import { PORTAL_LABEL, ROLE_BY_CODE, type Portal } from "@/domain/roles";
import { Button } from "@/components/ui/button";
import { DATA_MODE } from "@/lib/config";
import { cn } from "@/lib/utils";

const ORDER: Portal[] = ["so", "truong", "to", "gv", "hs", "ph", "ncc", "platform"];

export function LoginPage() {
  const { ds } = useStore();
  const navigate = useNavigate();
  const brand = useBrand();

  const accounts = ds.accounts.map((acc) => {
    const ctxs = assignmentsOf(ds, acc.id, TODAY);
    const roles = ctxs.map((c) => ROLE_BY_CODE[c.roleCode]);
    const units = ctxs.map((c) => ds.units.find((u) => u.id === c.scopeUnitId)?.name);
    return { acc, person: ds.persons.find((p) => p.id === acc.personId)!, roles, units, primary: roles[0]?.portal ?? "platform" };
  });

  const login = (accountId: string) => {
    actions.login(accountId);
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-[color-mix(in_oklch,var(--brand)_88%,black)] px-6 py-8 text-white sm:px-10 lg:py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="relative flex items-center gap-2">
          <BrandLockup brand={brand} invert />
        </div>
        <div className="relative my-10 max-w-md">
          <h1 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            Một nền tảng, <span className="text-highlight">đúng dữ liệu</span> cho từng vai trò.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Sở giao chỉ tiêu, trường lập kế hoạch, tổ rà soát, giáo viên tổ chức hoạt động, học sinh và phụ huynh theo dõi,
            nhà cung cấp phối hợp triển khai — mỗi người chỉ thấy phần dữ liệu được cấp quyền.
          </p>
        </div>
        <ul className="relative grid gap-2 text-xs text-white/75 sm:grid-cols-3">
          <li className="rounded-lg bg-white/10 px-3 py-2">Phân quyền theo vai trò × phạm vi × quan hệ</li>
          <li className="rounded-lg bg-white/10 px-3 py-2">Cấu hình kế thừa Sở → trường → tổ</li>
          <li className="rounded-lg bg-white/10 px-3 py-2">Nhật ký mọi thay đổi quan trọng</li>
        </ul>
      </section>

      <section className="px-4 py-8 sm:px-10 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-semibold">Đăng nhập</h2>
          {DATA_MODE === "demo" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Bản demo dùng dữ liệu <strong>hư cấu</strong> của tỉnh giả định “An Hòa”. Chọn một tài khoản để xem hệ thống dưới góc nhìn vai trò đó.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Đăng nhập Supabase sẽ bật ở Milestone 1.</p>
          )}

          <div className="mt-6 grid gap-6">
            {ORDER.map((portal) => {
              const list = accounts.filter((a) => a.primary === portal);
              if (!list.length) return null;
              const st = PORTAL_STYLE[portal];
              return (
                <div key={portal}>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <span className={cn("size-2 rounded-full", st.dot)} /> {PORTAL_LABEL[portal]}
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {list.map(({ acc, person, roles, units }) => (
                      <li key={acc.id}>
                        <button
                          type="button"
                          onClick={() => login(acc.id)}
                          className="w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <span className="block text-sm font-medium">{person.fullName}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {roles.map((r) => r.name).join(" + ")}{units[0] && roles[0]?.portal !== "ph" ? ` · ${units[0]}` : ""}
                          </span>
                          {roles.length > 1 && (
                            <span className="mt-1 inline-block rounded bg-highlight/25 px-1.5 text-[11px] font-medium">Nhiều vai trò</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
            <span>Khi chạy với Supabase local, mọi tài khoản demo dùng mật khẩu <code className="rounded bg-muted px-1">Demo@2026</code>.</span>
            <Button variant="ghost" size="sm" onClick={() => actions.resetDemo()}>
              <RotateCcw /> Khôi phục dữ liệu demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
