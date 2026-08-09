import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router";

import {
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";

export function Login() {
  const navigate = useNavigate();

  const {
    user,
    loading,
    signIn,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", {
        replace: true,
      });
    }
  }, [user, navigate]);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    const result =
      await signIn(
        email.trim(),
        password
      );

    setSubmitting(false);

    if (result.error) {
      setError(
        "Invalid email or password."
      );
      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">

          <div className="mb-2 text-2xl font-semibold text-[#07877B]">
            GEOJIT
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Communication Studio
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Sign in with your authorised account.
          </p>

        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
                placeholder="yourname@geojit.com"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[#07877B] focus:ring-2 focus:ring-[#07877B]/20"
              />

            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <div className="relative">

              <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[#07877B] focus:ring-2 focus:ring-[#07877B]/20"
              />

            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#07877B] px-5 py-3 font-medium text-white transition hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

      </div>
    </div>
  );
}
