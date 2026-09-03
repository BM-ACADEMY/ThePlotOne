import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { message } from "antd";
import { Building2, Users, BarChart3, Plus, ShieldCheck } from "lucide-react";
const illustration = "/assets/agent-hero-illustration-optimized.webp";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handlePostProperty = () => {
    if (isAuthenticated && user) {
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

  return (
    <section className="bg-[#fffbf7] py-6 lg:py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden">
      <div className="mt-10 max-w-350 mx-auto relative overflow-hidden">
        {/* Subtle Background Decorative Bubble */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-20 -mt-20 blur-3xl opacity-60"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start p-6 lg:py-16 lg:px-10 relative z-10">
          {/* Left Column: Illustration Area */}
          <div className="relative w-full flex items-start justify-center order-1 lg:pr-8">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
              <img
                src={illustration}
                alt="Professional Agent Illustration"
                className="w-full h-auto object-contain mix-blend-multiply"
              />
            </div>
          </div>

          {/* Right Column: Text & Call to Action */}
          <div className="space-y-6 lg:pl-24 order-2">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-100 bg-[#f6f9fa] text-[#38526e] text-[11px] font-bold tracking-tight uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c19b48]" />
              Exclusive for Pondicherry Brokers
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-[#0e182b] leading-[1.2] tracking-tight">
              Get <span className="text-[#c19b48]">Genuine</span> Buyers{" "}
              <br className="hidden sm:block" />
              for Your Properties in <br className="hidden sm:block" />
              Pondicherry
            </h1>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-[#f6f9fa] flex items-center justify-center border border-gray-100">
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#c19b48]" />
                    <Plus className="w-2.5 h-2.5 text-[#1aa554] absolute -bottom-0.5 -right-0.5 bg-white rounded-full font-bold" />
                  </div>
                </div>
                <p className="text-base text-[#38526e] font-semibold leading-relaxed">
                  Get direct buyer inquiries and close{" "}
                  <br className="hidden lg:block" />
                  your property deals 3x faster.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-[#f6f9fa] flex items-center justify-center border border-gray-100">
                  <Users className="w-4 h-4 text-[#c19b48]" />
                </div>
                <p className="text-base text-[#38526e] font-semibold leading-relaxed">
                  Get Genuine Buyer Leads
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-[#f6f9fa] flex items-center justify-center border border-gray-100">
                  <BarChart3 className="w-4 h-4 text-[#c19b48]" />
                </div>
                <p className="text-base text-[#38526e] font-semibold leading-relaxed">
                  Close deals 3x faster.
                </p>
              </div>
            </div>

            {/* CTA Button Block */}
            <div className="pt-2 space-y-3">
              <button
                onClick={handlePostProperty}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1aa554] hover:bg-[#168a44] cursor-pointer text-white text-xl font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:scale-95 leading-none"
              >
                Get Buyers Now - Post FREE
              </button>
              <div className="text-[#38526e] font-bold text-base flex items-center gap-2">
                Get More Buyers Today
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
