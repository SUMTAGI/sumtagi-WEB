import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Splash } from './components/Splash';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <RouterProvider router={router} />
      {showSplash && <Splash onComplete={() => setShowSplash(false)} />}
    </>
  );
}