import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-xuan-paper">
        <span className="text-ink-dark/50">加载中…</span>
      </div>
    );
  }

  if (auth.status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
