import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../lib/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-[calc(100dvh-64px)] lg:h-[calc(100vh-72px)] flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="로그인 상태 확인 중"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
