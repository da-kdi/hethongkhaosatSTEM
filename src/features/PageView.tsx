import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useStore } from "@/app/store";
import type { AccessContext } from "@/domain/access";
import { isNavItemAllowed } from "@/domain/menu";
import { findNavItem, READY } from "@/domain/navigation";
import type { Portal } from "@/domain/roles";
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
import { GuardianLinksPage } from "./org/GuardianLinksPage";
import { ChildLinkPage } from "./org/ChildLinkPage";
import { ProviderProfilePage } from "./provider/ProviderProfilePage";
import { BrandingPage } from "./cfg/BrandingPage";
import { PreviewPage } from "./preview/PreviewPage";

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
  "lien-ket-phu-huynh": GuardianLinksPage,
  "lien-ket-con": ChildLinkPage,
  "ho-so-ncc": ProviderProfilePage,
  "giao-dien": BrandingPage,
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

  return <PreviewPage portal={portal} item={item} />;
}
