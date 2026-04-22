import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle, Loader2, Info, MoreVertical, AlertTriangle, X, Play, Pause, FileText } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";

type TabKey = "update-plan" | "active-update-plans" | "update-history";

interface UpdatingOperator {
  name: string;
  version: string;
  status: "Updating" | "Updated" | "Pending";
  compatibility: "compatible" | "incompatible";
  lastUpdated: string;
}

interface WorkerPool {
  pool: string;
  status: "Updating" | "Updated" | "Pending";
  version: string;
  compatibility: "compatible" | "incompatible";
}

const UPDATING_OPERATORS: UpdatingOperator[] = [
  { name: "Abot Operator-v3.0.0", version: "3.2.5", status: "Updating", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Airflow Helm Operator", version: "3.5", status: "Updating", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Ansible Automation Platform", version: "3.25", status: "Updating", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Bare Metal Event Relay", version: "1.2.0", status: "Pending", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Camel K Operator", version: "2.1.0", status: "Pending", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
];

const WORKER_POOLS: WorkerPool[] = [
  { pool: "worker-east", status: "Updating", version: "4.18.16", compatibility: "compatible" },
  { pool: "worker-west", status: "Pending", version: "4.18.15", compatibility: "compatible" },
];

export default function ClusterUpdateInProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const version = (location.state as any)?.version || "5.1.10";
  const [activeTab, setActiveTab] = useState<TabKey>("update-plan");

  const [operatorProgress, setOperatorProgress] = useState(0);
  const [controlProgress, setControlProgress] = useState(0);
  const [workerProgress, setWorkerProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);

  useEffect(() => {
    localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version, startedAt: Date.now() }));
  }, [version]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setControlProgress(p => Math.min(100, p + 1.5));
      setOperatorProgress(p => Math.min(100, p + 0.8));
      setWorkerProgress(p => {
        if (controlProgress > 40) return Math.min(100, p + 0.3);
        return p;
      });
    }, 300);
    return () => clearInterval(timer);
  }, [controlProgress, paused]);

  useEffect(() => {
    if (operatorProgress >= 100 && controlProgress >= 100 && workerProgress >= 100) {
      localStorage.removeItem("clusterUpdateInProgress");
      setTimeout(() => navigate("/administration/cluster-update/complete", { state: { version } }), 1200);
    }
  }, [operatorProgress, controlProgress, workerProgress, navigate, version]);

  const opPct = Math.round(operatorProgress);
  const cpPct = Math.round(controlProgress);
  const wnPct = Math.round(workerProgress);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "update-plan", label: "Update plan" },
    { key: "active-update-plans", label: "Active update plans" },
    { key: "update-history", label: "Update history" },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Breadcrumbs items={[
        { label: "Administration", path: "/administration/cluster-update" },
        { label: "Cluster Update" },
      ]}>

      <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px] mb-[16px]">
        Cluster Update
      </h1>

      <div className="border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] mb-[24px] flex gap-[0px]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "update-plan") return;
              navigate("/administration/cluster-update", { state: { tab: tab.key } });
            }}
            className={`px-[20px] py-[12px] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] border-0 bg-transparent cursor-pointer transition-colors relative ${
              activeTab === tab.key
                ? "text-[#151515] dark:text-white font-medium"
                : "text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-t-[2px]" />
            )}
          </button>
        ))}
      </div>

      {/* Estimated Update Time Banner */}
      <div className="rounded-[12px] border-2 border-[#0066cc] dark:border-[#4dabf7] bg-[#e7f1fa] dark:bg-[rgba(0,102,204,0.08)] px-[20px] py-[16px] mb-[24px]">
        <div className="flex items-start gap-[12px]">
          <Info className="size-[20px] text-[#0066cc] dark:text-[#4dabf7] shrink-0 mt-[2px]" />
          <div className="flex-1">
            <p className="text-[#151515] dark:text-white text-[16px] font-semibold font-['Red_Hat_Display:SemiBold',sans-serif] mb-[4px]">
              Estimated update time 2 hours 12 minutes
            </p>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[14px]">
              This is a rough estimate and will vary based on resource availability and usage.
            </p>
            <div className="flex items-center gap-[10px]">
              <button
                onClick={() => setPaused(!paused)}
                className="inline-flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[13px] px-[16px] py-[7px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                {paused ? <><Play className="size-[13px]" /> Resume update</> : <><Pause className="size-[13px]" /> Pause update</>}
              </button>
              <button
                onClick={() => setShowAbortModal(true)}
                className="bg-transparent text-[#c9190b] text-[13px] px-[16px] py-[7px] rounded-[999px] border border-[#c9190b] cursor-pointer hover:bg-[rgba(201,25,11,0.05)] transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Abort update
              </button>
              <button
                onClick={() => setShowLogsPanel(true)}
                className="inline-flex items-center gap-[5px] text-[#0066cc] dark:text-[#4dabf7] text-[13px] bg-transparent border-0 cursor-pointer hover:underline font-['Red_Hat_Text:Regular',sans-serif] font-medium ml-[4px] p-0">
                <FileText className="size-[13px]" /> View logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {paused && (
        <div className="flex items-center gap-[12px] bg-[#fdf7e7] dark:bg-[rgba(240,171,0,0.06)] border border-[#f0ab00] rounded-[8px] px-[16px] py-[12px] mb-[16px]">
          <AlertTriangle className="size-[16px] text-[#f0ab00] shrink-0" />
          <p className="text-[#795600] dark:text-[#dca614] text-[14px] font-['Red_Hat_Text:Regular',sans-serif]">
            <span className="font-medium">Update paused.</span> Progress has been halted. Click "Resume update" to continue.
          </p>
        </div>
      )}

      {/* Cluster ID */}
      <div className="mb-[24px]">
        <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Cluster ID</p>
        <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Mono:Regular',sans-serif]">b86leae3-b06c-4ab2-8fa7-54b89a2bf4b2</p>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-[24px] mb-[32px]">
        <ProgressSection label="Operators" percentage={opPct} />
        <ProgressSection label="Control Plane" percentage={cpPct} />
        <ProgressSection label="Worker Nodes" percentage={wnPct} />
      </div>

      {/* Operators on this cluster */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] mb-[24px] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
          <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Operators on this cluster</h2>
        </div>
        <table className="w-full text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-left text-[11px] text-[#6a6e73] dark:text-[#8a8d90] uppercase tracking-wide">
              <th className="px-[24px] py-[10px] font-medium">Name</th>
              <th className="px-[16px] py-[10px] font-medium">Status</th>
              <th className="px-[16px] py-[10px] font-medium">Version</th>
              <th className="px-[16px] py-[10px] font-medium">Cluster compatibility</th>
              <th className="px-[16px] py-[10px] font-medium">Last updated</th>
              <th className="px-[16px] py-[10px] font-medium w-[48px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {UPDATING_OPERATORS.map((op) => (
              <tr key={op.name} className="border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-[24px] py-[12px] font-medium text-[#151515] dark:text-white">{op.name}</td>
                <td className="px-[16px] py-[12px]">
                  <span className={`inline-flex items-center gap-[6px] text-[13px] ${op.status === "Updating" ? "text-[#0066cc] dark:text-[#4dabf7]" : op.status === "Updated" ? "text-[#3e8635]" : "text-[#6a6e73]"}`}>
                    {op.status === "Updating" && <Loader2 className="size-[14px] animate-spin" />}
                    {op.status === "Updated" && <CheckCircle className="size-[14px]" />}
                    {op.status}
                  </span>
                </td>
                <td className="px-[16px] py-[12px] font-mono text-[#4d4d4d] dark:text-[#b0b0b0]">{op.version}</td>
                <td className="px-[16px] py-[12px]">
                  <span className="inline-flex items-center gap-[4px] text-[12px] text-[#3e8635] border border-[#3e8635] rounded-[999px] px-[10px] py-[3px] bg-[rgba(62,134,53,0.04)]">
                    <CheckCircle className="size-[13px]" /> compatible
                  </span>
                </td>
                <td className="px-[16px] py-[12px] text-[#4d4d4d] dark:text-[#b0b0b0]">{op.lastUpdated}</td>
                <td className="px-[16px] py-[12px] text-center">
                  <button className="p-[4px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-colors bg-transparent border-0 cursor-pointer">
                    <MoreVertical className="size-[16px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Worker nodes on this cluster */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] mb-[32px] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
          <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Worker nodes on this cluster</h2>
        </div>
        <table className="w-full text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-left text-[11px] text-[#6a6e73] dark:text-[#8a8d90] uppercase tracking-wide">
              <th className="px-[24px] py-[10px] font-medium">Pool</th>
              <th className="px-[16px] py-[10px] font-medium">Status</th>
              <th className="px-[16px] py-[10px] font-medium">Version</th>
              <th className="px-[16px] py-[10px] font-medium">Cluster compatibility</th>
              <th className="px-[16px] py-[10px] font-medium w-[48px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {WORKER_POOLS.map((pool) => (
              <tr key={pool.pool} className="border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-[24px] py-[12px] font-medium text-[#151515] dark:text-white">{pool.pool}</td>
                <td className="px-[16px] py-[12px]">
                  <span className={`inline-flex items-center gap-[6px] text-[13px] ${pool.status === "Updating" ? "text-[#0066cc] dark:text-[#4dabf7]" : pool.status === "Updated" ? "text-[#3e8635]" : "text-[#6a6e73]"}`}>
                    {pool.status === "Updating" && <Loader2 className="size-[14px] animate-spin" />}
                    {pool.status === "Updated" && <CheckCircle className="size-[14px]" />}
                    {pool.status}
                  </span>
                </td>
                <td className="px-[16px] py-[12px] font-mono text-[#4d4d4d] dark:text-[#b0b0b0]">{pool.version}</td>
                <td className="px-[16px] py-[12px]">
                  <span className="inline-flex items-center gap-[4px] text-[12px] text-[#3e8635] border border-[#3e8635] rounded-[999px] px-[10px] py-[3px] bg-[rgba(62,134,53,0.04)]">
                    <CheckCircle className="size-[13px]" /> compatible
                  </span>
                </td>
                <td className="px-[16px] py-[12px] text-center">
                  <button className="p-[4px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-colors bg-transparent border-0 cursor-pointer">
                    <MoreVertical className="size-[16px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Abort cluster update */}
      <button
        onClick={() => setShowAbortModal(true)}
        className="bg-[#c9190b] hover:bg-[#a11309] text-white text-[14px] px-[20px] py-[9px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium"
      >
        Abort cluster update
      </button>
      </Breadcrumbs>

      {/* Abort Confirmation Modal */}
      {showAbortModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAbortModal(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-[460px] max-w-[90vw] overflow-hidden">
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <h3 className="text-[18px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Display:SemiBold',sans-serif]">Abort cluster update?</h3>
              <button onClick={() => setShowAbortModal(false)} className="bg-transparent border-0 cursor-pointer p-[4px] hover:bg-[rgba(0,0,0,0.05)] rounded-[4px]">
                <X className="size-[18px] text-[#6a6e73]" />
              </button>
            </div>
            <div className="px-[24px] py-[20px]">
              <div className="flex items-start gap-[12px] mb-[8px]">
                <AlertTriangle className="size-[20px] text-[#c9190b] shrink-0 mt-[2px]" />
                <div>
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[8px]">
                    <span className="font-medium">This action cannot be undone.</span> Aborting the update to <span className="font-mono font-medium">{version}</span> will:
                  </p>
                  <ul className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] pl-[16px] space-y-[4px] list-disc">
                    <li>Stop all in-progress operator updates</li>
                    <li>Halt control plane rollout</li>
                    <li>Cancel pending worker node updates</li>
                    <li>Roll back partially updated components to the previous version</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <button onClick={() => setShowAbortModal(false)}
                className="text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Cancel
              </button>
              <button onClick={() => { localStorage.removeItem("clusterUpdateInProgress"); navigate("/administration/cluster-update/failed", { state: { version } }); }}
                className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 bg-[#c9190b] hover:bg-[#a11309] text-white cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Abort update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Side Panel */}
      {showLogsPanel && <LogsPanel version={version} onClose={() => setShowLogsPanel(false)} />}
    </div>
  );
}

function ProgressSection({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[#0066cc] dark:text-[#4dabf7] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">
          {label}
        </span>
        <span className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">{percentage}%</span>
      </div>
      <div className="h-[8px] bg-[#e0e0e0] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0066cc] rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percentage, percentage > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

const LOG_ENTRIES = [
  { ts: "00:00:01", level: "info", msg: "ClusterVersion operator initiated update to {version}" },
  { ts: "00:00:02", level: "info", msg: "Setting desiredUpdate.version={version}, channel=fast-5.1" },
  { ts: "00:00:03", level: "info", msg: "Reconciling ClusterVersion: status=Progressing" },
  { ts: "00:00:05", level: "info", msg: "Downloading release image quay.io/openshift-release-dev/ocp-release:{version}-x86_64" },
  { ts: "00:00:12", level: "info", msg: "Release image verified. Signature OK." },
  { ts: "00:00:14", level: "info", msg: "Beginning control plane update…" },
  { ts: "00:00:16", level: "info", msg: "Updating kube-apiserver to {version}" },
  { ts: "00:00:24", level: "info", msg: "kube-apiserver rollout progressing (1/3 nodes updated)" },
  { ts: "00:00:38", level: "info", msg: "kube-apiserver rollout progressing (2/3 nodes updated)" },
  { ts: "00:00:52", level: "info", msg: "kube-apiserver rollout complete" },
  { ts: "00:01:01", level: "info", msg: "Updating kube-controller-manager to {version}" },
  { ts: "00:01:15", level: "info", msg: "kube-controller-manager rollout complete" },
  { ts: "00:01:20", level: "info", msg: "Updating kube-scheduler to {version}" },
  { ts: "00:01:32", level: "info", msg: "kube-scheduler rollout complete" },
  { ts: "00:01:35", level: "info", msg: "Updating etcd to {version}" },
  { ts: "00:01:55", level: "warn", msg: "etcd member etcd-master-2 slow: latency 218ms exceeds threshold" },
  { ts: "00:02:10", level: "info", msg: "etcd rollout complete" },
  { ts: "00:02:12", level: "info", msg: "Control plane update complete. Starting operator updates…" },
  { ts: "00:02:14", level: "info", msg: "Updating operator: Abot Operator-v3.0.0 → 3.2.5" },
  { ts: "00:02:20", level: "info", msg: "Updating operator: Airflow Helm Operator → 3.5" },
  { ts: "00:02:28", level: "info", msg: "Updating operator: Ansible Automation Platform → 3.25" },
  { ts: "00:02:35", level: "warn", msg: "Operator Bare Metal Event Relay: waiting for dependency resolution" },
  { ts: "00:02:48", level: "info", msg: "Operator Abot Operator-v3.0.0 update complete" },
  { ts: "00:03:02", level: "info", msg: "Operator Airflow Helm Operator update complete" },
  { ts: "00:03:10", level: "info", msg: "Operator Ansible Automation Platform update complete" },
  { ts: "00:03:18", level: "info", msg: "Beginning worker node updates…" },
  { ts: "00:03:20", level: "info", msg: "Cordoning worker-east-1. Draining pods…" },
  { ts: "00:03:45", level: "info", msg: "Worker worker-east-1 drained. Applying update…" },
  { ts: "00:04:10", level: "info", msg: "Worker worker-east-1 rebooting with new OS image" },
  { ts: "00:04:55", level: "info", msg: "Worker worker-east-1 update complete. Uncordoning." },
];

function LogsPanel({ version, onClose }: { version: string; onClose: () => void }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= LOG_ENTRIES.length) return;
    const timer = setTimeout(() => setVisibleCount(c => Math.min(LOG_ENTRIES.length, c + 1)), 800);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  const entries = LOG_ENTRIES.slice(0, visibleCount).map(e => ({
    ...e,
    msg: e.msg.replace(/\{version\}/g, version),
  }));

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[600px] max-w-[90vw] bg-[#1a1a1a] h-full flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.3)] animate-slide-in">
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.1)]">
          <h3 className="text-[16px] font-semibold text-white font-['Red_Hat_Display:SemiBold',sans-serif]">Update Logs — {version}</h3>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer p-[4px] hover:bg-[rgba(255,255,255,0.1)] rounded-[4px]">
            <X className="size-[18px] text-[#b0b0b0]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-[16px] font-['Red_Hat_Mono:Regular',monospace] text-[12px] leading-[20px]">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-[8px]">
              <span className="text-[#6a6e73] shrink-0 select-none">{entry.ts}</span>
              <span className={`shrink-0 w-[40px] font-medium ${entry.level === "warn" ? "text-[#f0ab00]" : entry.level === "error" ? "text-[#c9190b]" : "text-[#3e8635]"}`}>
                {entry.level.toUpperCase()}
              </span>
              <span className="text-[#e0e0e0]">{entry.msg}</span>
            </div>
          ))}
          {visibleCount < LOG_ENTRIES.length && (
            <div className="flex items-center gap-[6px] mt-[4px]">
              <Loader2 className="size-[12px] text-[#6a6e73] animate-spin" />
              <span className="text-[#6a6e73]">streaming…</span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
