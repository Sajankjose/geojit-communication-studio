import {
  createContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";

export type AppRole =
  | "creator"
  | "marketing_reviewer"
  | "corpcom_reviewer"
  | "admin";

export interface UserProfile {
  id: string;
  full_name: string | null;
  department: string | null;
  designation: string | null;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signOut: () => Promise<void>;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  // Prevent an older profile request from overwriting
  // the state after the active user has changed.
  const profileRequestId =
    useRef(0);

  async function loadProfile(
    userId: string
  ) {
    const requestId =
      ++profileRequestId.current;

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, department, designation, role"
      )
      .eq("id", userId)
      .single();

    // Ignore stale responses.
    if (
      requestId !==
      profileRequestId.current
    ) {
      return;
    }

    if (error) {
      console.error(
        "Profile load error:",
        error
      );

      setProfile(null);
      return;
    }

    setProfile(
      data as UserProfile
    );
  }

  useEffect(() => {
    let mounted = true;

    async function initialiseAuth() {
      try {
        const {
          data: {
            session:
              initialSession,
          },
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(
          initialSession
        );

        setUser(
          initialSession?.user ??
            null
        );

        if (
          initialSession?.user
        ) {
          await loadProfile(
            initialSession.user.id
          );
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Auth initialisation error:",
          error
        );

        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialiseAuth();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          newSession
        ) => {
          if (!mounted) {
            return;
          }

          setSession(
            newSession
          );

          setUser(
            newSession?.user ??
              null
          );

          if (!newSession?.user) {
            // Invalidate any in-flight profile request.
            profileRequestId.current +=
              1;

            setProfile(null);
            setLoading(false);
            return;
          }

          /*
           * IMPORTANT:
           * Do not await Supabase database calls directly
           * inside onAuthStateChange.
           *
           * Auth events are emitted while Supabase is handling
           * its internal auth state. Awaiting another Supabase
           * request here can delay / block signInWithPassword().
           *
           * Defer the profile query to the next task instead.
           */
          setLoading(true);

          window.setTimeout(
            () => {
              if (!mounted) {
                return;
              }

              void loadProfile(
                newSession.user.id
              ).finally(() => {
                if (mounted) {
                  setLoading(false);
                }
              });
            },
            0
          );

          // Avoid unused-variable lint warnings while retaining
          // the event parameter for easier debugging later.
          void event;
        }
      );

    return () => {
      mounted = false;

      // Invalidate any pending profile response.
      profileRequestId.current +=
        1;

      subscription.unsubscribe();
    };
  }, []);

  async function signIn(
    email: string,
    password: string
  ) {
    const {
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    return {
      error:
        error?.message ??
        null,
    };
  }

  async function signOut() {
    /*
     * The auth-state listener will clear user/session/profile.
     * Keeping the state changes there avoids maintaining two
     * separate sources of truth.
     */
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Sign out error:",
        error
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
