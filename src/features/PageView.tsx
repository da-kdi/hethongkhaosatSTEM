import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useStore } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { isNavItemAllowed } from "@/domain/menu";
import { findNavItem, READY } from "@/domain/navigation";
import { MODULES, STEP_BY_NO } from "@/domain/modules";
import type { Portal } from "@/domain/roles";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page";
import { OverviewPage } from "./overview/OverviewPage";
import { UnitsPage } from "./org/UnitsPage";
import { SchoolsPage } from "./org/SchoolsPage";
import { ClassesPage } from "./org/ClassesPage";
import { AccountsPage } from "./iam/AccountsPage";
import { RolesPage } from "./iam/RolesPage";
import { ConfigPage } from "./cfg/ConfigPage";
import { AuditPage } from "./audit/AuditPage";
import { GrantsPage } from "./provider/GrantsPage";
import { DeAnProgressPage } from "./plan/DeAnProgress";
import { ModuleMapPage } from "./cfg/ModuleMapPage";
import { DictionaryPage } from "./cfg/DictionaryPage";
import { CatalogPage } from "./cfg/CatalogPage";
import { StaffPage } from "./org/StaffPage";
import { ExchangePage } from "./org/ExchangePage";

/** Trang đã triển khai (M0). Mục khác trong menu hiển thị trang "đang phát triển" kèm phạm vi & milestone. */
const PAGES: Record<string, (p: { access: AccessContext }) => React.ReactNode> = {
  "tong-quan": OverviewPage,
  "don-vi": UnitsPage,
  "truong-hoc": SchoolsPage,
  "hoc-sinh": ClassesPage,
  "lop-cua-to": ClassesPage,
  "lop-cua-toi": ClassesPage,
  "tai-khoan": AccountsPage,
  "vai-tro": RolesPage,
  "cau-hinh": ConfigPage,
  "nhat-ky": AuditPage,
  "truong-duoc-cap-quyen": GrantsPage,
  "tien-trinh": DeAnProgressPage,
  "ban-do-phan-he": ModuleMapPage,
  "tu-dien": DictionaryPage,
  "danh-muc": CatalogPage,
  "nhan-su": StaffPage,
  "nhap-xuat-ho-so": ExchangePage,
};

export function PageView({ portal, slug, access }: { portal: Portal; slug: string; access: AccessContext }) {
  const { ds } = useStore();
  const item = findNavItem(portal, slug);

  // Kiểm tra cả khi người dùng gõ URL trực tiếp (menu ẩn không phải lớp bảo mật)
  if (!item || !isNavItemAllowed(ds, access, item)) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <Lock className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-lg font-semibold">Không có quyền truy cập</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Trang này không thuộc ngữ cảnh hiện tại, module đã bị tắt ở đơn vị của bạn, hoặc vai trò chưa được cấp quyền.
        </p>
        <Link to="/$portal/$page" params={{ portal, page: "tong-quan" }} className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Về trang tổng quan
        </Link>
      </div>
    );
  }

  const Page = PAGES[slug];
  if (Page && item.milestone === READY) return <Page access={access} />;

  const mod = MODULES[item.module];
  return (
    <div>
      <PageHeader
        title={item.label}
        description={`Phân hệ ${mod.no} · ${mod.name}`}
        actions={<Badge variant="warning">Triển khai ở {item.milestone}</Badge>}
      />
      <div className="grid gap-4 rounded-xl border border-dashed bg-card p-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold">Phạm vi màn hình</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{item.scope ?? mod.description}</p>
          <h2 className="mt-4 text-sm font-semibold">Tham gia quy trình đề án</h2>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {mod.steps.map((n) => <li key={n}><Badge variant="outline">Bước {n} · {STEP_BY_NO[n].name}</Badge></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Chi tiết phân hệ</h2>
          <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">{mod.features.map((f) => <li key={f}>{f}</li>)}</ul>
          {mod.dataDomains.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Miền dữ liệu QĐ 2768: <span className="font-mono">{mod.dataDomains.join(", ")}</span></p>
          )}
        </div>
        <p className="text-xs text-muted-foreground lg:col-span-2">
          Mục này đã có trong menu, đã kiểm quyền và kiểm phân hệ bật/tắt. Lộ trình chi tiết: <code className="rounded bg-muted px-1">docs/ARCHITECTURE_PLAN.md</code> §7.
        </p>
      </div>
    </div>
  );
}
