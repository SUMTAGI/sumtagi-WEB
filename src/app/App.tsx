import { useEffect, useState } from 'react';
import { RouterProvider, useNavigate } from 'react-router';
import { router } from './routes';
import { Splash } from './components/Splash';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding && window.location.pathname === "/") {
      window.location.href = "/onboarding";
    }
  }, []);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return <RouterProvider router={router} />;
}