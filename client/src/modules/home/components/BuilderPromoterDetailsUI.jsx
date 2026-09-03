import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  Calendar,
  Layout,
  Layers,
  Square,
  Compass,
  Zap,
  Droplet,
  ChevronRight,
  ChevronLeft,
  Eye,
  Phone,
  Info,
  Gift,
  ShieldCheck,
  BedDouble,
  Bath,
  Wind,
  Download,
  Home,
  User,
  Share2,
  Flame,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  LayerGroup,
} from "react-leaflet";

const { BaseLayer } = LayersControl;

// Custom marker icon for properties
const customIconUrl = "/assets/marker-custom-optimized.webp";

const CustomIcon = L.icon({
  iconUrl: customIconUrl,
  iconSize: [38, 48],
  iconAnchor: [19, 48],
  popupAnchor: [0, -45],
});
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../../../utils/imageUrl";
import {
  formatIndianPrice,
  formatPriceRange,
} from "../../../utils/formatPrice";
import { formatNumber } from "../../../utils/formatNumber";
import WishlistButton from "../../../components/Common/WishlistButton";
import PropertyCard from "../components/PropertyCard";
import PostRequirementCard from "./PostRequirementCard";

const BuilderPromoterDetailsUI = ({
  property,
  mainImage,
  setMainImage,
  enquiryLoading,
  handleWhatsAppClick,
  maskPhoneNumber,
  getVideoEmbedUrl,
  fromBuilderList,
  moreProperties = [],
}) => {
  const handleShare = async () => {
    const shareData = {
      title: property.basicInfo?.title || "Property Details",
      text: `Check out this property: ${property.basicInfo?.title || "Property"} on The Plot One`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } else {
        throw new Error("Sharing not supported");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        } catch (clipError) {
          toast.error("Could not share or copy link");
        }
      }
    }
  };

  const isPropertySold = property.isSold || property.status?.toLowerCase() === "sold";

  const [activeTab, setActiveTab] = useState("overview");
  const scrollRefs = {
    overview: useRef(null),
    about: useRef(null),
    location: useRef(null),
    plans: useRef(null),
    amenities: useRef(null),
    highlights: useRef(null),
    gallery: useRef(null),
  };

  const floorPlans =
    property.media?.floorPlans?.length > 0
      ? property.media.floorPlans
      : property.floorPlan || property.media?.floorPlan
        ? [property.floorPlan || property.media.floorPlan]
        : [];
  const hasFloorPlan = floorPlans.length > 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "about", label: "About Project" },
    ...(hasFloorPlan ? [{ id: "plans", label: "Plans" }] : []),
    { id: "amenities", label: "Amenities" },
    { id: "highlights", label: "Highlights" },
    { id: "location", label: "Location" },
    { id: "gallery", label: "Gallery" },
  ];

  // Scroll Tracking Logic: Re-implemented for long-scrolling layout
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    const observerOptions = {
      root: mainContent,
      rootMargin: "-140px 0px -50% 0px", // Match scroller offset
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        // Only update active tab if it's intersecting sufficiently and we're not manually scrolling
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    Object.values(scrollRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const handleTabChange = (id) => {
    setActiveTab(id);
    const element = scrollRefs[id]?.current;
    const mainContent = document.getElementById("main-content");

    if (element && mainContent) {
      const offset = 140; // Precise offset to clear the sticky header and sub-nav (was 120 previously)
      const elementRect = element.getBoundingClientRect().top;
      const mainRect = mainContent.getBoundingClientRect().top;
      const elementPosition = elementRect - mainRect;
      const offsetPosition = mainContent.scrollTop + elementPosition - offset;

      mainContent.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-slate-50 pt-24 min-h-screen pb-20 font-sans">
      {/* 1. HERO BANNER */}
      <section className="relative h-[400px] md:h-[550px] w-full overflow-hidden">
        <img
          src={getImageUrl(property.media?.featuredImage || mainImage)}
          alt={property.basicInfo?.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${isPropertySold ? "grayscale-[0.8]" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Action Buttons: Top Right */}
        <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
          <WishlistButton propertyId={property._id} />
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all active:scale-95 group/share cursor-pointer"
            title="Share Property"
          >
            <Share2
              size={20}
              className="text-gray-600 group-hover/share:text-blue-600"
            />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 mb-10">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-4 text-white max-w-3xl">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded w-fit">
                    {property.basicInfo?.category === "Rent"
                      ? "For Rent"
                      : "For Sale"}
                  </span>
                  
                  {isPropertySold && (
                    <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded w-fit shadow-lg border border-white/20">
                      Sold Out
                    </span>
                  )}

                  {property.view_count >= 2000 && (
                    <div className="bg-red-50 text-red-600 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm border border-red-200 w-fit whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 fill-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Hot Deal
                      </span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                  {property.basicInfo?.title}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-sm md:text-base">
                  <MapPin size={18} className="text-red-500" />
                  {property.location?.locality}, {property.location?.city}{" "}
                  {property.location?.pincode &&
                    `- ${property.location.pincode}`}
                </div>
                {property.basicInfo?.approvalType && (Array.isArray(property.basicInfo.approvalType) ? property.basicInfo.approvalType.length > 0 : property.basicInfo.approvalType) && (
                  <div className="flex">
                    <span className="px-4 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-sm md:text-base font-bold text-green-400 capitalize shadow-sm backdrop-blur-sm">
                      {(() => {
                        const types = Array.isArray(property.basicInfo.approvalType) 
                          ? property.basicInfo.approvalType 
                          : [property.basicInfo.approvalType];
                        return types.map(t => t.toLowerCase().includes("approved") ? t : `${t} Approved`).join(", ");
                      })()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right text-white">
                <div className="text-xs text-white/70 font-medium uppercase tracking-widest mb-1">
                  Price Range
                </div>
                <div className="text-2xl md:text-4xl font-bold text-white">
                  {formatPriceRange(
                    property.pricing?.sell?.minPrice ||
                      property.pricing?.rent?.minRent,
                    property.pricing?.sell?.maxPrice ||
                      property.pricing?.rent?.maxRent,
                    property.pricing?.sell?.price ||
                      property.pricing?.rent?.monthlyRent ||
                      0,
                  )}
                </div>
                {property.view_count >= 2000 ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-red-500/20 text-red-100 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-500/30 shadow-sm ml-auto">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                    </span>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                      High Demand: {formatNumber(property.view_count || 0)}{" "}
                      views
                    </span>
                  </div>
                ) : property.view_count > 0 ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/10 text-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-sm ml-auto">
                    <Eye size={14} className="text-white/70" />
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
                      {formatNumber(property.view_count)} people viewing
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STICKY TABS */}
      <nav className="sticky top-[100px] z-40 bg-white border-b border-gray-100 shadow-sm overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="container mx-auto max-w-7xl px-4 flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="container mx-auto max-w-7xl px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* MAIN CONTENT AREA: LONG SCROLLING LAYOUT */}
          <div className="lg:col-span-8 space-y-12">
            {/* OVERVIEW SECTION */}
            <div
              id="overview"
              ref={scrollRefs.overview}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Overview
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-50">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <MapPin size={16} className="text-red-500" />
                  <span className="font-semibold text-gray-800">
                    {property.location?.locality}, {property.location?.city}
                  </span>
                </div>
                {(property.seller?.badgeVerified ||
                  property.seller?.role_id?.role_name === "admin") && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span className="font-semibold text-gray-800">
                      Verified Listing
                    </span>
                  </div>
                )}
                {property.view_count > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <Eye size={16} className="text-blue-500" />
                    <span className="font-semibold text-gray-800">
                      {formatNumber(property.view_count)} Views
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1">
                    Configuration
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {property.basicInfo?.propertyType}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {property.basicInfo?.usageType}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                    {property.specifications?.area?.minArea &&
                    property.specifications?.area?.maxArea
                      ? "Area Range"
                      : "Total Area"}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {(() => {
                      const minA = property.specifications?.area?.minArea;
                      const maxA = property.specifications?.area?.maxArea;
                      const total = property.specifications?.area?.totalArea;
                      if (minA && maxA)
                        return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sq.ft`;
                      if (minA)
                        return `${Number(minA).toLocaleString()}+ sq.ft`;
                      return total ? `${total} sq.ft` : "N/A";
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ready to Move
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1">
                    Price
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPriceRange(
                      property.pricing?.sell?.minPrice ||
                        property.pricing?.rent?.minRent,
                      property.pricing?.sell?.maxPrice ||
                        property.pricing?.rent?.maxRent,
                      property.pricing?.sell?.price ||
                        property.pricing?.rent?.monthlyRent ||
                        0,
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ABOUT PROJECT */}
            <div id="about" ref={scrollRefs.about} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                About Project
              </h3>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-8">
                  {property.basicInfo?.description ||
                    "No project overview provided."}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Launch Date
                    </div>
                    <div className="font-bold text-gray-800">
                      {new Date(property.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "long", year: "numeric" },
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Status
                    </div>
                    <div className="font-bold text-gray-800">
                      {property.legal?.propertyStatus || "Active"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Possession
                    </div>
                    <div className="font-bold text-gray-800">
                      {property.legal?.expectedCompletionYear || "Immediate"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      Locality
                    </div>
                    <div className="font-bold text-gray-800 truncate">
                      {property.location?.locality}
                    </div>
                  </div>
                  {property.basicInfo?.approvalType && (Array.isArray(property.basicInfo.approvalType) ? property.basicInfo.approvalType.length > 0 : property.basicInfo.approvalType) && (
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                        Approval
                      </div>
                      <div className="font-bold text-gray-800">
                        {(() => {
                          const types = Array.isArray(property.basicInfo.approvalType) 
                            ? property.basicInfo.approvalType 
                            : [property.basicInfo.approvalType];
                          return types.map(t => t.toLowerCase().includes("approved") ? t : `${t} Approved`).join(", ");
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED SPECIFICATIONS */}
              {((property.specifications?.residential?.bedrooms > 0) ||
                (property.specifications?.residential?.bathrooms > 0) ||
                (property.specifications?.commercial?.cabins > 0)) && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h4 className="font-bold text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                    Project Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                    {property.specifications?.residential?.bedrooms > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-400">
                          <BedDouble size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Bedrooms
                          </span>
                          <span className="text-[14px] font-bold text-gray-800">
                            {property.specifications.residential.bedrooms}
                          </span>
                        </div>
                      </div>
                    )}
                    {property.specifications?.residential?.bathrooms > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-400">
                          <Bath size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Bathrooms
                          </span>
                          <span className="text-[14px] font-bold text-gray-800">
                            {property.specifications.residential.bathrooms}
                          </span>
                        </div>
                      </div>
                    )}
                    {property.specifications?.commercial?.cabins > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-400">
                          <Layers size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Cabins
                          </span>
                          <span className="text-[14px] font-bold text-gray-800">
                            {property.specifications.commercial.cabins}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FLOOR PLANS */}
            {hasFloorPlan && (
              <div id="plans" ref={scrollRefs.plans} className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Floor Plans
                </h3>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative group/floorplan">
                  {floorPlans.length > 1 ? (
                    <>
                      <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        autoHeight={true}
                        navigation={{ nextEl: ".fp-next", prevEl: ".fp-prev" }}
                        pagination={{ clickable: true, dynamicBullets: true }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        className="rounded-2xl"
                      >
                        {floorPlans.map((fp, i) => (
                          <SwiperSlide
                            key={i}
                            className="flex justify-center items-center"
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                window.open(getImageUrl(fp), "_blank")
                              }
                            >
                                <img
                                  src={getImageUrl(fp)}
                                  className="mx-auto max-w-full h-auto rounded-2xl shadow-sm block"
                                  alt={`Floor Plan ${i + 1}`}
                                />
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                      <button className="fp-prev absolute left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-lg opacity-0 group-hover/floorplan:opacity-100 transition-all active:scale-95">
                        <ChevronLeft size={20} />
                      </button>
                      <button className="fp-next absolute right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-lg opacity-0 group-hover/floorplan:opacity-100 transition-all active:scale-95">
                        <ChevronRight size={20} />
                      </button>
                    </>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        window.open(getImageUrl(floorPlans[0]), "_blank")
                      }
                    >
                       <img
                         src={getImageUrl(floorPlans[0])}
                         className="mx-auto max-w-full h-auto rounded-2xl shadow-sm block"
                         alt="Floor Plan"
                       />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AMENITIES SECTION */}
            {property.amenities && property.amenities.length > 0 && (
              <div
                id="amenities"
                ref={scrollRefs.amenities}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-3">
                  {property.amenities?.map((amenity, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-2 group hover:bg-red-50 transition-all"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-green-500 group-hover:text-red-500"
                      />
                      <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UTILITIES SECTION */}
            {(property.specifications?.utilities?.waterSupply ||
              property.specifications?.utilities?.powerBackup) && (
              <div
                id="highlights"
                ref={scrollRefs.highlights}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Essential Utilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.specifications?.utilities?.waterSupply && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-center shadow-sm">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                        <Droplet size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Water Supply
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {property.specifications.utilities.waterSupply}
                      </span>
                    </div>
                  )}
                  {property.specifications?.utilities?.powerBackup && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-center shadow-sm">
                      <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center">
                        <Zap size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Power Backup
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        Available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LOCATION SECTION */}
            {property.location?.coordinates?.lat && (
              <div
                id="location"
                ref={scrollRefs.location}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Project Location
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <MapPin size={16} className="text-red-500" />
                    {property.location?.locality}, {property.location?.city}
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-[32px] border border-slate-100 shadow-inner h-[400px] md:h-[500px]">
                  <div className="h-full w-full rounded-[24px] overflow-hidden relative shadow-sm">
                    <MapContainer
                      center={[
                        property.location.coordinates.lat,
                        property.location.coordinates.lng,
                      ]}
                      zoom={15}
                      scrollWheelZoom={false}
                      className="h-full w-full z-10"
                    >
                      <LayersControl position="topright">
                        <BaseLayer name="Street Map">
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                        </BaseLayer>
                        <BaseLayer checked name="Satellite View">
                          <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          />
                        </BaseLayer>
                      </LayersControl>
                      <Marker
                        position={[
                          property.location.coordinates.lat,
                          property.location.coordinates.lng,
                        ]}
                        icon={CustomIcon}
                      >
                        <Popup minWidth={180} maxWidth={220}>
                          <div className="w-[180px] sm:w-[200px] p-0.5">
                            <div className="relative h-24 w-full mb-2 rounded-md overflow-hidden">
                              <img
                                src={getImageUrl(
                                  property.media?.featuredImage ||
                                    property.media?.images?.[0]
                                )}
                                alt={property.basicInfo?.title || "Property"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                              {property.basicInfo?.title || "Untitled Project"}
                            </h3>
                            <p className="text-[11px] text-gray-500 mb-1">
                              {property.location?.locality}, {property.location?.city}
                            </p>
                            <p className="text-sm font-bold text-[#166aa8]">
                              {formatPriceRange(
                                property.pricing?.sell?.minPrice ||
                                  property.pricing?.rent?.minRent,
                                property.pricing?.sell?.maxPrice ||
                                  property.pricing?.rent?.maxRent,
                                property.pricing?.sell?.price ||
                                  property.pricing?.rent?.monthlyRent ||
                                  0
                              )}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}

            {/* GALLERY */}
            <div id="gallery" ref={scrollRefs.gallery} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Gallery</h3>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative group/gallery">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation={{ nextEl: ".gal-next", prevEl: ".gal-prev" }}
                  pagination={{ clickable: true }}
                  className="rounded-2xl h-[450px]"
                >
                  {property.media?.images?.map((img, i) => (
                    <SwiperSlide key={i}>
                      <img
                        src={getImageUrl(img)}
                        className="w-full h-full object-cover"
                        alt="Gallery"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className="gal-prev absolute left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover/gallery:opacity-100 transition-all active:scale-95">
                  <ChevronLeft size={24} />
                </button>
                <button className="gal-next absolute right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover/gallery:opacity-100 transition-all active:scale-95">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR: Seller Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-40">
              {/* Contact Card */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    {property.seller?.profile_image ? (
                      <img
                        src={getImageUrl(property.seller.profile_image)}
                        alt="Seller"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-[#174685] uppercase font-bold tracking-widest mb-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">
                      {property.seller?.role_id?.role_name === "admin"
                        ? property.seller?.name || "Admin"
                        : property.businessType?.name || "LISTED BY"}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {property.seller?.name || "Seller"}
                    </h3>
                    <div className="text-sm font-semibold text-gray-500">
                      {maskPhoneNumber(property.seller?.phone)}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="text-sm text-gray-600 text-center px-4">
                    Interested in this property? <br /> Connect directly with
                    the seller.
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppClick}
                  disabled={enquiryLoading || isPropertySold}
                  className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg cursor-pointer ${
                    isPropertySold
                      ? "bg-gray-400 text-gray-100 cursor-not-allowed shadow-none"
                      : "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-green-100"
                  }`}
                >
                  {isPropertySold ? (
                    "Property Sold Out"
                  ) : enquiryLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp Enquiry
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4">
                <PostRequirementCard />
              </div>
            </div>
          </div>
        </div>

        {/* More Properties / Recommended Properties Section */}
        {moreProperties && moreProperties.length > 0 && (
          <div className="mt-24">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-[28px] font-bold text-[#1E293B]">
                  {fromBuilderList ? (
                    <>
                      More Properties by{" "}
                      <span className="text-[#174685] font-semibold">
                        {property.seller?.name || "this Builder"}
                      </span>
                    </>
                  ) : (
                    <>
                      Recommended in{" "}
                      <span className="text-[#174685] font-semibold">
                        {property.location?.locality ||
                          property.location?.city ||
                          "this area"}
                      </span>
                    </>
                  )}
                </h2>
                {fromBuilderList && (
                  <p className="text-sm text-slate-500 mt-1">
                    Explore other projects from the same builder
                  </p>
                )}
              </div>

              {/* Navigation Buttons for Desktop */}
              <div className="hidden md:flex items-center gap-3 mb-8">
                <button className="rec-prev w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="rec-next w-10 h-10 flex items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={{
                  prevEl: ".rec-prev",
                  nextEl: ".rec-next",
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                  el: ".rec-pagination",
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 20 },
                  1024: { slidesPerView: 3, spaceBetween: 24 },
                  1280: { slidesPerView: 4, spaceBetween: 24 },
                }}
                className="recommended-swiper !pb-12"
              >
                {moreProperties.map((prop) => (
                  <SwiperSlide key={prop._id}>
                    <div className="h-full">
                      <PropertyCard
                        property={prop}
                        onWhatsAppClick={handleWhatsAppClick}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderPromoterDetailsUI;
