import {
  FormEvent,
  useState,
} from "react";

import {
  Navigate,
} from "react-router";

import {
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  DesignSystemButton,
  DesignSystemInput,
} from "../design-system";

import { useAuth } from "../auth/useAuth";

export function Login() {
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

  /*
   * Keep one redirect path only.
   * Once AuthProvider updates `user`, React Router
   * moves to the dashboard.
   */
  if (!loading && user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleLogin(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result =
        await signIn(
          email.trim(),
          password
        );

      if (result.error) {
        setError(
          "Invalid email or password."
        );
      }

      /*
       * Do not call navigate() here.
       * Successful authentication updates `user`
       * in AuthProvider, and the Navigate above
       * handles the transition once.
       */
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ds-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-card)] p-8 shadow-sm">

        <div className="mb-8 text-center">
          <div className="mb-2 text-2xl font-semibold text-[var(--ds-text-brand)]">
            GEOJIT
          </div>

          <h1 className="ds-title-2">
            Communication Studio
          </h1>

          <p className="ds-body-sm mt-2">
            Sign in with your authorised account.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <DesignSystemInput
            type="email"
            label="Email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
            autoComplete="email"
            placeholder="yourname@geojit.com"
            leadingIcon={
              <Mail />
            }
          />

          <DesignSystemInput
            type="password"
            label="Password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            required
            autoComplete="current-password"
            placeholder="Enter password"
            leadingIcon={
              <LockKeyhole />
            }
          />

          {error && (
            <div className="ds-alert ds-alert-error text-sm">
              {error}
            </div>
          )}

          <DesignSystemButton
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            disabled={
              submitting
            }
            loading={
              submitting
            }
            loadingLabel="Signing in..."
          >
            Sign In
          </DesignSystemButton>
        </form>
      </div>
    </div>
  );
}
