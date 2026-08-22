import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  renderEmailHtml,
} from "../email/renderEmailHtml";

interface SnapshotItem {
  label: string;
  value: string;
}

interface EmailSection {
  type:
    | "text"
    | "bullets"
    | "snapshot"
    | "highlight"
    | "steps"
    | "timeline"
    | "note";
  title?: string;
  content?: string;
  items?: Array<
    string | SnapshotItem
  >;
}

interface EmailContentData {
  variant_name?: string;
  strategy?: string;

  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };

  body?: {
    intro?: string;
    sections?: EmailSection[];
    closing?: string;
  };

  disclaimer?: {
    required?: boolean;
    type?: string;
    text?: string;
  };

  compliance?: {
    status?: string;
    flags?: string[];
    notes?: string[];
  };
}

interface EmailPreviewProps {
  category?: string;
  subject: string;
  preheader: string;

  contentData:
    | EmailContentData
    | null;

  cta: {
    enabled: boolean;
    label: string;
    url: string;
  };
}

/**
 * EmailPreview
 *
 * IMPORTANT:
 * The preview must use the SAME HTML renderer as the
 * downloaded email.
 *
 * This ensures:
 * - Full Preview = Downloaded HTML
 * - same header/footer
 * - same Geojit Ideas card
 * - same recommendation pill
 * - same financial formatting
 * - same client-facing filtering
 * - same disclaimer handling
 * - same spacing, typography and colours
 *
 * Do not recreate the email using React/Tailwind here.
 * renderEmailHtml() is the single source of truth.
 */
export function EmailPreview({
  category = "research",
  subject,
  preheader,
  contentData,
  cta,
}: EmailPreviewProps) {
  const iframeRef =
    useRef<HTMLIFrameElement | null>(
      null
    );

  const html = useMemo(
    () =>
      renderEmailHtml({
        category,
        subject,
        preheader,

        contentData:
          contentData
            ? {
                hero:
                  contentData.hero,

                body:
                  contentData.body,

                disclaimer:
                  contentData.disclaimer,
              }
            : null,

        cta: {
          enabled:
            Boolean(
              cta.enabled
            ),

          label:
            cta.label || "",

          url:
            cta.url || "",
        },
      }),
    [
      category,
      subject,
      preheader,
      contentData,
      cta.enabled,
      cta.label,
      cta.url,
    ]
  );

  /**
   * Keep iframe height in sync with the email document.
   *
   * This avoids:
   * - inner scrollbars
   * - cropped footer
   * - unnecessary blank area
   */
  function resizeIframe() {
    const iframe =
      iframeRef.current;

    if (!iframe) {
      return;
    }

    try {
      const document =
        iframe.contentDocument;

      if (!document) {
        return;
      }

      const body =
        document.body;

      const root =
        document.documentElement;

      const height =
        Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          root?.clientHeight || 0,
          root?.scrollHeight || 0,
          root?.offsetHeight || 0
        );

      iframe.style.height =
        `${Math.max(
          height,
          500
        )}px`;
    } catch (error) {
      /**
       * srcDoc remains same-origin in our app,
       * but keep preview resilient if browser
       * behaviour changes.
       */
      console.warn(
        "Unable to resize email preview iframe:",
        error
      );
    }
  }

  /**
   * Recalculate after the generated HTML changes.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(
        resizeIframe,
        80
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [html]);

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-[#EEF1F4]
        shadow-sm
      "
    >
      <iframe
        ref={iframeRef}
        title="Email preview"
        srcDoc={html}
        onLoad={() => {
          resizeIframe();

          /**
           * Images such as the Geojit logo can finish loading
           * after the document load event. Re-measure once more.
           */
          window.setTimeout(
            resizeIframe,
            250
          );
        }}
        className="
          block
          w-full
          border-0
          bg-[#EEF1F4]
        "
        style={{
          minHeight:
            "500px",
        }}
      />
    </div>
  );
}
