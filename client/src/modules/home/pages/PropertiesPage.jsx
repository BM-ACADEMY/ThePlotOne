import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import HorizontalPropertyCard from "@/modules/home/components/HorizontalPropertyCard";
import MapComponent from "../components/MapComponent";
import Loader from "../../../components/Common/Loader";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";
import PropertySidebarFilter from "../components/PropertySidebarFilter";
import { Filter, X } from "lucide-react";

const PropertiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);
  const { user, setLoginModalOpen } = useAuth();
  const [pendingWhatsApp, setPendingWhatsApp] = useState(null);
  const navigate = useNavigate();
  const loc = useLocation();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- FILTER STATE (Synced with URL) ---
  const getParamArray = (key) => {
    const val = searchParams.get(key);
    return val ? val.split(",") : [];
  };

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    type: getParamArray("type"),
    location: getParamArray("location"),
    approval: getParamArray("approval"),
    bedrooms: getParamArray("bedrooms"),
    category: getParamArray("category"),
    usageType: getParamArray("usageType"),
    businessType: getParamArray("businessType"),
  });

  // SYNC FROM URL
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      type: getParamArray("type"),
      location: getParamArray("location"),
      approval: getParamArray("approval"),
      bedrooms: getParamArray("bedrooms"),
      category: getParamArray("category"),
      usageType: getParamArray("usageType"),
      businessType: getParamArray("businessType"),
    });
    setCurrentPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  // FETCH PROPERTIES
  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.type.length) params.append("type", filters.type.join(","));
      if (filters.location.length) params.append("location", filters.location.join(","));
      if (filters.approval.length) params.append("approval", filters.approval.join(","));
      if (filters.bedrooms.length) params.append("bedrooms", filters.bedrooms.join(","));
      if (filters.category.length) params.append("category", filters.category.join(","));
      if (filters.usageType.length) params.append("usageType", filters.usageType.join(","));
      if (filters.businessType.length) params.append("businessType", filters.businessType.join(","));
      params.append("page", currentPage);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/properties/fetch-all-property?${params.toString()}`
      );

      if (res.data.properties) {
        setProperties(res.data.properties);
        setTotalPages(res.data.totalPages);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (keyOrUpdates, value) => {
    const newParams = new URLSearchParams(searchParams);
    const updates = typeof keyOrUpdates === "object" ? keyOrUpdates : { [keyOrUpdates]: value };

    Object.entries(updates).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) newParams.set(key, val.join(","));
        else newParams.delete(key);
      } else {
        if (val !== undefined && val !== null && val !== "") newParams.set(key, val);
        else newParams.delete(key);
      }
    });

    newParams.set("page", "1"); // Reset to page 1 on filter
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({ page: "1" });
  };

  const handleWhatsAppClick = (e, property) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!property || !property.seller) {
      toast.error("Seller information missing");
      return;
    }

    if (user) {
      if (!user.phone) {
        setSelectedProperty(property);
        setShowPhoneModal(true);
      } else {
        submitEnquiry(property, user.name, user.email, user.phone);
      }
    } else {
      setPendingWhatsApp(property);
      setLoginModalOpen(true);
    }
  };

  useEffect(() => {
    if (user && pendingWhatsApp) {
      handleWhatsAppClick(null, pendingWhatsApp);
      setPendingWhatsApp(null);
    }
  }, [user, pendingWhatsApp]);

  const submitEnquiry = async (property, name, email, phone) => {
    const sellerPhone = property.seller.phone || "919000000000";
    const locStr =
      typeof property.location === "string"
        ? property.location
        : `${property.location?.city || ""}, ${property.location?.state || ""}`;
    const message = `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${locStr}. Please provide more details.`;
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/enquiries/create`, {
        property_id: property._id,
        seller_id: property.seller._id || property.seller,
        message: message,
        name,
        email,
        phone,
      });
      toast.success("Enquiry sent! Opening WhatsApp...");
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || "Failed to submit enquiry";
      toast.error(errMsg);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12 font-sans">
      <Helmet>
        <title>Properties for Sale in Pondicherry | Verified Listings</title>
        <meta
          name="description"
          content="Browse verified residential and commercial properties in Pondicherry. Transparent pricing and expert guidance for buyers."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Mobile Filter Button - Floating Fixed Right */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden fixed bottom-6 -right-2 z-50 flex items-center gap-2 bg-[#166aa8] text-white px-4 py-3 rounded-md shadow-2xl hover:bg-[#145a8d] transition-all transform hover:scale-105 active:scale-95 border border-white/20"
          >
            <Filter className="w-5 h-5 text-white" />
            <span className="font-bold text-sm pr-1">Filters</span>
          </button>

          {/* Sidebar Filter (Desktop) */}
          <aside className="hidden lg:block lg:w-1/4">
            <PropertySidebarFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Off-canvas Filter (Mobile/Tablet) */}
          <div
            className={`fixed top-19 inset-0 z-[100] lg:hidden transition-opacity duration-300 ${isFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isFilterOpen ? "opacity-100" : "opacity-0"
                }`}
              onClick={() => setIsFilterOpen(false)}
            />

            {/* Drawer Content */}
            <div
              className={`absolute left-0 top-0 bottom-0 h-full w-[280px] sm:w-[320px] bg-white shadow-2xl transition-transform duration-300 transform ${isFilterOpen ? "translate-x-0" : "-translate-x-full"
                } flex flex-col`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content Area - FIX APPLIED HERE */}
              {/* [&>*]:!mt-0 and [&>*]:!pt-0 forcefully strips top spacing from the child component */}
              {/* [&>*]:!border-none removes the extra border from the desktop version to make it look cleaner on mobile */}
              <div className="flex-1 overflow-y-auto px-2 py-0 [&>*]:!mt-0 [&>*]:!pt-2 [&>*]:!border-none [&>*]:!shadow-none">
                <PropertySidebarFilter
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                />
              </div>

              {/* Footer Apply Button */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Show Results
                </button>
              </div>
            </div>
          </div>

          {/* Properties Content */}
          <main className="w-full lg:w-3/4">
            {loading ? (
              <Loader />
            ) : (
              <div className="flex flex-col gap-6 relative z-0">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <HorizontalPropertyCard
                      key={property._id}
                      property={property}
                      onWhatsAppClick={handleWhatsAppClick}
                    />
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                    <div className="mx-auto w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-6">
                      <img
                        src="/notfound/nousers.webp"
                        alt="No properties found"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-gray-500 font-medium">No properties found matching your criteria.</p>
                    <button onClick={clearFilters} className="text-blue-600 font-semibold mt-2 hover:underline">Clear all filters</button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-50 transition shadow-sm"
                >
                  Previous
                </button>
                <span className="px-5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg font-medium shadow-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-50 transition shadow-sm"
                >
                  Next
                </button>
              </div>
            )}

            {/* Map Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Explore Properties on Map
              </h2>
              <div className="h-[500px] w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
                <MapComponent properties={properties} />
              </div>
            </div>
          </main>
        </div>
      </div>
      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(updatedPhone) => {
          if (user && selectedProperty) {
            submitEnquiry(selectedProperty, user.name, user.email, updatedPhone);
          }
        }}
      />
    </div>
  );
};

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default PropertiesPage;
