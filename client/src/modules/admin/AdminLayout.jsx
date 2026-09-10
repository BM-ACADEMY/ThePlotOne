import { useState, useEffect, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, User, LogOut } from "lucide-react";
import { RiSidebarFoldFill, RiSidebarUnfoldFill } from "react-icons/ri";
import {
  Layout,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Breadcrumb,
  theme,
  Tag,
} from "antd";
import { AlertCircle, Clock, MessageSquare, BellRing } from "lucide-react";
import moment from "moment";

import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { useSocket } from "@/context/SocketContext";
import Loader from "@/components/Common/Loader";

const { Header, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);

  // Portal notifications (Notification model) — Module 6 admin-facing types:
  // campaign_activation_required (6.4), admin_lead_limit (6.3). Distinct from
  // the expiringCount/supportCount blocks above, which stay untouched.
  const [portalNotifications, setPortalNotifications] = useState([]);
  const [portalUnreadCount, setPortalUnreadCount] = useState(0);

  const [isNotificationsCleared, setIsNotificationsCleared] = useState(() => {
    return localStorage.getItem("admin_notifications_cleared") === "true";
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const socket = useSocket();

  // Get theme tokens for dynamic styling
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Fetch pending approvals count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get("/properties/admin-stats");
        setPendingCount(response.data.pendingApprovals || 0);
      } catch (error) {
        console.error("Error fetching pending approvals count:", error);
        setPendingCount(0);
      }
    };

    fetchPendingCount();
    
    const fetchExpiringCount = async () => {
      try {
        const response = await api.get("/subscriptions/admin/expiring-soon");
        const count = response.data.length || 0;
        
        // If count has increased since last clear, show notifications again
        const lastClearedCount = parseInt(localStorage.getItem("admin_notifications_last_count") || "0");
        if (count > lastClearedCount) {
          setIsNotificationsCleared(false);
          localStorage.setItem("admin_notifications_cleared", "false");
        }
        
        setExpiringCount(count);
      } catch (error) {
        console.error("Error fetching expiring subscriptions count:", error);
      }
    };
    fetchExpiringCount();

    // Portal notifications — same endpoints NotificationBell.jsx uses for
    // promoters. No socket channel wired for these yet, so it's polled here
    // alongside the other header counts.
    const fetchPortalNotifications = async () => {
      try {
        const res = await api.get("/portal-notifications");
        setPortalNotifications(res.data?.notifications || []);
        setPortalUnreadCount(res.data?.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching portal notifications:", error);
      }
    };
    fetchPortalNotifications();

    if (socket) {
      socket.on("new-property-listed", fetchPendingCount);
      
      const handleNewSupport = () => {
        if (!pathname.includes("/admin/support")) {
          setSupportCount(prev => prev + 1);
        }
      };

      socket.on("new-support-message", handleNewSupport);
      socket.on("new-support-ticket", handleNewSupport);

      return () => {
        socket.off("new-property-listed", fetchPendingCount);
        socket.off("new-support-message", handleNewSupport);
        socket.off("new-support-ticket", handleNewSupport);
      };
    }


    // Refresh counts every minute as fallback
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchExpiringCount();
      fetchPortalNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [socket, pathname]);


  // Reset counts on navigation
  useEffect(() => {
    if (pathname === "/admin/support") {
      setSupportCount(0);
    }
  }, [pathname]);

  const handleOpenPortalNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/portal-notifications/${notification._id}/read`);
        setPortalUnreadCount((prev) => Math.max(0, prev - 1));
        setPortalNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
        );
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllPortalRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put("/portal-notifications/read-all");
      setPortalUnreadCount(0);
      setPortalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // Default collapsed on mobile (drawer closed)
      } else {
        setCollapsed(false); // Default expanded on desktop
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ... menu parts ...

  // ... breadcrumb items ...

  // User dropdown menu & breadcrumb logic remain same, just skipping lines for brevity in instruction if possible, but replace tool needs context.
  // I will just replace the beginning of the component up to the return.

  // ... (re-implementing the function body to ensure I don't miss anything) ...

  const userMenuParts = [
    {
      key: "1",
      label: (
        <div className="px-1 py-1">
          <p className="font-semibold text-gray-800">
            {user?.name || "Admin User"}
          </p>
          <p className="text-xs text-gray-500">
            {user?.email || "admin@example.com"}
          </p>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "Profile Settings",
      icon: <User size={16} />,
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "3",
      label: "Logout",
      icon: <LogOut size={16} className="text-red-500" />,
      danger: true,
      onClick: logout,
    },
  ];

  // Generate breadcrumb items based on path
  const getBreadcrumbItems = () => {
    const pathSnippets = pathname.split("/").filter((i) => i);
    const breadcrumbItems = [
      { title: <Link to="/admin/dashboard">{user?.isSuperAdmin ? "Admin" : "Sub Admin"}</Link> },
    ];

    pathSnippets.forEach((snippet, index) => {
      if (snippet === "admin") return;

      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);

      breadcrumbItems.push({
        title:
          index === pathSnippets.length - 1 ? (
            title
          ) : (
            <Link to={url}>{title}</Link>
          ),
      });
    });

    return breadcrumbItems;
  };
  
  const notificationItems = [
    {
      key: 'header',
      label: (
        <div className="px-3 py-2 border-b border-gray-100 mb-1 flex justify-between items-center">
          <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Notifications</span>
          <div className="flex items-center gap-3">
            {portalUnreadCount > 0 && (
              <span
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer uppercase tracking-tight"
                onClick={handleMarkAllPortalRead}
              >
                Mark All Read
              </span>
            )}
            {expiringCount > 0 && !isNotificationsCleared && (
              <span
                className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer uppercase tracking-tight"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationsCleared(true);
                  localStorage.setItem("admin_notifications_cleared", "true");
                  localStorage.setItem("admin_notifications_last_count", expiringCount.toString());
                }}
              >
                Clear All
              </span>
            )}
          </div>
        </div>
      ),
    },
    ...(expiringCount > 0 && !isNotificationsCleared ? [
      {
        key: 'expiring',
        label: (
          <div 
            className="flex flex-col gap-1 py-1"
            onClick={() => {
              navigate("/admin/dashboard");
              setTimeout(() => {
                const el = document.getElementById('expiring-subscriptions-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 500);
            }}
          >
            <div className="flex items-center gap-2">
              <Tag color="warning" className="m-0 text-[10px] px-1.5 font-bold border-none uppercase">Plan Alert</Tag>
              <span className="text-[12px] font-semibold text-gray-700">{expiringCount} Plans Expiring</span>
            </div>
            <span className="text-[11px] text-gray-400">View and manage expiring seller subscriptions</span>
          </div>
        ),
        icon: <Clock size={16} className="text-amber-500" />,
      }
    ] : []),
    ...(supportCount > 0 ? [
      {
        key: 'support',
        label: (
          <div 
            className="flex flex-col gap-1 py-1"
            onClick={() => {
              setSupportCount(0);
              navigate("/admin/support");
            }}
          >
            <div className="flex items-center gap-2">
              <Tag color="blue" className="m-0 text-[10px] px-1.5 font-bold border-none uppercase">Support</Tag>
              <span className="text-[12px] font-semibold text-gray-700">{supportCount} New Messages</span>
            </div>
            <span className="text-[11px] text-gray-400">View support tickets and respond to sellers</span>
          </div>
        ),
        icon: <MessageSquare size={16} className="text-blue-500" />,
      }
    ] : []),
    ...(portalNotifications.length > 0
      ? portalNotifications.slice(0, 5).map((n) => ({
          key: `portal-${n._id}`,
          label: (
            <div
              className="flex flex-col gap-1 py-1"
              onClick={() => handleOpenPortalNotification(n)}
            >
              <div className="flex items-center gap-2">
                <Tag color="purple" className="m-0 text-[10px] px-1.5 font-bold border-none uppercase">
                  Campaign
                </Tag>
                <span className={`text-[12px] text-gray-700 ${!n.isRead ? "font-bold" : "font-semibold"}`}>
                  {n.title}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">{n.message}</span>
              <span className="text-[10px] text-gray-300">{moment(n.createdAt).fromNow()}</span>
            </div>
          ),
          icon: <BellRing size={16} className="text-indigo-500" />,
        }))
      : []),
    ...(expiringCount === 0 && supportCount === 0 && portalNotifications.length === 0 ? [
      {
        key: 'empty',
        label: (
          <div className="py-4 px-6 text-center">
            <span className="text-[11px] text-gray-400 font-medium italic">No new notifications</span>
          </div>
        ),
      }
    ] : []),

    {
      key: 'footer',

      label: (
        <div className="text-center py-1 mt-1 border-t border-gray-50 pt-2">
          <span className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">View All Activity</span>
        </div>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
      />

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 250,
          transition: "margin-left 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)",
          height: "100vh",
          overflow: "hidden",
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
              className="lg:hidden" // Hide on large screens
              style={{
                fontSize: "16px",
                width: 40,
                height: 40,
              }}
            />
            <Breadcrumb
              items={getBreadcrumbItems()}
              className="hidden md:flex"
            />
          </div>

          <div className="flex items-center gap-6">


            <Badge
              count={supportCount + (isNotificationsCleared ? 0 : expiringCount) + portalUnreadCount}
              size="small"
              offset={[-2, 2]}
              color="#7c3aed"
            >
              <Dropdown
                menu={{ items: notificationItems }}
                trigger={["click"]}
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
                classNames={{ root: "notification-dropdown" }}
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <Bell
                      size={24}
                      className={
                        supportCount > 0 || (expiringCount > 0 && !isNotificationsCleared) || portalUnreadCount > 0
                          ? "text-amber-500 bell-ringing"
                          : ""
                      }
                    />
                  }
                  title={
                    supportCount + expiringCount + portalUnreadCount > 0
                      ? `${supportCount + expiringCount + portalUnreadCount} Notifications`
                      : "No Notifications"
                  }
                />
              </Dropdown>
            </Badge>


            {/* <Badge count={pendingCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<Bell size={20} />}
                onClick={() => navigate("/admin/seller-listings")}
                title="Pending approvals"
              />
            </Badge> */}

            <Dropdown
              menu={{ items: userMenuParts }}
              trigger={["click"]}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pl-3 rounded-full transition-colors border border-transparent hover:border-gray-100">
                <div className="text-right hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-gray-700">
                    {user?.name || "Admin"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.isSuperAdmin ? "Super Admin" : "Sub Admin"}
                  </div>
                </div>
                <Avatar
                  size="large"
                  src={getImageUrl(user?.profile_image)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold"
                >
                  {!user?.profile_image &&
                    (user?.name?.charAt(0).toUpperCase() || "A")}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            padding: 0,
            height: "calc(100vh - 64px)",
            overflowY: pathname.includes("/support") ? "hidden" : "auto",
            background: pathname.includes("/support") ? "#fff" : "#f8fafc",
          }}
        >
          <div
            className="admin-content-wrapper relative"
            style={{
              padding: pathname.includes("/support") ? 0 : 24,
              borderRadius: 0,
              height: pathname.includes("/support") ? "100%" : "auto",
            }}
          >
            <Suspense fallback={<Loader variant="panel" />}>
              <Outlet />
            </Suspense>
          </div>
        </Content>

      </Layout>
      <style>{`
        @keyframes bell-ring {
          0%, 40%, 100% { transform: rotate(0); }
          5%, 15%, 25% { transform: rotate(15deg); }
          10%, 20%, 30% { transform: rotate(-15deg); }
          35% { transform: rotate(5deg); }
          38% { transform: rotate(-5deg); }
        }

        .bell-ringing {
          display: inline-block;
          animation: bell-ring 3s ease-in-out infinite;
          transform-origin: top center;
          filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.2));
        }

        .notification-dropdown .ant-dropdown-menu {
          padding: 8px !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #f1f5f9 !important;
        }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;
