import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  TopNavBar,
} from "../components/TopNavBar";

export function GuidedReady() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  function handleBack() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided/brief?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>

          <p className="text-sm font-medium text-[#07877B]">
            Guided Creation
          </p>

          <h1 className="mt-2 text-3xl text-gray-900">
            Your guided brief is ready
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
            We've saved the idea, audience,
            purpose, personalisation and
            selected channels. The next
            implementation will use this
            governed brief to create
            channel-specific communication
            options.
          </p>

          <div className="mt-6 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[#07877B]" />

              <p className="text-sm leading-6 text-gray-700">
                Nothing has been sent to the
                existing Expert generation
                workflow yet. This keeps the
                current application protected
                while we build multi-channel
                generation in the next
                checkpoint.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleBack
            }
            className="mt-7 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guided Brief
          </button>

        </div>
      </main>
    </div>
  );
}
