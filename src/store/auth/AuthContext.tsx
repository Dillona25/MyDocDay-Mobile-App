import { getCurrentUser } from "@/api/auth/me";
import type { SignedInUser } from "@/api/auth/sign-in";
import {
  deleteSessionToken,
  getSessionToken,
  saveSessionToken,
} from "@/store/auth/token-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextValue = {
  user: SignedInUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  saveSession: (session: {
    token: string;
    user: SignedInUser;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredToken() {
      const storedToken = await getSessionToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(storedToken);

        setToken(storedToken);
        setUser(currentUser.user);
      } catch {
        await deleteSessionToken();
        queryClient.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredToken();
  }, [queryClient]);

  const saveSession = useCallback(
    async (session: { token: string; user: SignedInUser }) => {
      await saveSessionToken(session.token);
      queryClient.clear();
      setToken(session.token);
      setUser(session.user);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    queryClient.clear();
    setToken(null);
    setUser(null);
    await deleteSessionToken();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      saveSession,
      signOut,
    }),
    [isLoading, saveSession, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
