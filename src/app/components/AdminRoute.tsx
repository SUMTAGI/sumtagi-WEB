import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../lib/useAuth";

// ProtectedRoute의 자식으로만 사용한다 — 로그인 여부 자체는 ProtectedRoute가
// 이미 보장하므로, 여기서는 admin 여부만 추가로 검사한다(로그인 리다이렉트
// 로직을 중복 구현하지 않기 위함). 실제 승인/반려 권한의 최종 보안선은
// approve_host_application/reject_host_application RPC 내부의 auth.uid()
// 검증이며, 이 라우트 가드는 어디까지나 UI 노출을 막는 역할일 뿐이다.
export function AdminRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-[calc(100dvh-64px)] lg:h-[calc(100vh-72px)] flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="권한 확인 중"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/my" replace />;
  }

  return <Outlet />;
}
