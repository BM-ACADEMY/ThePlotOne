import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNav } from "../../../context/NavContext";
import PropertyCard from "./PropertyCard";
import PhoneUpdateModal from "../../../components/Common/PhoneUpdateModal";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const BuilderPromoterProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, setLoginModalOpen } = useAuth();
    const { businessTypes } = useNav();
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);

    const builderType = businessTypes?.find(t =>
        t.name?.toLowerCase().includes("builder") ||
        t.name?.toLowerCase().includes("promoter")
    );

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                let url = `${import.meta.env.VITE_API_URL}/properties/fetch-all-property?isVerified=true&limit=12`;

                if (builderType) {
                    url += `&businessType=${builderType._id}`;
                }

                const res = await axios.get(url);
                if (Array.isArray(res.data.properties)) {
                    setProperties(res.data.properties);
                } else if (Array.isArray(res.data)) {
                    setProperties(res.data);
                }
            } catch (error) {
                console.error("Error fetching properties", error);
            } finally {
                setLoading(false);
            }
        };
        if (businessTypes?.length > 0) {
            fetchProperties();
        }
    }, [businessTypes, builderType]);

    const navigate = useNavigate();
    const location = useLocation();

    const handleWhatsAppClick = (e, property) => {
        e.stopPropagation();
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
            setLoginModalOpen(true);
        }
    };

    const submitEnquiry = async (property, name, email, phone) => {
        const sellerPhone = property.seller.phone;
        const locationStr =
            typeof property.location === "string"
                ? property.location
                : `${property.location?.city || ""}, ${property.location?.state || ""}`;
        const message = `Hi, I am interested in your property: ${property.basicInfo?.title || "Untitled"} located at ${locationStr}. Please provide more details.`;
        const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/enquiries/create`, {
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
            console.error(error);
            const errMsg = error.response?.data?.error || "Failed to submit enquiry";
            toast.error(errMsg);
        }
    };

    if (loading)
        return (
            <div className="text-center py-20 text-gray-500">
                Loading Builder Properties...
            </div>
        );

    const viewAllUrl = builderType ? `/properties?businessType=${builderType._id}` : "/properties";

    return (
        <section className="py-10">
            <div className=" mx-auto max-w-[1400px] px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="mb-6">
                            <h2 className="text-[28px] font-bold text-[#1E293B]">Builder & Promoters</h2>
                            <p className="text-[15px] text-[#64748B] mt-1">Explore exclusive properties from top builders and promoters.</p>
                        </div>
                    </div>
                    <Link
                        to={viewAllUrl}
                        className="hidden md:flex items-center text-gray-900 font-semibold hover:text-[#166aa8] transition"
                    >
                        View All Properties <ArrowRight className="w-5 h-5 ml-1" />
                    </Link>
                </div>

                <div className="relative group/carousel">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        navigation={{
                            prevEl: ".prev-builder-property",
                            nextEl: ".next-builder-property",
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2, spaceBetween: 24 },
                            1024: { slidesPerView: 3, spaceBetween: 30 },
                            1280: { slidesPerView: 4, spaceBetween: 30 },
                        }}
                        className="!px-1"
                    >
                        {properties.map((property) => (
                            <SwiperSlide key={property._id} className="h-auto">
                                <PropertyCard
                                    property={property}
                                    onWhatsAppClick={handleWhatsAppClick}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button className="prev-builder-property absolute left-[-20px] top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover/carousel:opacity-100 hidden xl:flex cursor-pointer">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button className="next-builder-property absolute right-[-20px] top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover/carousel:opacity-100 hidden xl:flex cursor-pointer">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="mt-8 text-center font-serif md:hidden">
                    <Link
                        to={viewAllUrl}
                        className="inline-flex items-center text-gray-900 font-semibold hover:text-[#166aa8]"
                    >
                        View All Properties <ArrowRight className="w-5 h-5 ml-1" />
                    </Link>
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
        </section>
    );
};

export default BuilderPromoterProperties;
