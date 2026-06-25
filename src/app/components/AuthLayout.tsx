import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { MobileFrame } from "./MobileFrame";

export function AuthLayout() {
  return (
    <MobileFrame>
      <div className="h-full bg-white overflow-y-auto">
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
        <Outlet />
      </div>
    </MobileFrame>
  );
}
