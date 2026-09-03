import { useState, useEffect, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, Bell, MessageSquare, Home } from "lucide-react";
import { RiSidebarFoldFill, RiSidebarUnfoldFill } from "react-icons/ri";

import { Layout, Button, Avatar, Dropdown, Breadcrumb, theme, Alert, Modal, Tag, Badge } from "antd";

import { AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";

import SellerSidebar from "./SellerSidebar";
import { getImageUrl } from "../../../utils/imageUrl";
import Loader from "../../../components/Common/Loader";

const { Header, Content } = Layout;

const SellerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user, refetchUser } = useAuth();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [supportCount, setSupportCount] = useState(0);
  const socket = useSocket();



  useEffect(() => {
    if (user?.activeSubscription) {
      const sub = user.activeSubscription;
      setSubscriptionInfo(sub);

      if (sub.status === "expired") {
        const lastShown = localStorage.getItem(`expired_modal_shown_${user._id}`);
        const today = new Date().toDateString();
        if (lastShown !== today) {
          setShowExpiredModal(true);
        }
      }
    }
  }, [user]);

  const handleCloseModal = () => {
    setShowExpiredModal(false);
    localStorage.setItem(`expired_modal_shown_${user._id}`, new Date().toDateString());
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Responsive Width Settings
  const SIDEBAR_WIDTH = 250;
  const COLLAPSED_WIDTH = 72;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setCollapsed(mobile); // Auto-collapse on mobile
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (!pathname.includes("/seller/support")) {
          setSupportCount(prev => prev + 1);
        }
      };
      socket.on("new-support-message", handleNewMessage);
      return () => socket.off("new-support-message", handleNewMessage);
    }
  }, [socket, pathname]);

  useEffect(() => {
    if (pathname === "/seller/support") {
      setSupportCount(0);
    }
  }, [pathname]);


  const userMenuParts = [
    {
      key: "1",
      label: (
        <div className="px-1 py-1">
          <p className="font-semibold text-gray-800 m-0">
            {user?.name || "Seller User"}
          </p>
        </div>
      ),
    },
    { type: "divider" },
    {
      label: "My Profile",
      icon: <User size={16} />,
      onClick: () => navigate("/seller/profile"),
    },
    {
      key: "home",
      label: "Back Home",
      icon: <Home size={16} />,
      onClick: () => navigate("/"),
    },
    {
      key: "3",
      label: "Logout",
      icon: <LogOut size={16} className="text-red-500" />,
      danger: true,
      onClick: logout,
    },
  ];

  const getBreadcrumbItems = () => {
    const pathSnippets = pathname.split("/").filter((i) => i);
    const breadcrumbItems = [
      { title: <Link to="/seller/dashboard">Home</Link> },
    ];

    pathSnippets.forEach((snippet, index) => {
      if (snippet === "seller") return;
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      const title =
        snippet.charAt(0).toUpperCase() + snippet.slice(1).replace(/-/g, " ");
      const isLast = index === pathSnippets.length - 1;

      breadcrumbItems.push({
        title: isLast ? (
          <span className="text-blue-600 font-medium">{title}</span>
        ) : (
          <Link to={url}>{title}</Link>
        ),
      });
    });

    return breadcrumbItems;
  };

  return (
    <Layout className="min-h-screen">
      <SellerSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
      />

      <Layout
        style={{
          marginLeft: isMobile
            ? 0
            : collapsed
              ? COLLAPSED_WIDTH
              : SIDEBAR_WIDTH,
          transition: "margin-left 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)",
          background: "#f9fafb", // Match gray-50/50 background
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
            height: 64,
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <RiSidebarUnfoldFill size={22} /> : <RiSidebarFoldFill size={22} />}
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-gray-100 flex items-center justify-center"
              style={{ width: 40, height: 40 }}
            />
            <Breadcrumb
              items={getBreadcrumbItems()}
              className="hidden md:flex"
            />
          </div>

          <div className="flex items-center gap-4">
            <Badge count={supportCount} size="small" offset={[-2, 2]}>
              <Dropdown
                menu={{ 
                  items: [
                    {
                      key: 'support',
                      label: (
                        <div onClick={() => navigate("/seller/support")}>
                          <p className="font-bold m-0">New Message</p>
                          <p className="text-xs text-gray-500 m-0">Support team replied to your ticket</p>
                        </div>
                      ),
                      icon: <MessageSquare size={16} className="text-blue-500" />
                    }
                  ] 
                }}
                disabled={supportCount === 0}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={<Bell size={24} className={supportCount > 0 ? "text-amber-500 animate-ring" : ""} />}
                  onClick={() => supportCount > 0 && navigate("/seller/support")}
                />
              </Dropdown>
            </Badge>

            <Dropdown

              menu={{ items: userMenuParts }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 px-3 rounded-full transition-all border border-transparent hover:border-gray-100">
                <div className="text-right hidden sm:block leading-tight">
                  <div className="text-sm font-bold text-gray-700">
                    {user?.name || "Seller"}
                  </div>
                  {user?.badgeVerified && (
                    <div className="text-[10px] text-blue-600 uppercase font-bold flex items-center gap-1">
                      <span className="m-0 text-[9px] text-gray-400 font-bold leading-none">VERIFIED ACCOUNT</span>
                    </div>
                  )}
                </div>
                <Avatar
                  size="large"
                  src={getImageUrl(user?.profile_image)}
                  className="bg-linear-to-tr from-blue-600 to-indigo-600 shadow-sm"
                >
                  {!user?.profile_image &&
                    (user?.name?.charAt(0).toUpperCase() || "S")}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 0,
            height: pathname === "/seller/support" ? "calc(100vh - 64px)" : "auto",
            minHeight: pathname === "/seller/support" ? "calc(100vh - 64px)" : "auto",
            background: pathname === "/seller/support" ? "#fff" : "transparent",
            overflow: pathname === "/seller/support" ? "hidden" : "visible",
          }}
        >
          {/* Subscription Status - Closable Right Aligned Alert */}
          <div className="flex justify-end mb-4 sticky top-20 z-20">
            {subscriptionInfo && subscriptionInfo.status === "active" && getDaysRemaining(subscriptionInfo.endDate) <= 7 && (
              <Alert
                message={
                  <div className="flex items-center gap-2 pr-2">
                    <Clock size={14} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">
                      Plan expires in {getDaysRemaining(subscriptionInfo.endDate)} days
                    </span>
                    <Link to="/seller/upgrade-plan" className="text-[10px] underline ml-1 hover:text-amber-900">Renew</Link>
                  </div>
                }
                type="warning"
                closable
                className="rounded-full py-1 px-4 border-amber-200 shadow-md bg-amber-50/90 backdrop-blur-sm animate-in slide-in-from-right duration-500"
              />
            )}

            {subscriptionInfo && subscriptionInfo.status === "expired" && (
              <Alert
                message={
                  <div className="flex items-center gap-2 pr-2">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-xs font-bold text-red-800 uppercase">Plan Expired</span>
                    <Link to="/seller/upgrade-plan" className="text-[10px] underline ml-1 hover:text-red-900">Renew now</Link>
                  </div>
                }
                type="error"
                closable
                className="rounded-full py-1 px-4 border-red-200 shadow-md bg-red-50/90 backdrop-blur-sm animate-in slide-in-from-right duration-500"
              />
            )}
          </div>

          <div
            className={`seller-content-wrapper relative flex flex-col ${pathname === "/seller/support" ? "" : "p-4 md:p-6"}`}
            style={{
              borderRadius: 0,
              height: pathname === "/seller/support" ? "100%" : "auto",
              minHeight: "100%",
              boxShadow: pathname === "/seller/support" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
              background: pathname === "/seller/support" ? "#fff" : "transparent",
            }}
          >
            <Suspense fallback={<Loader variant="panel" />}>
              <Outlet />
            </Suspense>
          </div>
        </Content>
      </Layout>

      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={24} />
            <span className="text-xl font-bold">Plan Expired</span>
          </div>
        }
        open={showExpiredModal}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Later
          </Button>,
          <Button 
            key="renew" 
            type="primary" 
            danger 
            onClick={() => {
              handleCloseModal();
              navigate("/seller/upgrade-plan");
            }}
          >
            Renew Now
          </Button>
        ]}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <div className="py-4">
          <p className="text-gray-600 text-lg">
            Your premium plan has expired. To continue receiving leads and managing your properties effectively, please renew your subscription.
          </p>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
            <p className="text-sm text-red-700 m-0">
              Expired on: <strong>{subscriptionInfo && new Date(subscriptionInfo.endDate).toLocaleDateString()}</strong>
            </p>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SellerLayout;
