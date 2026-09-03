import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Eye, ArrowRight, Phone, MessageSquare, Flame, Building } from "lucide-react";
import { formatIndianPrice, formatPriceRange } from "@/utils/formatPrice";
import { formatNumber } from "../../../utils/formatNumber";
import { getImageUrl } from "@/utils/imageUrl";
import moment from "moment";
import WishlistButton from "../../../components/Common/WishlistButton";

const HorizontalPropertyCard = ({ property, onWhatsAppClick, linkQuery = "" }) => {
    const images = property.media?.images && property.media.images.length > 0
        ? property.media.images
        : (property.media?.featuredImage ? [property.media.featuredImage] : []);

    const displayImages = images.length > 0
        ? (images.length > 1 ? [...images, images[0]] : images)
        : [null]; // Show fallback image if no images available
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [useTransition, setUseTransition] = useState(true);

    useEffect(() => {
        if (!isHovering || images.length <= 1) {
            setCurrentImageIndex(0);
            setUseTransition(true);
            return;
        }

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => prev + 1);
        }, 2000);

        return () => clearInterval(interval);
    }, [isHovering, images.length]);

    // Handle Infinite Loop teleporting
    useEffect(() => {
        if (currentImageIndex === images.length && images.length > 1) {
            // Wait for the slide animation to the clone to finish (700ms)
            const jumpTimer = setTimeout(() => {
                setUseTransition(false); // Disable animation for the jump
                setCurrentImageIndex(0); // Teleport back to start

                // Re-enable animation for next cycle
                setTimeout(() => {
                    setUseTransition(true);
                }, 50);
            }, 700);

            return () => clearTimeout(jumpTimer);
        }
    }, [currentImageIndex, images.length]);

    const locality = property.location?.locality || property.location?.city || "Pondicherry";
    const city = property.location?.city || "";
    const posterType = property.businessType?.name || (typeof property.businessType === 'string' ? property.businessType : null) || property.seller?.role_id?.role_name || property.seller?.role?.name || "Owner";
    const timeAgo = property.createdAt ? moment(property.createdAt).fromNow() : "Recently";
    const isPropertySold = property.isSold || property.status?.toLowerCase() === "sold";

    const bedrooms = property.specifications?.residential?.bedrooms || 0;
    const minArea = property.specifications?.area?.minArea;
    const maxArea = property.specifications?.area?.maxArea;
    const totalArea = property.specifications?.area?.totalArea || property.specifications?.area?.builtupArea || 0;
    const areaUnit = property.specifications?.area?.unit || "sqft";

    // Build area display string
    const areaDisplay = (minArea && maxArea && !isNaN(minArea) && !isNaN(maxArea))
        ? `${Number(minArea).toLocaleString()} - ${Number(maxArea).toLocaleString()} ${areaUnit}`
        : (minArea && !isNaN(minArea))
            ? `${Number(minArea).toLocaleString()}+ ${areaUnit}`
            : (totalArea && !isNaN(totalArea) && String(totalArea).toLowerCase() !== "nan")
                ? `${Number(totalArea).toLocaleString()} ${areaUnit}`
                : "N/A";

    const areaLabel = (minArea || maxArea) ? "Area Range" : (property.specifications?.area?.totalArea ? "Total Area" : "Built Area");

    return (
        <div
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col xl:flex-row group relative xl:h-64 top-6"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Left: Image Section */}
            <div className="w-full xl:w-[35%] h-48 xl:h-full relative shrink-0 overflow-hidden">
                <Link
                    to={`/properties/${property.slug || property._id}${linkQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-30"
                />

                {/* Sliding Image Strip */}
                <div
                    className={`flex flex-nowrap h-full w-full ${useTransition ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                        willChange: 'transform'
                    }}
                >
                    {displayImages.map((img, idx) => (
                        <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden">
                            <img
                                src={getImageUrl(img)}
                                alt={`${property.basicInfo?.title || "Property"} - ${idx + 1}`}
                                className={`w-full h-full object-cover scale-[1.03] ${isPropertySold ? "grayscale-[0.8]" : ""}`}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>

                <div className="absolute top-3 right-3 z-40">
                    <WishlistButton propertyId={property._id} />
                </div>

                {/* Sold Out Badge */}
                {isPropertySold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 pointer-events-none">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider pointer-events-auto shadow-lg border border-red-500/50">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 z-40 flex flex-col gap-2 items-start pointer-events-none">
                    {/* Verified Badge */}
                    {(property.seller?.badgeVerified || property.seller?.role_id?.role_name === 'admin') && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-green-200 pointer-events-auto">
                            <img src="/Logo/badge.webp" alt="Verified" className="w-5 h-5 object-contain" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Verified</span>
                        </div>
                    )}

                    {/* Hot Deal Badge */}
                    {property.view_count >= 2000 && (
                        <div className="bg-red-50 text-red-600 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-red-200 pointer-events-auto">
                            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Hot Deal</span>
                        </div>
                    )}
                </div>

                {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 z-40 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-white text-[9px] font-medium flex items-center gap-1">
                        {(currentImageIndex % images.length) + 1}/{images.length}
                    </div>
                )}

                {property.view_count > 0 && (
                    <div className="absolute bottom-3 left-3 z-40 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 transition-all group-hover:bg-black/70">
                        <Eye className="w-3 h-3 text-white/90" />
                        <span className="text-white text-[10px] font-bold tracking-tight">
                            {formatNumber(property.view_count)}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Content Section */}
            <div className="flex-1 p-4 md:px-6 md:py-4 flex flex-col min-w-0">
                {/* Header: Title & Tag */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 truncate line-clamp-1">
                            {property.basicInfo?.title || "Untitled Property"}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium truncate">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {locality}{city ? `, ${city}` : ""}
                        </p>

                        {/* Property Type Details */}
                        {property.basicInfo?.category && (
                          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{property.basicInfo.category === "Rent" ? "For Rent" : "For Sale"}</span>
                          </div>
                        )}
                    </div>
                    <span className="bg-gray-100 text-[9px] font-bold px-2 py-0.5 rounded text-gray-500 uppercase tracking-widest shrink-0">
                        {property.basicInfo?.category === "Rent" ? "FOR RENT" : "SELL/BUY"}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="flex items-center gap-4 py-3 my-1 border-y border-slate-50">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-base font-bold text-slate-800 truncate">
                            {(() => {
                                const isRent = property.basicInfo?.category === "Rent";
                                const min = isRent ? property.pricing?.rent?.minRent : property.pricing?.sell?.minPrice;
                                const max = isRent ? property.pricing?.rent?.maxRent : property.pricing?.sell?.maxPrice;
                                const price = isRent ? property.pricing?.rent?.monthlyRent : property.pricing?.sell?.price;
                                return formatPriceRange(min, max, price);
                            })()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                            {property.basicInfo?.category !== "Rent" && property.pricing?.sell?.pricePerSqft ? `₹${property.pricing.sell.pricePerSqft.toLocaleString()}/sqft` : "Price"}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-gray-100 shrink-0" />

                    <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-base font-bold text-slate-800 truncate">
                            {areaDisplay}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                            {areaLabel}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-gray-100 shrink-0 hidden sm:block" />

                    <div className="flex-1 min-w-0 flex flex-col hidden sm:flex">
                        <span className="text-base font-bold text-slate-800">
                            Status
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                            {property.legal?.propertyStatus || "Ready to Move"}
                        </span>
                    </div>
                </div>

                {/* Excerpt */}
                <div className="mb-4 relative group/excerpt flex-1 flex items-center">
                    <p className="text-sm text-slate-500 line-clamp-2 pr-6 leading-relaxed italic">
                        Located in {locality}, {city}, this {bedrooms > 0 ? `${bedrooms} BHK ` : ""}{property.basicInfo?.propertyType?.toLowerCase()}...
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-300 absolute right-0 top-1/2 -translate-y-1/2" />
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium leading-none">{timeAgo}</span>
                        <span className="text-[13px] font-bold text-slate-700 capitalize mt-1 leading-none">{posterType}</span>
                    </div>

                    {!isPropertySold && (
                        <button
                            onClick={(e) => onWhatsAppClick && onWhatsAppClick(e, property)}
                            className="px-6 py-2 rounded-xl bg-[#166aa8] text-white font-bold text-[13px] tracking-wide flex items-center gap-2 hover:bg-[#125a8e] transition-all shadow-md active:scale-95"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Contact</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChevronRight = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default HorizontalPropertyCard;
