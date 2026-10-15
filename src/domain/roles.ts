import type { Permission } from "./permissions.ts";

/**
 * Phạm vi dữ liệu của một vai trò (xem docs/PERMISSION_MATRIX.md §4.3)
 *  - UNIT_SUBTREE: mọi bản ghi thuộc đơn vị được gán và cây con
 *  - TEACHING:     lớp được phân công dạy/chủ nhiệm (trong trường được gán)
 *  - SELF:         chỉ bản thân
 *  - LINKED:       học sinh đã liên kết & xác minh (phụ huynh)
 *  - GRANT:        trường/chương trình được cấp quyền theo hợp tác (nhà cung cấp)
 *  - PLATFORM:     quản trị nền tảng (cấu hình), KHÔNG mặc định xem dữ liệu cá nhân
 */
export type ScopeKind = "PLATFORM" | "UNIT_SUBTREE" | "TEACHING" | "SELF" | "LINKED" | "GRANT";

/** Nhóm vai trò = "cổng" giao diện (7 nhóm theo brief + quản trị nền tảng). */
export type Portal = "platform" | "so" | "truong" | "to" | "gv" | "hs" | "ph" | "ncc";

export interface RoleDef {
  code: string;
  name: string;
  portal: Portal;
  scope: ScopeKind;
  /** Loại đơn vị được phép gán vai trò này vào */
  unitTypes: readonly string[];
  permissions: readonly Permission[];
}

const SO_VIEW: Permission[] = [
  "org.unit.view", "org.class.view", "org.person.view", "iam.account.view", "iam.role.view", "cfg.setting.view",
  "plan.target.view", "plan.plan.view", "training.course.view", "program.content.view", "resource.room.view",
  "schedule.lesson.view", "session.attendance.view", "assess.task.view", "report.dashboard.view", "report.export",
  "survey.form.view", "integration.connector.view",
];

export const SYSTEM_ROLES: readonly RoleDef[] = [
  {
    code: "PLATFORM_ADMIN", name: "Quản trị nền tảng", portal: "platform", scope: "PLATFORM",
    unitTypes: ["PLATFORM"],
    permissions: ["org.unit.view", "org.unit.manage", "iam.account.view", "iam.account.manage", "iam.role.view",
      "iam.role.manage", "cfg.setting.view", "cfg.setting.manage", "cfg.catalog.manage", "audit.log.view",
      "integration.connector.view", "integration.connector.manage"],
  },
  {
    code: "SO_LEADER", name: "Lãnh đạo Sở", portal: "so", scope: "UNIT_SUBTREE", unitTypes: ["SO"],
    permissions: [...SO_VIEW, "plan.target.manage", "plan.plan.approve", "report.submission.approve",
      "workflow.directive.manage", "program.content.approve", "survey.form.manage", "audit.log.view"],
  },
  {
    code: "SO_SPECIALIST", name: "Chuyên viên Sở", portal: "so", scope: "UNIT_SUBTREE", unitTypes: ["SO"],
    permissions: [...SO_VIEW, "plan.target.manage", "plan.plan.approve", "report.submission.approve",
      "workflow.directive.manage", "program.content.approve", "training.course.manage", "survey.form.manage"],
  },
  {
    code: "SO_ADMIN", name: "Quản trị viên Sở", portal: "so", scope: "UNIT_SUBTREE", unitTypes: ["SO"],
    permissions: ["org.unit.view", "org.unit.manage", "iam.account.view", "iam.account.manage", "iam.role.view",
      "iam.role.manage", "cfg.setting.view", "cfg.setting.manage", "audit.log.view", "report.dashboard.view",
      "integration.connector.view", "integration.connector.manage"],
  },
  {
    code: "SCHOOL_LEADER", name: "Ban giám hiệu", portal: "truong", scope: "UNIT_SUBTREE", unitTypes: ["TRUONG"],
    permissions: ["org.unit.view", "org.class.view", "org.person.view", "org.person.personal", "iam.account.view",
      "iam.role.view", "cfg.setting.view", "audit.log.view", "plan.target.view", "plan.plan.view", "plan.plan.create",
      "plan.plan.approve", "training.course.view", "training.course.manage", "training.competency.evaluate",
      "program.content.view", "program.content.approve", "resource.room.view", "schedule.lesson.view",
      "schedule.booking.approve", "session.attendance.view", "session.evidence.approve", "assess.task.view",
      "iam.grant.manage", "report.dashboard.view", "report.submission.create", "report.export",
      "workflow.directive.manage", "workflow.directive.respond", "survey.form.view", "survey.form.manage",
      "survey.response.submit"],
  },
  {
    code: "SCHOOL_ADMIN", name: "Quản trị viên trường", portal: "truong", scope: "UNIT_SUBTREE", unitTypes: ["TRUONG"],
    permissions: ["org.unit.view", "org.unit.manage", "org.class.view", "org.class.manage", "org.person.view",
      "org.person.personal", "org.person.manage", "iam.account.view", "iam.account.manage", "iam.role.view",
      "iam.role.manage", "iam.guardian.approve", "iam.grant.manage", "cfg.setting.view", "cfg.setting.manage",
      "audit.log.view", "resource.room.view", "resource.room.manage", "resource.stock.manage", "schedule.lesson.view",
      "schedule.booking.approve", "report.dashboard.view", "report.submission.create", "report.export",
      "survey.form.view", "integration.connector.view"],
  },
  {
    code: "DEPT_HEAD", name: "Tổ trưởng chuyên môn", portal: "to", scope: "UNIT_SUBTREE", unitTypes: ["TO"],
    permissions: ["org.unit.view", "org.class.view", "org.person.view", "plan.plan.view", "plan.plan.create",
      "plan.plan.approve", "training.course.view", "training.competency.evaluate", "program.content.view",
      "program.content.create", "resource.room.view", "schedule.lesson.view", "schedule.lesson.create",
      "session.attendance.view", "session.evidence.approve", "assess.task.view", "report.dashboard.view",
      "report.submission.create", "workflow.directive.respond", "survey.form.view", "survey.response.submit"],
  },
  {
    code: "TEACHER", name: "Giáo viên", portal: "gv", scope: "TEACHING", unitTypes: ["TRUONG"],
    permissions: ["org.class.view", "org.person.view", "plan.plan.view", "training.course.view", "program.content.view",
      "program.content.create", "resource.room.view", "schedule.lesson.view", "schedule.lesson.create",
      "schedule.booking.create", "session.attendance.view", "session.attendance.record", "assess.task.view",
      "assess.task.create", "assess.evaluation.create", "workflow.directive.respond", "workflow.message.send",
      "survey.response.submit"],
  },
  {
    code: "STUDENT", name: "Học sinh", portal: "hs", scope: "SELF", unitTypes: ["TRUONG"],
    permissions: ["program.content.view", "schedule.event.register", "session.attendance.view", "assess.task.view",
      "assess.task.submit", "survey.response.submit"],
  },
  {
    code: "GUARDIAN", name: "Phụ huynh", portal: "ph", scope: "LINKED", unitTypes: ["PLATFORM"],
    permissions: ["org.child.view", "iam.guardian.request", "schedule.event.register", "workflow.message.send",
      "survey.response.submit"],
  },
  {
    code: "PROVIDER_ADMIN", name: "Quản trị nhà cung cấp", portal: "ncc", scope: "GRANT", unitTypes: ["NCC"],
    permissions: ["org.provider.manage", "iam.account.view", "iam.account.manage", "training.course.view",
      "training.course.manage", "program.content.view", "program.content.create", "resource.ticket.handle",
      "report.dashboard.view", "report.submission.create", "survey.response.submit"],
  },
  {
    code: "PROVIDER_EXPERT", name: "Chuyên gia nhà cung cấp", portal: "ncc", scope: "GRANT", unitTypes: ["NCC"],
    permissions: ["training.course.view", "training.course.manage", "program.content.view", "program.content.create",
      "resource.ticket.handle", "report.dashboard.view"],
  },
];

export const ROLE_BY_CODE: Record<string, RoleDef> = Object.fromEntries(SYSTEM_ROLES.map((r) => [r.code, r]));

export const PORTAL_LABEL: Record<Portal, string> = {
  platform: "Quản trị nền tảng",
  so: "Cấp Sở",
  truong: "Trường học",
  to: "Tổ chuyên môn",
  gv: "Giáo viên",
  hs: "Học sinh",
  ph: "Phụ huynh",
  ncc: "Nhà cung cấp",
};
