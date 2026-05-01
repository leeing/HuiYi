import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
      status: "authenticated";
      userId: number;
      username: string;
      avatar: string;
      signature: string;
    };

type AuthContextValue = AuthState & {
  login: (
    userId: number,
    username: string,
    avatar: string,
    signature: string,
  ) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "huiyi_auth";

const StoredAuthSchema = z.object({
  userId: z.number().describe("Numeric user ID from the backend"),
  username: z.string().describe("Display name of the authenticated user"),
  avatar: z.string().describe("URL or path to the user's avatar image"),
  signature: z.string().describe("User's personal signature or bio"),
});

type StoredAuth = z.infer<typeof StoredAuthSchema>;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = StoredAuthSchema.parse(JSON.parse(stored));
        setState({
          status: "authenticated",
          userId: parsed.userId,
          username: parsed.username,
          avatar: parsed.avatar,
          signature: parsed.signature,
        });
      } catch (err) {
        if (!(err instanceof SyntaxError) && !(err instanceof z.ZodError))
          throw err;
        localStorage.removeItem(STORAGE_KEY);
        setState({ status: "anonymous" });
      }
    } else {
      setState({ status: "anonymous" });
    }
  }, []);

  const login = useCallback(
    (userId: number, username: string, avatar: string, signature: string) => {
      const stored: StoredAuth = { userId, username, avatar, signature };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setState({
        status: "authenticated",
        userId,
        username,
        avatar,
        signature,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ status: "anonymous" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
