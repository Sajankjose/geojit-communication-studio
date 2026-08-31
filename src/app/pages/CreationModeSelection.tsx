import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  TopNavBar,
} from "../components/TopNavBar";

type CreationMode =
  | "guided"
  | "expert";

export function CreationModeSelection() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  function handleBack() {
    navigate("/");
  }

  function handleSelect(
    mode:
      CreationMode
  ) {
    if (
      !communicationId
    ) {
      navigate("/");
      return;
    }

    const communicationParam =
      `communicationId=${encodeURIComponent(
        communicationId
      )}`;

    if (
      mode ===
      "guided"
    ) {
      navigate(
        `/create/guided?${communicationParam}`
      );

      return;
    }

    navigate(
      `/create/category?${communicationParam}`
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <button
          type="button"
          onClick={
            handleBack
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B]"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back to Dashboard
        </button>

        <header className="mb-9 max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-[#07877B]"
              aria-hidden="true"
            />

            <p className="text-sm font-medium text-[#07877B]">
              Create Communication
            </p>
          </div>

          <h1 className="text-3xl leading-tight text-gray-900 sm:text-4xl">
            How would you like to start?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Both paths follow the same Geojit governance and approval process.
            Choose based on how much structure you already have when you begin.
          </p>
        </header>

        {!communicationId && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            Communication ID is missing. Please return to the Dashboard and start a new communication.
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid lg:grid-cols-2">
            <ModeOption
              mode="guided"
              title="Guided Creation"
              description="Start with your idea in your own words. Communication Studio helps shape it into a clear brief and adapt it for the channels you need."
              label="Recommended for most communications"
              icon={
                Sparkles
              }
              benefits={[
                "Start from a rough idea or customer insight",
                "Turn your intent into a clear communication brief",
                "Create channel-specific Email, WhatsApp and Leaflet options",
              ]}
              actionLabel="Start Guided Creation"
              disabled={
                !communicationId
              }
              onSelect={() =>
                handleSelect(
                  "guided"
                )
              }
            />

            <ModeOption
              mode="expert"
              title="Expert Creation"
              description="Use the structured workflow when the communication category, source information and content requirements are already clear."
              label="For structured inputs"
              icon={
                FileText
              }
              benefits={[
                "Choose the communication category first",
                "Enter structured, category-specific details",
                "Continue through option selection and preview",
              ]}
              actionLabel="Start Expert Creation"
              disabled={
                !communicationId
              }
              onSelect={() =>
                handleSelect(
                  "expert"
                )
              }
              bordered
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0] text-[#07877B]">
              <Check
                className="h-4 w-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                Different starting points. Same governance.
              </p>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                Whichever path you choose, the communication follows the same
                brand, content-quality and approval checks before it can move
                forward.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


function ModeOption({
  mode,
  title,
  description,
  label,
  icon:
    Icon,
  benefits,
  actionLabel,
  onSelect,
  disabled,
  bordered = false,
}: {
  mode:
    CreationMode;

  title:
    string;

  description:
    string;

  label:
    string;

  icon:
    typeof Sparkles;

  benefits:
    string[];

  actionLabel:
    string;

  onSelect:
    () => void;

  disabled:
    boolean;

  bordered?:
    boolean;
}) {
  const guided =
    mode ===
    "guided";

  return (
    <article
      aria-labelledby={`${mode}-creation-title`}
      className={`flex flex-col px-6 py-7 sm:px-8 sm:py-8 lg:min-h-[470px] ${
        bordered
          ? "border-t border-gray-200 lg:border-l lg:border-t-0"
          : ""
      } ${
        guided
          ? "bg-[#fbfefd]"
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            guided
              ? "bg-[#dff2ef] text-[#07877B]"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
            guided
              ? "bg-[#e8f5f4] text-[#075f58]"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="mt-7">
        <h2
          id={`${mode}-creation-title`}
          className="text-2xl text-gray-900"
        >
          {title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-600">
          {description}
        </p>
      </div>

      <div className="mt-7 space-y-3">
        {benefits.map(
          (
            benefit
          ) => (
            <div
              key={
                benefit
              }
              className="flex items-start gap-3"
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  guided
                    ? "bg-[#e8f5f4] text-[#07877B]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Check
                  className="h-3 w-3"
                  aria-hidden="true"
                />
              </div>

              <p className="text-sm leading-6 text-gray-600">
                {benefit}
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={
            onSelect
          }
          disabled={
            disabled
          }
          aria-describedby={`${mode}-creation-title`}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            guided
              ? "bg-[#07877B] text-white shadow-sm hover:bg-[#06766a]"
              : "border border-gray-300 bg-white text-gray-800 hover:border-[#9bcfc9] hover:bg-[#f3fbfa]"
          }`}
        >
          {actionLabel}
          <ArrowRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}
