import { useNavigate } from "@tanstack/react-router";
import { actions, useStore } from "@/app/store";
import { ContextList } from "@/components/layout/AppShell";
import { ROLE_BY_CODE } from "@/domain/roles";
import { Button } from "@/components/ui/button";

export function ContextPage() {
  const { ds, session } = useStore();
  const navigate = useNavigate();
  const person = ds.persons.find((p) => p.id === ds.accounts.find((a) => a.id === session.accountId)?.personId);

  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold">Xin chào, {person?.fullName}</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Tài khoản của bạn có nhiều vai trò. Chọn ngữ cảnh làm việc — có thể đổi bất cứ lúc nào ở góc trái màn hình.
        </p>
        <ContextList
          onPick={(id) => {
            actions.switchContext(id);
            const role = ROLE_BY_CODE[ds.assignments.find((a) => a.id === id)!.roleCode];
            navigate({ to: "/$portal/$page", params: { portal: role.portal, page: "tong-quan" } });
          }}
        />
        <Button variant="link" className="mt-4 px-0" onClick={() => { actions.logout(); navigate({ to: "/dang-nhap" }); }}>
          Đăng nhập tài khoản khác
        </Button>
      </div>
    </div>
  );
}
