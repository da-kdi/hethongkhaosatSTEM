import {
  createHashHistory, createRootRoute, createRoute, createRouter, Navigate, Outlet, useParams,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { ContextPage } from "@/features/auth/ContextPage";
import { PageView } from "@/features/PageView";
import { getAccess, useStore } from "./store";
import type { Portal } from "@/domain/roles";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  ),
});

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/dang-nhap", component: LoginPage });

function RequireAccount({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  if (!session.accountId) return <Navigate to="/dang-nhap" />;
  return <>{children}</>;
}

const contextRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chon-ngu-canh",
  component: () => <RequireAccount><ContextPage /></RequireAccount>,
});

function HomeRedirect() {
  const s = useStore();
  if (!s.session.accountId) return <Navigate to="/dang-nhap" />;
  const access = getAccess(s);
  if (!access) return <Navigate to="/chon-ngu-canh" />;
  return <Navigate to="/$portal/$page" params={{ portal: access.role.portal, page: "tong-quan" }} />;
}
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomeRedirect });

function AppPage() {
  const { portal, page } = useParams({ from: "/$portal/$page" });
  const s = useStore();
  if (!s.session.accountId) return <Navigate to="/dang-nhap" />;
  const access = getAccess(s);
  if (!access) return <Navigate to="/chon-ngu-canh" />;
  // URL thuộc cổng khác ngữ cảnh hiện tại → đưa về trang chủ của ngữ cảnh (không trộn quyền)
  if (portal !== access.role.portal) {
    return <Navigate to="/$portal/$page" params={{ portal: access.role.portal, page: "tong-quan" }} />;
  }
  return (
    <AppShell access={access} activeSlug={page}>
      <PageView portal={portal as Portal} slug={page} access={access} />
    </AppShell>
  );
}
const pageRoute = createRoute({ getParentRoute: () => rootRoute, path: "/$portal/$page", component: AppPage });

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, contextRoute, pageRoute]);

// Hash history: chạy được trên hosting tĩnh (GitHub Pages) không cần cấu hình rewrite
export const router = createRouter({ routeTree, history: createHashHistory(), defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
