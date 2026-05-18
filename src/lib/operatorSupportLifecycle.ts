/**
 * Red Hat OpenShift Operator support phases and published milestone dates.
 * Phase names and milestone labels follow the operator life cycle policy tables
 * (Full support ends, Maintenance ends, EUS ends, EUS Term 2/3 ends).
 *
 * @see https://access.redhat.com/support/policy/updates/openshift_operators
 */

export const RH_OPERATOR_LC_DOC_URL =
  "https://access.redhat.com/support/policy/updates/openshift_operators";

/** OpenShift cluster (OCP) version support policy — use with operator dates in context. */
export const RH_OPENSHIFT_CLUSTER_LIFECYCLE_URL =
  "https://access.redhat.com/support/policy/updates/openshift";

/** Product / life cycle lookup (Customer Portal). */
export const RH_PRODUCT_LIFE_CYCLES_URL = "https://access.redhat.com/product-life-cycles";

/** In-policy names for the operator’s current support period (see RH operator life cycle tables). */
export type SupportPhase =
  | "Full support"
  | "Maintenance support"
  | "EUS"
  | "EUS Term 2"
  | "EUS Term 3"
  | "End of life"
  | "Unsupported";

export type OperatorSupportLifecycle = {
  /** Policy column “Full support ends” (date when full support ends for this operator version line). */
  fullSupportEndDate?: string;
  /** Policy column “Maintenance ends”. */
  maintenanceEndDate?: string;
  /** Policy column “EUS ends” (first extended update support term, when applicable). */
  eus1EndDate?: string;
  /** Policy column “EUS Term 2 ends” (when applicable). */
  eus2EndDate?: string;
  /** Policy column “EUS Term 3 ends” (when applicable). */
  eus3EndDate?: string;
  /** Final end of support after all published terms; if omitted with no EUS, defaults to maintenance end for comparisons. */
  eolEndDate?: string;
};

/** Parses prototype date strings like "Nov 13, 2025" reliably across environments. */
export function parseSupportEndDateMs(supportEndDate?: string): number | undefined {
  if (!supportEndDate || supportEndDate === "—") return undefined;
  const trimmed = supportEndDate.trim();
  let parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  const mdy = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (mdy) {
    parsed = Date.parse(`${mdy[1]} ${mdy[2]}, ${mdy[3]}`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    parsed = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return parsed;
  }
  return undefined;
}

export function formatLifecycleDateShort(raw?: string): string {
  if (!raw || raw === "—") return "—";
  const ms = parseSupportEndDateMs(raw);
  if (ms === undefined) return raw;
  return new Date(ms).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function getDerivedSupportPhase(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): SupportPhase {
  if (op.isUnsupported) return "Unsupported";
  const L = op.supportLifecycle;
  if (!L) return "Unsupported";

  const m = (s?: string) => parseSupportEndDateMs(s);
  const full = m(L.fullSupportEndDate);
  const maint = m(L.maintenanceEndDate);
  const e1 = m(L.eus1EndDate);
  const e2 = m(L.eus2EndDate);
  const e3 = m(L.eus3EndDate);
  const eol = m(L.eolEndDate ?? L.maintenanceEndDate);

  if (eol !== undefined && nowMs >= eol) return "End of life";
  if (full !== undefined && nowMs < full) return "Full support";
  if (maint !== undefined && nowMs < maint) return "Maintenance support";

  const hasEus = e1 !== undefined || e2 !== undefined || e3 !== undefined;
  if (!hasEus) {
    if (maint !== undefined && nowMs >= maint) return "End of life";
    return "Maintenance support";
  }

  if (e1 !== undefined && nowMs < e1) return "EUS";
  if (e2 !== undefined && nowMs < e2) return "EUS Term 2";
  if (e3 !== undefined && nowMs < e3) return "EUS Term 3";

  return "End of life";
}

export function getPhaseBadgeType(phase: SupportPhase): "success" | "warning" | "danger" {
  switch (phase) {
    case "Full support":
    case "EUS":
      return "success";
    case "Maintenance support":
    case "EUS Term 2":
    case "EUS Term 3":
      return "warning";
    case "End of life":
    case "Unsupported":
      return "danger";
    default:
      return "success";
  }
}

export function getSupportLifecycleSortTimestamp(op: {
  isUnsupported?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): number {
  if (op.isUnsupported) return Number.MAX_SAFE_INTEGER - 2;
  const L = op.supportLifecycle;
  if (!L) return Number.MAX_SAFE_INTEGER - 1;
  const eol = parseSupportEndDateMs(L.eolEndDate ?? L.maintenanceEndDate);
  if (eol !== undefined) return eol;
  return Number.MAX_SAFE_INTEGER - 1;
}

/** Lifecycle progression order for Support phase column sort (not alphabetical). */
const SUPPORT_PHASE_SORT_RANK: Record<SupportPhase, number> = {
  "Full support": 0,
  "Maintenance support": 1,
  EUS: 2,
  "EUS Term 2": 3,
  "EUS Term 3": 4,
  "End of life": 5,
  Unsupported: 6,
};

/** Rank for sorting the Support phase column; lower = earlier in ascending “healthiest first” order. */
export function getSupportPhaseSortRank(
  op: Pick<
    { supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean; isOlmV1Extension?: boolean },
    "supportLifecycle" | "isUnsupported" | "isOlmV1Extension"
  >
): number {
  if (op.isOlmV1Extension) return 99;
  return SUPPORT_PHASE_SORT_RANK[getDerivedSupportPhase(op)];
}

/** Maps lifecycle phase to PatternFly Label `status` (semantic color + icon). */
export function getPhaseLabelStatus(phase: SupportPhase): "success" | "warning" | "danger" {
  switch (phase) {
    case "Full support":
    case "EUS":
      return "success";
    case "Maintenance support":
    case "EUS Term 2":
    case "EUS Term 3":
      return "warning";
    case "End of life":
    case "Unsupported":
      return "danger";
    default:
      return "success";
  }
}

/**
 * Raw published date string for when the operator’s current {@link getDerivedSupportPhase} ends
 * (full support end, maintenance end, EUS milestone, or final EOL as applicable).
 */
export function getCurrentPhaseEndDateRaw(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): string | undefined {
  if (op.isUnsupported) return undefined;
  const L = op.supportLifecycle;
  if (!L) return undefined;
  const phase = getDerivedSupportPhase(op, nowMs);
  switch (phase) {
    case "Full support":
      return L.fullSupportEndDate;
    case "Maintenance support":
      return L.maintenanceEndDate;
    case "EUS":
      return L.eus1EndDate;
    case "EUS Term 2":
      return L.eus2EndDate;
    case "EUS Term 3":
      return L.eus3EndDate;
    case "End of life":
      return L.eolEndDate ?? L.maintenanceEndDate;
    case "Unsupported":
    default:
      return undefined;
  }
}

/** Timestamp for sorting the “Current phase end date” column; missing dates sort last (asc). */
export function getCurrentPhaseEndSortTimestamp(op: {
  isUnsupported?: boolean;
  isOlmV1Extension?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): number {
  if (op.isOlmV1Extension) return Number.MAX_SAFE_INTEGER - 1;
  const raw = getCurrentPhaseEndDateRaw(op);
  const ms = raw ? parseSupportEndDateMs(raw) : undefined;
  return ms ?? Number.MAX_SAFE_INTEGER;
}

/** Within this many days of the current phase end, maintenance / ELC dates surface as warning (stakeholder UX). */
export const OPERATOR_PHASE_END_WARNING_DAYS = 90;

const MS_PER_DAY = 86_400_000;

/** Days from now until the end of the operator’s current published phase (floor); negative if past. */
export function getDaysUntilCurrentPhaseEnd(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): number | undefined {
  const raw = getCurrentPhaseEndDateRaw(op, nowMs);
  if (!raw) return undefined;
  const end = parseSupportEndDateMs(raw);
  if (end === undefined) return undefined;
  return Math.floor((end - nowMs) / MS_PER_DAY);
}

/** EUS milestones (policy “EUS ends”, “EUS Term 2/3 ends”) — stakeholder “Extended life cycle” bucket. */
export function isExtendedLifeCyclePhase(phase: SupportPhase): boolean {
  return phase === "EUS" || phase === "EUS Term 2" || phase === "EUS Term 3";
}

/** Urgency for the current phase end date label (Installed Operators planning cues). */
export type PhaseDateLabelUrgency = "success" | "warning" | "danger" | "default";

/**
 * Stakeholder rules: full support → success; maintenance or extended life cycle with ≤90 days to
 * phase end → warning; end of life / unsupported → danger; otherwise default (grey) for
 * maintenance/ELC with more runway.
 */
export function getCurrentPhaseDateLabelUrgency(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): PhaseDateLabelUrgency {
  const phase = getDerivedSupportPhase(op, nowMs);
  if (phase === "End of life" || phase === "Unsupported") return "danger";
  if (phase === "Full support") return "success";

  const days = getDaysUntilCurrentPhaseEnd(op, nowMs);
  const inMaintenanceOrElc = phase === "Maintenance support" || isExtendedLifeCyclePhase(phase);
  if (inMaintenanceOrElc && days !== undefined && days <= OPERATOR_PHASE_END_WARNING_DAYS && days >= 0) {
    return "warning";
  }
  return "default";
}

/** Rows for a PatternFly DescriptionList (policy-aligned labels). */
export function getSupportLifecycleDateEntries(op: {
  isUnsupported?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): { term: string; description: string }[] {
  if (op.isUnsupported) return [];
  const L = op.supportLifecycle;
  if (!L) return [];

  const rows: { term: string; description: string }[] = [];
  if (L.fullSupportEndDate) {
    rows.push({ term: "Full support ends", description: formatLifecycleDateShort(L.fullSupportEndDate) });
  }
  if (L.maintenanceEndDate) {
    rows.push({ term: "Maintenance ends", description: formatLifecycleDateShort(L.maintenanceEndDate) });
  }
  if (L.eus1EndDate) rows.push({ term: "EUS ends", description: formatLifecycleDateShort(L.eus1EndDate) });
  if (L.eus2EndDate) rows.push({ term: "EUS Term 2 ends", description: formatLifecycleDateShort(L.eus2EndDate) });
  if (L.eus3EndDate) rows.push({ term: "EUS Term 3 ends", description: formatLifecycleDateShort(L.eus3EndDate) });
  const eol = L.eolEndDate ?? L.maintenanceEndDate;
  if (eol) {
    rows.push({ term: "End of life (no further support)", description: formatLifecycleDateShort(eol) });
  }
  return rows;
}
