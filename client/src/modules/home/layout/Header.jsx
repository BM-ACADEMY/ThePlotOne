import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "@/context/AuthContext";
import { useNav } from "@/context/NavContext";
import { useLocation as useAppLocation } from "@/context/LocationContext";
import { getImageUrl } from "@/utils/imageUrl";
import { slugify } from "@/utils/slugify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  ChevronDown,
  Star,
  PhoneCall,
  Search,
  ChevronRight,
  MapPin,
  LocateFixed,
} from "lucide-react";
import RequestCallBackModal from "@/components/Common/RequestCallBackModal";
import PropertySearchBar from "../components/PropertySearchBar";
import TopAnnouncementBar from "@/components/Common/TopAnnouncementBar";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeBusinessDropdown, setActiveBusinessDropdown] = useState(null);
  const [expandedMobileBusiness, setExpandedMobileBusiness] = useState(null);
  const {
    businessTypes,
    propertyCategories = [],
    isCallbackModalOpen,
    setIsCallbackModalOpen,
  } = useNav();

  // Sort business types: Agent -> Builder/Promoter -> Owner
  const sortedBusinessTypes = useMemo(() => {
    return [...businessTypes].sort((a, b) => {
      const nameA = (
        typeof a.name === "string" ? a.name : a.name?.name || ""
      ).toLowerCase();
      const nameB = (
        typeof b.name === "string" ? b.name : b.name?.name || ""
      ).toLowerCase();

      const getIndex = (name) => {
        if (name.includes("agent")) return 0;
        if (name.includes("builder") || name.includes("promoter")) return 1;
        if (name.includes("owner") || name.includes("individual")) return 2;
        return 3;
      };

      return getIndex(nameA) - getIndex(nameB);
    });
  }, [businessTypes]);

  const builderType = useMemo(() => {
    return businessTypes.find((t) => {
      const n = typeof t.name === "string" ? t.name : t.name?.name || "";
      return (
        n.toLowerCase().includes("builder") ||
        n.toLowerCase().includes("promoter")
      );
    });
  }, [businessTypes]);

  const userMenuRef = useRef(null);
  const { user, logout, isAuthenticated, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { city, detectLocation, loading: locationLoading } = useAppLocation();

  const isHomePage = location.pathname === "/";
  const isPropertiesPage = location.pathname === "/properties";

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        const scrollTop = mainContent.scrollTop;
        const threshold = window.innerWidth < 1024 ? 130 : 170;

        setIsScrolled((prev) => {
          if (scrollTop > threshold && !prev) {
            return true;
          } else if (scrollTop <= threshold && prev) {
            setIsMobileSearchOpen(false);
            return false;
          }
          return prev;
        });
      }
    };

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isHomePage]);

  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
  }, [logout]);

  const handlePostProperty = useCallback(() => {
    setIsMenuOpen(false);
    if (isAuthenticated && user) {
      const {
        canPost,
        reason,
        message: limitMessage,
        redirectPath,
      } = checkPropertyListingLimit(user);

      if (!canPost) {
        message.warning({
          content: limitMessage,
          key: "verification-restricted",
        });

        if (reason === "unverified") {
          const role =
            user?.role_id?.role_name?.toUpperCase() ||
            user?.role?.name?.toUpperCase();
          if (role === "SELLER") {
            navigate("/seller/profile");
          } else {
            navigate("/user/profile");
          }
        } else if (reason === "limit_reached") {
          navigate(redirectPath || "/seller/upgrade-plan");
        }
        return;
      }

      const role =
        user?.role_id?.role_name?.toUpperCase() ||
        user?.role?.name?.toUpperCase();
      if (role === "ADMIN") {
        navigate("/admin/properties/add");
      } else if (role === "SELLER") {
        navigate("/seller/add-property");
      } else {
        navigate("/add-property");
      }
    } else {
      navigate("/post-property");
    }
  }, [isAuthenticated, user, navigate]);

  // --- Animation Variants ---
  const dropdownVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const sidebarVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <>
      <header
        className={`z-[1000] transition-all duration-500
          ${
            isHomePage
              ? "lg:fixed lg:top-0 lg:left-0 lg:right-0 relative"
              : "fixed top-0 left-0 right-0"
          }
          ${
            isHomePage
              ? isScrolled
                ? "bg-[#166aa8] shadow-lg py-1"
                : "bg-[white] lg:bg-transparent lg:border-transparent py-0 lg:py-0"
              : "bg-[#166aa8] shadow-lg py-1"
          }`}
      >
        <TopAnnouncementBar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 xl:space-x-4">
              {/* Logo - Left Side */}
              <Link
                to="/"
                className={`flex-shrink-0 items-center group cursor-pointer ${isMobileSearchOpen ? "hidden lg:flex" : "flex"}`}
                onClick={() => {
                  const mainContent = document.getElementById("main-content");
                  if (mainContent) {
                    mainContent.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                <img
                  src="/Logo/logo.webp"
                  alt="ThePlotOne Logo - Pondicherry's leading real estate platform"
                  className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Location Picker - Moved next to Logo */}
              <div className="hidden lg:flex items-center">
                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className={`flex items-center space-x-1.5 xl:space-x-2 lg:px-2 xl:px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${isHomePage && !isScrolled ? "text-white hover:bg-white/20" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}
                  aria-label={`Current location: ${city}. Click to detect location.`}
                >
                  <MapPin
                    className={`h-4 w-4 ${locationLoading ? "animate-pulse" : ""}`}
                  />
                  <span className="text-[10px] xl:text-xs font-bold truncate max-w-[80px] xl:max-w-[100px] uppercase tracking-wider">
                    {locationLoading ? "Locating..." : city}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Side Container (Navigation + Actions) - Visible on lg and above */}
            <div className="hidden lg:flex items-center flex-1 justify-end lg:space-x-3 xl:space-x-8">
              {/* Scrolling Search Bar (Reuses PropertySearchBar) */}
              {(isScrolled && isHomePage) || isPropertiesPage ? (
                <div className="flex-1 max-w-4xl lg:mx-4 xl:mx-8">
                  <PropertySearchBar variant="header" showFilters={false} />
                </div>
              ) : (
                /* Desktop Navigation */
                <nav className="flex items-center lg:space-x-3 xl:space-x-6">
                  {propertyCategories.map((category) => {
                    const name = category; // Sell, Rent
                    return (
                      <Link
                        key={name}
                        to={`/properties?category=${encodeURIComponent(name)}`}
                        className="text-white hover:text-yellow-300 font-medium transition-colors lg:text-[13px] xl:text-[15px] tracking-wide cursor-pointer"
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Link>
                    );
                  })}

                  {sortedBusinessTypes.map((type) => {
                    const id = type._id?.toString() || type.name;
                    const name =
                      typeof type.name === "string"
                        ? type.name
                        : type.name?.name || "Unknown";
                    return (
                      <div
                        key={id}
                        className="relative group py-2"
                        onMouseEnter={() => setActiveBusinessDropdown(id)}
                        onMouseLeave={() => setActiveBusinessDropdown(null)}
                      >
                        <button className="flex items-center space-x-1 text-white hover:text-yellow-300 font-medium transition-colors lg:text-[13px] xl:text-[15px] tracking-wide capitalize focus:outline-none cursor-pointer">
                          <span className="lg:hidden xl:inline">{name}</span>
                          <span className="hidden lg:inline xl:hidden">
                            {name.includes("/")
                              ? name.split("/")[0].trim()
                              : name}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-300 ${activeBusinessDropdown === id ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {activeBusinessDropdown === id && (
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                              <div className="px-2 space-y-0.5">
                                <Link
                                  to={`/business/${slugify(name)}`}
                                  className="flex items-center px-4 py-2 text-sm font-bold text-[#166aa8] hover:bg-blue-50 rounded-lg transition-colors capitalize"
                                >
                                  Our {name}
                                </Link>
                                {name.toLowerCase().includes("agent") && (
                                  <Link
                                    to="/agent-info"
                                    onClick={() =>
                                      setActiveBusinessDropdown(null)
                                    }
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#166aa8] rounded-lg transition-colors"
                                  >
                                    Agent Info
                                  </Link>
                                )}
                                {(name.toLowerCase().includes("builder") ||
                                  name.toLowerCase().includes("promoter")) && (
                                  <>
                                    <Link
                                      to="/builder-info"
                                      onClick={() =>
                                        setActiveBusinessDropdown(null)
                                      }
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#166aa8] rounded-lg transition-colors"
                                    >
                                      Builder Info
                                    </Link>
                                  </>
                                )}
                                <button
                                  onClick={handlePostProperty}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#166aa8] rounded-lg transition-colors group/post"
                                >
                                  <span>Post Property</span>
                                  <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ml-2.5">
                                    FREE
                                  </span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  <Link
                    to="/blog"
                    className="text-white hover:text-yellow-300 font-medium transition-colors lg:text-[13px] xl:text-[15px] tracking-wide cursor-pointer"
                  >
                    Blog
                  </Link>
                </nav>
              )}

              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              {/* Actions */}
              <div className="flex items-center lg:space-x-3 xl:space-x-5">
                {/* Post Property Button */}
                <button
                  onClick={handlePostProperty}
                  className="flex items-center cursor-pointer bg-white text-gray-900 lg:px-2 xl:px-4 py-2 rounded-md hover:bg-gray-100 transition-all font-semibold shadow-sm"
                >
                  <span className="lg:text-[12px] xl:text-[14px]">
                    Post property
                  </span>
                  <span className="relative overflow-hidden ml-2 bg-[#1aa554] text-white text-[10px] tracking-wider font-bold px-1.5 py-0.5 rounded before:absolute before:inset-0 before:-translate-x-full before:animate-[shine_3s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent">
                    FREE
                  </span>
                </button>

                {/* Support/Headphones Icon Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsContactMenuOpen(true)}
                  onMouseLeave={() => setIsContactMenuOpen(false)}
                >
                  <button 
                    className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none cursor-pointer"
                    aria-label="Contact Support"
                    aria-haspopup="true"
                    aria-expanded={isContactMenuOpen}
                  >
                    <PhoneCall className="h-5 w-5" />
                  </button>

                  <AnimatePresence>
                    {isContactMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-6 px-6 z-50 overflow-hidden cursor-default"
                      >
                        <h3 className="text-[#003366] font-bold text-[13px] tracking-wide mb-6">
                          CONTACT US
                        </h3>

                        <div className="flex items-start mb-6">
                          <PhoneCall className="h-5 w-5 text-[#4A5568] mt-1 mr-4 shrink-0" />
                          <div>
                            <p className="text-[#A0AEC0] text-[13px] font-medium tracking-wide">
                              Toll Free | 9:30 AM to 6:30 PM
                            </p>
                            <p className="text-[#A0AEC0] text-[13px] font-medium tracking-wide">
                              (Mon-Sun)
                            </p>
                            <a
                              href="tel:+919403892971"
                              className="text-[#2D3748] font-semibold text-lg mt-0.5 tracking-wide hover:text-[#166aa8] transition-colors"
                            >
                              +91 94038 92971
                            </a>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsContactMenuOpen(false);
                            setIsCallbackModalOpen(true);
                          }}
                          className="w-full bg-[#166aa8] text-white hover:bg-[#0078d7] hover:text-white transition-colors duration-300 rounded-lg py-2.5 font-bold flex items-center justify-center space-x-2 text-[15px]"
                        >
                          <PhoneCall className="h-4 w-4" />
                          <span>Request a Call Back</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Favorites icon is commented out as requested */}
                {/*
                <Link
                  to="/favorites"
                  className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-200 transition-colors shadow-sm"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                */}

                {/* USER PROFILE DROPDOWN (NEW LIGHT DESIGN) */}
                {isAuthenticated ? (
                  <div
                    className="relative"
                    ref={userMenuRef}
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <button className="flex items-center space-x-1 focus:outline-none group py-1 cursor-pointer">
                      <div className="relative">
                        <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center overflow-hidden border border-transparent group-hover:border-gray-400 transition-all duration-300 text-gray-900">
                          {user?.profile_image ? (
                            <img
                              src={getImageUrl(user.profile_image)}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors ml-1" />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 pt-0 pb-2 z-50 overflow-hidden"
                        >
                          {/* Profile Card Header inside Dropdown */}
                          <div className="px-5 py-3 border-b border-gray-100 mb-2 flex items-center space-x-3 bg-slate-50">
                            <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-blue-100 flex items-center justify-center text-blue-600">
                              {user?.profile_image ? (
                                <img
                                  src={getImageUrl(user.profile_image)}
                                  alt={user.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-gray-900 truncate tracking-wide">
                                {user?.name || "User"}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          {/* Navigation Links */}
                          <div className="px-2 space-y-1">
                            {user?.role_id?.role_name?.toUpperCase() ===
                              "ADMIN" ||
                            user?.role?.name?.toUpperCase() === "ADMIN" ? (
                              <Link
                                to="/admin/dashboard"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 rounded-xl transition-all group"
                              >
                                <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="group-hover:translate-x-1 transition-transform">
                                  Admin Dashboard
                                </span>
                              </Link>
                            ) : user?.role_id?.role_name?.toUpperCase() ===
                                "SELLER" ||
                              user?.role?.name?.toUpperCase() === "SELLER" ? (
                              <Link
                                to="/seller/dashboard"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 rounded-xl transition-all group"
                              >
                                <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="group-hover:translate-x-1 transition-transform">
                                  Seller Dashboard
                                </span>
                              </Link>
                            ) : (
                              <>
                                <Link
                                  to="/user/profile"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 rounded-xl transition-all group"
                                >
                                  <User className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                  <span className="group-hover:translate-x-1 transition-transform">
                                    My Profile
                                  </span>
                                </Link>
                                <Link
                                  to="/user/reviews"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 rounded-xl transition-all group"
                                >
                                  <Star className="h-4 w-4 mr-3 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                                  <span className="group-hover:translate-x-1 transition-transform">
                                    My Reviews
                                  </span>
                                </Link>
                              </>
                            )}

                            <Link
                              to="/favorites"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 rounded-xl transition-all group"
                            >
                              <Heart className="h-4 w-4 mr-3 text-gray-400 group-hover:text-pink-500 transition-colors" />
                              <span className="group-hover:translate-x-1 transition-transform">
                                My Wishlist
                              </span>
                            </Link>
                          </div>

                          {/* Action - Sign out */}
                          <div className="border-t border-gray-100 mt-2 pt-2 px-2 pb-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center px-4 py-2.5 mx-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                            >
                              <LogOut className="h-4 w-4 mr-3 text-red-500 transition-transform group-hover:scale-110" />
                              <span className="group-hover:translate-x-1 transition-transform">
                                Sign Out
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsLoginMenuOpen(true)}
                    onMouseLeave={() => setIsLoginMenuOpen(false)}
                  >
                    <button className="flex items-center space-x-1 focus:outline-none group py-1 cursor-pointer">
                      <div className="relative">
                        <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center text-gray-900 border border-transparent group-hover:border-gray-400 transition-all">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 group-hover:text-white transition-all ml-1 ${isLoginMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isLoginMenuOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden"
                        >
                          {/* Welcome Header */}
                          <div className="px-5 py-3 border-b border-gray-100 bg-slate-50">
                            <p className="text-sm font-bold text-gray-900 tracking-wide">
                              Welcome to ThePlotOne
                            </p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              Login to manage your properties, leads and saved
                              listings.
                            </p>
                          </div>

                          {/* Login Action */}
                          <div className="p-4">
                            <button
                              onClick={() => {
                                setIsLoginMenuOpen(false);
                                setLoginModalOpen(true);
                              }}
                              className="w-full flex items-center justify-center px-4 py-3 bg-[#166aa8] text-white text-sm font-bold rounded-xl hover:bg-[#125a8e] transition-all shadow-md active:scale-[0.98] group cursor-pointer"
                            >
                              <User className="h-4 w-4 mr-2 text-white/80 group-hover:text-white transition-colors" />
                              <span>Login / Register</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle - Visible below lg */}
            <div
              className={`lg:hidden flex items-center ${isMobileSearchOpen ? "flex-1 ml-2" : "space-x-3"}`}
            >
              {isMobileSearchOpen ? (
                <div className="flex items-center w-full gap-2 transition-all duration-300">
                  <div className="flex-1">
                    <PropertySearchBar variant="header" showFilters={false} />
                  </div>
                  <button
                    onClick={() => setIsMobileSearchOpen(false)}
                    className={`p-2 transition-colors focus:outline-none shrink-0 rounded-lg ${
                      isHomePage && !isScrolled
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-white hover:text-yellow-300"
                    }`}
                    aria-label="Close search"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Location Picker */}
                  <button
                    onClick={detectLocation}
                    disabled={locationLoading}
                    className={`p-2 transition-colors focus:outline-none rounded-lg ${
                      isHomePage && !isScrolled
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-white hover:text-yellow-300"
                    }`}
                  >
                    <MapPin
                      className={`h-6 w-6 ${locationLoading ? "animate-pulse" : ""}`}
                    />
                  </button>
                  {/* Mobile Contact/Search Button */}
                  <button
                    onClick={() => {
                      if (isScrolled) {
                        setIsMobileSearchOpen(true); // Open full search
                      } else {
                        setIsCallbackModalOpen(true);
                      }
                    }}
                    className={`p-2 transition-colors focus:outline-none rounded-lg ${
                      isHomePage && !isScrolled
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-white hover:text-yellow-300"
                    }`}
                  >
                    {isScrolled ? (
                      <Search className="h-6 w-6" />
                    ) : (
                      <PhoneCall className="h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`p-2 rounded-lg focus:outline-none transition-colors ${
                      isHomePage && !isScrolled
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-white hover:text-yellow-300 hover:bg-[#115b94]"
                    }`}
                    aria-label="Open menu"
                    aria-expanded={isMenuOpen}
                  >
                    <Menu className="h-7 w-7" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Legacy Mobile Search Bar Expansion - Removed as it's now integrated in the header line */}
        </div>
      </header>

      {/* MOBILE MENU (Off-canvas sidebar matching dark theme) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] lg:hidden"
            />
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl z-[1001] lg:hidden flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-slate-50">
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="flex items-center text-[#166aa8] font-bold text-[15px] tracking-wide uppercase cursor-pointer"
                  >
                    <User className="h-6 w-6 mr-2 text-slate-700" />
                    LOGIN / REGISTER
                  </button>
                ) : (
                  <div className="flex items-center text-[#166aa8] font-bold text-[15px] tracking-wide uppercase truncate">
                    <User className="h-6 w-6 mr-2 text-slate-700 shrink-0" />
                    <span className="truncate">{user?.name || "PROFILE"}</span>
                  </div>
                )}
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                {/* Banner Card */}
                <div className="bg-[#e6f4ea] rounded-xl p-4 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
                  <div className="relative z-10 w-[60%]">
                    <h3 className="font-bold text-[#1E293B] leading-tight mb-3 text-[15px]">
                      Sell or rent faster at the right price!
                    </h3>
                    <button
                      onClick={handlePostProperty}
                      className="bg-[#0078d7] hover:bg-[#005bb5] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                    >
                      Post Property
                    </button>
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-[50%] h-full bg-contain bg-no-repeat bg-bottom"
                    style={{ backgroundImage: "url(/properties/adsman.webp)" }}
                  ></div>
                </div>

                {/* Authentication Links */}
                {isAuthenticated && (
                  <div className="space-y-1">
                    {user?.role_id?.role_name?.toUpperCase() === "ADMIN" ||
                    user?.role?.name?.toUpperCase() === "ADMIN" ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                      >
                        <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                        Dashboard
                      </Link>
                    ) : user?.role_id?.role_name?.toUpperCase() === "SELLER" ||
                      user?.role?.name?.toUpperCase() === "SELLER" ? (
                      <Link
                        to="/seller/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                      >
                        <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                        Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/user/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                        >
                          <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                          Profile
                        </Link>
                        <Link
                          to="/user/reviews"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                        >
                          <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                          Reviews
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-2 py-3 text-red-500 hover:bg-red-50 transition-colors rounded-lg text-[15px]"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 text-red-400" />{" "}
                      Logout
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[15px] font-medium text-slate-800 mb-2">
                    Explore our Services
                  </p>
                  <div className="border-t border-gray-100 mb-2"></div>

                  {propertyCategories.map((category) => {
                    const name = category;
                    return (
                      <Link
                        key={name}
                        to={`/properties?category=${encodeURIComponent(name)}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                      >
                        <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Link>
                    );
                  })}

                  {sortedBusinessTypes.map((type) => {
                    const id = type._id?.toString() || type.name;
                    const name =
                      typeof type.name === "string"
                        ? type.name
                        : type.name?.name || "Unknown";
                    const isExpanded = expandedMobileBusiness === id;

                    return (
                      <div key={id} className="space-y-1">
                        <button
                          onClick={() =>
                            setExpandedMobileBusiness(isExpanded ? null : id)
                          }
                          className="flex items-center justify-between w-full px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px] capitalize"
                        >
                          <div className="flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />{" "}
                            {name}
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-6 space-y-1"
                            >
                              <Link
                                to={`/business/${slugify(name)}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm font-bold text-[#166aa8] hover:bg-blue-50/50 rounded-lg transition-all capitalize"
                              >
                                {name}
                              </Link>
                              {name.toLowerCase().includes("agent") && (
                                <Link
                                  to="/agent-info"
                                  onClick={() => setIsMenuOpen(false)}
                                  className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:text-[#166aa8] hover:bg-blue-50/50 rounded-lg transition-all"
                                >
                                  Agent Info
                                </Link>
                              )}
                              {(name.toLowerCase().includes("builder") ||
                                name.toLowerCase().includes("promoter")) && (
                                <>
                                  <Link
                                    to="/builder-info"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:text-[#166aa8] hover:bg-blue-50/50 rounded-lg transition-all"
                                  >
                                    Builder Info
                                  </Link>
                                </>
                              )}
                              <button
                                onClick={handlePostProperty}
                                className="w-full flex items-center px-4 py-2.5 text-sm text-slate-600 hover:text-[#166aa8] hover:bg-blue-50/50 rounded-lg transition-all"
                              >
                                <span>Post Property</span>
                                <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ml-2.5">
                                  FREE
                                </span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  <Link
                    to="/blog"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-2 py-3 text-slate-700 hover:text-[#166aa8] hover:bg-blue-50 transition-colors rounded-lg text-[15px]"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 text-slate-400" /> Blog
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RequestCallBackModal
        isOpen={isCallbackModalOpen}
        onClose={() => setIsCallbackModalOpen(false)}
      />
    </>
  );
};

export default Header;
