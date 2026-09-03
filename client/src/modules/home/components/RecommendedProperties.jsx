import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation as useRouteLocation } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { useLocation as useAppLocation } from "../../../context/LocationContext";
import PropertyCard from "./PropertyCard";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RecommendedProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, setLoginModalOpen } = useAuth();
    const { city, locality, loading: locationLoading } = useAppLocation();
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);

    const navigate = useNavigate();
    const location = useRouteLocation();

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                // 1. Try with locality first (most granular)
                let fetched = [];
                if (locality) {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/properties/fetch-all-property?isVerified=true&limit=12&location=${encodeURIComponent(locality)}`);
                    fetched = res.data.properties || res.data || [];
                }

                // 2. Fallback to city if locality results are empty
                if (fetched.length === 0 && city) {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/properties/fetch-all-property?isVerified=true&limit=12&location=${encodeURIComponent(city)}`);
                    fetched = res.data.properties || res.data || [];
                }

                // 3. Last fallback: Try without location if still empty
                if (fetched.length === 0) {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/properties/fetch-all-property?isVerified=true&limit=12`);
                    fetched = res.data.properties || res.data || [];
                }

                setProperties(fetched);
            } catch (error) {
                console.error("Error fetching recommended properties", error);
            } finally {
                setLoading(false);
            }
        };

        if (!locationLoading) {
            fetchProperties();
        }
    }, [city, locality, locationLoading]);

    const handleWhatsAppClick = (e, property) => {
        e.stopPropagation();
        if (!property || !property.seller) return;

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
        const rawPhone = (property.seller.phone || "").toString().replace(/\D/g, "");
        const sellerPhone = rawPhone.length === 10
            ? `91${rawPhone}`
            : rawPhone.length === 12 && rawPhone.startsWith("91")
                ? rawPhone
                : rawPhone || "919000000000";

        const locationStr =
            typeof property.location === "string"
                ? property.location
                : `${property.location?.city || ""}, ${property.location?.state || ""}`;
        const message = `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${locationStr}. Please provide more details.`;
        const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

        try {
            await api.post("/enquiries/create", {
                property_id: property._id,
                seller_id: property.seller._id,
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

    if (loading || locationLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[4/3] bg-gray-100 animate-pulse rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (properties.length === 0) {
        return null;
    }

    const searchLocation = locality || city;
    const hasNoLocalMatches = searchLocation && !properties.some(p =>
        (p.location?.city?.toLowerCase().includes(searchLocation.toLowerCase())) ||
        (p.location?.locality?.toLowerCase().includes(searchLocation.toLowerCase()))
    );

    return (
        <section className="py-8 md:py-16">
            <div className="mx-auto max-w-[1400px] px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="mb-6">
                            <h2 className="text-[28px] font-bold text-[#1E293B]">
                                {hasNoLocalMatches ? "Recommended for You" : (
                                    <>Recommended In <span className="text-[#166aa8] font-semibold">{searchLocation}</span></>
                                )}
                            </h2>
                            <p className="text-[15px] text-[#64748B] mt-1">
                                {hasNoLocalMatches
                                    ? "Handpicked properties for you since we couldn't find matches in your exact area."
                                    : `Explore the best deals currently available in ${searchLocation}.`
                                }
                            </p>
                        </div>

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
                            el: ".rec-pagination"
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
                        {properties.map((property) => (
                            <SwiperSlide key={property._id}>
                                <div className="h-full">
                                    <PropertyCard
                                        property={property}
                                        onWhatsAppClick={handleWhatsAppClick}
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Mobile/Tablet Pagination Container */}
                    {/* <div className="rec-pagination flex justify-center mt-4"></div> */}
                </div>

                {/* <div className="mt-8 text-center flex justify-center">
                    <Link
                        to={`/properties?location=${encodeURIComponent(city || "Pondicherry")}`}
                        className="hidden md:flex items-center text-gray-900 font-semibold hover:text-[#166aa8] transition"
                    >
                        View All in {city || "Pondicherry"}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div> */}
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
        </section>
    );
};

export default RecommendedProperties;
