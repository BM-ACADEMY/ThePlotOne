import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import api from "../../../services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-hot-toast";

import { useAuth } from "../../../context/AuthContext";
import { recordPropertyView } from "../../../utils/propertyViewTracker";
import Loader from "../../../components/Common/Loader";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";

import StandardPropertyDetailsUI from "../components/StandardPropertyDetailsUI";
import BuilderPromoterDetailsUI from "../components/BuilderPromoterDetailsUI";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PropertyDetails = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [moreProperties, setMoreProperties] = useState([]);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const { user, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedEnquiryProperty, setSelectedEnquiryProperty] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setProperty(null);
      setMainImage("");
      setMoreProperties([]);

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/properties/fetch-property-by-slug/${slug}`,
        );
        const propertyData = res.data;

        if (!propertyData || !propertyData._id) {
          navigate("/properties", { replace: true });
          return;
        }

        setProperty(propertyData);

        // Set dynamic meta title
        const title = propertyData.basicInfo?.title || "Property Details";
        const category = propertyData.basicInfo?.category || "Sell/Buy";
        const locality = propertyData.location?.locality || "";
        const city = propertyData.location?.city || "Pondicherry";
        document.title = `${title} | ${category} in ${locality ? locality + ", " : ""}${city} | The Plot One`;

        if (propertyData?.media?.images?.length > 0) {
          setMainImage(propertyData.media.featuredImage || propertyData.media.images[0]);
        }

        // Check if this is a builder/promoter property and fetch related items
        try {
          const isBuilder = propertyData.businessType?.name?.toLowerCase().includes("builder") ||
            propertyData.businessType?.name?.toLowerCase().includes("promoter");
          
          const queryParams = new URLSearchParams(location.search);
          const fromBuilderList = queryParams.get("from") === "builder";

          if (isBuilder && fromBuilderList) {
            const builderRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/properties/fetch-builder-other-properties/${propertyData._id}`,
            );
            if (Array.isArray(builderRes.data)) {
              setMoreProperties(builderRes.data);
            }
          } else {
            const relatedRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/properties/fetch-recommended-properties/${propertyData._id}`,
            );
            if (Array.isArray(relatedRes.data)) {
              setMoreProperties(relatedRes.data);
            }
          }

          const viewResult = await recordPropertyView(propertyData._id);
          if (viewResult && viewResult.success && !viewResult.alreadyViewed) {
            setProperty(prev => ({
              ...prev,
              view_count: viewResult.view_count || (prev?.view_count + 50)
            }));
          }
        } catch (subError) {
          console.error("Error fetching recommended properties or recording view:", subError);
        }
      } catch (error) {
        console.error("Error fetching property details", error);
        navigate("/properties", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
    window.scrollTo(0, 0);
  }, [slug, navigate, location.search]);

  const handleWhatsAppClick = (e = null, clickedProp = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const targetProp = clickedProp || property;
    if (!targetProp || !targetProp.seller) return;
    if (!user) {
      setLoginModalOpen(true);
    } else if (!user.phone) {
      setSelectedEnquiryProperty(targetProp);
      setShowPhoneModal(true);
    } else {
      submitEnquiry(user.name, user.email, user.phone, targetProp);
    }
  };

  const submitEnquiry = async (name, email, phone, targetProp = selectedEnquiryProperty || property) => {
    if (!targetProp || !targetProp.seller) return;
    setEnquiryLoading(true);

    const rawPhone = (targetProp.seller.phone || "").toString().replace(/\D/g, "");
    const sellerPhone = rawPhone.length === 10
      ? `91${rawPhone}`
      : rawPhone.length === 12 && rawPhone.startsWith("91")
      ? rawPhone
      : rawPhone || "919000000000";

    const locationStr =
      typeof targetProp.location === "string"
        ? targetProp.location
        : `${targetProp.location?.city || ""}, ${targetProp.location?.state || ""}`;
    const message = `Hi, I am interested in your property: ${targetProp.basicInfo?.title || "Untitled"} located at ${locationStr}. Please provide more details.`;
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    try {
      await api.post("/enquiries/create", {
        property_id: targetProp._id,
        seller_id: targetProp.seller._id || targetProp.seller,
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

  const maskPhoneNumber = (phone) => {
    if (!phone) return "**********";
    const phoneStr = phone.toString();
    if (phoneStr.length < 10) return phoneStr;
    return phoneStr.substring(0, 5) + "*****";
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  if (loading) return <Loader />;
  if (!property) return null;

  const isBuilderProperty = property.businessType?.name?.toLowerCase().includes("builder") ||
    property.businessType?.name?.toLowerCase().includes("promoter");

  const fromBuilderList = new URLSearchParams(location.search).get("from") === "builder";

  return (
    <div className="relative">
      {isBuilderProperty ? (
        <BuilderPromoterDetailsUI
          property={property}
          mainImage={mainImage}
          setMainImage={setMainImage}
          moreProperties={moreProperties}
          fromBuilderList={fromBuilderList}
          enquiryLoading={enquiryLoading}
          handleWhatsAppClick={handleWhatsAppClick}
          maskPhoneNumber={maskPhoneNumber}
          getVideoEmbedUrl={getVideoEmbedUrl}
        />
      ) : (
        <StandardPropertyDetailsUI
          property={property}
          mainImage={mainImage}
          setMainImage={setMainImage}
          moreProperties={moreProperties}
          enquiryLoading={enquiryLoading}
          handleWhatsAppClick={handleWhatsAppClick}
          maskPhoneNumber={maskPhoneNumber}
          getVideoEmbedUrl={getVideoEmbedUrl}
          showPhoneModal={showPhoneModal}
          setShowPhoneModal={setShowPhoneModal}
          user={user}
          submitEnquiry={submitEnquiry}
          selectedEnquiryProperty={selectedEnquiryProperty}
        />
      )}

      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(updatedPhone) => {
          if (user) {
            submitEnquiry(user.name, user.email, updatedPhone, selectedEnquiryProperty || property);
          }
        }}
      />
    </div>
  );
};

export default PropertyDetails;
