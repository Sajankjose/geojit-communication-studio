import {
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  TopNavBar,
} from "../components/TopNavBar";

export function CreationModeSelection() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  function handleGuidedCreation() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  function handleExpertCreation() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/category?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-16">

        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium text-[#07877B]">
            Create Communication
          </p>

          <h1 className="text-3xl text-gray-900">
            How would you like to create?
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Choose the approach that works
            best for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Guided Creation */}

          <button
            type="button"
            onClick={handleGuidedCreation}
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-[#07877B] hover:shadow-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f5f4]">
              <Sparkles className="h-6 w-6 text-[#07877B]" />
            </div>

            <h2 className="text-xl text-gray-900">
              Guided Creation
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Have an idea but not sure how
              to structure it? AI will help
              you shape the idea into a clear
              communication.
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[#07877B]">
              Start Guided
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Expert Creation */}

          <button
            type="button"
            onClick={handleExpertCreation}
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-[#07877B] hover:shadow-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <SlidersHorizontal className="h-6 w-6 text-gray-700" />
            </div>

            <h2 className="text-xl text-gray-900">
              Expert Creation
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Know what you want to create?
              Continue with the structured
              communication workflow and
              provide the required details.
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[#07877B]">
              Start Expert
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

        </div>

      </main>
    </div>
  );
}
