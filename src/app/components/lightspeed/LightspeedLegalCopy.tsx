import { Content } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text.mjs";

/** Legal / PM-approved copy (OpenShift Lightspeed demo) — do not paraphrase for product-facing UI. */
export const LIGHTSPEED_IMPORTANT_NOTICE =
  "OpenShift Lightspeed can answer questions related to OpenShift. Do not include personal or business sensitive information in your input. Interactions with OpenShift Lightspeed may be reviewed and used to improve our products and services.";

export const LIGHTSPEED_AI_RESPONSE_FOOTER =
  "Always check AI/LLM generated responses for accuracy prior to use.";

export function LightspeedHeaderNotice() {
  return (
    <div
      className="ols-legal-header-notice"
      role="region"
      aria-label="Important notice about use of OpenShift Lightspeed"
    >
      <Content
        className={css(textStyles.fontSizeSm)}
        component="p"
        style={{ margin: 0 }}
      >
        {LIGHTSPEED_IMPORTANT_NOTICE}
      </Content>
    </div>
  );
}

export function LightspeedAiMessageFooter() {
  return (
    <p
      className="ols-legal-message-footer"
      style={{
        margin: "0.5rem 0 0 0",
        fontSize: "var(--pf-t--global--font--size--body--sm, 0.75rem)",
        lineHeight: 1.4,
        color: "var(--pf-t--global--text--color--subtle)",
      }}
    >
      {LIGHTSPEED_AI_RESPONSE_FOOTER}
    </p>
  );
}
