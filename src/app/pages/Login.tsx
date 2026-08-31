import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import {
  useAuth,
} from "../auth/useAuth";


export function Login() {
  const navigate =
    useNavigate();

  const {
    user,
    loading:
      authLoading,
  } =
    useAuth();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    signingIn,
    setSigningIn,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  /**
   * If a valid session already exists, do not keep
   * the user on the login screen.
   */
  useEffect(() => {
    if (
      !authLoading &&
      user
    ) {
      navigate(
        "/",
        {
          replace:
            true,
        }
      );
    }
  }, [
    authLoading,
    user,
    navigate,
  ]);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      signingIn
    ) {
      return;
    }

    const normalizedEmail =
      email.trim();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setSigningIn(
        true
      );

      setError(
        ""
      );

      const {
        error:
          signInError,
      } =
        await supabase.auth.signInWithPassword({
          email:
            normalizedEmail,

          password,
        });

      if (
        signInError
      ) {
        throw signInError;
      }

      /**
       * AuthProvider will receive the new session.
       * Navigate immediately for a responsive login UX.
       */
      navigate(
        "/",
        {
          replace:
            true,
        }
      );
    } catch (
      err
    ) {
      console.error(
        "Login error:",
        err
      );

      setError(
        getLoginErrorMessage(
          err
        )
      );
    } finally {
      setSigningIn(
        false
      );
    }
  }


  if (
    authLoading ||
    user
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f9] px-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
          Preparing your workspace...
        </div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f9f9]">

      {/* subtle background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#e8f5f4] opacity-70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -right-48 h-[500px] w-[500px] rounded-full bg-[#eef7f6] opacity-80 blur-3xl"
      />


      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-[430px]">

          {/* Product identity */}
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5f4] text-[#07877B] ring-1 ring-[#d8ebe8]">
              <Sparkles
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#07877B]">
              Geojit
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Communication Studio
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
              AI-enabled communication creation with centralised governance.
            </p>
          </div>


          {/* Login card */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
              <h2 className="text-lg font-semibold text-gray-900">
                Sign in
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Use your authorised Communication Studio account.
              </p>
            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="px-6 py-6 sm:px-7"
            >
              <div className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      aria-invalid={
                        Boolean(
                          error
                        )
                      }
                      aria-describedby={
                        error
                          ? "login-error"
                          : undefined
                      }
                      value={
                        email
                      }
                      onChange={(
                        event
                      ) => {
                        setEmail(
                          event.target.value
                        );

                        if (
                          error
                        ) {
                          setError(
                            ""
                          );
                        }
                      }}
                      placeholder="yourname@geojit.com"
                      disabled={
                        signingIn
                      }
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>


                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      aria-invalid={
                        Boolean(
                          error
                        )
                      }
                      aria-describedby={
                        error
                          ? "login-error"
                          : undefined
                      }
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) => {
                        setPassword(
                          event.target.value
                        );

                        if (
                          error
                        ) {
                          setError(
                            ""
                          );
                        }
                      }}
                      placeholder="Enter password"
                      disabled={
                        signingIn
                      }
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:bg-gray-50 disabled:text-gray-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                      disabled={
                        signingIn
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>


                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                  >
                    {error}
                  </div>
                )}


                <button
                  type="submit"
                  disabled={
                    signingIn
                  }
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07877B] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#06766a] focus:outline-none focus:ring-4 focus:ring-[#07877B]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>


            <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:px-7">
              <div className="flex items-start gap-2.5">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#07877B]"
                  aria-hidden="true"
                />

                <p className="text-xs leading-5 text-gray-500">
                  Access is restricted to authorised users. Communication activity is governed through role-based access and approval controls.
                </p>
              </div>
            </div>
          </section>


          <p className="mt-5 text-center text-xs text-gray-400">
            Geojit Financial Services Ltd.
          </p>
        </div>
      </main>
    </div>
  );
}


function getLoginErrorMessage(
  error:
    unknown
) {
  if (
    error &&
    typeof error ===
      "object" &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message ===
      "string"
  ) {
    const message =
      (
        error as {
          message:
            string;
        }
      ).message;

    if (
      message
        .toLowerCase()
        .includes(
          "invalid login credentials"
        )
    ) {
      return "Incorrect email or password. Please check your credentials and try again.";
    }

    return message;
  }

  return "Unable to sign in. Please try again.";
}
