import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage"));
const BookshelfPage = lazy(() => import("@/features/bookshelf/BookshelfPage"));
const ReaderPage = lazy(() => import("@/features/reader/ReaderPage"));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-xuan-paper">
      <span className="text-ink-dark/50">加载中…</span>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: (
          <Suspense fallback={<PageFallback />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "/register",
        element: (
          <Suspense fallback={<PageFallback />}>
            <RegisterPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={<PageFallback />}>
            <BookshelfPage />
          </Suspense>
        ),
      },
      {
        path: "/reader/:bookId",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReaderPage />
          </Suspense>
        ),
      },
    ],
  },
]);
