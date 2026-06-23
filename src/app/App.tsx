import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Splash } from "./components/Splash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

    if (!hasSeenOnboarding && window.location.pathname === "/") {
      window.location.href = "/onboarding";
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("OAuth callback URL 확인", window.location.href);
      console.log("search", window.location.search);
      console.log("hash", window.location.hash);

      try {
        const { data, error } = await supabase.auth.getSession();

        console.log("현재세션", data.session);
        console.log("세션에러", error);

        if (data.session?.user) {
          localStorage.setItem("user", JSON.stringify(data.session.user));
          localStorage.setItem("isLoggedIn", "true");
        }
      } catch (error) {
        console.error("initializeAuth 오류", error);
      } finally {
        setAuthInitializing(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("AUTH변경", _event, session);

        if (session?.user) {
          localStorage.setItem("user", JSON.stringify(session.user));
          localStorage.setItem("isLoggedIn", "true");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  if (authInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-700">
        인증 정보를 불러오는 중입니다...
      </div>
    );
  }

  return <RouterProvider router={router} />;
}