import {
  ArrowLeft,
  Home,
  Loader2,
  LogIn,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../auth/useAuth";

import {
  TopNavBar,
} from "../components/TopNavBar";


export function NotFoundPage() {
  const navigate =
    useNavigate();

  const {
    user,
    loading,
  } =
    useAuth();


  if (
    loading
  ) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background px-6"
      >
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2
            className="h-4 w-4 animate-spin text-[#07877B]"
            aria-hidden="true"
          />
          Loading...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {user && (
        <TopNavBar />
      )}

      <main className="mx-auto flex min-h-[78vh] max-w-3xl items-center justify-center px-6 py-12 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#07877B]">
            404
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            This page is not available
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
            The link may be outdated, incomplete, or no longer part of the
            current Communication Studio workflow.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  -1
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-[#07877B]/10"
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              Go Back
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  user
                    ? "/"
                    : "/login",
                  {
                    replace:
                      true,
                  }
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#06766a] focus:outline-none focus:ring-4 focus:ring-[#07877B]/15"
            >
              {user ? (
                <Home
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              ) : (
                <LogIn
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              )}

              {user
                ? "Back to Dashboard"
                : "Go to Sign In"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
