import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Splash } from "./components/Splash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const upsertProfile = async (user: any) => {
    const metadata = user.user_metadata || {};

    const nickname =
      metadata.name ||
      metadata.full_name ||
      metadata.nickname ||
      metadata.preferred_username ||
      user.email?.split("@")[0] ||
      "사용자";

    const avatarUrl =
      metadata.avatar_url ||
      metadata.picture ||
      metadata.profile_image_url ||
      null;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      nickname,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("profiles 저장 실패:", error.message);
    }
  };

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

    if (!hasSeenOnboarding && window.location.pathname === "/") {
      window.location.href = "/onboarding";
    }
  }, []);

  useEffect(() => {
    const saveSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("세션 확인 실패:", error.message);
        return;
      }

      if (data.session?.user) {
        await upsertProfile(data.session.user);

        localStorage.setItem("user", JSON.stringify(data.session.user));
        localStorage.setItem("isLoggedIn", "true");

        if (
          window.location.pathname === "/login" ||
          window.location.pathname === "/auth/callback"
        ) {
          window.location.href = "/";
        }
      } else {
        localStorage.removeItem("user");
        localStorage.setItem("isLoggedIn", "false");
      }
    };

    saveSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await upsertProfile(session.user);

          localStorage.setItem("user", JSON.stringify(session.user));
          localStorage.setItem("isLoggedIn", "true");

          if (
            window.location.pathname === "/login" ||
            window.location.pathname === "/auth/callback"
          ) {
            window.location.href = "/";
          }
        } else {
          localStorage.removeItem("user");
          localStorage.setItem("isLoggedIn", "false");
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

  return <RouterProvider router={router} />;
}