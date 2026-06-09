import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { subscribeAuth, signInWithGoogle, signOutUser, getIdToken } from "@/lib/firebase-client";

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      unsub = await subscribeAuth((u) => {
        setUser(u);
        setLoading(false);
      });
    })();
    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      loading,
      signIn: async () => {
        await signInWithGoogle();
      },
      signOut: async () => {
        await signOutUser();
      },
      getToken: getIdToken,
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}