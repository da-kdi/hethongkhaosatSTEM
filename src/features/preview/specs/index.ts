import type { Portal } from "@/domain/roles";
import type { PreviewSpec } from "../types";
import { ASSESS } from "./assess";
import { INTEGRATION } from "./integration";
import { ORG } from "./org";
import { PLAN } from "./plan";
import { PROGRAM } from "./program";
import { REPORT } from "./report";
import { RESOURCE } from "./resource";
import { SCHEDULE } from "./schedule";
import { SESSION } from "./session";
import { SURVEY } from "./survey";
import { TRAINING } from "./training";
import { WORKFLOW } from "./workflow";
import { EXTRA } from "./extra";

/** Khóa `cổng:slug` (riêng theo vai trò) hoặc `slug` (dùng chung) */
export const SPECS: Record<string, PreviewSpec> = {
  ...PLAN, ...TRAINING, ...PROGRAM, ...RESOURCE, ...ORG, ...SCHEDULE, ...SESSION, ...ASSESS, ...WORKFLOW, ...REPORT, ...SURVEY, ...INTEGRATION, ...EXTRA,
};

export function previewSpec(portal: Portal, slug: string): PreviewSpec | undefined {
  return SPECS[`${portal}:${slug}`] ?? SPECS[slug];
}
