import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PrivateRoute from "./guard/PrivateRoute";
import PublicRoute from "./guard/PublicRoute";
const HomeLayout = lazy(() => import("./modules/home/layout/HomeLayout"));
import Loader from "./components/Common/Loader";

// Lazy loaded modules
const Unauthorized = lazy(() => import("./modules/common-pages/Unauthorized"));
const NotFound = lazy(() => import("./modules/common-pages/NotFound"));
const UserRoutes = lazy(() => import("./modules/user/routes/UserRoutes"));
const SellerRoute = lazy(() => import("./modules/seller/Routes/SellerRoute"));
const AdminRoute = lazy(() => import("./modules/admin/AdminRoute"));
const HomePageRoute = lazy(() => import("./modules/home/routes/HomePageRoute"));
const BecomeSeller = lazy(() => import("./modules/user/BecomeSeller"));
const About = lazy(() => import("./modules/about/About"));
const Contact = lazy(() => import("./modules/contact/Contact"));
const TermsAndConditions = lazy(() => import("./modules/home/pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./modules/home/pages/PrivacyPolicy"));
const DeactivateAccount = lazy(() => import("./modules/home/pages/DeactivateAccount"));
const AddProperty = lazy(() => import("./modules/seller/pages/properties/AddProperty"));
const PostRequirementPage = lazy(() => import("./modules/home/pages/PostRequirementPage"));
const FavoritesPage = lazy(() => import("./modules/home/pages/FavoritesPage"));
const BlogList = lazy(() => import("./modules/blog/pages/BlogList"));
const DtcpApprovedPlots = lazy(() => import("./modules/blog/pages/dtcp-approved-plots-in-pondicherry/DtcpApprovedPlots"));
const PlotPriceInPondicherry = lazy(() => import("./modules/blog/pages/plot-price-in-pondicherry/PlotPriceInPondicherry"));
const DtcpVsCmdaApproval = lazy(() => import("./modules/blog/pages/dtcp-vs-cmda-approval/DtcpVsCmdaApproval"));
const LandInvestmentPondicherry = lazy(() => import("./modules/blog/pages/land-investment-pondicherry/LandInvestmentPondicherry"));
const PropertyRegistrationProcess = lazy(() => import("./modules/blog/pages/property-registration-process-tamil-nadu/PropertyRegistrationProcess"));
const BestAreasToBuyPlots = lazy(() => import("./modules/blog/pages/best-areas-to-buy-plots-pondicherry/BestAreasToBuyPlots"));
const DtcpPlotsMarakkanam = lazy(() => import("./modules/blog/pages/dtcp-plots-marakkanam/DtcpPlotsMarakkanam"));
const HomeLoanForPlotPurchase = lazy(() => import("./modules/blog/pages/home-loan-for-plot/HomeLoanForPlotPurchase"));
const NriPropertyInvestment = lazy(() => import("./modules/blog/pages/nri-property-investment-pondicherry/NriPropertyInvestment"));
const PlotsForSaleVillupuram = lazy(() => import("./modules/blog/pages/plots-for-sale-villupuram/PlotsForSaleVillupuram"));
const DtcpPlotsTindivanam = lazy(() => import("./modules/blog/pages/dtcp-plots-tindivanam/DtcpPlotsTindivanam"));
const PlotsForSaleCuddalore = lazy(() => import("./modules/blog/pages/plots-for-sale-cuddalore/PlotsForSaleCuddalore"));

const PageLoader = () => <Loader />;

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<HomeLayout />}>
        {/* Public pages accessible to everyone */}
        <Route
          path="/about"
          element={
            <Suspense fallback={<PageLoader />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<PageLoader />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="/terms-and-condition"
          element={
            <Suspense fallback={<PageLoader />}>
              <TermsAndConditions />
            </Suspense>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route
          path="/deactivate-account"
          element={
            <Suspense fallback={<PageLoader />}>
              <DeactivateAccount />
            </Suspense>
          }
        />
        <Route
          path="/favorites"
          element={
            <Suspense fallback={<PageLoader />}>
              <FavoritesPage />
            </Suspense>
          }
        />
        <Route
          path="/post-requirement"
          element={
            <Suspense fallback={<PageLoader />}>
              <PostRequirementPage />
            </Suspense>
          }
        />
        <Route
          path="/blog"
          element={
            <Suspense fallback={<PageLoader />}>
              <BlogList />
            </Suspense>
          }
        />
        <Route
          path="/blog/dtcp-approved-plots-in-pondicherry"
          element={
            <Suspense fallback={<PageLoader />}>
              <DtcpApprovedPlots />
            </Suspense>
          }
        />
        <Route
          path="/blog/plot-price-in-pondicherry"
          element={
            <Suspense fallback={<PageLoader />}>
              <PlotPriceInPondicherry />
            </Suspense>
          }
        />
        <Route
          path="/blog/dtcp-vs-cmda-approval"
          element={
            <Suspense fallback={<PageLoader />}>
              <DtcpVsCmdaApproval />
            </Suspense>
          }
        />
        <Route
          path="/blog/land-investment-pondicherry"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandInvestmentPondicherry />
            </Suspense>
          }
        />
        <Route
          path="/blog/property-registration-process-tamil-nadu"
          element={
            <Suspense fallback={<PageLoader />}>
              <PropertyRegistrationProcess />
            </Suspense>
          }
        />
        <Route
          path="/blog/best-areas-to-buy-plots-pondicherry"
          element={
            <Suspense fallback={<PageLoader />}>
              <BestAreasToBuyPlots />
            </Suspense>
          }
        />
        <Route
          path="/blog/dtcp-plots-marakkanam"
          element={
            <Suspense fallback={<PageLoader />}>
              <DtcpPlotsMarakkanam />
            </Suspense>
          }
        />
        <Route
          path="/blog/home-loan-for-plot"
          element={
            <Suspense fallback={<PageLoader />}>
              <HomeLoanForPlotPurchase />
            </Suspense>
          }
        />
        <Route
          path="/blog/nri-property-investment-pondicherry"
          element={
            <Suspense fallback={<PageLoader />}>
              <NriPropertyInvestment />
            </Suspense>
          }
        />
        <Route
          path="/blog/plots-for-sale-villupuram"
          element={
            <Suspense fallback={<PageLoader />}>
              <PlotsForSaleVillupuram />
            </Suspense>
          }
        />
        <Route
          path="/blog/dtcp-plots-tindivanam"
          element={
            <Suspense fallback={<PageLoader />}>
              <DtcpPlotsTindivanam />
            </Suspense>
          }
        />
        <Route
          path="/blog/plots-for-sale-cuddalore"
          element={
            <Suspense fallback={<PageLoader />}>
              <PlotsForSaleCuddalore />
            </Suspense>
          }
        />
      </Route>

      {/* User Routes */}
      <Route element={<PrivateRoute allowedRoles={["USER"]} />}>
        <Route
          path="/user/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserRoutes />
            </Suspense>
          }
        />
        <Route
          path="/become-seller"
          element={
            <Suspense fallback={<PageLoader />}>
              <BecomeSeller />
            </Suspense>
          }
        />
      </Route>

      <Route element={<PrivateRoute allowedRoles={["USER", "SELLER"]} />}>
        <Route element={<HomeLayout />}>
          <Route
            path="/add-property"
            element={
              <Suspense fallback={<PageLoader />}>
                <AddProperty />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* Seller Routes - Strictly for Sellers and Admins */}
      <Route element={<PrivateRoute allowedRoles={["SELLER"]} />}>
        <Route
          path="/seller/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <SellerRoute />
            </Suspense>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminRoute />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<PageLoader />}>
            <Unauthorized />
          </Suspense>
        }
      />

      {/* Home Page Route (Catch-all for public/home) */}
      <Route
        path="/*"
        element={
          <Suspense fallback={<PageLoader />}>
            <HomePageRoute />
          </Suspense>
        }
      />

      {/* Global Fallback for strict unmatched routes */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
