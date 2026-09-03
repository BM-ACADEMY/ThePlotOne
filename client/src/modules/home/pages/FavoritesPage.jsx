import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MapPin, Heart, ArrowRight, Store, Eye } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import {
  formatIndianPrice,
  formatPriceRange,
} from "../../../utils/formatPrice";
import WishlistButton from "../../../components/Common/WishlistButton";
import { getImageUrl } from "@/utils/imageUrl";

import api from "../../../services/api";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";

const emptyWishlistImg = "/assets/wishlistEmpty.webp";

const getLocation = (loc) => {
  if (!loc) return "Location not specified";
  if (typeof loc === "string") return loc;
  return [loc.city, loc.state].filter(Boolean).join(", ");
};

/* ── skeleton card ── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto sm:h-44 animate-pulse shadow-sm border border-gray-100">
    <div className="w-full sm:w-44 h-44 sm:h-full bg-gray-200 shrink-0" />
    <div className="flex-1 p-5 flex flex-col gap-3">
      <div className="h-4 bg-gray-200 rounded-full w-1/3" />
      <div className="h-5 bg-gray-200 rounded-full w-2/3" />
      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      <div className="mt-auto flex gap-3">
        <div className="h-9 bg-gray-200 rounded-full w-28" />
        <div className="h-9 bg-gray-200 rounded-full w-28" />
      </div>
    </div>
  </div>
);

/* ── main component ── */
const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  // --- NEW: Dynamically load the "Outfit" font to match the image ---
  useEffect(() => {
    const fontLinkId = "google-font-outfit";
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement("link");
      link.id = fontLinkId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* sync with wishlist changes */
  useEffect(() => {
    if (user && user.wishlist) {
      if (user.wishlist.length === 0) {
        setFavorites([]);
        return;
      }
      setFavorites((prev) =>
        prev.filter((fav) =>
          user.wishlist.some(
            (w) => (typeof w === "string" ? w : w._id) === fav._id,
          ),
        ),
      );
    } else if (user) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.wishlist]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/wishlist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data?.wishlist) setFavorites(res.data.wishlist);
    } catch (err) {
      console.error("Error fetching favorites", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (e, property) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!property || !property.seller_id) return;

    if (user) {
      if (!user.phone) {
        setSelectedProperty(property);
        setShowPhoneModal(true);
      } else {
        submitEnquiry(property, user.name, user.email, user.phone);
      }
    } else {
      setLoginModalOpen(true);
    }
  };

  const submitEnquiry = async (property, name, email, phone) => {
    // Normalise phone: strip leading +, 0, or 91 country code then prepend 91
    const rawPhone = (property.seller_id.phone || "")
      .toString()
      .replace(/\D/g, "");
    const sellerPhone =
      rawPhone.length === 10
        ? `91${rawPhone}`
        : rawPhone.length === 12 && rawPhone.startsWith("91")
          ? rawPhone
          : rawPhone || "919000000000";

    const locStr = getLocation(property.location);
    const message = `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${locStr}. Please provide more details.`;
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    setEnquiryLoading(true);
    try {
      await api.post("/enquiries/create", {
        property_id: property._id,
        seller_id: property.seller_id._id || property.seller_id,
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

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fa] py-10 px-4 font-['Outfit',_sans-serif]">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── unauthenticated state ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f9fa] flex items-center justify-center p-6 font-['Outfit',_sans-serif]">
        <div className="bg-white rounded-2xl shadow-[0px_0px_20px_rgba(0,0,0,0.07)] p-12 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-[#f6f9fa] flex items-center justify-center mx-auto mb-5">
            <Heart className="w-8 h-8 text-[#c19b48]" />
          </div>
          <h2 className="text-xl font-bold text-[#0e182b] mb-2">
            Sign in to see your favorites
          </h2>
          <p className="text-[#38526e] text-sm mb-7 leading-relaxed">
            Save properties you love and access them anytime in one place.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#0e182b] hover:bg-[#1a2b4c] text-white text-sm font-medium py-2.5 px-6 rounded-full transition-colors"
          >
            Log in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── main content ── */
  return (
    // CHANGED: Applied background color and 'Outfit' font family
    <div className="mt-20 min-h-[calc(100vh-80px)] bg-[#f6f9fa] font-['Outfit',_sans-serif] flex flex-col">
      {/* ── Page Header ── */}
      <div className="bg-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              {/* CHANGED: Applied the gold color to the top accent text */}
              <p className="text-sm font-medium tracking-wide text-[#ae284c] mb-1.5">
                Your Collection
              </p>
              {/* CHANGED: Applied the bold navy color to the main heading */}
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0e182b] flex items-center gap-2.5">
                <Heart className="w-7 h-7 text-[#ae284c] fill-[#ae284c]/20" />
                My Favorites
              </h1>
            </div>
            {/* CHANGED: Badge matches the color scheme */}
            <span className="text-xs font-semibold bg-[#0e182b] text-white px-4 py-1.5 rounded-full whitespace-nowrap shrink-0">
              {favorites.length}{" "}
              {favorites.length === 1 ? "property" : "properties"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Property Cards or Empty State ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 pb-10 flex-1 flex flex-col">
        {favorites.length === 0 ? (
          <div className="p-6 md:p-10 text-center w-full border border-gray-100/50 relative overflow-hidden flex-1 flex flex-col justify-center items-center">
            {/* Decorative background element */}
            <div className="relative mb-8 flex justify-center">
              <div className="relative">
                <img
                  src={emptyWishlistImg}
                  alt="Empty Wishlist"
                  className="w-44 md:w-56 h-auto object-contain animate-float"
                  style={{ animation: "float 6s ease-in-out infinite" }}
                />
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                  }
                `}</style>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-[#0e182b] mb-3 tracking-tight">
              Your Wishlist is Empty
            </h2>
            <p className="text-[#38526e] text-sm md:text-base mb-8 leading-relaxed max-w-[320px] mx-auto opacity-80">
              Looks like you haven't found any favorites yet. Start exploring to
              build your dream collection!
            </p>

            <Link
              to="/properties"
              className="group inline-flex items-center gap-3 bg-[#0e182b] hover:bg-[#1a2b4c] text-white text-[14px] font-semibold py-3.5 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-[#0e182b]/10 hover:shadow-[#0e182b]/20 hover:-translate-y-0.5"
            >
              Start Exploring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {favorites.map((property) => {
              const imgUrl = getImageUrl(
                property.media?.featuredImage || property.media?.images?.[0],
              );
              const locStr = getLocation(property.location);
              const sellerPhone = property.seller_id?.phone;

              return (
                <div
                  key={property._id}
                  className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg hover:shadow-[#0e182b]/5 transition-all duration-300 flex flex-col sm:flex-row group"
                >
                  {/* ── Image ── */}
                  <Link
                    to={`/properties/${property.slug || property._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full sm:w-56 md:w-64 h-56 sm:h-auto shrink-0 overflow-hidden block"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={property.basicInfo?.title || "Property"}
                        className={`w-full h-full object-cover transition-transform duration-700 ${property.isSold ? "grayscale-[0.6]" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f6f9fa] flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                    )}
                    {property.isSold && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Sold
                      </span>
                    )}
                    {!property.isSold && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#0e182b]/70 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1.5 rounded-full">
                        <Eye className="w-3.5 h-3.5" />
                        {property.view_count || 0} views
                      </span>
                    )}
                  </Link>

                  {/* ── Details ── */}
                  <div className="flex-1 p-6 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#e22454] bg-[#e22454]/10 px-3 py-1 rounded-full shrink-0">
                        {property.businessType?.name ||
                          property.basicInfo?.propertyType ||
                          "Property"}
                      </span>
                      <div className="shrink-0 -mt-1">
                        <WishlistButton propertyId={property._id} />
                      </div>
                    </div>

                    <Link
                      to={`/properties/${property.slug || property._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h3 className="text-lg font-bold text-[#0e182b] line-clamp-1 hover:text-[#166aa8] transition-colors mb-2">
                        {property.basicInfo?.title || "Untitled Property"}
                      </h3>
                    </Link>

                    <div className="flex flex-col gap-1.5 mb-4">
                      <div className="flex items-center gap-2 text-[#e22454] text-sm">
                        <MapPin className="w-4 h-4 text-[#e22454] shrink-0" />
                        <span className="truncate">{locStr}</span>
                      </div>
                      {property.seller_id?.name && (
                        <div className="flex items-center gap-2 text-[#38526e] text-sm">
                          <Store className="w-4 h-4 text-[#c19b48] shrink-0" />
                          <span className="truncate">
                            {property.seller_id.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4 mt-auto pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#38526e] mb-1">
                          Price
                        </p>
                        <p className="text-xl font-bold text-[#0e182b] leading-none">
                          {formatPriceRange(
                            property.pricing?.sell?.minPrice ||
                              property.pricing?.rent?.minRent,
                            property.pricing?.sell?.maxPrice ||
                              property.pricing?.rent?.maxRent,
                            property.pricing?.sell?.price ||
                              property.pricing?.rent?.monthlyRent ||
                              0,
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Link
                          to={`/properties/${property.slug || property._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#0e182b] border-2 border-[#0e182b]/10 hover:border-[#0e182b] hover:bg-[#0e182b] hover:text-white px-4 py-2 rounded-full transition-all duration-300"
                        >
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {!property.isSold && sellerPhone && (
                          <button
                            onClick={(e) => handleWhatsAppClick(e, property)}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                          </button>
                        )}
                        {property.isSold && (
                          <span className="text-xs font-semibold text-[#38526e] bg-[#f6f9fa] px-4 py-2.5 rounded-full cursor-default border border-gray-200">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(updatedPhone) => {
          if (user && selectedProperty) {
            submitEnquiry(
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

export default FavoritesPage;
