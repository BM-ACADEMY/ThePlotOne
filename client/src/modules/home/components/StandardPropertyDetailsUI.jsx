import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ArrowRight,
  BedDouble,
  Bath,
  Square,
  User,
  Calendar,
  Home,
  Eye,
  Wind,
  Droplet,
  Zap,
  Layout,
  Layers,
  Compass,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Share2,
  Flame,
  FileCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  LayerGroup,
} from "react-leaflet";

const { BaseLayer, Overlay } = LayersControl;

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import WishlistButton from "../../../components/Common/WishlistButton";
import {
  formatIndianPrice,
  formatPriceRange,
} from "../../../utils/formatPrice";
import { formatNumber } from "../../../utils/formatNumber";

import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";
import { getImageUrl } from "../../../utils/imageUrl";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import PropertyCard from "../components/PropertyCard";
import PostRequirementCard from "./PostRequirementCard";

// Custom marker icon
const customMarkerIcon = "/assets/marker-custom-optimized.webp";

const CustomIcon = L.icon({
  iconUrl: customMarkerIcon,
  iconSize: [38, 48],
  iconAnchor: [19, 48],
  popupAnchor: [0, -45],
});

const StandardPropertyDetailsUI = ({
  property,
  mainImage,
  setMainImage,
  moreProperties,
  enquiryLoading,
  handleWhatsAppClick,
  maskPhoneNumber,
  getVideoEmbedUrl,
  showPhoneModal,
  setShowPhoneModal,
  user,
  submitEnquiry,
  selectedEnquiryProperty,
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

  return (
    <div className="bg-white min-h-screen py-8 font-sans text-gray-900">
      <div className="container mx-auto px-4 pt-19 max-w-7xl">
        {/* Breadcrumb */}
        <div className="text-[11px] md:text-xs text-blue-600 font-medium flex-wrap flex items-center gap-2 mb-4">
          <Link to="/" className="hover:text-blue-800">
            Home
          </Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-500 truncate max-w-[200px] md:max-w-md">
            {property.basicInfo?.title || "Property"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* LEFT COLUMN: Premium New Look */}
          <div className="lg:col-span-8 space-y-12">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                {property.basicInfo?.title || "Untitled Property"}
              </h1>
              <div className="flex items-center text-gray-500 text-lg">
                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                {typeof property.location === "string"
                  ? property.location
                  : `${property.location?.locality ? property.location.locality + ", " : ""}${property.location?.city || ""}`}
              </div>

              {/* Approval Badge - Large and prominent */}
              {property.basicInfo?.approvalType && (Array.isArray(property.basicInfo.approvalType) ? property.basicInfo.approvalType.length > 0 : property.basicInfo.approvalType) && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-100 shadow-sm">
                    <FileCheck size={16} className="text-green-600" />
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

            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              {/* LEFT SECTION (Price + Urgency) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg md:text-xl text-gray-500 font-medium">
                        Price:
                      </span>
                      <span className="text-gray-900">
                        {(() => {
                          const isRent = property.basicInfo?.category === "Rent";
                          const min = isRent ? property.pricing?.rent?.minRent : property.pricing?.sell?.minPrice;
                          const max = isRent ? property.pricing?.rent?.maxRent : property.pricing?.sell?.maxPrice;
                          const price = isRent ? property.pricing?.rent?.monthlyRent : property.pricing?.sell?.price;
                          return formatPriceRange(min, max, price);
                        })()}
                      </span>
                    </div>
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                      {property.basicInfo?.propertyType || "Property"} for{" "}
                      {property.basicInfo?.category === "Rent"
                        ? "Rent"
                        : "Sell/Buy"}{" "}
                      in{" "}
                      {property.location?.locality || property.location?.city}
                    </span>
                  </div>

                  {property.view_count >= 2000 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 shadow-sm animate-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        High Demand: {formatNumber(property.view_count || 0)}{" "}
                        views
                      </span>
                    </div>
                  ) : property.view_count > 0 ? (
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                      <Eye size={16} />
                      <span className="text-xs font-bold tracking-widest">
                        {formatNumber(property.view_count)} people viewing
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RIGHT SECTION (Status & Meta) */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Posted on {new Date(property.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm font-bold text-blue-600">
                  {property.legal?.propertyStatus || "Ready to Move"}
                </div>
              </div>
            </div>

            {/* 2. Image Gallery - Clean & Sharp */}
            <div className="space-y-4">
              <div className="relative h-[350px] md:h-[450px] bg-gray-100 rounded-xl overflow-hidden group">
                {/* Badges Container - Top Left */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
                  {isPropertySold && (
                    <div className="w-fit">
                      <span className="bg-red-600 shadow-lg text-white text-sm font-bold px-4 py-2 rounded-sm uppercase tracking-wider border border-white/20 whitespace-nowrap">
                        Sold Out
                      </span>
                    </div>
                  )}

                  {(property.seller?.badgeVerified ||
                    property.seller?.role_id?.role_name === "admin") && (
                      <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm border border-green-200 w-fit whitespace-nowrap">
                        <img
                          src="/Logo/badge.webp"
                          alt="Verified"
                          className="w-5 h-5 object-contain"
                        />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Verified Seller
                        </span>
                      </div>
                    )}

                  {property.view_count >= 2000 && (
                    <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm border border-red-200 w-fit whitespace-nowrap">
                      <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Hot Deal
                      </span>
                    </div>
                  )}
                </div>

                <img
                  src={getImageUrl(mainImage)}
                  alt={property.basicInfo?.title || "Property"}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isPropertySold ? "grayscale-[0.8]" : ""}`}
                />

                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
              </div>

              {/* Thumbnails */}
              {(() => {
                const thumbnails = [...(property.media?.images || [])];

                if (thumbnails.length > 1) {
                  return (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {thumbnails.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMainImage(img)}
                          className={`relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 cursor-pointer border-2 ${mainImage === img
                              ? "border-blue-600 opacity-100 shadow-md scale-[1.02]"
                              : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* 3. Key Information - Clean Style Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Key Features:
              </h3>
              <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
                  {/* item */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <Layers size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                        Usage
                      </span>
                      <span className="text-[15px] font-medium text-gray-800 leading-tight">
                        {property.basicInfo?.usageType || "Residential"}
                      </span>
                    </div>
                  </div>
                  {/* item */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                        Locality
                      </span>
                      <span className="text-[15px] font-medium text-gray-800 leading-tight capitalize truncate max-w-[120px]">
                        {property.location?.locality ||
                          property.location?.city ||
                          "Pondicherry"}
                      </span>
                    </div>
                  </div>
                  {/* item — Area */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <Square size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                        {property.specifications?.area?.minArea ||
                          property.specifications?.area?.maxArea
                          ? "Area Range"
                          : "Total Area"}
                      </span>
                      <span className="text-[15px] font-medium text-gray-800 leading-tight whitespace-nowrap">
                        {(() => {
                          const minA = property.specifications?.area?.minArea;
                          const maxA = property.specifications?.area?.maxArea;
                          const total =
                            property.specifications?.area?.totalArea;
                          if (minA && maxA)
                            return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sqft`;
                          if (minA)
                            return `${Number(minA).toLocaleString()}+ sqft`;
                          if (total) return `${total} sqft`;
                          return "N/A";
                        })()}
                      </span>
                    </div>
                  </div>
                  {/* item */}
                  {property.specifications?.area?.builtupArea && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Layout size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Built-up
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight whitespace-nowrap">
                          {property.specifications.area.builtupArea} sqft
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item */}
                  {property.specifications?.area?.carpetArea && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Layers size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Carpet Area
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight whitespace-nowrap">
                          {property.specifications.area.carpetArea} sqft
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item */}
                  {property.specifications?.floor?.totalFloor && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Layers size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Total Floors
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.specifications.floor.totalFloor}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item */}
                  {property.specifications?.floor?.propertyOnFloor && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Layers size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          On Floor
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.specifications.floor.propertyOnFloor}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item */}
                  {(property.specifications?.facing ||
                    property.specifications?.residential?.facing) && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                          <Compass size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                            Facing
                          </span>
                          <span className="text-[15px] font-medium text-gray-800 leading-tight capitalize">
                            {property.specifications.facing ||
                              property.specifications.residential.facing}
                          </span>
                        </div>
                      </div>
                    )}
                  {/* item */}
                  {property.specifications?.residential?.furnishing && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Layout size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Furnishing
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.specifications.residential.furnishing}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item — Utilities */}
                  {property.specifications?.utilities?.waterSupply && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Droplet size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Water Supply
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.specifications.utilities.waterSupply}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item — Power Backup */}
                  {property.specifications?.utilities?.powerBackup && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Zap size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Power Backup
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          Available
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item */}

                  {property.legal?.propertyStatus === "Ready to Move" &&
                    property.legal?.ageOfProperty && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                          <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                            Age of Property
                          </span>
                          <span className="text-[15px] font-medium text-gray-800 leading-tight">
                            {property.legal.ageOfProperty}
                          </span>
                        </div>
                      </div>
                    )}

                  {property.basicInfo?.category && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Calendar size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Type
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.basicInfo.category}
                        </span>
                      </div>
                    </div>
                  )}
                  {property.basicInfo?.propertyType && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <Calendar size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Property Type
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {property.basicInfo.propertyType}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* item — Approval */}
                  {property.basicInfo?.approvalType && (Array.isArray(property.basicInfo.approvalType) ? property.basicInfo.approvalType.length > 0 : property.basicInfo.approvalType) && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <FileCheck size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Approval
                        </span>
                        <span className="text-[15px] font-medium text-gray-800 leading-tight">
                          {(() => {
                            const types = Array.isArray(property.basicInfo.approvalType) 
                              ? property.basicInfo.approvalType 
                              : [property.basicInfo.approvalType];
                            return types.map(t => t.toLowerCase().includes("approved") ? t : `${t} Approved`).join(", ");
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* item — Possession */}
                  {property.legal?.propertyStatus === "Under Construction" &&
                    property.legal?.expectedCompletionYear && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                          <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                            Possession
                          </span>
                          <span className="text-[15px] font-medium text-gray-800 leading-tight">
                            {property.legal.expectedCompletionYear}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* item */}
                  {property.legal?.propertyStatus && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-500">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 whitespace-nowrap">
                          Status
                        </span>
                        <span className="text-[15px] font-semibold text-blue-600 leading-tight">
                          {property.legal.propertyStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* 4. About the Project */}
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              Property Overview
            </h3>
            <div className="space-y-6">
              <div className="relative">
                {/* <div
                  className={`prose prose-lg max-w-none text-gray-600 leading-relaxed transition-all duration-500 overflow-hidden ${!isDescriptionExpanded ? "max-h-[90px] line-clamp-3" : "max-h-[2000px]"}`}
                > */}
                <div
                  className={`prose prose-lg max-w-none text-gray-600 leading-relaxed transition-all duration-500 overflow-hidden`}
                >
                  <p className="whitespace-pre-line text-slate-700">
                    {property.basicInfo?.description ||
                      "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Specifications Section */}
            {(property.specifications?.residential ||
              property.specifications?.commercial ||
              property.specifications?.plot) && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Property Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Residential Specifics */}
                    {property.specifications?.residential &&
                      (property.specifications.residential.bedrooms > 0 ||
                        property.specifications.residential.bathrooms > 0 ||
                        property.specifications.residential.balconies > 0 ||
                        property.specifications.residential.hall !== undefined ||
                        property.specifications.residential.kitchens !==
                        undefined ||
                        property.specifications.residential.facing) && (
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="font-bold text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <BedDouble size={18} className="text-gray-400" />{" "}
                            Residential Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            {property.specifications.residential.bedrooms > 0 && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <BedDouble size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Bedrooms
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    {property.specifications.residential.bedrooms}
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.residential.bathrooms >
                              0 && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Bath size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Bathrooms
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {
                                        property.specifications.residential
                                          .bathrooms
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            {property.specifications.residential.balconies >
                              0 && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Wind size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Balconies
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {
                                        property.specifications.residential
                                          .balconies
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            {(property.specifications.residential.hall !==
                              undefined ||
                              property.specifications.residential.kitchens !==
                              undefined) && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Home size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Hall / Kitchen
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.residential.hall ??
                                        0}
                                      H /{" "}
                                      {property.specifications.residential
                                        .kitchens ?? 0}
                                      K
                                    </span>
                                  </div>
                                </div>
                              )}
                            {(property.specifications.facing ||
                              property.specifications.residential.facing) && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Compass size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Facing
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.facing ||
                                        property.specifications.residential.facing}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                    {/* Commercial Specifics */}
                    {property.specifications?.commercial &&
                      (property.specifications.commercial.cabins ||
                        property.specifications.commercial.meetingRooms ||
                        property.specifications.commercial.workstations ||
                        property.specifications.commercial.pantry ||
                        property.specifications.commercial.receptionArea ||
                        property.specifications.commercial.suitableFor) && (
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="font-bold text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Layers size={18} className="text-gray-400" />{" "}
                            Commercial Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            {property.specifications.commercial.cabins !==
                              undefined && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Layers size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Cabins
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.commercial.cabins}
                                    </span>
                                  </div>
                                </div>
                              )}
                            {property.specifications.commercial.meetingRooms !==
                              undefined && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Layers size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Meeting Rooms
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {
                                        property.specifications.commercial
                                          .meetingRooms
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            {property.specifications.commercial.workstations !==
                              undefined && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Layers size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Workstations
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {
                                        property.specifications.commercial
                                          .workstations
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            {property.specifications.commercial.pantry && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                  <CheckCircle2 size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Pantry
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    Available
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.commercial.receptionArea && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                  <CheckCircle2 size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Reception
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    Available
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.commercial.suitableFor && (
                              <div className="flex items-center gap-4 sm:col-span-2">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <Layout size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Suitable For
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    {
                                      property.specifications.commercial
                                        .suitableFor
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                            {(property.specifications.facing ||
                              property.specifications.residential?.facing) && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Compass size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Facing
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.facing ||
                                        property.specifications.residential?.facing}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                    {/* Plot Specifics */}
                    {property.specifications?.plot &&
                      (property.specifications.plot.plotLength ||
                        property.specifications.plot.plotWidth ||
                        property.specifications.plot.roadWidth ||
                        property.specifications.plot.cornerPlot ||
                        property.specifications.plot.gatedCommunity) && (
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="font-bold text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Square size={18} className="text-gray-400" /> Plot
                            Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            {(property.specifications.plot.plotLength ||
                              property.specifications.plot.plotWidth) && (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Square size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Dimensions
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.plot.plotLength ||
                                        "L"}{" "}
                                      x{" "}
                                      {property.specifications.plot.plotWidth ||
                                        "W"}{" "}
                                      ft
                                    </span>
                                  </div>
                                </div>
                              )}
                            {property.specifications.plot.roadWidth > 0 && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <Layout size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Road Width
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    {property.specifications.plot.roadWidth} ft
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.plot.cornerPlot && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <CheckCircle2 size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Corner Plot
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    Yes
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.plot.gatedCommunity && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                  <CheckCircle2 size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Gated Community
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    Yes
                                  </span>
                                </div>
                              </div>
                            )}
                            {(property.specifications.facing ||
                              property.specifications.residential?.facing) && (
                                <div className="flex items-center gap-4 sm:col-span-2">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                    <Compass size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                      Facing
                                    </span>
                                    <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                      {property.specifications.facing ||
                                        property.specifications.residential?.facing}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                    {/* Utilities */}
                    {property.specifications?.utilities &&
                      (property.specifications.utilities.waterSupply ||
                        property.specifications.utilities.powerBackup) && (
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="font-bold text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Zap size={18} className="text-gray-400" /> Utilities
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            {property.specifications.utilities.waterSupply && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <Droplet size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Water Supply
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    {
                                      property.specifications.utilities
                                        .waterSupply
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                            {property.specifications.utilities.powerBackup && (
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                  <Zap size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                                    Power Backup
                                  </span>
                                  <span className="text-[15px] font-medium text-gray-800 leading-tight">
                                    Available
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* 5. Amenities & Highlights */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm my-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 font-sans flex items-center gap-2">
                  Amenities & Highlights
                </h3>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 text-sm font-medium border border-gray-100 hover:border-black transition-colors"
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Location Map Section */}
            {property?.location?.coordinates?.lat &&
              property?.location?.coordinates?.lng && (
                <div className="bg-white md:bg-blue-50 md:p-2 rounded-[32px] border border-gray-100 md:border-blue-100 shadow-sm my-8">
                  <div className="h-[400px] md:h-[500px] w-full rounded-[24px] overflow-hidden relative shadow-inner">
                    <MapContainer
                      center={[
                        property.location.coordinates.lat,
                        property.location.coordinates.lng,
                      ]}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <LayersControl position="topright">
                        <BaseLayer name="Street Map">
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                        </BaseLayer>
                        <BaseLayer checked name="Satellite View">
                          <LayerGroup>
                            <TileLayer
                              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                            <TileLayer
                              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                            />
                          </LayerGroup>
                        </BaseLayer>

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
                                {property.basicInfo?.title || "Untitled Property"}
                              </h3>
                              <p className="text-[11px] text-gray-500 mb-1">
                                {property.location?.city || "Unknown City"}
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
                      </LayersControl>
                    </MapContainer>

                    <div className="absolute bottom-4 left-4 z-[400]">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${property.location.coordinates.lat},${property.location.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-gray-900 flex items-center hover:bg-gray-50 transition"
                      >
                        Open in Google Maps{" "}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

            {/* 6. Floor Plan Section */}
            {(() => {
              const floorPlans =
                property.media?.floorPlans?.length > 0
                  ? property.media.floorPlans
                  : property.floorPlan || property.media?.floorPlan
                    ? [property.floorPlan || property.media.floorPlan]
                    : [];

              if (floorPlans.length === 0) return null;

              return (
                <div className="space-y-6 mt-8">
                  <hr className="border-gray-100" />
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 font-sans">
                    Floor Plan
                  </h3>
                  <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100 relative group/floorplan">
                    {floorPlans.length > 1 ? (
                      <>
                        <Swiper
                          modules={[Navigation, Pagination, Autoplay]}
                          autoHeight={true}
                          navigation={{
                            nextEl: ".fp-next",
                            prevEl: ".fp-prev",
                          }}
                          pagination={{ clickable: true, dynamicBullets: true }}
                          autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                          }}
                          className="rounded-2xl"
                        >
                          {floorPlans.map((fp, i) => (
                            <SwiperSlide
                              key={i}
                              className="flex justify-center items-center"
                            >
                              <div
                                className="cursor-pointer relative group/img"
                                onClick={() =>
                                  window.open(getImageUrl(fp), "_blank")
                                }
                              >
                                <img
                                  src={getImageUrl(fp)}
                                  alt={`Floor Plan ${i + 1}`}
                                  className="mx-auto max-w-full h-auto rounded-2xl shadow-sm block"
                                />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                                  <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-gray-900 shadow-sm flex items-center gap-2">
                                    <Eye size={16} /> Click to view full size
                                  </span>
                                </div>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                        <button className="fp-prev absolute left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover/floorplan:opacity-100 transition-all active:scale-95">
                          <ChevronLeft size={24} />
                        </button>
                        <button className="fp-next absolute right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover/floorplan:opacity-100 transition-all active:scale-95">
                          <ChevronRight size={24} />
                        </button>
                      </>
                    ) : (
                      <div
                        className="cursor-pointer group/img relative"
                        onClick={() =>
                          window.open(getImageUrl(floorPlans[0]), "_blank")
                        }
                      >
                        <img
                          src={getImageUrl(floorPlans[0])}
                          alt="Floor Plan"
                          className="w-full h-auto rounded-2xl shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                          <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-gray-900 shadow-sm flex items-center gap-2">
                            <Eye size={16} /> Click to view full size
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT COLUMN: Sidebar (Preserved Card Style) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
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
                      {property.seller?.role_id?.role_name === "admin"
                        ? property.seller?.name || "Admin"
                        : property.seller?.name || "Seller"}
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
                  className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg cursor-pointer ${isPropertySold
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

        {/* Nearby Properties */}
        {moreProperties.length > 0 && (
          <div className="mt-24">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-[28px] font-bold text-[#1E293B]">
                  Recommended in{" "}
                  <span className="text-[#166aa8] font-semibold">
                    {property.location?.locality ||
                      property.location?.city ||
                      "this area"}
                  </span>
                </h2>
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

              {/* Mobile/Tablet Pagination Container */}
              {/* <div className="rec-pagination flex justify-center mt-4"></div> */}
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
              user.name,
              user.email,
              updatedPhone,
              selectedEnquiryProperty || property,
            );
          }
        }}
      />
    </div>
  );
};

export default StandardPropertyDetailsUI;
