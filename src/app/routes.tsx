import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AuthLayout } from "./components/AuthLayout";
import { Home } from "./pages/Home";
import { Travel } from "./pages/Travel";
import { Itinerary } from "./pages/Itinerary";
import { Islands } from "./pages/Islands";
import { MapPage } from "./pages/MapPage";
import { MyPage } from "./pages/MyPage";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ProfileEdit } from "./pages/ProfileEdit";
import { NotificationSettings } from "./pages/NotificationSettings";
import { PaymentMethods } from "./pages/PaymentMethods";
import { VisitedIslands } from "./pages/VisitedIslands";
import { Favorites } from "./pages/Favorites";
import { Reviews } from "./pages/Reviews";
import { ReviewDetail } from "./pages/ReviewDetail";
import { Notifications } from "./pages/Notifications";
import { CreateTrip } from "./pages/CreateTrip";
import { NotFound } from "./pages/NotFound";
import { IslandDetail } from "./pages/IslandDetail";
import { Experiences, ExperienceDetail } from "./pages/Experiences";
import { Checklist } from "./pages/Checklist";
import { Budget } from "./pages/Budget";
import { Community } from "./pages/Community";
import { CommunityWrite } from "./pages/CommunityWrite";
import { Packages } from "./pages/Packages";
import { Events } from "./pages/Events";
import { Emergency } from "./pages/Emergency";
import { Schedule } from "./pages/Schedule";
import { Coupons } from "./pages/Coupons";
import { Diary } from "./pages/Diary";
import { GroupTrip } from "./pages/GroupTrip";
import { GroupJoin } from "./pages/GroupJoin";
import { AppSettings } from "./pages/AppSettings";
import { Support } from "./pages/Support";

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    Component: AuthLayout,
    children: [
      { index: true, Component: Onboarding },
    ],
  },
  {
    path: "/login",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
    ],
  },
  {
    path: "/signup",
    Component: AuthLayout,
    children: [
      { index: true, Component: Signup },
    ],
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "travel", Component: Travel },
      { path: "itinerary/:id", Component: Itinerary },
      { path: "islands", Component: Islands },
      { path: "island/:id", Component: IslandDetail },
      { path: "map", Component: MapPage },
      { path: "my", Component: MyPage },
      { path: "profile-edit", Component: ProfileEdit },
      { path: "notification-settings", Component: NotificationSettings },
      { path: "payment-methods", Component: PaymentMethods },
      { path: "visited-islands", Component: VisitedIslands },
      { path: "favorites", Component: Favorites },
      { path: "reviews", Component: Reviews },
      { path: "review/:id", Component: ReviewDetail },
      { path: "notifications", Component: Notifications },
      { path: "create-trip", Component: CreateTrip },
      { path: "experiences", Component: Experiences },
      { path: "experience/:id", Component: ExperienceDetail },
      { path: "checklist", Component: Checklist },
      { path: "budget", Component: Budget },
      { path: "community", Component: Community },
      { path: "community/write", Component: CommunityWrite },
      { path: "packages", Component: Packages },
      { path: "events", Component: Events },
      { path: "emergency", Component: Emergency },
      { path: "schedule", Component: Schedule },
      { path: "coupons", Component: Coupons },
      { path: "diary", Component: Diary },
      { path: "group-trip", Component: GroupTrip },
      { path: "group-join/:code", Component: GroupJoin },
      { path: "app-settings", Component: AppSettings },
      { path: "support", Component: Support },
      { path: "*", Component: NotFound },
    ],
  },
]);
