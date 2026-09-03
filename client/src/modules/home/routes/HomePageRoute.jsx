import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../../../components/Common/Loader";

const HomeLayout = lazy(() => import("../layout/HomeLayout"));
const HomePage = lazy(() => import("../pages/HomePage"));
const PropertiesPage = lazy(() => import("../pages/PropertiesPage"));
const PropertyDetails = lazy(() => import("../pages/PropertyDetails"));
const NotFound = lazy(() => import("../../common-pages/NotFound"));
const UserPropertiesPage = lazy(() => import("../pages/UserPropertiesPage"));
const PostPropertyLanding = lazy(() => import("../pages/PostPropertyLanding"));
const BusinessUserList = lazy(() => import("../pages/BusinessUserList"));
const AgentInfo = lazy(() => import("../pages/agents/AgentLandingPage").then(module => ({ default: module.AgentInfo })));
const BuilderInfo = lazy(() => import("../pages/builder/Builderinfo").then(module => ({ default: module.BuilderInfo })));

const PageLoader = () => <Loader />;

const HomePageRoute = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/*" element={<Suspense fallback={<PageLoader />}><HomeLayout /></Suspense>}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="business/:businessTypeSlug" element={<BusinessUserList />} />
          <Route path="business/:businessTypeSlug/:sellerSlug" element={<BusinessUserList />} />
          <Route path="business-user-list/:businessTypeSlug" element={<BusinessUserList />} />
          <Route path="business-user-list/:businessTypeSlug/:sellerSlug" element={<BusinessUserList />} />
          <Route path="properties/:slug" element={<PropertyDetails />} />
          <Route path="post-property" element={<PostPropertyLanding />} />
          <Route path="agent-info" element={<AgentInfo />} />
          <Route path="builder-info" element={<BuilderInfo />} />

          {/* Dynamic Routes for User Properties */}
          <Route
            path="properties/user/:userId"
            element={<UserPropertiesPage />}
          />

          {/* Catch-all for invalid paths within Home Layout */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default HomePageRoute;
