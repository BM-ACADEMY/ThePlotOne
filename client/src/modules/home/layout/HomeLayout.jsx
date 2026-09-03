import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LoginModal from "@/components/Auth/LoginModal";
import PostRequirementModal from "../components/PostRequirementModal";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const HomeLayout = () => {
  const { isLoginModalOpen, setLoginModalOpen } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openLogin) {
      setLoginModalOpen(true);
      // Clean up state immediately
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, setLoginModalOpen, navigate]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Header />
      <LoginModal
        open={isLoginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
      />
      <PostRequirementModal />
      <main
        id="main-content"
        className="grow overflow-y-auto scroll-smooth"
      >
        <div className="min-h-full flex flex-col">
          <div className="grow">
            <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default HomeLayout;
