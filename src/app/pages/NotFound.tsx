import { Link } from "react-router";
import { Home, Ship } from "lucide-react";

export function NotFound() {
  return (
    <div className="h-full flex items-center justify-center px-6 bg-white">
      <div className="text-center">
        <Ship className="w-20 h-20 text-blue-600 mx-auto mb-6 opacity-50" strokeWidth={2} />
        <h1 className="text-5xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">페이지를 찾을 수 없어요</h2>
        <p className="text-sm text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었어요.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform"
        >
          <Home className="w-5 h-5" strokeWidth={2} />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
