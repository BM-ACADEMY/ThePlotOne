import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { message } from "antd";
import {
  ShieldCheck,
  Users,
  MapPin,
  Camera,
  MousePointerClick,
} from "lucide-react";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";
const siteVisit1 = "/assets/site_visit_1-optimized.webp";
const siteVisit2 = "/assets/site_visit_2.webp";

const ProofSection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handlePostProperty = () => {
    if (isAuthenticated && user) {
      const {
        canPost,
        reason,
        message: limitMessage,
        redirectPath,
      } = checkPropertyListingLimit(user);

      if (!canPost) {
        message.warning({
          content: limitMessage,
          key: "verification-restricted",
        });

        if (reason === "unverified") {
          const role =
            user?.role_id?.role_name?.toUpperCase() ||
            user?.role?.name?.toUpperCase();
          if (role === "SELLER") {
            navigate("/seller/profile");
          } else {
            navigate("/user/profile");
          }
        } else if (reason === "limit_reached") {
          navigate(redirectPath || "/seller/upgrade-plan");
        }
        return;
      }

      const role =
        user?.role_id?.role_name?.toUpperCase() ||
        user?.role?.name?.toUpperCase();
      if (role === "ADMIN") {
        navigate("/admin/properties/add");
      } else if (role === "SELLER") {
        navigate("/seller/add-property");
      } else {
        navigate("/add-property");
      }
    } else {
      navigate("/post-property");
    }
  };

  const images = [
    { src: siteVisit1, label: "White Town Villa Inspection" },
    { src: siteVisit2, label: "Buyer Consultation - ECR Road" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header Badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 px-4 py-1.5 rounded-full shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
            <span className="text-[#0e182b] text-[11px] font-bold tracking-wider uppercase">
              Trust & Results
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Metric & Local Proof */}
          <div className="flex flex-col gap-8">
            {/* 100+ Buyers Card */}
            <div className="bg-[#091E42] rounded-4xl p-10 text-white flex flex-col justify-center items-center text-center shadow-xl shadow-[#091E42]/10 relative overflow-hidden group h-full min-h-75">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24" />
              </div>
              <h3 className="text-5xl md:text-6xl font-extrabold text-[#c5a059] mb-4">
                100+
              </h3>
              <p className="text-xl font-semibold opacity-90">
                Buyers Connected
              </p>
              <p className="text-sm mt-4 opacity-60 max-w-62.5">
                Genuine inquiries delivered to Pondicherry agents this month
                alone.
              </p>
            </div>

            {/* Local Platform Card */}
            <div className="bg-[#FFF6E9] rounded-4xl p-8 flex items-center gap-6 border border-[#fdf3e7]">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <MapPin className="w-8 h-8 text-[#c19b48]" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#0e182b]">
                  Local Pondy Platform
                </h4>
                <p className="text-[#38526e] text-sm font-medium opacity-80 mt-1">
                  Deeply rooted in the Pondicherry market, connecting locals and
                  investors.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Photo Carousel */}
          <div className="relative group">
            <div className="bg-gray-50 rounded-4xl p-4 h-full border border-gray-100 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2">
                <Camera className="w-4 h-4 text-[#c19b48]" />
                <span className="text-[11px] font-bold text-[#0e182b] uppercase tracking-widest opacity-60">
                  Site Visit Gallery
                </span>
              </div>

              {/* Image Slider Container */}
              <div className="relative h-full min-h-87.5 overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-700 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <div key={i} className="min-w-full h-full relative">
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <p className="absolute bottom-6 left-6 text-white text-sm font-semibold tracking-wide">
                        {img.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 pb-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIndex === i
                        ? "w-6 bg-[#c19b48]"
                        : "w-2 bg-[#c19b48] opacity-20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Added CTA Button at the bottom */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <button
            onClick={handlePostProperty}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1aa554] hover:bg-[#168a44] cursor-pointer text-white text-xl font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:scale-95 leading-none flex items-center gap-2"
          >
            <MousePointerClick className="w-6 h-6" />
            Get Buyers Now - Post FREE
          </button>
          <p className="text-[#38526e] font-bold text-base flex items-center gap-2">
            Join 100+ Pondicherry Agents Today!
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProofSection;
