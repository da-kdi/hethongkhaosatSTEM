import { useState } from "react";
import { Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/app/store";
import { ancestorsOf, subtreeIds, type AccessContext } from "@/domain/access";
import { canWriteSetting, resolveSetting, type ResolvedSetting } from "@/domain/config";
import type { ConfigMode, Dataset, OrgUnit } from "@/domain/model";
import { MODULE_LIST, MODULES, type ModuleCode } from "@/domain/modules";
import { UNIT_TYPE_LABEL } from "@/app/queries";
import { PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/** Loại đơn vị có cấu hình riêng (tổ thừa hưởng cấu hình của trường). */
const CONFIGURABLE = new Set(["PLATFORM", "SO", "DON_VI", "TRUONG"]);
const PARENT_TYPES = new Set(["PLATFORM", "SO", "DON_VI"]);

const MODE_LABEL: Record<ConfigMode, string> = {
  MANDATORY: "Bắt buộc",
  EXTEND: "Kế thừa & mở rộng",
  AUTONOMOUS: "Tự chủ",
};

function tryDo(fn: () => void, ok: string) {
  try {
    fn();
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Không lưu được cấu hình");
  }
}

function SourceNote({ ds, r, unitId }: { ds: Dataset; r: ResolvedSetting; unitId: string }) {
  const name = (id?: string) => ds.units.find((u) => u.id === id)?.name ?? "—";
  if (r.lockedByUnitId && r.lockedByUnitId !== unitId) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" aria-hidden /> Bắt buộc bởi {name(r.lockedByUnitId)}
      </span>
    );
  }
  if (!r.sourceUnitId) return <span className="text-xs text-muted-foreground">Mặc định hệ thống</span>;
  if (r.sourceUnitId === unitId) return <span className="text-xs text-muted-foreground">Thiết lập tại đơn vị này · {MODE_LABEL[r.mode!]}</span>;
  return <span className="text-xs text-muted-foreground">Kế thừa từ {name(r.sourceUnitId)}</span>;
}

export function ConfigPage({ access }: { access: AccessContext }) {
  const { ds } = useStore();
  const canManage = access.has("cfg.setting.manage");

  // Đơn vị được chọn để xem/sửa cấu hình: trong phạm vi, và là loại có cấu hình riêng
  const scope = subtreeIds(ds, access.scopeUnit.id);
  const candidates: OrgUnit[] = ds.units.filter(
    (u) => CONFIGURABLE.has(u.type) && (scope.has(u.id) || u.id === access.configUnitId) && u.type !== "NCC",
  );
  const defaultUnit = CONFIGURABLE.has(access.scopeUnit.type) ? access.scopeUnit.id : access.configUnitId;
  const [unitId, setUnitId] = useState(defaultUnit);
  const unit = ds.units.find((u) => u.id === unitId)!;
  const chain = ancestorsOf(ds, unitId);
  const editable = canManage && scope.has(unitId);
  const own = (key: string) => ds.settings.find((s) => s.unitId === unitId && s.key === key);

  const setModule = (code: ModuleCode, enabled: boolean, mode?: ConfigMode) =>
    tryDo(
      () => actions.setSetting(unitId, `module.${code}`, { enabled }, mode ?? own(`module.${code}`)?.mode ?? "AUTONOMOUS"),
      `${MODULES[code].name}: ${enabled ? "bật" : "tắt"}`,
    );

  return (
    <div>
      <PageHeader
        title="Phân hệ & cấu hình"
        description="Cấu hình kế thừa theo tầng Nền tảng → Sở → Trường → Tổ. Cấp trên đặt “Bắt buộc” thì cấp dưới không sửa được; “Kế thừa & mở rộng” cho phép cấp dưới thêm nhưng không xóa."
        actions={
          candidates.length > 1 ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Đơn vị</span>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="h-9 max-w-64 rounded-md border border-input bg-background px-2 text-sm"
              >
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          ) : undefined
        }
      />

      {!editable && (
        <p className="mb-4 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Bạn đang xem ở chế độ chỉ đọc. Chỉ quản trị viên của đơn vị hoặc cấp trên mới sửa được cấu hình.
        </p>
      )}

      <div className="grid gap-4">
        <Section
          title={`Phân hệ · ${unit.name}`}
          description={`${UNIT_TYPE_LABEL[unit.type]}. Tắt phân hệ sẽ ẩn menu và chặn truy cập ở đơn vị này và mọi tổ trực thuộc, không ảnh hưởng đơn vị khác. Các phân hệ nền tảng (0, 4, 8, 0.1, 0.4, 0.5) luôn bật.`}
        >
          <ul className="divide-y">
            {MODULE_LIST.filter((m) => m.canDisable)
              .map(({ code }) => {
                const key = `module.${code}`;
                const r = resolveSetting<{ enabled?: boolean }>(ds.settings, chain, key);
                const enabled = r.value?.enabled ?? true;
                const writable = editable && canWriteSetting(ds.settings, chain, key);
                const ownMode = own(key)?.mode;
                return (
                  <li key={code} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{MODULES[code].no} · {MODULES[code].name}</span>
                        {enabled ? <Badge variant="success">Đang bật</Badge> : <Badge variant="muted">Đang tắt</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {MODULES[code].description} <span className="whitespace-nowrap">· Bước {MODULES[code].steps.join(", ")}</span>
                      </p>
                      <SourceNote ds={ds} r={r} unitId={unitId} />
                    </div>
                    <div className="flex items-center gap-4">
                      {PARENT_TYPES.has(unit.type) && (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          Bắt buộc cho cấp dưới
                          <Switch
                            label={`Bắt buộc ${MODULES[code].name} cho cấp dưới`}
                            checked={ownMode === "MANDATORY"}
                            disabled={!writable}
                            onCheckedChange={(v) => setModule(code, enabled, v ? "MANDATORY" : "AUTONOMOUS")}
                          />
                        </label>
                      )}
                      <Switch
                        label={`Bật ${MODULES[code].name}`}
                        checked={enabled}
                        disabled={!writable}
                        onCheckedChange={(v) => setModule(code, v)}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <CatalogEditor ds={ds} unitId={unitId} chain={chain} editable={editable} />
          <WorkflowParams ds={ds} unitId={unitId} chain={chain} editable={editable} />
        </div>
      </div>
    </div>
  );
}

/** Danh mục loại hoạt động — minh họa chế độ EXTEND: cấp trên ban hành, cấp dưới thêm mục riêng. */
function CatalogEditor({ ds, unitId, chain, editable }: { ds: Dataset; unitId: string; chain: OrgUnit[]; editable: boolean }) {
  const key = "catalog.activity_types";
  const [draft, setDraft] = useState("");
  const r = resolveSetting<string[]>(ds.settings, chain, key);
  const items = r.value ?? [];
  const ownSetting = ds.settings.find((s) => s.unitId === unitId && s.key === key);
  const ownItems = (ownSetting?.value as string[] | undefined) ?? [];
  const writable = editable && canWriteSetting(ds.settings, chain, key);
  const mode: ConfigMode = ownSetting?.mode ?? (r.mode === "EXTEND" ? "EXTEND" : "AUTONOMOUS");

  const save = (next: string[], msg: string) => tryDo(() => actions.setSetting(unitId, key, next, mode), msg);

  return (
    <Section title="Danh mục loại hoạt động STEM" description="Mục có biểu tượng khóa do cấp trên ban hành. Đơn vị chỉ thêm hoặc xóa mục của chính mình.">
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => {
          const mine = ownItems.includes(it) && !r.lockedItems.includes(it);
          return (
            <li key={it} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-sm">
              {!mine && <Lock className="size-3 text-muted-foreground" aria-label="Do cấp trên ban hành" />}
              {it}
              {mine && writable && (
                <button
                  type="button"
                  aria-label={`Xóa ${it}`}
                  className="rounded-full p-0.5 hover:bg-accent"
                  onClick={() => save(ownItems.filter((x) => x !== it), `Đã xóa “${it}”`)}
                >
                  <X className="size-3" />
                </button>
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Chưa có danh mục.</li>}
      </ul>
      {writable && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = draft.trim();
            if (!v || items.includes(v)) return;
            save([...ownItems, v], `Đã thêm “${v}”`);
            setDraft("");
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Thêm loại hoạt động riêng…" aria-label="Loại hoạt động mới" maxLength={80} />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            <Plus /> Thêm
          </Button>
        </form>
      )}
    </Section>
  );
}

/** Tham số quy trình — minh họa chế độ AUTONOMOUS: trường tự quyết có bước Tổ duyệt hay không. */
function WorkflowParams({ ds, unitId, chain, editable }: { ds: Dataset; unitId: string; chain: OrgUnit[]; editable: boolean }) {
  const key = "wf.session.dept_review";
  const r = resolveSetting<{ enabled?: boolean }>(ds.settings, chain, key);
  const enabled = r.value?.enabled ?? true;
  const writable = editable && canWriteSetting(ds.settings, chain, key);
  const mode = ds.settings.find((s) => s.unitId === unitId && s.key === key)?.mode ?? "AUTONOMOUS";
  return (
    <Section title="Quy trình duyệt buổi dạy & minh chứng (phân hệ 6 · 8)" description="Trạng thái lõi (Nháp → Chờ duyệt → Đã duyệt) do Sở quy định. Trường được bật/tắt bước Tổ rà soát.">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Bước Tổ chuyên môn rà soát</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enabled ? "Nháp → Chờ Tổ duyệt → Chờ BGH duyệt → Đã duyệt" : "Nháp → Chờ BGH duyệt → Đã duyệt"}
          </p>
          <SourceNote ds={ds} r={r} unitId={unitId} />
        </div>
        <Switch
          label="Bật bước Tổ rà soát"
          checked={enabled}
          disabled={!writable}
          onCheckedChange={(v) => tryDo(() => actions.setSetting(unitId, key, { enabled: v }, mode), v ? "Đã bật bước Tổ rà soát" : "Đã tắt bước Tổ rà soát")}
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Bộ máy quy trình (phân hệ 8) chạy thật với tham số này từ M3.</p>
    </Section>
  );
}
