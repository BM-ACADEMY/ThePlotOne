import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { message } from "antd";
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Target,
  MousePointerClick,
} from "lucide-react";
const illustration = "/assets/builder-hero-illustration-optimized.webp";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";
import { useNav } from "@/context/NavContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { setIsCallbackModalOpen } = useNav();

  const handlePostProperty = () => {
    if (isAuthenticated && user) {
      const {
        canPost,
        reason,
        message: limitMessage,
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
          navigate("/seller/upgrade-plan");
        }
        return;
      }

      const role =
        user?.role_id?.role_name?.toUpperCase() ||
        user?.role?.name?.toUpperCase();
      if (role === "SELLER") {
        navigate("/seller/upgrade-plan");
      } else {
        navigate("/add-property");
      }
    } else {
      navigate("/add-property");
    }
  };

  const handleGetDemo = () => {
    setIsCallbackModalOpen(true);
  };

  return (
    <section className="bg-[#fffbf7] pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        {/* Subtle Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059] rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#091E42] rounded-full blur-[100px] opacity-5 -ml-32 -mb-32"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left Column: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-100 bg-[#f6f9fa] text-[#38526e] text-[11px] font-bold tracking-tight uppercase animate-fade-in">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c19b48]" />
              For Developers & Promoters
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-[#0e182b] leading-[1.2] tracking-tight">
              Sell Your Project <span className="text-[#c19b48]">Faster</span>{" "}
              <br className="hidden md:block" />
              with Verified Buyer Leads
            </h1>

            {/* Subtitle */}
            <p className="text-base text-[#38526e] font-semibold leading-relaxed max-w-xl opacity-90">
              Complete marketing & lead generation for your project.{" "}
              <br className="hidden md:block" />
              Reach the right investors in Pondicherry today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
              <button
                onClick={handleGetDemo}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1aa554] hover:bg-[#168a44] cursor-pointer text-white text-xl font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:scale-95 group leading-none"
              >
                Get Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>

            {/* Trust Markers */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#c19b48]" />
                <span className="text-base text-[#38526e] font-bold">
                  Targeted Ads
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c19b48]" />
                <span className="text-base text-[#38526e] font-bold">
                  Fast Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div className="relative group lg:mt-0 mt-8">
            <div className="relative z-10 w-full max-w-2xl mx-auto">
              <img
                src={illustration}
                alt="Modern Project Illustration"
                className="w-full h-auto object-contain mix-blend-multiply transition-all duration-700"
              />
            </div>

            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#FFF6E9] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl opacity-50 z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
