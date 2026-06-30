import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { MapPin, Compass, Home as HomeIcon, Calendar, User, Bell, Ship } from "lucide-react";
import { Toaster } from "sonner";
import { useAuth } from "../../lib/useAuth";

const DESKTOP_NAV = [
  { to: "/",         label: "홈",       exact: true },
  { to: "/islands",  label: "섬 탐색"              },
  { to: "/travel",   label: "여행 계획"             },
  { to: "/community",label: "커뮤니티"              },
  { to: "/map",      label: "지도"                  },
];

const MOBILE_NAV = [
  { to: "/",       label: "홈",  Icon: HomeIcon, exact: true },
  { to: "/travel", label: "여행", Icon: Calendar               },
  { to: "/islands",label: "섬",  Icon: MapPin                  },
  { to: "/map",    label: "지도", Icon: Compass                 },
  { to: "/my",     label: "마이", Icon: User                    },
];

const TOASTER_STYLE = {
  background: "white",
  color: "#111827",
  border: "none",
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export function Layout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && !localStorage.getItem("hasSeenOnboarding") && location.pathname === "/") {
      navigate("/onboarding", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ style: TOASTER_STYLE }} />

      {/* ── Desktop Top Navigation ──────────────────────────────────────── */}
      <header
        className={`hidden lg:flex fixed top-0 inset-x-0 z-50 h-[72px] items-center px-8 transition-all duration-200 ${
          scrolled
            ? "bg-white shadow-sm border-b border-gray-200"
            : "bg-white border-b border-gray-100"
        }`}
      >
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 mr-12 shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Ship className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-bold text-gray-900 tracking-tight">
            섬여행
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center h-full flex-1 gap-8">
          {DESKTOP_NAV.map(({ to, label, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`relative h-full flex items-center text-[15px] font-medium transition-colors duration-150 ${
                  active
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" strokeWidth={2} />
              </Link>
              <Link
                to="/my"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────────────────── */}
      {/*
        Mobile  : fixed-height scrollable container sitting above bottom nav.
                  Replicates the old MobileFrame scroll behaviour.
        Desktop : natural document scroll; top-nav is fixed so we add pt-[72px].
      */}
      <main className="h-[calc(100dvh-64px)] overflow-y-auto overflow-x-hidden lg:h-auto lg:overflow-y-visible lg:overflow-x-hidden lg:pt-[72px]">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Navigation ────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around items-center">
          {MOBILE_NAV.map(({ to, label, Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={2} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
