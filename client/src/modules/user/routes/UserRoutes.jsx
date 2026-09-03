import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../../../components/Common/Loader";
const UserLayout = lazy(() => import("../layout/UserLayout"));
const Profile = lazy(() => import("../pages/settings/Profile"));
const Reviews = lazy(() => import("../pages/reviews/Reviews"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));

const PageLoader = () => <Loader />;

const UserRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Suspense fallback={<PageLoader />}><UserLayout /></Suspense>}>
          {/* user routes here */}
          <Route index element={<Profile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default UserRoutes;
