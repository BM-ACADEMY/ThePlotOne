import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useNav } from "@/context/NavContext";
import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from "@/utils/imageUrl";

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import PostRequirementCard from "./PostRequirementCard";

const PropertyTypeList = () => {
  const navigate = useNavigate();
  const { propertyTypes, isLoading: loading } = useNav();
  const { isAuthenticated, setLoginModalOpen } = useAuth();
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // 🏠 Visit Count Tracker (Once per session)
    const storedCount = parseInt(localStorage.getItem("site_visits")) || 0;
    const sessionCounted = sessionStorage.getItem("visit_counted");

    if (!sessionCounted) {
      const newCount = storedCount + 1;
      localStorage.setItem("site_visits", newCount);
      sessionStorage.setItem("visit_counted", "true");
      setVisitCount(newCount);
    } else {
      setVisitCount(storedCount);
    }
  }, []);

  // Matched exactly to the subtle pastels in your second reference image
  const bgColors = [
    "bg-[#F0FDF4]", // Subtle Mint (like Builder Floor)
    "bg-[#FFFBEB]", // Subtle Cream (like Commercial Other)
    "bg-[#FAF5FF]", // Subtle Lilac (like Commercial Plot)
    "bg-[#F0F9FF]", // Subtle Sky Blue
  ];

  // Helper function to get details and images based on type name
  const getCardDetails = (type) => {
    const typeName = typeof type === "string" ? type : type.name || "";

    const details = {
      image: "/dummyimg/dummy.png",
      description: "Discover exceptional properties that match your vision.",
      ctaText: `Explore ${typeName}`,
    };

    // Priority: 1. Backend imageUrl, 2. Default placeholder
    if (typeof type === "object" && type.imageUrl) {
      details.image = getImageUrl(type.imageUrl);
    }

    return details;
  };

  // Map property types from NavContext and assign a background color
  const types = (propertyTypes || []).map((type, index) => {
    const name = typeof type === "string" ? type : type.name || "";
    return {
      originalType: name,
      title: name,
      bgColor: bgColors[index % bgColors.length],
      ...getCardDetails(type),
    };
  });

  return (
    <section className="pt-12 md:pt-16 pb-10 bg-white font-sans overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1450px] flex flex-col lg:flex-row gap-10">
        {/* Left Section: Main Content */}
        <div className="flex-1 w-full overflow-visible min-w-0">
          <div className="mb-6 md:pt-15 pt-1">
            <h2 className="text-[28px] font-bold text-[#1E293B]">
              Explore Properties
            </h2>
            <p className="text-[15px] text-[#64748B] mt-1">
              Discover exceptional properties and landscapes
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-2xl flex h-[300px] animate-pulse overflow-hidden"
                ></div>
              ))}
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg font-light">
                No property types found at this moment.
              </p>
            </div>
          ) : (
            <div className="relative group/slider w-full">
              {/* Custom Navigation */}
              <button className="swiper-prev-btn absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 rounded-full transition hover:scale-105 hover:text-blue-600 disabled:opacity-0 disabled:pointer-events-none hidden md:flex cursor-pointer text-[#475569]">
                <ChevronLeft className="w-6 h-6 ml-[-2px]" />
              </button>
              <button className="swiper-next-btn absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 rounded-full transition hover:scale-105 hover:text-blue-600 disabled:opacity-0 disabled:pointer-events-none hidden md:flex cursor-pointer text-[#475569]">
                <ChevronRight className="w-6 h-6 mr-[-2px]" />
              </button>

              {/* Swiper Implementation */}
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                navigation={{
                  prevEl: ".swiper-prev-btn",
                  nextEl: ".swiper-next-btn",
                }}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                watchOverflow={true}
                breakpoints={{
                  540: { slidesPerView: 2, spaceBetween: 24 },
                  768: { slidesPerView: 2, spaceBetween: 24 },
                  1024: { slidesPerView: 2, spaceBetween: 30 },
                  1280: { slidesPerView: 3, spaceBetween: 30 },
                }}
                className="py-6 px-1"
              >
                {types.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div
                      onClick={() =>
                        navigate(
                          `/properties?type=${encodeURIComponent(item.originalType)}`,
                        )
                      }
                      // ⬇️ FIXED: Responsive height so it doesn't stay stuck at 400px on small screens
                      className={`relative flex flex-col h-[240px] sm:h-[280px] lg:h-[320px] rounded-[24px] overflow-hidden cursor-pointer group shadow-sm transition-all duration-300 border border-gray-200 ${item.bgColor}`}
                    >
                      {/* Full-Height Image */}
                      <div className="absolute inset-0 w-full h-full">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = "/dummyimg/dummy.png";
                          }}
                        />
                      </div>

                      {/* Overlay Content */}
                      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-white/90 via-white/40 to-transparent flex flex-col justify-start p-6 h-1/2">
                        <h3 className="text-[21px] font-bold text-[#1E293B] leading-[1.2] transition-colors relative z-10">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>

        {/* Right Section: Sidebar */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6 lg:mt-29.5">
          {/* Activity Widget - Only for guests */}
          {!isAuthenticated && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">
                Your Recent Activity
              </p>

              <div className="bg-orange-50/70 rounded-lg p-4 mb-4 flex justify-between items-start border border-orange-100">
                <div>
                  <span className="text-2xl font-bold block text-slate-800">
                    {visitCount}
                  </span>
                  <span className="text-sm text-slate-600">Viewed</span>
                </div>
                <span className="text-orange-400 text-lg leading-none">
                  <Activity size={18} />
                </span>
              </div>

              <button
                onClick={() => setLoginModalOpen(true)}
                className="w-full bg-[#166aa8] hover:bg-[#0078d7] text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Login/Register to Save Activity
              </button>
              <p className="text-[10px] text-center text-[#64748B] mt-3">
                & see your activities across browsers & devices...
              </p>
            </div>
          )}

          {/* Post by Requirement */}
          <PostRequirementCard />

          {/* Promo Widget - At Bottom */}
          <div className="mt-auto">
            <div className="bg-[#e6f4ea] rounded-xl p-5 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
              <div className="relative z-10 w-2/3">
                <h3 className="font-bold text-[#1E293B] leading-tight mb-1 text-lg">
                  Find the Best Deal for Your Property!
                </h3>
                <p className="text-sm text-[#475569] mb-4">
                  List your property today
                </p>
                <button
                  onClick={() => navigate("/post-property")}
                  className="bg-[#166aa8] hover:bg-[#0078d7] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Post Property – It's FREE
                </button>
              </div>

              {/* Agent Image */}
              <div
                // ⬇️ FIXED: Added responsive minimum widths so the agent image never disappears completely
                className="absolute bottom-0 right-0 w-[40%] min-w-[100px] sm:min-w-[120px] h-[95%] bg-contain bg-no-repeat bg-bottom"
                style={{ backgroundImage: "url(./properties/adsman.webp)" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyTypeList;
