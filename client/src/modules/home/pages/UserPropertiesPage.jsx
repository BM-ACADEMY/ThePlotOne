import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  User,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Store,
  Building2,
} from "lucide-react";
import PropertyCard from "@/modules/home/components/PropertyCard";

import { useAuth } from "../../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";
import { getImageUrl } from "@/utils/imageUrl";
import api from "../../../services/api";

const UserPropertiesPage = () => {
  const { userId } = useParams();
  const [properties, setProperties] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch User Details
        const userRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/public-user/${userId}`,
        );
        setProfileUser(userRes.data);

        // Fetch Properties by this User
        const propertiesRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/properties/fetch-all-property?seller_id=${userId}`,
        );
        console.log("Properties response:", propertiesRes.data); // Debugging
        // Handle different response structures gracefully
        if (Array.isArray(propertiesRes.data)) {
          setProperties(propertiesRes.data);
        } else if (
          propertiesRes.data.properties &&
          Array.isArray(propertiesRes.data.properties)
        ) {
          setProperties(propertiesRes.data.properties);
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/properties", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleWhatsAppClick = (e, property) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!profileUser?.phone) return;

    if (authUser) {
      if (!authUser.phone) {
        setSelectedProperty(property);
        setShowPhoneModal(true);
      } else {
        submitEnquiry(property, authUser.name, authUser.email, authUser.phone);
      }
    } else {
      setLoginModalOpen(true);
    }
  };

  const submitEnquiry = async (property, name, email, phone) => {
    // Normalise phone: strip leading +, 0, or 91 country code then prepend 91
    const rawPhone = (profileUser.phone || "").toString().replace(/\D/g, "");
    const sellerPhone = rawPhone.length === 10
      ? `91${rawPhone}`
      : rawPhone.length === 12 && rawPhone.startsWith("91")
        ? rawPhone
        : rawPhone || "919000000000";

    const locStr =
      typeof property.location === "string"
        ? property.location
        : `${property.location?.city || ""}, ${property.location?.state || ""}`;
    const message = `Hi ${profileUser.name}, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${locStr}.`;
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    try {
      await api.post("/enquiries/create", {
        property_id: property._id,
        seller_id: profileUser._id,
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
    }
  };

  const handleProfileContact = () => {
    // Normalise phone
    const rawPhone = (profileUser.phone || "").toString().replace(/\D/g, "");
    const sellerPhone = rawPhone.length === 10
      ? `91${rawPhone}`
      : rawPhone.length === 12 && rawPhone.startsWith("91")
        ? rawPhone
        : rawPhone;

    if (sellerPhone) {
      const whatsappUrl = `https://wa.me/${sellerPhone}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b5998]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 pt-10 relative overflow-hidden">
      {/* Background sparkle effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white opacity-40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* --- PROFILE HERO CARD --- */}
        {/* Replaced the dark banner with a clean, unified white card matching the new style */}
        <div className="bg-white rounded-[24px] shadow-sm p-8 lg:p-12 mb-16 flex flex-col md:flex-row items-center md:items-start gap-10 border border-gray-100/50">
          {/* Left: Image Container */}
          <div className="shrink-0">
            <div className="h-[140px] w-[140px] md:h-[160px] md:w-[160px] rounded-full overflow-hidden bg-gray-50 border-[4px] border-white shadow-md relative">
              {profileUser?.profile_image ? (
                <img
                  src={getImageUrl(profileUser.profile_image)}
                  alt={profileUser.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 text-[#3b5998] font-light text-5xl">
                  {profileUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
            {/* Gold Expertise Badge */}
            <div className="inline-block border border-[#d4af37]/60 text-[#b58900] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 bg-white/40 backdrop-blur-sm">
              {profileUser?.businessType?.name ||
                profileUser?.role_id?.name ||
                "Verified Professional"}
            </div>

            {/* Thin Typography Heading */}
            <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-4 tracking-tight flex items-center gap-3">
              {profileUser?.name}
              {profileUser?.isVerified && (
                <ShieldCheck
                  className="w-8 h-8 text-[#3b5998]"
                  fill="currentColor"
                  strokeWidth={1.5}
                  title="Verified Professional"
                />
              )}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-medium text-sm mb-6">
              {profileUser?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />{" "}
                {properties.length} Active Listings
              </span>
            </div>

            {/* Bold Italic Emphasis in description */}
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl">
              Welcome to my verified property portfolio. Browse through the
              exclusive listings below and feel free to{" "}
              <span className="font-bold italic text-slate-900">
                contact me directly
              </span>{" "}
              for any inquiries or to schedule a site visit.
            </p>

            <button
              onClick={handleProfileContact}
              className="flex items-center gap-2 py-3 px-8 bg-[#3b5998] text-white rounded-xl hover:bg-[#2d4373] transition-colors font-semibold shadow-sm w-full sm:w-auto justify-center"
            >
              <Phone className="w-5 h-5" /> Contact{" "}
              {profileUser?.name?.split(" ")[0] || "Agent"}
            </button>
          </div>
        </div>

        {/* --- PROPERTIES GRID --- */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
              <Building2 className="w-6 h-6 text-slate-400" />
              Available Listings
            </h2>
            <span className="text-gray-500 text-sm font-medium bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              {properties.length} Properties Found
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <div className="mx-auto w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-6">
                <img
                  src="/notfound/nousers.webp"
                  alt="No properties listed"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No properties listed yet
              </h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                This verified professional hasn't added any active property
                listings at the moment. Please check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onWhatsAppClick={handleWhatsAppClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(updatedPhone) => {
          if (authUser && selectedProperty) {
            submitEnquiry(
              selectedProperty,
              authUser.name,
              authUser.email,
              updatedPhone,
            );
          }
        }}
      />
    </div>
  );
};

export default UserPropertiesPage;
