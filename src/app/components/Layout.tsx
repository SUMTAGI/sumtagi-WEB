import { Outlet, Link, useLocation } from "react-router";
import { MapPin, Compass, Home as HomeIcon, Calendar, User } from "lucide-react";
import { Toaster } from "sonner";
import { MobileFrame } from "./MobileFrame";

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <MobileFrame>
      <div className="h-full flex flex-col bg-gray-50">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              color: '#111827',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="bg-white border-t border-gray-200 px-2 py-2 flex-shrink-0">
          <div className="flex justify-around items-center">
            <Link
              to="/"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive("/") && location.pathname === "/"
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <HomeIcon className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">홈</span>
            </Link>
            <Link
              to="/travel"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive("/travel")
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <Calendar className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">여행</span>
            </Link>
            <Link
              to="/islands"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive("/islands")
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <MapPin className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">섬</span>
            </Link>
            <Link
              to="/map"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive("/map")
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <Compass className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">지도</span>
            </Link>
            <Link
              to="/my"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive("/my")
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <User className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">마이</span>
            </Link>
          </div>
        </nav>
      </div>
    </MobileFrame>
  );
}
