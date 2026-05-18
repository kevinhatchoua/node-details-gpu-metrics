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

/** Console 5.0 interim: customer-selected subscription tier (SKU-blind until OCPSTRAT-2957). */
export type SubscriptionEntitlementContext = "standard" | "premium-eus-term1" | "premium-extended-eus";

export const SUBSCRIPTION_ENTITLEMENT_OPTIONS: {
  value: SubscriptionEntitlementContext;
  label: string;
}[] = [
  { value: "standard", label: "Standard Subscription" },
  { value: "premium-eus-term1", label: "Premium Subscription (Includes EUS Term 1)" },
  { value: "premium-extended-eus", label: "Premium + Extended EUS (Includes Term 2/ Term 3)" },
];

export const LIFECYCLE_PUBLIC_SCHEDULE_DISCLAIMER =
  "Lifecycle dates (Support phase, End date) are based on PUBLIC product schedules and MAY NOT reflect your specific support entitlements. Always verify your account's exact SKU.";

export const PLATFORM_ALIGNED_EUS_MISMATCH_DISCLAIMER =
  "Operator EUS date mismatches current cluster alignment date. Verify alignment status.";

/** Cluster OCP version line dates for platform-aligned operator comparison (prototype). */
export type ClusterOcpLifecycleDates = {
  ocpVersionLabel: string;
  fullSupportEndDate: string;
  maintenanceEndDate: string;
  eus1EndDate?: string;
  eus2EndDate?: string;
  eus3EndDate?: string;
  eolEndDate?: string;
};

export function clusterLifecycleToOperatorLifecycle(
  cluster: ClusterOcpLifecycleDates
): OperatorSupportLifecycle {
  return {
    fullSupportEndDate: cluster.fullSupportEndDate,
    maintenanceEndDate: cluster.maintenanceEndDate,
    eus1EndDate: cluster.eus1EndDate,
    eus2EndDate: cluster.eus2EndDate,
    eus3EndDate: cluster.eus3EndDate,
    eolEndDate: cluster.eolEndDate ?? cluster.eus3EndDate ?? cluster.maintenanceEndDate,
  };
}

export type OperatorLifecycleEntitlementRow = {
  supportLifecycle?: OperatorSupportLifecycle;
  isUnsupported?: boolean;
  /** When false, row uses published operator dates only (Ansible, RHOAI, community, etc.). */
  isHpbuOwned?: boolean;
  isPlatformAligned?: boolean;
};

/** HPBU-owned operators follow the page entitlement control; others always use published operator dates. */
export function operatorResolvesEntitlementContext(op: OperatorLifecycleEntitlementRow): boolean {
  if (op.isUnsupported) return false;
  return op.isHpbuOwned !== false;
}

export function hasPlatformAlignedEusMismatch(
  op: OperatorLifecycleEntitlementRow,
  cluster: ClusterOcpLifecycleDates
): boolean {
  if (!op.isPlatformAligned || !op.supportLifecycle?.eus1EndDate || !cluster.eus1EndDate) {
    return false;
  }
  const opMs = parseSupportEndDateMs(op.supportLifecycle.eus1EndDate);
  const clusterMs = parseSupportEndDateMs(cluster.eus1EndDate);
  if (opMs === undefined || clusterMs === undefined) return false;
  return opMs !== clusterMs;
}

/** Lifecycle payload used for phase / urgency when aligned with cluster (no EUS mismatch). */
export function getLifecycleEvaluationRow<T extends OperatorLifecycleEntitlementRow>(
  op: T,
  cluster: ClusterOcpLifecycleDates
): T {
  if (op.isPlatformAligned && !hasPlatformAlignedEusMismatch(op, cluster)) {
    return { ...op, supportLifecycle: clusterLifecycleToOperatorLifecycle(cluster) };
  }
  return op;
}

export function getEntitlementAwareSupportPhase(
  op: OperatorLifecycleEntitlementRow,
  entitlement: SubscriptionEntitlementContext,
  nowMs: number = Date.now()
): SupportPhase {
  if (!operatorResolvesEntitlementContext(op)) {
    return getDerivedSupportPhase(op, nowMs);
  }
  if (entitlement === "premium-extended-eus") {
    return getDerivedSupportPhase(op, nowMs);
  }

  const L = op.supportLifecycle;
  if (!L) return "Unsupported";

  const full = parseSupportEndDateMs(L.fullSupportEndDate);
  const maint = parseSupportEndDateMs(L.maintenanceEndDate);
  const e1 = parseSupportEndDateMs(L.eus1EndDate);

  if (entitlement === "standard") {
    if (full !== undefined && nowMs < full) return "Full support";
    if (maint !== undefined && nowMs < maint) return "Maintenance support";
    return "End of life";
  }

  if (e1 === undefined) {
    if (full !== undefined && nowMs < full) return "Full support";
    if (maint !== undefined && nowMs < maint) return "Maintenance support";
    return "End of life";
  }

  const eol = parseSupportEndDateMs(L.eolEndDate ?? L.maintenanceEndDate);
  if (eol !== undefined && nowMs >= eol) return "End of life";
  if (full !== undefined && nowMs < full) return "Full support";
  if (maint !== undefined && nowMs < maint) return "Maintenance support";
  if (nowMs < e1) return "EUS";
  return "End of life";
}

export function getEntitlementAwarePhaseEndDateRaw(
  op: OperatorLifecycleEntitlementRow,
  entitlement: SubscriptionEntitlementContext,
  nowMs: number = Date.now()
): string | undefined {
  if (!operatorResolvesEntitlementContext(op)) {
    return getCurrentPhaseEndDateRaw(op, nowMs);
  }

  const phase = getEntitlementAwareSupportPhase(op, entitlement, nowMs);
  const L = op.supportLifecycle;
  if (!L) return undefined;

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
      if (entitlement === "standard") return L.maintenanceEndDate;
      if (entitlement === "premium-eus-term1") return L.eus1EndDate ?? L.maintenanceEndDate;
      return L.eolEndDate ?? L.maintenanceEndDate;
    case "Unsupported":
    default:
      return undefined;
  }
}

export function getEntitlementAwareDaysUntilPhaseEnd(
  op: OperatorLifecycleEntitlementRow,
  entitlement: SubscriptionEntitlementContext,
  nowMs: number = Date.now()
): number | undefined {
  const raw = getEntitlementAwarePhaseEndDateRaw(op, entitlement, nowMs);
  if (!raw) return undefined;
  const end = parseSupportEndDateMs(raw);
  if (end === undefined) return undefined;
  return Math.floor((end - nowMs) / MS_PER_DAY);
}

export function getEntitlementAwarePhaseDateLabelUrgency(
  op: OperatorLifecycleEntitlementRow,
  entitlement: SubscriptionEntitlementContext,
  nowMs: number = Date.now()
): PhaseDateLabelUrgency {
  if (!operatorResolvesEntitlementContext(op)) {
    return getCurrentPhaseDateLabelUrgency(op, nowMs);
  }

  const phase = getEntitlementAwareSupportPhase(op, entitlement, nowMs);
  if (phase === "End of life" || phase === "Unsupported") return "danger";
  if (phase === "Full support") return "success";

  const days = getEntitlementAwareDaysUntilPhaseEnd(op, entitlement, nowMs);
  const inWindow =
    phase === "Maintenance support" ||
    (entitlement !== "standard" && isExtendedLifeCyclePhase(phase));
  if (inWindow && days !== undefined && days <= OPERATOR_PHASE_END_WARNING_DAYS && days >= 0) {
    return "warning";
  }
  return "default";
}

export function getEntitlementAwarePhaseEndSortTimestamp(
  op: OperatorLifecycleEntitlementRow & { isOlmV1Extension?: boolean },
  entitlement: SubscriptionEntitlementContext
): number {
  if (op.isOlmV1Extension) return Number.MAX_SAFE_INTEGER - 1;
  const raw = getEntitlementAwarePhaseEndDateRaw(op, entitlement);
  const ms = raw ? parseSupportEndDateMs(raw) : undefined;
  return ms ?? Number.MAX_SAFE_INTEGER;
}

export function getEntitlementAwareSupportPhaseSortRank(
  op: OperatorLifecycleEntitlementRow & { isOlmV1Extension?: boolean },
  entitlement: SubscriptionEntitlementContext
): number {
  if (op.isOlmV1Extension) return 99;
  return SUPPORT_PHASE_SORT_RANK[getEntitlementAwareSupportPhase(op, entitlement)];
}

/** Milestone list for lifecycle popover — filtered by entitlement (no hidden EUS rows). */
export function getEntitlementAwareLifecycleDateEntries(
  op: OperatorLifecycleEntitlementRow,
  entitlement: SubscriptionEntitlementContext
): { term: string; description: string }[] {
  const all = getSupportLifecycleDateEntries(op);
  if (!operatorResolvesEntitlementContext(op)) return all;
  if (entitlement === "premium-extended-eus") return all;
  if (entitlement === "standard") return all.filter((row) => !row.term.includes("EUS"));
  return all.filter((row) => !row.term.includes("EUS Term 2") && !row.term.includes("EUS Term 3"));
}

/** Progress stepper segment from entitlement-aware phase (not calendar-only). */
export function getEntitlementAwareLifecycleTrackSegment(
  phase: SupportPhase,
  entitlement: SubscriptionEntitlementContext
): "full" | "maintenance" | "elc" | "eol" {
  if (entitlement === "premium-extended-eus") {
    if (phase === "End of life" || phase === "Unsupported") return "eol";
    if (phase === "Full support") return "full";
    if (phase === "Maintenance support") return "maintenance";
    return "elc";
  }
  if (entitlement === "premium-eus-term1") {
    if (phase === "EUS") return "elc";
    if (phase === "Full support") return "full";
    if (phase === "Maintenance support") return "maintenance";
    return "eol";
  }
  if (phase === "Full support") return "full";
  if (phase === "Maintenance support") return "maintenance";
  return "eol";
}
