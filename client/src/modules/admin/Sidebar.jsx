import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Badge, Drawer, Dropdown } from "antd";
import {
  LayoutDashboard,
  Building,
  Briefcase,
  BarChart3,
  Megaphone,
  Users,
  LibraryBig,
  ClipboardList,
  MessageSquare,
  Image,
  CreditCard,
  Headphones,
  Sliders,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../utils/imageUrl";

/* ─────────────────────────────────────────────
   Inline styles (Perfectly matching Seller Panel)
───────────────────────────────────────────── */
const S = {
  sidebar: {
    width: 250,
    minWidth: 250,
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    background: "linear-gradient(180deg, #12101a 0%, #1a1625 60%, #12101a 100%)",
    display: "flex",
    flexDirection: "column",
    zIndex: 20,
    transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
    overflow: "hidden",
  },
  sidebarCollapsed: {
    width: 72,
    minWidth: 72,
  },
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
    textDecoration: "none",
    height: 64,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "linear-gradient(135deg, #7c3aed 0%, #9f5fff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 0 14px rgba(124,58,237,0.5)",
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  logoTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  logoSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    whiteSpace: "nowrap",
    marginTop: 2,
  },
  menuArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "12px 0 8px",
    scrollbarWidth: "none",
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "10px 20px 4px",
    whiteSpace: "nowrap",
  },
  menuItem: (isActive, collapsed) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: collapsed ? "10px 0" : "10px 14px",
    margin: "2px 10px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background 0.18s, box-shadow 0.18s",
    background: isActive
      ? "linear-gradient(90deg, rgba(124,58,237,0.28) 0%, rgba(124,58,237,0.08) 100%)"
      : "transparent",
    boxShadow: isActive ? "0 0 0 1px rgba(124,58,237,0.25) inset" : "none",
    position: "relative",
    justifyContent: collapsed ? "center" : "flex-start",
    textDecoration: "none",
  }),
  activeBar: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3,
    height: 20,
    borderRadius: "0 3px 3px 0",
    background: "#7c3aed",
  },
  menuIcon: (isActive) => ({
    color: isActive ? "#a78bfa" : "rgba(255,255,255,0.55)",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    transition: "color 0.18s",
  }),
  menuLabel: (isActive) => ({
    color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    whiteSpace: "nowrap",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "color 0.18s",
  }),
  chevron: (isActive) => ({
    color: isActive ? "#a78bfa" : "rgba(255,255,255,0.3)",
    flexShrink: 0,
    transition: "transform 0.2s",
  }),
  submenu: (open) => ({
    overflow: "hidden",
    maxHeight: open ? 1000 : 0,
    transition: "max-height 0.25s cubic-bezier(.4,0,.2,1)",
  }),
  submenuItem: (isActive, level = 1) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: `8px 14px 8px ${level * 20 + 26}px`,
    margin: "1px 10px",
    borderRadius: 8,
    cursor: "pointer",
    color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
    fontWeight: isActive ? 600 : 400,
    fontSize: 13,
    background: isActive ? "rgba(124,58,237,0.18)" : "transparent",
    transition: "background 0.15s, color 0.15s",
  }),
  submenuDot: (isActive) => ({
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: isActive ? "#a78bfa" : "rgba(255,255,255,0.25)",
    flexShrink: 0,
  }),
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "8px 16px",
  },
  tooltip: {
    position: "absolute",
    left: "calc(100% + 12px)",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#1e1b2e",
    color: "#fff",
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 10px",
    borderRadius: 6,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 999,
  },
  // Bottom user profile block
  profileBlock: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "16px 20px",
    flexShrink: 0,
    background: "transparent",
  },
  profileInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
    boxShadow: "0 0 10px rgba(124,58,237,0.4)",
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.8)",
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#22c55e",
    border: "2px solid #12101a",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    overflow: "hidden",
  },
  profileName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
  },
  profileRole: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    marginTop: 2,
    letterSpacing: "0.02em",
  },
};

/* ─────────────────────────────────────────────
   Hoverable menu item wrapper
───────────────────────────────────────────── */
const HoverItem = ({ children, tooltip, collapsed, style, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
      {collapsed && hovered && tooltip && (
        <div style={S.tooltip}>{typeof tooltip === 'string' ? tooltip : ''}</div>
      )}
    </div>
  );
};

const Sidebar = ({ collapsed, setCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const fullPath = pathname + search;

  const socket = useSocket();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState({
    badgeRequests: 0,
    sellerProperties: 0,
    ourProperties: 0,
    marketingLeads: 0,
    enquiries: 0,
    requirements: 0,
    callRequests: 0,
    contactMessages: 0,
    expiringPlans: 0,
    supportTickets: 0,
  });
  const [businessTypes, setBusinessTypes] = useState([]);
  const [openKeys, setOpenKeys] = useState(["properties-sub", "users-sub", "seller-sub", "enquiries-sub"]);

  const toggleSubmenu = (key) => {
    setOpenKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const fetchCounts = async () => {
    try {
      const response = await api.get("/users/fetch-notification-counts");
      if (response.data.success) {
        const { counts } = response.data;
        setNotifications(prev => ({
          ...prev,
          badgeRequests: counts.badgeRequests || 0,
          sellerProperties: counts.sellerProperties || 0,
          enquiries: counts.enquiries || 0,
          requirements: counts.requirements || 0,
          callRequests: counts.callRequests || 0,
          contactMessages: counts.contactMessages || 0,
          marketingLeads: counts.marketingRequests || 0,
          supportTickets: counts.supportTickets || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  };

  const fetchExpiringSoon = async () => {
    try {
      const response = await api.get("/subscriptions/admin/expiring-soon");
      setNotifications(prev => ({ ...prev, expiringPlans: response.data.length || 0 }));
    } catch (error) {
      console.error("Error fetching expiring plans count:", error);
    }
  };

  const fetchBusinessTypes = async () => {
    try {
      const response = await api.get("/business-types");
      setBusinessTypes(response.data.filter((t) => t.status === "active"));
    } catch (error) {
      console.error("Error fetching business types:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchExpiringSoon();
    fetchBusinessTypes();

    // Polling fallback every 5 minutes
    const interval = setInterval(() => {
      fetchCounts();
      fetchExpiringSoon();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      fetchCounts();
      fetchExpiringSoon();
    };
    window.addEventListener("refresh-admin-counts", handleRefresh);
    return () => window.removeEventListener("refresh-admin-counts", handleRefresh);
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewBadgeRequest = () => { 
        if (pathname !== "/admin/sellers") 
          setNotifications(prev => ({ ...prev, badgeRequests: prev.badgeRequests + 1 })); 
      };
      const handleNewProperty = (data) => {
        if (data.isSellerProperty) { 
          if (pathname !== "/admin/seller-listings") 
            setNotifications(prev => ({ ...prev, sellerProperties: prev.sellerProperties + 1 })); 
        } else { 
          if (!pathname.startsWith("/admin/properties")) 
            setNotifications(prev => ({ ...prev, ourProperties: prev.ourProperties + 1 })); 
        }
      };
      const handleNewEnquiry = () => { if (pathname !== "/admin/enquiries") setNotifications(prev => ({ ...prev, enquiries: prev.enquiries + 1 })); };
      const handleNewWhatsappLead = () => { if (pathname !== "/admin/enquiries") setNotifications(prev => ({ ...prev, enquiries: prev.enquiries + 1 })); };
      const handleNewRequirement = () => { if (pathname !== "/admin/requirements") setNotifications(prev => ({ ...prev, requirements: prev.requirements + 1 })); };
      const handleNewCallRequest = () => { if (pathname !== "/admin/forms/call-requests") setNotifications(prev => ({ ...prev, callRequests: prev.callRequests + 1 })); };
      const handleNewContactMessage = () => { if (pathname !== "/admin/forms/contact-messages") setNotifications(prev => ({ ...prev, contactMessages: prev.contactMessages + 1 })); };
      const handleNewMarketingRequest = () => { if (pathname !== "/admin/marketing-requests") setNotifications(prev => ({ ...prev, marketingLeads: prev.marketingLeads + 1 })); };
      const handleNewSupportMessage = () => { if (pathname !== "/admin/support") setNotifications(prev => ({ ...prev, supportTickets: prev.supportTickets + 1 })); };

      socket.on("badge-verification-requested", handleNewBadgeRequest);
      socket.on("new-property-listed", handleNewProperty);
      socket.on("new-enquiry", handleNewEnquiry);
      socket.on("new-whatsapp-lead", handleNewWhatsappLead);
      socket.on("new-requirement", handleNewRequirement);
      socket.on("new-call-request", handleNewCallRequest);
      socket.on("new-contact-message", handleNewContactMessage);
      socket.on("new-marketing-request", handleNewMarketingRequest);
      socket.on("new-support-message", handleNewSupportMessage);
      socket.on("new-support-ticket", handleNewSupportMessage);

      return () => {
        socket.off("badge-verification-requested", handleNewBadgeRequest);
        socket.off("new-property-listed", handleNewProperty);
        socket.off("new-enquiry", handleNewEnquiry);
        socket.off("new-whatsapp-lead", handleNewWhatsappLead);
        socket.off("new-requirement", handleNewRequirement);
        socket.off("new-call-request", handleNewCallRequest);
        socket.off("new-contact-message", handleNewContactMessage);
        socket.off("new-marketing-request", handleNewMarketingRequest);
        socket.off("new-support-message", handleNewSupportMessage);
        socket.off("new-support-ticket", handleNewSupportMessage);
      };
    }
  }, [socket, pathname]);

  // Removed automatic count reset on navigation to allow tracking individual record status changes.
  // Counts will now update via polling or socket events.

  const handleMenuClick = (path) => {
    if (!path) return;
    navigate(path);
    if (isMobile) setCollapsed(true);
  };

  const allMenuItems = useMemo(() => [
    { key: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", onClick: () => handleMenuClick("/admin/dashboard") },
    {
      key: "properties-sub", 
      icon: <Building size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Properties</span>
          {notifications.ourProperties > 0 && <Badge count={notifications.ourProperties} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { 
          key: "/admin/properties", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Our Properties</span>
              {notifications.ourProperties > 0 && <Badge count={notifications.ourProperties} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/properties") 
        },
        { key: "/admin/properties/add", label: "Add Property", onClick: () => handleMenuClick("/admin/properties/add") },
      ],
    },
    {
      key: "seller-sub", 
      icon: <Briefcase size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Seller</span>
          {notifications.sellerProperties > 0 && <Badge count={notifications.sellerProperties} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { 
          key: "/admin/seller-listings", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Seller Listings</span>
              {notifications.sellerProperties > 0 && <Badge count={notifications.sellerProperties} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/seller-listings") 
        },
      ],
    },
    { 
      key: "analytics-sub", 
      icon: <BarChart3 size={18} />, 
      label: "Analytics / Manager", 
      children: [
        { key: "/admin/view-count-manager", label: "View Count Manager", onClick: () => handleMenuClick("/admin/view-count-manager") }
      ] 
    },
    {
      key: "marketing-sub", 
      icon: <Megaphone size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Marketing</span>
          {notifications.marketingLeads > 0 && <Badge count={notifications.marketingLeads} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { key: "/admin/marketing-plans", label: "Marketing Plans", onClick: () => handleMenuClick("/admin/marketing-plans") },
        { 
          key: "/admin/marketing-requests", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Marketing Leads</span>
              {notifications.marketingLeads > 0 && <Badge count={notifications.marketingLeads} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/marketing-requests") 
        },
      ],
    },
    {
      key: "users-sub", 
      icon: <Users size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Users</span>
          {notifications.badgeRequests > 0 && <Badge count={notifications.badgeRequests} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { key: "/admin/users", label: "User List", onClick: () => handleMenuClick("/admin/users") },
        { key: "/admin/admins", label: "Admin List", onClick: () => handleMenuClick("/admin/admins") },
        {
          key: "seller-list-sub", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Seller List</span>
              {notifications.badgeRequests > 0 && <Badge count={notifications.badgeRequests} size="small" color="#7c3aed" />}
            </div>
          ),
          children: [
            { 
              key: "/admin/sellers", 
              label: (
                <div className="flex justify-between items-center pr-4">
                  <span>All Sellers</span>
                  {notifications.badgeRequests > 0 && <Badge count={notifications.badgeRequests} size="small" color="#7c3aed" />}
                </div>
              ), 
              onClick: () => handleMenuClick("/admin/sellers") 
            },
            ...businessTypes.map((type) => ({ key: `/admin/sellers?type=${type._id}`, label: type.name, onClick: () => handleMenuClick(`/admin/sellers?type=${type._id}`) })),
          ],
        },
        { key: "/admin/failed-registrations", label: "Failed Registrations", onClick: () => handleMenuClick("/admin/failed-registrations") },
      ],
    },
    {
      key: "enquiries-sub",
      icon: <LibraryBig size={18} />,
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Enquiry Leads</span>
          {notifications.enquiries > 0 && <Badge count={notifications.enquiries} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { 
          key: "/admin/enquiries", 
          label: "Our Enquiry Leads", 
          onClick: () => handleMenuClick("/admin/enquiries") 
        },
        { 
          key: "/admin/enquiries?view=seller", 
          label: "Seller Enquiry Leads", 
          onClick: () => handleMenuClick("/admin/enquiries?view=seller") 
        },
      ],
    },
    { 
      key: "/admin/requirements", 
      icon: <ClipboardList size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Posted Requirements</span>
          {notifications.requirements > 0 && <Badge count={notifications.requirements} size="small" color="#7c3aed" />}
        </div>
      ), 
      onClick: () => handleMenuClick("/admin/requirements") 
    },
    {
      key: "forms-sub", 
      icon: <MessageSquare size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Forms Data</span>
          {(notifications.callRequests + notifications.contactMessages) > 0 && (
            <Badge count={notifications.callRequests + notifications.contactMessages} size="small" color="#7c3aed" />
          )}
        </div>
      ),
      children: [
        { 
          key: "/admin/forms/call-requests", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Call Requests</span>
              {notifications.callRequests > 0 && <Badge count={notifications.callRequests} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/forms/call-requests") 
        },
        { 
          key: "/admin/forms/contact-messages", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Contact Messages</span>
              {notifications.contactMessages > 0 && <Badge count={notifications.contactMessages} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/forms/contact-messages") 
        },
      ],
    },
    { key: "/admin/banner-ads", icon: <Image size={18} />, label: "Banner Ads", onClick: () => handleMenuClick("/admin/banner-ads") },
    {
      key: "subscriptions-sub", 
      icon: <CreditCard size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Subscriptions</span>
          {notifications.expiringPlans > 0 && <Badge count={notifications.expiringPlans} size="small" color="#7c3aed" />}
        </div>
      ),
      children: [
        { key: "/admin/subscription-plans", label: "Subscription Plans", onClick: () => handleMenuClick("/admin/subscription-plans") },
        { 
          key: "/admin/payment-history", 
          label: (
            <div className="flex justify-between items-center pr-4">
              <span>Payment History</span>
              {notifications.expiringPlans > 0 && <Badge count={notifications.expiringPlans} size="small" color="#7c3aed" />}
            </div>
          ), 
          onClick: () => handleMenuClick("/admin/payment-history") 
        },
        { key: "/admin/coupons", label: "Coupons", onClick: () => handleMenuClick("/admin/coupons") },
      ],
    },
    { 
      key: "/admin/support", 
      icon: <Headphones size={18} />, 
      label: (
        <div className="flex justify-between items-center pr-4">
          <span>Support Tickets</span>
          {notifications.supportTickets > 0 && <Badge count={notifications.supportTickets} size="small" color="#7c3aed" />}
        </div>
      ), 
      onClick: () => handleMenuClick("/admin/support") 
    },
    {
      key: "property-settings-sub", icon: <Sliders size={18} />, label: "Property Settings",
      children: [
        { key: "/admin/business-types", label: "Business Types", onClick: () => handleMenuClick("/admin/business-types") },
        { key: "/admin/property-types", label: "Property Types", onClick: () => handleMenuClick("/admin/property-types") },
        { key: "/admin/approval-types", label: "Approval Types", onClick: () => handleMenuClick("/admin/approval-types") },
      ],
    },
    {
      key: "settings-sub", icon: <Settings size={18} />, label: "Settings",
      children: [
        { key: "/admin/profile", label: "Profile", onClick: () => handleMenuClick("/admin/profile") },
        { key: "/admin/testimonials", label: "Testimonials", onClick: () => handleMenuClick("/admin/testimonials") },
        { key: "/admin/social-media", label: "Social Media", onClick: () => handleMenuClick("/admin/social-media") },
      ],
    },
  ], [notifications, businessTypes]);

  const filteredMenuItems = useMemo(() => {
    if (!user) return [];
    if (user.isSuperAdmin) return allMenuItems;
    const userPermissions = user.permissions || [];
    const filterItems = (items) => {
      return items.map(item => {
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) return { ...item, children: filteredChildren };
        }
        if (userPermissions.includes(item.key) || (item.key && item.key.includes("/admin/enquiries") && userPermissions.includes("/admin/enquiries"))) return item;
        return null;
      }).filter(Boolean);
    };
    return filterItems(allMenuItems);
  }, [user, allMenuItems]);

  /* ── Recursive render function ────────────────── */
  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const checkActive = (it) => {
      if (it.key === fullPath) return true;
      if (it.children) return it.children.some(c => checkActive(c));
      return false;
    };
    const isActive = checkActive(item);
    const itemPathActive = item.key === fullPath;
    const isOpen = openKeys.includes(item.key) && !collapsed;

    if (level === 0) {
      const content = (
        <div key={item.key}>
          <HoverItem tooltip={item.label} collapsed={collapsed} onClick={() => { if (hasChildren && !collapsed) toggleSubmenu(item.key); else if (item.onClick) item.onClick(); }}>
            <div 
              style={S.menuItem(isActive, collapsed)}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {isActive && <div style={S.activeBar} />}
              <span style={S.menuIcon(isActive)}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={S.menuLabel(isActive)}>{item.label}</span>
                  {hasChildren && <span style={S.chevron(isActive)}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>}
                </>
              )}
            </div>
          </HoverItem>
          {hasChildren && !collapsed && <div style={S.submenu(isOpen)}>{item.children.map(child => renderItem(child, level + 1))}</div>}
        </div>
      );

      if (hasChildren && collapsed) {
        return (
          <Dropdown key={item.key} menu={{ items: item.children.map(child => ({ key: child.key, label: child.label, onClick: child.onClick })), theme: "dark" }} placement="rightTop" trigger={["hover"]}>
            {content}
          </Dropdown>
        );
      }
      return content;
    }

    // Sub-menu items (level > 0)
    return (
      <div key={item.key}>
        <div
          style={S.submenuItem(itemPathActive, level)}
          onClick={() => { if (hasChildren) toggleSubmenu(item.key); else if (item.onClick) item.onClick(); }}
          onMouseEnter={(e) => { if (!itemPathActive) e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
          onMouseLeave={(e) => { if (!itemPathActive) e.currentTarget.style.background = "transparent"; }}
        >
          {!collapsed && <span style={S.submenuDot(itemPathActive)} />}
          <div style={{ flex: 1 }}>{item.label}</div>
          {hasChildren && !collapsed && <span style={S.chevron(isActive)}>{isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>}
        </div>
        {hasChildren && !collapsed && <div style={S.submenu(isOpen)}>{item.children.map(child => renderItem(child, level + 1))}</div>}
      </div>
    );
  };

  /* Derive initials from user */
  const displayName = user?.name || user?.fullName || "Admin";
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const SidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(180deg, #12101a 0%, #1a1625 60%, #12101a 100%)" }}>
      <Link to="/" style={S.logoBlock} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <img src="/Logo/logo.webp" alt="Logo" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0, borderRadius: 8 }} />
        {!collapsed && (
          <div style={S.logoText}>
            <span style={S.logoTitle}>{user?.isSuperAdmin ? "Admin Panel" : "Sub Admin"}</span>
            <span style={S.logoSubtitle}>Management Suite</span>
          </div>
        )}
      </Link>

      <div style={S.menuArea}>
        {!collapsed && <div style={S.sectionLabel}>Main</div>}
        {filteredMenuItems.slice(0, 6).map(item => renderItem(item))}
        <div style={S.divider} />
        {!collapsed && <div style={S.sectionLabel}>Others</div>}
        {filteredMenuItems.slice(6).map(item => renderItem(item))}
      </div>

      {/* ── User Profile Block ────────────────────── */}
      <div style={S.profileBlock}>
        {collapsed ? (
          /* Collapsed: just avatar */
          <HoverItem tooltip={displayName} collapsed={collapsed}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <div style={S.avatar}>
                  {user?.profile_image ? (
                    <img
                      src={getImageUrl(user.profile_image)}
                      alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div style={S.avatarOnlineDot} />
              </div>
            </div>
          </HoverItem>
        ) : (
          /* Expanded: full profile row */
          <div style={S.profileInner}>
            <div style={{ position: "relative", display: "inline-flex" }}>
              <div style={S.avatar}>
                {user?.profile_image ? (
                  <img
                    src={getImageUrl(user.profile_image)}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div style={S.avatarOnlineDot} />
            </div>

            <div style={S.profileInfo}>
              <div style={S.profileName}>{displayName}</div>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {user?.isSuperAdmin ? "Super Admin" : "Sub Admin"}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.45)",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                e.currentTarget.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer placement="left" closable={false} onClose={() => setCollapsed(true)} open={!collapsed} styles={{ body: { padding: 0, background: "#12101a" } }} width={250}>
        {SidebarContent}
      </Drawer>
    );
  }

  return (
    <div style={{ ...S.sidebar, ...(collapsed ? S.sidebarCollapsed : {}) }}>
      {SidebarContent}
    </div>
  );
};

export default Sidebar;

