import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AuthLayout } from "./components/AuthLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Travel = lazy(() => import("./pages/Travel").then(m => ({ default: m.Travel })));
const Itinerary = lazy(() => import("./pages/Itinerary").then(m => ({ default: m.Itinerary })));
const Islands = lazy(() => import("./pages/Islands").then(m => ({ default: m.Islands })));
const MyPage = lazy(() => import("./pages/MyPage").then(m => ({ default: m.MyPage })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Signup = lazy(() => import("./pages/Signup").then(m => ({ default: m.Signup })));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit").then(m => ({ default: m.ProfileEdit })));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods").then(m => ({ default: m.PaymentMethods })));
const Favorites = lazy(() => import("./pages/Favorites").then(m => ({ default: m.Favorites })));
const Notifications = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const CreateTrip = lazy(() => import("./pages/CreateTrip").then(m => ({ default: m.CreateTrip })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));
const IslandDetail = lazy(() => import("./pages/IslandDetail").then(m => ({ default: m.IslandDetail })));
const Experiences = lazy(() => import("./pages/Experiences").then(m => ({ default: m.Experiences })));
const ExperienceDetail = lazy(() => import("./pages/Experiences").then(m => ({ default: m.ExperienceDetail })));
const Checklist = lazy(() => import("./pages/Checklist").then(m => ({ default: m.Checklist })));
const Budget = lazy(() => import("./pages/Budget").then(m => ({ default: m.Budget })));
const Community = lazy(() => import("./pages/Community").then(m => ({ default: m.Community })));
const CommunityWrite = lazy(() => import("./pages/CommunityWrite").then(m => ({ default: m.CommunityWrite })));
const Emergency = lazy(() => import("./pages/Emergency").then(m => ({ default: m.Emergency })));
const Schedule = lazy(() => import("./pages/Schedule").then(m => ({ default: m.Schedule })));
const GroupTrip = lazy(() => import("./pages/GroupTrip").then(m => ({ default: m.GroupTrip })));
const GroupJoin = lazy(() => import("./pages/GroupJoin").then(m => ({ default: m.GroupJoin })));
const Support = lazy(() => import("./pages/Support").then(m => ({ default: m.Support })));
const Privacy = lazy(() => import("./pages/Privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Terms").then(m => ({ default: m.Terms })));

const Fallback = () => null;

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: AuthLayout,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><Login /></Suspense> },
    ],
  },
  {
    path: "/signup",
    Component: AuthLayout,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><Signup /></Suspense> },
    ],
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><Home /></Suspense> },
      { path: "islands", element: <Suspense fallback={<Fallback />}><Islands /></Suspense> },
      { path: "island/:id", element: <Suspense fallback={<Fallback />}><IslandDetail /></Suspense> },
      { path: "experiences", element: <Suspense fallback={<Fallback />}><Experiences /></Suspense> },
      { path: "experience/:id", element: <Suspense fallback={<Fallback />}><ExperienceDetail /></Suspense> },
      { path: "community", element: <Suspense fallback={<Fallback />}><Community /></Suspense> },
      { path: "emergency", element: <Suspense fallback={<Fallback />}><Emergency /></Suspense> },
      { path: "schedule", element: <Suspense fallback={<Fallback />}><Schedule /></Suspense> },
      { path: "support", element: <Suspense fallback={<Fallback />}><Support /></Suspense> },
      { path: "privacy", element: <Suspense fallback={<Fallback />}><Privacy /></Suspense> },
      { path: "terms", element: <Suspense fallback={<Fallback />}><Terms /></Suspense> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "travel", element: <Suspense fallback={<Fallback />}><Travel /></Suspense> },
          { path: "itinerary/:id", element: <Suspense fallback={<Fallback />}><Itinerary /></Suspense> },
          { path: "my", element: <Suspense fallback={<Fallback />}><MyPage /></Suspense> },
          { path: "profile-edit", element: <Suspense fallback={<Fallback />}><ProfileEdit /></Suspense> },
          { path: "notification-settings", element: <Suspense fallback={<Fallback />}><NotificationSettings /></Suspense> },
          { path: "payment-methods", element: <Suspense fallback={<Fallback />}><PaymentMethods /></Suspense> },
          { path: "favorites", element: <Suspense fallback={<Fallback />}><Favorites /></Suspense> },
          { path: "notifications", element: <Suspense fallback={<Fallback />}><Notifications /></Suspense> },
          { path: "create-trip", element: <Suspense fallback={<Fallback />}><CreateTrip /></Suspense> },
          { path: "checklist", element: <Suspense fallback={<Fallback />}><Checklist /></Suspense> },
          { path: "budget", element: <Suspense fallback={<Fallback />}><Budget /></Suspense> },
          { path: "community/write", element: <Suspense fallback={<Fallback />}><CommunityWrite /></Suspense> },
          { path: "group-trip", element: <Suspense fallback={<Fallback />}><GroupTrip /></Suspense> },
          { path: "group-join/:code", element: <Suspense fallback={<Fallback />}><GroupJoin /></Suspense> },
        ],
      },
      { path: "*", element: <Suspense fallback={<Fallback />}><NotFound /></Suspense> },
    ],
  },
]);
