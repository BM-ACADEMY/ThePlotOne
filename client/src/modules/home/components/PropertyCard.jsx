import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MapPin, Eye, Flame, Building } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import WishlistButton from "../../../components/Common/WishlistButton";
import { formatIndianPrice, formatPriceRange } from "../../../utils/formatPrice";
import { formatNumber } from "../../../utils/formatNumber";
import { getImageUrl } from "../../../utils/imageUrl";

import moment from "moment";

const PropertyCard = ({ property }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const imgUrl = getImageUrl(property.media?.featuredImage || property.media?.images?.[0]);
  const locality = property.location?.locality || property.location?.city || "Pondicherry";
  const city = property.location?.city || "";
  const isPosterAdmin = property.seller?.role_id?.role_name === 'admin' || property.seller?.role?.name === 'admin';
  const posterType = isPosterAdmin ? (property.seller?.name || "Admin") : (property.businessType?.name || (typeof property.businessType === 'string' && property.businessType !== "" ? property.businessType : null) || "Owner");
  const timeAgo = property.createdAt ? moment(property.createdAt).fromNow() : "Recently";
  const isPropertySold = property.isSold || property.status?.toLowerCase() === "sold";

  // Price range display
  const isRent = property.basicInfo?.category === "Rent";
  const minPrice = isRent ? property.pricing?.rent?.minRent : property.pricing?.sell?.minPrice;
  const maxPrice = isRent ? property.pricing?.rent?.maxRent : property.pricing?.sell?.maxPrice;
  const singlePrice = isRent ? (property.pricing?.rent?.monthlyRent || 0) : (property.pricing?.sell?.price || 0);
  const displayPrice = formatPriceRange(minPrice, maxPrice, singlePrice);

  return (
    <div className="flex flex-col group h-full">
      {/* Top Image Section */}
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
        <Link
          to={`/properties/${property.slug || property._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
        />

        <img
          src={imgUrl}
          alt={property.basicInfo?.title || "Property"}
          className={`w-full h-full object-cover ${isPropertySold ? "grayscale-[0.8]" : ""}`}
          loading="lazy"
        />

        {/* Wishlist Button - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <WishlistButton propertyId={property._id} />
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start pointer-events-none">
          {/* Verified Badge */}
          {(property.seller?.badgeVerified || property.seller?.role_id?.role_name === 'admin') && (
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-green-200 pointer-events-auto">
              <img src="/Logo/badge.webp" alt="Verified" className="w-4 h-4 object-contain" />
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

        {/* Price Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 z-20 bg-white px-3 py-1.5 rounded-lg shadow-md">
          <span className="text-sm font-bold text-gray-900">
            {displayPrice}
          </span>
        </div>

        {/* View Count Badge - Bottom Right */}
        {property.view_count > 0 && (
          <div className="absolute bottom-3 right-3 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/20 transition-all group-hover:bg-black/70">
            <Eye className="w-3.5 h-3.5 text-white/90" />
            <span className="text-white text-[11px] font-bold tracking-tight">
              {formatNumber(property.view_count)}
            </span>
          </div>
        )}

        {isPropertySold && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider pointer-events-auto">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Bottom Content Section */}
      <div className="flex flex-col flex-1 px-1">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
          {property.basicInfo?.title || "Untitled Property"}
        </h3>

        {/* Location */}
        <p className="text-gray-500 text-sm mb-2 font-medium">
          In <span className="font-bold text-gray-800">{locality}</span>{city ? `, ${city}` : ""}
        </p>

        {/* Property Type Details */}
        {property.basicInfo?.category && (
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-semibold mb-3">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{property.basicInfo.category === "Rent" ? "For Rent" : "For Sale"}</span>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-auto flex items-center justify-between text-gray-500 text-sm">
          <span>Posted by {posterType}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
