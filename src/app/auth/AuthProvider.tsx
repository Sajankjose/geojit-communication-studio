import {
  createContext,
  ReactNode,
  useEffect,
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, department, designation, role"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      setProfile(null);
      return;
    }

    setProfile(data as UserProfile);
  }

  useEffect(() => {
    async function initialiseAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
    }

    initialiseAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(
    email: string,
    password: string
  ) {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    return {
      error: error?.message ?? null,
    };
  }

  async function signOut() {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setProfile(null);
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
