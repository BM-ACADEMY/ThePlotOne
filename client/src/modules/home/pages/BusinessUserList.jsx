import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useNav } from "@/context/NavContext";
import axios from "axios";
import {
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  User,
  ArrowRight,
  Building2,
  Phone,
  ShieldCheck,
  Star,
  Users,
  X,
  ChevronRight,
  Share2,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { getImageUrl } from "@/utils/imageUrl";
import HorizontalPropertyCard from "@/modules/home/components/HorizontalPropertyCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import PhoneUpdateModal from "@/components/Common/PhoneUpdateModal";
import { slugify } from "@/utils/slugify";
import Loader from "@/components/Common/Loader";

const BusinessUserList = () => {
  const { businessTypeSlug, sellerSlug } = useParams();
  const { businessTypes = [] } = useNav();
  const [businessTypeId, setBusinessTypeId] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerProperties, setSellerProperties] = useState([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [businessType, setBusinessType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  const { user, setLoginModalOpen } = useAuth();
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isBuilderType = useMemo(() => {
    return businessType?.name?.toLowerCase().includes("builder") ||
      businessType?.name?.toLowerCase().includes("promoter");
  }, [businessType]);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (businessTypes.length > 0 && businessTypeSlug) {
      if (businessTypeSlug === "administration") {
        setBusinessTypeId("administration");
        setBusinessType({ name: "Administration" });
        return;
      }
      const type = businessTypes.find((t) => {
        const name = typeof t.name === "string" ? t.name : t.name?.name || "";
        return slugify(name) === businessTypeSlug || t._id === businessTypeSlug;
      });
      if (type) {
        setBusinessTypeId(type._id);
        const typeSlug = slugify(typeof type.name === "string" ? type.name : type.name?.name || "");
        if (type._id === businessTypeSlug && typeSlug) {
          navigate(`/business/${typeSlug}${sellerSlug ? `/${sellerSlug}` : ""}`, { replace: true });
        }
      }
    }
  }, [businessTypeSlug, businessTypes, navigate, sellerSlug]);

  useEffect(() => {
    const fontLinkId = "google-font-poppins";
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement("link");
      link.id = fontLinkId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      if (!businessTypeId) return;
      setLoading(true);
      try {
        if (businessTypeId === "administration") {
          const res = await axios.get(`${API}/users/public-admins`);
          setSellers(res.data);
          if (res.data.length > 0) setSelectedSeller(res.data[0]);
        } else {
          const [typeRes, sellersRes] = await Promise.all([
            axios.get(`${API}/business-types/${businessTypeId}`),
            axios.get(`${API}/users/sellers-by-business-type/${businessTypeId}`),
          ]);
          const bType = typeRes.data;
          setBusinessType(bType);
          setSellers(sellersRes.data);

          // Check if this is a builder/promoter type
          const isBuilder =
            bType?.name?.toLowerCase().includes("builder") ||
            bType?.name?.toLowerCase().includes("promoter");

          // Only auto-select if NOT a builder type
          if (sellersRes.data.length > 0 && !isBuilder) {
            setSelectedSeller(sellersRes.data[0]);
          } else {
            setSelectedSeller(null);
          }
        }
      } catch (error) {
        console.error("Error fetching sellers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [businessTypeId, API]);

  useEffect(() => {
    if (sellerSlug && sellers.length > 0) {
      const seller = sellers.find((s) => s.slug === sellerSlug || s._id === sellerSlug);
      if (seller) {
        setSelectedSeller(seller);
        // Auto-redirect to slug if accessing by ID
        if (seller._id === sellerSlug && seller.slug) {
          navigate(`/business/${businessTypeSlug}/${seller.slug}`, { replace: true });
        }
      }
    } else if (!sellerSlug && isBuilderType) {
      // Clear selected seller when going back to the list (for builders)
      setSelectedSeller(null);
    }
  }, [sellerSlug, sellers, navigate, businessTypeSlug, isBuilderType]);

  useEffect(() => {
    const fetchSellerProperties = async () => {
      if (!selectedSeller) {
        setSellerProperties([]);
        return;
      }
      setPropertiesLoading(true);
      try {
        let url = `${API}/properties/fetch-all-property?seller_id=${selectedSeller._id}`;
        if (businessTypeId !== "administration") {
          url += `&businessType=${businessTypeId}`;
        }
        const res = await axios.get(url);
        setSellerProperties(res.data.properties || []);
      } catch (error) {
        console.error("Error fetching seller properties:", error);
      } finally {
        setPropertiesLoading(false);
      }
    };
    fetchSellerProperties();
  }, [selectedSeller, businessTypeId, API]);

  // Close drawer when screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsDrawerOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handleWhatsAppClick = async (e, targetUser, property = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!targetUser) return;

    if (!user) {
      setPendingWhatsApp({ targetUser, property });
      setLoginModalOpen(true);
      return;
    }

    // Normalise phone: strip leading +, 0, or 91 country code then prepend 91
    const rawPhone = (targetUser.phone || "").toString().replace(/\D/g, "");
    const sellerPhone =
      rawPhone.length === 10
        ? `91${rawPhone}`
        : rawPhone.length === 12 && rawPhone.startsWith("91")
          ? rawPhone
          : rawPhone;

    const message = property
      ? `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${typeof property.location === "string" ? property.location : property.location?.city || "Unknown"}. Please provide more details.`
      : `Hi ${targetUser.name}, I'm interested in your property listings on The Plot One.`;

    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    // Track enquiry if user is logged in
    if (user) {
      try {
        await api.post("/enquiries/create", {
          property_id: property?._id,
          seller_id: targetUser._id,
          message: message,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
        });
        toast.success("Enquiry sent! Opening WhatsApp...");
        window.open(whatsappUrl, "_blank");
      } catch (err) {
        console.error("Enquiry Error:", err);
        const errMsg = err.response?.data?.error || "Failed to submit enquiry";
        toast.error(errMsg);
      }
    } else {
      window.open(whatsappUrl, "_blank");
    }
  };

  useEffect(() => {
    if (user && pendingWhatsApp) {
      handleWhatsAppClick(null, pendingWhatsApp.targetUser, pendingWhatsApp.property);
      setPendingWhatsApp(null);
    }
  }, [user, pendingWhatsApp]);

  const submitEnquiry = async (targetUser, property, name, email, phone) => {
    // Normalise phone: strip leading +, 0, or 91 country code then prepend 91
    const rawPhone = (targetUser.phone || "").toString().replace(/\D/g, "");
    const sellerPhone =
      rawPhone.length === 10
        ? `91${rawPhone}`
        : rawPhone.length === 12 && rawPhone.startsWith("91")
          ? rawPhone
          : rawPhone || "919000000000";

    const message = property
      ? `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${typeof property.location === "string" ? property.location : property.location?.city || "Unknown"}. Please provide more details.`
      : `Hi ${targetUser.name}, I'm interested in your property listings on The Plot One.`;

    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    setEnquiryLoading(true);
    try {
      await api.post("/enquiries/create", {
        property_id: property?._id,
        seller_id: targetUser._id,
        message: message,
        name,
        email,
        phone,
      });
      toast.success("Enquiry sent! Opening WhatsApp...");
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Enquiry Error:", error);
      const errMsg = error.response?.data?.error || "Failed to submit enquiry";
      toast.error(errMsg);
    } finally {
      setEnquiryLoading(false);
    }
  };

  const handleShareProfile = async (e) => {
    e.stopPropagation();
    const shareData = {
      title: `${selectedSeller?.name} | The Plot One`,
      text: `View ${selectedSeller?.name}'s professional profile and listings on The Plot One.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      } else {
        throw new Error("Sharing not supported");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Profile link copied to clipboard!");
        } catch (clipError) {
          toast.error("Could not share or copy profile link");
        }
      }
    }
  };



  if (loading) {
    return <Loader />;
  }

  // Shared sellers list content
  const maskPhoneNumber = (phone) => {
    if (!phone) return "**********";
    const phoneStr = phone.toString();
    if (phoneStr.length < 10) return phoneStr;
    return phoneStr.substring(0, 5) + "*****";
  };

  const SellersList = ({ onSelect, compact = false }) => (
    <div className="overflow-y-auto">
      {sellers.map((user) => {
        const isActive = selectedSeller?._id === user._id;
        return (
          <div
            key={user._id}
            onClick={() => {
              const sellerPath = user.slug || slugify(user.name) || user._id;
              navigate(`/business/${businessTypeSlug}/${sellerPath}`);
              onSelect?.();
            }}
            className={`group flex items-center cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-0
              ${compact ? "gap-3 px-4 py-3" : "gap-4 px-5 py-4"}
              ${isActive
                ? "bg-[#174685]/8"
                : "bg-white hover:bg-slate-50 border-l-[3px] border-l-transparent"
              }`}
          >
            {/* Avatar */}
            <div
              className={`relative shrink-0 ${compact ? "w-12 h-12" : "w-16 h-16"}`}
            >
              <div
                className={`overflow-hidden transition-all duration-200 absolute top-1 left-1
                ${compact ? "w-10 h-10 rounded-full" : "w-14 h-14 rounded-xl"}
                `}
              >
                {user.profile_image ? (
                  <img
                    src={getImageUrl(user.profile_image)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center font-bold
                    ${compact ? "text-sm" : "text-xl"}
                    ${isActive ? "bg-[#174685] text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Green online dot */}
              {/* <span className={`absolute border-2 border-white rounded-full bg-green-400 z-10
                ${compact ? "bottom-0.5 right-0.5 w-2.5 h-2.5" : "bottom-1 right-1 w-3 h-3"}`}></span> */}
              {/* Active check badge */}
              {isActive && (
                <div
                  className={`absolute bg-[#174685] rounded-full flex items-center justify-center border-2 border-white z-10
                  ${compact ? "-top-0.5 -left-0.5 w-4 h-4" : "-top-0.5 -left-0.5 w-5 h-5"}`}
                >
                  <svg
                    width={compact ? 8 : 9}
                    height={compact ? 8 : 9}
                    viewBox="0 0 10 8"
                    fill="none"
                  >
                    <path
                      d="M1 4L3.5 7L9 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4
                className={`truncate leading-tight transition-colors
                ${compact ? "text-[13px]" : "text-[14px]"}
                ${isActive ? "text-[#174685] font-bold" : "text-slate-800 font-semibold group-hover:text-[#174685]"}`}
              >
                {user.name}
              </h4>
              {!compact && (
                <p className="text-[11px] text-slate-400 capitalize mt-0.5 truncate">
                  {businessType?.name || "Professional"}
                </p>
              )}
              <div className="text-[11px] text-[#174685] font-bold mt-1">
                {maskPhoneNumber(user.phone)}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight
              className={`shrink-0 transition-all duration-200
              ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}
              ${isActive ? "text-[#174685]" : "text-slate-200 group-hover:text-slate-400"}`}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen pt-30 bg-gray-50 font-['Poppins',_sans-serif] pb-20 pt-8 relative overflow-x-hidden">
      {/* ─── MOBILE: Floating side tab button ─── */}
      {sellers.length > 0 && !isBuilderType && (
        <div className="lg:hidden fixed left-0 top-[120px] z-[400]">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-2 bg-[#174685] text-white py-4 px-2.5 rounded-r-2xl shadow-xl active:scale-95 transition-transform"
          >
            <Users className="w-5 h-5" />
            <span className="w-px h-5 bg-white/30 block" />
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {sellers.length}
            </span>
          </button>
        </div>
      )}

      {/* ─── MOBILE: Slide-in Drawer ─── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[450] lg:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white z-[460] shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    {businessType?.name || "Professional"}s
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {sellers.length} verified professionals
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sellers List */}
              <div className="flex-1 overflow-y-auto">
                <SellersList compact onSelect={() => setIsDrawerOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {sellers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
            <div className="mx-auto w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-6">
              <img
                src="/notfound/nousers.webp"
                alt="No sellers found"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              No sellers found
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              There are currently no sellers who have posted properties with
              this business type.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* ─── DESKTOP: Left Sidebar ─── */}
            {!isBuilderType && (
              <div className="hidden lg:block lg:w-72 xl:w-80 h-fit sticky top-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                      {businessType?.name || "Professional"}s
                    </h3>
                  </div>
                  <SellersList />
                </div>
              </div>
            )}

            {/* ─── Profile Grid / Properties ─── */}
            <div className="flex-1 min-h-[600px]">
              {isBuilderType && !selectedSeller ? (
                /* ─── Builder Profile Grid ─── */
                <div>
                  {/* ─── SuperAgent CTA Banner ─── */}
                  <div className="mb-12 bg-[#E9EAF5] rounded-xl overflow-hidden relative shadow-sm border border-[#D1D5DB]/30 mx-0 sm:mx-0">
                    <div className="flex flex-col md:flex-row items-center py-2 md:py-6">
                      <div className="flex-1 px-6 md:px-12 py-8 md:py-6 text-left z-10">
                        <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-[#2C334E] mb-2 sm:mb-3 lg:mb-4 tracking-tight">
                          Trusted Builders & Promoters
                        </h2>
                        <p className="text-[#5E6D8E] text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 max-w-lg leading-relaxed font-medium">
                          Partner with verified professionals who deliver quality and transparency.
                          The most responsive experts for your next big project.
                        </p>
                        <button
                          onClick={() => navigate("/builder-info")}
                          className="w-full sm:w-auto px-10 py-3 bg-[#174685] text-white rounded-xl text-base font-bold hover:bg-[#123a6d] transition-all shadow-lg hover:shadow-[#174685]/20 active:scale-95 cursor-pointer"
                        >
                          Learn more
                        </button>
                      </div>
                      <div className="flex-1 relative w-full h-[200px] sm:h-[240px] md:h-[300px]">
                        <img
                          src="/builder/agent.webp"
                          alt="Trusted Builders"
                          className="w-full h-full object-contain object-right-bottom scale-100 sm:scale-110 md:scale-125 md:translate-x-4 translate-y-2 opacity-95 transition-all duration-700 hover:scale-[1.3] pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[#1e293b]">
                      Verified {businessType?.name}s
                    </h1>
                    <p className="text-slate-500 mt-1">
                      Select a professional to view their exclusive property
                      listings.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sellers.map((user) => (
                      <motion.div
                        key={user._id}
                        onClick={() => {
                          const sellerPath = user.slug || slugify(user.name) || user._id;
                          navigate(`/business/${businessTypeSlug}/${sellerPath}`);
                        }}
                        className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group overflow-hidden h-auto sm:h-[240px] relative"
                      >
                        {/* Company Logo Top Right (Corner Flushed) */}
                        {user.builderProfile?.companyLogo && (
                          <div className="absolute top-0 right-0 w-24 h-24 lg:w-28 lg:h-28 flex justify-center items-center z-10 rounded-tr-xl overflow-hidden bg-white shadow-sm border-l border-b border-slate-100">
                            <img
                              src={getImageUrl(user.builderProfile.companyLogo)}
                              className="w-full h-full object-contain"
                              alt="company logo"
                            />
                          </div>
                        )}

                        {/* Left Section: Profile Photo */}
                        <div className="w-full sm:w-[240px] h-64 sm:h-full shrink-0 overflow-hidden relative">
                          {user.profile_image ? (
                            <img
                              src={getImageUrl(user.profile_image)}
                              alt={user.name}
                              className="w-full h-full object-cover transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#174685] text-6xl font-medium uppercase">
                              {user.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Right Section: Info */}
                        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center min-w-0">
                          <div className="mb-4">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5 mt-2">
                              {user.name}
                            </h3>
                            <p className="text-[17px] text-slate-600 font-semibold">
                              {businessType?.name || "Professional"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-4">
                            {/* Verified Badge */}
                            {(user.badgeVerified ||
                              user.role_id?.role_name === "admin") && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-md text-[12px] font-bold uppercase tracking-wider w-fit shadow-sm">
                                  <img
                                    src="/Logo/badge.webp"
                                    alt="Verified"
                                    className="w-5 h-5 object-contain"
                                  />
                                  <span>Verified</span>
                                </div>
                              )}

                            {/* Details Table-style layout */}
                            <div className="space-y-1 mt-1">
                              {user.builderProfile?.experienceYears && (
                                <div className="flex items-center gap-2 text-[15px]">
                                  <span className="text-slate-500">Experience:</span>
                                  <span className="text-slate-800 font-semibold">{user.builderProfile.experienceYears} Years</span>
                                </div>
                              )}
                              {user.builderProfile?.companyName && (
                                <div className="flex items-center gap-2 text-[15px]">
                                  <span className="text-slate-500">Company:</span>
                                  <span className="text-slate-800 font-semibold truncate max-w-[150px] sm:max-w-full">
                                    {user.builderProfile.companyName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ─── Properties View ─── */
                <>
                  {isBuilderType ? (
                    <div className="space-y-6 mb-10">
                      <div className="mb-4 sm:mb-6">
                        <button
                          onClick={() => {
                            const typeSlug = businessType ? slugify(typeof businessType.name === "string" ? businessType.name : businessType.name?.name || "") : businessTypeSlug;
                            navigate(`/business/${typeSlug}`);
                          }}
                          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#174685] transition-all group lg:pl-0"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:bg-[#174685] group-hover:border-[#174685] group-hover:text-white transition-all duration-300">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                          </div>
                          <span className="text-[13px] sm:text-sm font-bold tracking-tight">
                            Back to Professionals List
                          </span>
                        </button>
                      </div>
                      {/* ─── Premium Profile Hero ─── */}
                      <div className="bg-[#174685] rounded-2xl md:rounded-[24px] overflow-hidden text-white shadow-2xl relative mb-10">
                        {/* Header & Sidebar Container */}
                        <div className="flex flex-col md:flex-row p-5 sm:p-6 md:p-10 gap-8 lg:gap-16">
                          {/* Main Profile Info */}
                          <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 lg:gap-10">
                            {/* Share Profile Button (Refined Top Right) */}
                            <button
                              onClick={handleShareProfile}
                              className="absolute top-4 sm:top-6 right-6 sm:right-10 p-2 lg:p-2.5 flex items-center gap-2 text-white hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 group z-20 cursor-pointer"
                              title="Share profile"
                            >
                              <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Share</span>
                            </button>

                            {/* Profile Image with Refined Thin Gold Ring */}
                            <div className="flex flex-col items-center shrink-0 gap-4 sm:gap-5">
                              <div className="relative group/avatar">
                                {/* Radiant Glow for Gold Ring */}
                                <div className="absolute -inset-4 bg-[#D4AF37]/15 rounded-full blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />

                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-full p-[5px] sm:p-[4px] bg-[conic-gradient(from_0deg,#8A6628,#E6BE08,#F9F295,#E6BE08,#8A6628,#E6BE08,#F9F295,#E6BE08,#8A6628)] shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.7)]">
                                  {/* Beveled Edge Highlight */}
                                  <div className="absolute inset-[0.5px] rounded-full border border-white/15 pointer-events-none" />

                                  {/* Inner Groove for Depth */}
                                  <div className="w-full h-full rounded-full p-[2px] bg-[#5D4037] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                                    <div className="w-full h-full rounded-full border-[2.5px] border-[#0f3468] overflow-hidden bg-[#0f3468]">
                                      {selectedSeller?.profile_image ? (
                                        <img
                                          src={getImageUrl(selectedSeller.profile_image)}
                                          alt={selectedSeller?.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#0f3468] text-white/90 text-5xl font-bold rounded-full">
                                          {selectedSeller?.name?.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Verified Badge (Fully Separated) */}
                              {(selectedSeller?.badgeVerified || selectedSeller?.role_id?.role_name === "admin") && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] rounded-md shadow-lg border border-white/10">
                                  <img
                                    src="/Logo/badge.webp"
                                    alt="Verified"
                                    className="w-5 h-5 object-contain"
                                  />
                                  <span className="text-[12px] font-black uppercase tracking-widest leading-none">
                                    Verified
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Bio Content */}
                            <div className="flex-1 text-center md:text-left pt-2">
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                                {selectedSeller?.role_id?.role_name === 'admin' && selectedSeller?.name === 'Admin' ? 'The Plot One Admin' : selectedSeller?.name}
                              </h2>

                              {/* Experience & Type Row */}
                              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 sm:gap-4 text-white/80 text-sm sm:text-base font-medium leading-relaxed">
                                <span className="px-2.5 py-1 bg-black/20 rounded text-[12px] sm:text-[14px] uppercase tracking-wider font-bold">{businessType?.name || "Professional"}</span>
                                {selectedSeller?.builderProfile?.experienceYears && (
                                  <span>{selectedSeller.builderProfile.experienceYears} Years of experience</span>
                                )}
                              </div>

                              {/* About Company / Bio Section */}
                              {selectedSeller?.builderProfile?.aboutCompany && (
                                <div className="mt-8">
                                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[2px] mb-3">About Company</h3>
                                  <p className={`text-sm lg:text-base text-white/70 leading-relaxed max-w-2xl transition-all duration-300 ${isDescriptionExpanded ? "" : "line-clamp-2"}`}>
                                    {selectedSeller.builderProfile.aboutCompany}
                                  </p>
                                  {selectedSeller.builderProfile.aboutCompany.length > 100 && (
                                    <button
                                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                      className="mt-3 text-[11px] sm:text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      {isDescriptionExpanded ? "Read Less" : "Read More"}
                                      <ChevronRight size={12} className={`transition-transform duration-300 ${isDescriptionExpanded ? "-rotate-90" : "rotate-90"}`} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Lower Action Row (Integrated) */}
                              <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                  <button
                                    onClick={(e) => handleWhatsAppClick(e, selectedSeller)}
                                    className="flex items-center gap-2 px-5 sm:px-8 py-3 bg-white text-[#174685] rounded-xl font-bold text-[13px] sm:text-sm hover:bg-white/90 transition-all shadow-xl active:scale-95 cursor-pointer"
                                  >
                                    <MessageSquare size={16} className="fill-current" />
                                    WhatsApp
                                  </button>
                                  <button
                                    onClick={() => document.getElementById("seller-properties-grid")?.scrollIntoView({ behavior: "smooth" })}
                                    className="flex items-center gap-2 px-5 sm:px-8 py-3 bg-transparent border border-white/30 text-white rounded-lg font-bold text-[13px] sm:text-sm hover:bg-white/10 transition-all cursor-pointer"
                                  >
                                    View properties
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Brokerage Sidebar - Only show if any data exists */}
                          {(selectedSeller?.builderProfile?.companyLogo || selectedSeller?.builderProfile?.companyName || (selectedSeller?.builderProfile?.socialLinks && Object.values(selectedSeller.builderProfile.socialLinks).some(link => link))) && (
                            <div className="w-full md:w-[200px] lg:w-[240px] shrink-0 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-8 lg:pl-10">
                              {selectedSeller?.builderProfile?.companyLogo && (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl flex items-center justify-center mb-5 transition-transform duration-500">
                                  <img
                                    src={getImageUrl(selectedSeller.builderProfile.companyLogo)}
                                    className="max-h-full max-w-full object-contain"
                                    alt="company logo"
                                  />
                                </div>
                              )}

                              {selectedSeller?.builderProfile?.companyName && (
                                <h4 className="text-white font-bold text-sm sm:text-base lg:text-lg text-left md:text-right leading-tight mb-2 uppercase tracking-wide">
                                  {selectedSeller.builderProfile.companyName}
                                </h4>
                              )}

                              {/* Social Media Links in Sidebar */}
                              {selectedSeller?.builderProfile?.socialLinks && Object.values(selectedSeller.builderProfile.socialLinks).some(link => link) && (
                                <div className="flex flex-wrap justify-start md:justify-end gap-2.5 sm:gap-3 mt-4 sm:mt-6">
                                  {selectedSeller.builderProfile.socialLinks.website && (
                                    <a href={selectedSeller.builderProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white" title="Website">
                                      <Globe size={16} />
                                    </a>
                                  )}
                                  {selectedSeller.builderProfile.socialLinks.linkedin && (
                                    <a href={selectedSeller.builderProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white" title="LinkedIn">
                                      <Linkedin size={16} />
                                    </a>
                                  )}
                                  {selectedSeller.builderProfile.socialLinks.instagram && (
                                    <a href={selectedSeller.builderProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white" title="Instagram">
                                      <Instagram size={16} />
                                    </a>
                                  )}
                                  {selectedSeller.builderProfile.socialLinks.facebook && (
                                    <a href={selectedSeller.builderProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white" title="Facebook">
                                      <Facebook size={16} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                          Properties by {selectedSeller?.name}
                        </h2>
                      </div>
                      {selectedSeller?.phone && (
                        <button
                          onClick={(e) =>
                            handleWhatsAppClick(e, selectedSeller)
                          }
                          className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#174685] text-white rounded-[10px] text-sm font-bold hover:bg-[#123a6d] transition-all shadow-sm"
                        >
                          <Phone className="w-4 h-4 fill-current" /> WhatsApp
                        </button>
                      )}
                    </div>
                  )}

                  {propertiesLoading ? (
                    <Loader variant="inline" />
                  ) : sellerProperties.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                      <div className="mx-auto w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-6">
                        <img
                          src="/notfound/nousers.webp"
                          alt="No listings found"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        No active listings
                      </h3>
                      <p className="text-slate-500 max-w-xs mx-auto">
                        This {businessType?.name?.toLowerCase()} hasn't posted
                        any properties yet.
                      </p>
                    </div>
                  ) : (
                    <div
                      id="seller-properties-grid"
                      className="flex flex-col gap-4 pb-10"
                    >
                      {sellerProperties.map((property) => (
                        <HorizontalPropertyCard
                          key={property._id}
                          property={{
                            ...property,
                            businessType: property.businessType || businessType,
                          }}
                          linkQuery={`?from=${businessTypeSlug || 'professional'}`}
                          onWhatsAppClick={(e, prop) => {
                            handleWhatsAppClick(
                              e,
                              prop.seller || selectedSeller,
                              prop,
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(updatedPhone) => {
          if (user) {
            submitEnquiry(
              selectedSeller,
              selectedProperty,
              user.name,
              user.email,
              updatedPhone,
            );
          }
        }}
      />
    </div>
  );
};

export default BusinessUserList;
