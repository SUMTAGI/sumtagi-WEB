import { Outlet } from "react-router";
import { Toaster } from "sonner";

const TOASTER_STYLE = {
  background: "white",
  color: "#111827",
  border: "none",
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" toastOptions={{ style: TOASTER_STYLE }} />
      <Outlet />
    </div>
  );
}
