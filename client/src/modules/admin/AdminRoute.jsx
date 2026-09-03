import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../../components/Common/Loader";

const AdminLayout = lazy(() => import("./AdminLayout"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const SellerOverview = lazy(() => import("./pages/dashboard/SellerOverview"));
const Users = lazy(() => import("./pages/users/Users"));
const AdminProperties = lazy(() => import("./pages/properties/AdminProperties"));
const AdminApprovals = lazy(() => import("./pages/approvals/AdminApprovals"));
const UserList = lazy(() => import("./pages/UserList"));
const SellerList = lazy(() => import("./pages/SellerList"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminEnquiries = lazy(() => import("./pages/enquiries/AdminEnquiries"));
const BusinessTypeManager = lazy(() => import("./pages/BusinessTypeManager"));
const PropertyTypeManager = lazy(() => import("./pages/PropertyTypeManager"));
const ApprovalTypeManager = lazy(() => import("./pages/ApprovalTypeManager"));
const MarketingPlanManager = lazy(() => import("./pages/MarketingPlanManager"));
const MarketingRequests = lazy(() => import("./pages/MarketingRequests"));
const TestimonialManager = lazy(() => import("./pages/TestimonialManager"));
const GeneralSettings = lazy(() => import("./pages/settings/GeneralSettings"));
const SellerRequests = lazy(() => import("./pages/SellerRequests"));
const SocialMediaManager = lazy(() => import("./pages/SocialMediaManager"));
const AdminBannerAds = lazy(() => import("./pages/AdminBannerAds"));
const ViewCountManager = lazy(() => import("./pages/properties/ViewCountManager"));
const CallRequests = lazy(() => import("./pages/forms/CallRequests"));
const ContactMessages = lazy(() => import("./pages/forms/ContactMessages"));
const FailedRegistrations = lazy(() => import("./pages/FailedRegistrations"));
const AdminList = lazy(() => import("./pages/AdminList"));
const RequirementList = lazy(() => import("./pages/RequirementList"));
const SubscriptionPlanManager = lazy(() => import("./pages/SubscriptionPlanManager"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const SupportManagement = lazy(() => import("./pages/SupportManagement"));
const CouponManager = lazy(() => import("./pages/CouponManager"));

const PageLoader = () => <Loader variant="panel" />;

const AdminRoute = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="seller/overview" element={<SellerOverview />} />
          <Route path="users" element={<UserList />} />{" "}
          {/* Changed to UserList */}
          <Route path="sellers" element={<SellerList />} />{" "}
          <Route path="failed-registrations" element={<FailedRegistrations />} />{" "}
          <Route path="admins" element={<AdminList />} />{" "}
          {/* Added failed-registrations route */}
          <Route path="profile" element={<AdminProfile />} />
          <Route path="properties" element={<AdminProperties mode="admin" />} />
          <Route
            path="seller-listings"
            element={<AdminProperties mode="seller" />}
          />
          <Route path="seller-requests" element={<SellerRequests />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="properties/add" element={<AddProperty />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="business-types" element={<BusinessTypeManager />} />
          <Route path="property-types" element={<PropertyTypeManager />} />
          <Route path="approval-types" element={<ApprovalTypeManager />} />
          <Route path="testimonials" element={<TestimonialManager />} />
          <Route path="marketing-plans" element={<MarketingPlanManager />} />
          <Route path="marketing-requests" element={<MarketingRequests />} />
          <Route path="social-media" element={<SocialMediaManager />} />
          <Route path="banner-ads" element={<AdminBannerAds />} />
          <Route path="view-count-manager" element={<ViewCountManager />} />
          <Route path="forms/call-requests" element={<CallRequests />} />
          <Route path="forms/contact-messages" element={<ContactMessages />} />
          <Route path="requirements" element={<RequirementList />} />
          <Route path="subscription-plans" element={<SubscriptionPlanManager />} />
          <Route path="payment-history" element={<PaymentHistory />} />
          <Route path="coupons" element={<CouponManager />} />

          <Route path="support" element={<SupportManagement />} />

        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoute;
