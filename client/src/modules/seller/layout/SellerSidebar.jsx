import { useNavigate, useLocation, Link } from "react-router-dom";
import { Drawer, message, Dropdown } from "antd";
import {
  LayoutDashboard,
  Building,
  User,
  MessageSquare,
  Megaphone,
  LogOut,
  Lock,
  CreditCard,
  ClipboardList,
  Headphones,
  ChevronDown,
  ChevronRight,
  Star,
  MoreVertical,
  Home
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../../../services/api";
import { getImageUrl } from "../../../utils/imageUrl";

/* ─────────────────────────────────────────────
   Inline styles (no Tailwind dependency added)
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
  // Top logo block
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
  collapseBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(255,255,255,0.35)",
    display: "flex",
    alignItems: "center",
    padding: 4,
    borderRadius: 6,
    transition: "color 0.2s",
    flexShrink: 0,
  },
  // Scrollable menu area
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
    overflow: "hidden",
  },
  // Individual menu item
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
  badge: {
    background: "#7c3aed",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },
  lockIcon: {
    color: "rgba(255,255,255,0.3)",
    marginLeft: "auto",
    flexShrink: 0,
  },
  chevron: (isActive) => ({
    color: isActive ? "#a78bfa" : "rgba(255,255,255,0.3)",
    flexShrink: 0,
    transition: "transform 0.2s",
  }),
  // Sub-menu container
  submenu: (open) => ({
    overflow: "hidden",
    maxHeight: open ? 200 : 0,
    transition: "max-height 0.25s cubic-bezier(.4,0,.2,1)",
  }),
  submenuItem: (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 14px 8px 46px",
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
    alignItems: "flex-start", // left aligned text
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
  // Logout button
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "9px 14px",
    marginTop: 6,
    borderRadius: 8,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.18s, border-color 0.18s",
    justifyContent: "center",
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
};

/* ─────────────────────────────────────────────
   Hoverable menu item wrapper (for tooltip)
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
        <div style={S.tooltip}>{tooltip}</div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const SellerSidebar = ({ collapsed, setCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, user, refetchUser } = useAuth();
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  // ── existing logic (unchanged) ──────────────────────
  const defaultOpenKeys = ["properties"];

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const [subRes, historyRes] = await Promise.all([
          api.get("/subscriptions/my-subscription"),
          api.get("/subscriptions/my-history"),
        ]);
        setHasActivePlan(!!subRes.data);
        setHasHistory(historyRes.data?.length > 0);
      } catch (error) {
        console.error("Sidebar sub check error:", error);
      }
    };
    checkSubscription();
  }, [pathname]);

  // Quick fix: ensure businessType name is fetched if missing (e.g. after fresh login)
  useEffect(() => {
    if (user && user.businessType && !user.businessType.name) {
      refetchUser();
    }
  }, [user, refetchUser]);

  const handleMenuClick = (path, isLocked = false) => {
    if (isLocked) return;
    navigate(path);
    if (isMobile) {
      setCollapsed(true);
    }
  };
  // ────────────────────────────────────────────────────

  /* Derive initials and display name from auth user */
  const displayName = user?.name || user?.fullName || "Seller";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Store Manager";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* ── Menu definitions ───────────────────────────── */
  const mainItems = [
    {
      key: "/seller/dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      onClick: () => handleMenuClick("/seller/dashboard"),
    },
    {
      key: "properties",
      icon: <Building size={18} />,
      label: "Properties",
      hasChildren: true,
      children: [
        {
          key: "/seller/my-properties",
          label: "My Properties",
          onClick: () => handleMenuClick("/seller/my-properties"),
        },
        {
          key: "/seller/add-property",
          label: "Add Property",
          onClick: () => handleMenuClick("/seller/add-property"),
        },
      ],
    },
    {
      key: "/seller/enquiries",
      icon: <MessageSquare size={18} />,
      label: "Enquiry Property",
      locked: !hasActivePlan,
      onClick: () => handleMenuClick("/seller/enquiries"),
    },
    {
      key: "/seller/leads-overview",
      icon: <ClipboardList size={18} />,
      label: "Leads Overview",
      locked: !hasActivePlan,
      onClick: () => {
        if (!hasActivePlan) {
          navigate("/seller/upgrade-plan");
        } else {
          handleMenuClick("/seller/leads-overview");
        }
      },
    },
    {
      key: "/seller/payment-history",
      icon: <CreditCard size={18} />,
      label: "Payment History",
      locked: !hasHistory,
      onClick: () => {
        if (!hasHistory) {
          message.warning("Please upgrade your plan to access payment history");
        } else {
          handleMenuClick("/seller/payment-history");
        }
      },
    },
    {
      key: "/seller/support",
      icon: <Headphones size={18} />,
      label: "Support Team",
      onClick: () => handleMenuClick("/seller/support"),
    },
  ];

  const otherItems = [
    {
      key: "/seller/reviews",
      icon: <Star size={20} />,
      label: "My Reviews",
      onClick: () => handleMenuClick("/seller/reviews"),
    },
    {
      key: "/seller/profile",
      icon: <User size={18} />,
      label: "Profile",
      onClick: () => handleMenuClick("/seller/profile"),
    },

  ];

  /* ── Render a single menu item ─────────────────── */
  const renderItem = (item) => {
    const isParentActive =
      item.hasChildren &&
      item.children?.some((c) => pathname === c.key);
    const isActive = item.hasChildren
      ? isParentActive
      : pathname === item.key;

    if (item.hasChildren) {
      const isOpen = propertiesOpen && !collapsed;
      const triggerDiv = (
        <div
          style={S.menuItem(isActive, collapsed)}
          onClick={() =>
            collapsed
              ? null
              : setPropertiesOpen((v) => !v)
          }
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {isActive && <div style={S.activeBar} />}
          <span style={S.menuIcon(isActive)}>{item.icon}</span>
          {!collapsed && (
            <>
              <span style={S.menuLabel(isActive)}>{item.label}</span>
              <span style={S.chevron(isActive)}>
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
            </>
          )}
        </div>
      );

      return (
        <div key={item.key}>
          {collapsed ? (
            <Dropdown
              menu={{
                items: item.children.map((child) => ({
                  key: child.key,
                  label: child.label,
                  onClick: child.onClick,
                })),
                theme: "dark",
              }}
              placement="rightTop"
              trigger={["hover"]}
            >
              {triggerDiv}
            </Dropdown>
          ) : (
            <HoverItem tooltip={item.label} collapsed={false}>
              {triggerDiv}
            </HoverItem>
          )}

          {/* Sub-items */}
          {!collapsed && (
            <div style={S.submenu(isOpen)}>
              {item.children.map((child) => {
                const childActive = pathname === child.key;
                return (
                  <div
                    key={child.key}
                    style={S.submenuItem(childActive)}
                    onClick={child.onClick}
                    onMouseEnter={(e) => {
                      if (!childActive)
                        e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!childActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={S.submenuDot(childActive)} />
                    {child.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <HoverItem key={item.key} tooltip={item.label} collapsed={collapsed}>
        <div
          style={S.menuItem(isActive, collapsed)}
          onClick={item.onClick}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {isActive && <div style={S.activeBar} />}
          <span style={S.menuIcon(isActive)}>{item.icon}</span>
          {!collapsed && (
            <>
              <span style={S.menuLabel(isActive)}>{item.label}</span>
              {item.locked && (
                <span style={S.lockIcon}>
                  <Lock size={12} />
                </span>
              )}
            </>
          )}
        </div>
      </HoverItem>
    );
  };

  /* ── Sidebar body ───────────────────────────────── */
  const SidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background:
          "linear-gradient(180deg, #12101a 0%, #1a1625 60%, #12101a 100%)",
      }}
    >
      {/* ── Logo ─────────────────────────────────── */}
      <Link to="/" style={S.logoBlock}>
        <img
          src="/Logo/logo.webp"
          alt="Logo"
          style={{
            width: collapsed ? 38 : 38,
            height: collapsed ? 38 : 38,
            objectFit: "contain",
            flexShrink: 0,
            borderRadius: 8,
          }}
        />
        {!collapsed && (
          <div style={S.logoText}>
            <span style={S.logoTitle}>Seller Panel</span>
            {user?.businessType?.name && (
              <span style={S.logoSubtitle}>{user.businessType.name}</span>
            )}
          </div>
        )}
      </Link>

      {/* ── Menu ─────────────────────────────────── */}
      <div style={S.menuArea}>
        {/* Main section */}
        {!collapsed && (
          <div style={S.sectionLabel}>Main</div>
        )}
        {collapsed && (
          <div style={{ ...S.sectionLabel, textAlign: "center", padding: "10px 0 4px" }}>
            Main
          </div>
        )}

        {mainItems.map(renderItem)}

        <div style={S.divider} />

        {/* Others section */}
        {!collapsed && (
          <div style={S.sectionLabel}>Others</div>
        )}
        {collapsed && (
          <div style={{ ...S.sectionLabel, textAlign: "center", padding: "10px 0 4px" }}>
            Others
          </div>
        )}

        {otherItems.map(renderItem)}
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
          /* Expanded: full profile row (avatar on left, text on right) */
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
            </div>

            <div style={S.profileInfo}>
              <div style={S.profileName}>{displayName}</div>
              {user?.badgeVerified && (
                <div style={{ ...S.profileRole, color: "gray", fontWeight: 700 }}>
                  VERIFIED ACCOUNT
                </div>
              )}
            </div>

            <Dropdown
              menu={{
                items: [
                  {
                    key: "home",
                    label: "Back Home",
                    icon: <Home size={14} />,
                    onClick: () => navigate("/"),
                  },
                  {
                    key: "logout",
                    label: "Logout",
                    icon: <LogOut size={14} />,
                    danger: true,
                    onClick: logout,
                  },
                ],
              }}
              trigger={["click"]}
              placement="topRight"
            >
              <button
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
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }}
              >
                <MoreVertical size={18} />
              </button>
            </Dropdown>
          </div>
        )}
      </div>

    </div>
  );

  /* ── Mobile Drawer ──────────────────────────────── */
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setCollapsed(true)}
        open={!collapsed}
        styles={{ body: { padding: 0, background: "#12101a" } }}
        size={250}
      >
        {SidebarContent}
      </Drawer>
    );
  }

  /* ── Desktop Sider ──────────────────────────────── */
  return (
    <div
      style={{
        ...S.sidebar,
        ...(collapsed ? S.sidebarCollapsed : {}),
      }}
    >
      {SidebarContent}
    </div>
  );
};

export default SellerSidebar;
