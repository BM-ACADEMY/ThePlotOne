import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../../../components/Common/Loader";

const SellerLayout = lazy(() => import("../layout/SellerLayout"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const AddProperty = lazy(() => import("../pages/properties/AddProperty"));
const MyProperties = lazy(() => import("../pages/properties/MyProperties"));
const Profile = lazy(() => import("../pages/profile/Profile"));
const SellerEnquiries = lazy(() => import("../pages/enquiries/SellerEnquiries"));
const RequestLimit = lazy(() => import("../pages/properties/RequestLimit"));
const AddAttributes = lazy(() => import("../pages/properties/AddAttributes"));
const UpgradePlan = lazy(() => import("../pages/UpgradePlan"));
const SellerPaymentHistory = lazy(() => import("../pages/payments/SellerPaymentHistory"));
const LeadsOverview = lazy(() => import("../pages/enquiries/LeadsOverview"));
const Support = lazy(() => import("../pages/Support"));
const Reviews = lazy(() => import("../../user/pages/reviews/Reviews"));
const PropertyAnalytics = lazy(() => import("../pages/properties/PropertyAnalytics"));

const PageLoader = () => <Loader variant="panel" />;

const SellerRoute = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Suspense fallback={<PageLoader />}><SellerLayout /></Suspense>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-properties" element={<MyProperties />} />
          <Route path="add-property" element={<AddProperty />} />
          <Route path="add-attributes" element={<AddAttributes />} />
          <Route path="request-limit" element={<RequestLimit />} />
          <Route path="profile" element={<Profile />} />
          <Route path="enquiries" element={<SellerEnquiries />} />
          <Route path="upgrade-plan" element={<UpgradePlan />} />
          <Route path="payment-history" element={<SellerPaymentHistory />} />
          <Route path="leads-overview" element={<LeadsOverview />} />
          <Route path="support" element={<Support />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="property-analytics" element={<PropertyAnalytics />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default SellerRoute;
