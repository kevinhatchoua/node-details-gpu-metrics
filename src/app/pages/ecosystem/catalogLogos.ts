/**
 * Brand logos via Simple Icons (MIT) SVGs on jsDelivr — no extra npm deps.
 * @see https://github.com/simple-icons/simple-icons
 */
const SI = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${slug}.svg`;

/** Known operator list entries → logo slug (Simple Icons) or full SVG URL. */
export const OPERATOR_LOGO_BY_ID: Record<string, string> = {
  "abot-operator": SI("redhat"),
  "airflow-helm": SI("apacheairflow"),
  "ansible-automation": SI("ansible"),
  "bare-metal-event": SI("redhatopenshift"),
  "camel-k": SI("apache"),
  "business-automation": SI("redhat"),
  "postgresql": SI("postgresql"),
  "mongodb": SI("mongodb"),
  "mysql": SI("mysql"),
  "redis": SI("redis"),
  "kafka-strimzi": SI("apachekafka"),
  "couchbase": SI("couchbase"),
  "jenkins": SI("jenkins"),
  "tekton": SI("tekton"),
  "jaeger": SI("jaeger"),
  "kiali": SI("istio"),
  "elasticsearch": SI("elasticsearch"),
  "fluentd": SI("fluentd"),
  "minio": SI("minio"),
  "rook-ceph": SI("ceph"),
  "metallb": SI("kubernetes"),
  "nginx-ingress": SI("nginx"),
  "istio": SI("istio"),
  "kong": SI("kong"),
  "datadog": SI("datadog"),
  "dynatrace": SI("dynatrace"),
  "newrelic": SI("newrelic"),
  "splunk": SI("splunk"),
  "vault-secrets": SI("vault"),
  "cert-manager": SI("letsencrypt"),
  "keycloak": SI("keycloak"),
  "gpu-operator": SI("nvidia"),
  "knative-serving": SI("knative"),
  "openfaas": SI("openfaas"),
  "kubevirt": SI("qemu"),
  "crossplane": SI("pulumi"),
  "argocd": SI("argo"),
  "gitops": SI("argo"),
  "nexus": SI("sonatype"),
  "harbor": SI("harbor"),
  "portworx": SI("netapp"),
  "argocd-operator-v1": SI("argo"),
  "prometheus-v1": SI("prometheus"),
  "cert-manager-v1": SI("letsencrypt"),
  "elastic-v1": SI("elastic"),
  "vault-v1": SI("vault"),
  "grafana-v1": SI("grafana"),
};

const HELM_ROTATION = [SI("helm"), SI("helm"), SI("kubernetes")];
const DEVFILE_ROTATION = [SI("go"), SI("nodedotjs"), SI("python"), SI("dotnet"), SI("openjdk")];
const TEMPLATE_ROTATION = [SI("apache"), SI("nginx"), SI("helm")];
const BUILDER_ROTATION = [SI("docker"), SI("podman"), SI("redhatopenshift")];
const GENERIC_ROTATION = [SI("kubernetes"), SI("redhatopenshift"), SI("helm")];

export type LogoCatalogType =
  | "builderImages"
  | "devfiles"
  | "helmCharts"
  | "operators"
  | "templates"
  | "event-sources"
  | "knative-serving"
  | "samples"
  | "shared-resources"
  | "cluster-addons"
  | "pipelines";

function indexFromId(id: string): number {
  const m = id.match(/-(\d+)$/);
  return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
}

export function catalogItemLogoSrc(id: string, catalogType: LogoCatalogType): string {
  const direct = OPERATOR_LOGO_BY_ID[id];
  if (direct) return direct;

  const i = indexFromId(id);
  switch (catalogType) {
    case "helmCharts":
      return HELM_ROTATION[i % HELM_ROTATION.length];
    case "devfiles":
      return DEVFILE_ROTATION[i % DEVFILE_ROTATION.length];
    case "templates":
      return TEMPLATE_ROTATION[i % TEMPLATE_ROTATION.length];
    case "builderImages":
      return BUILDER_ROTATION[i % BUILDER_ROTATION.length];
    default:
      return GENERIC_ROTATION[i % GENERIC_ROTATION.length];
  }
}
