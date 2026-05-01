import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "huiyi_auth";

interface StoredAuth {
  userId: number;
  username: string;
  avatar: string;
  signature: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredAuth;
        setState({
          status: "authenticated",
          userId: parsed.userId,
          username: parsed.username,
          avatar: parsed.avatar,
          signature: parsed.signature,
        });
      } catch {
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
