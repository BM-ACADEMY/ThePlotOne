import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { message, Spin } from 'antd';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const DealerPlanBanner = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/subscriptions/plans?allPlans=true");
        // Filter plans for Agents
        const agentPlans = res.data.filter(p => 
          p.businessType?.name?.toLowerCase().includes("agent")
        );

        // Map to the structure we need
        const formattedPlans = agentPlans.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          duration: p.duration,
          features: p.features || [],
          notIncluded: p.notIncluded || [],
          isPopular: p.isPopular || false
        }));

        // Add static free plan if not present (REMOVED AS PER USER REQUEST)
        /*
        if (!formattedPlans.some(p => p.price === 0)) {
          formattedPlans.unshift({
            id: 'static_free',
            name: "Free",
            price: 0,
            duration: "Forever",
            features: ["3 Listings included", "Basic visibility"],
            notIncluded: ["No leads"],
            isPopular: false
          });
        }
        */

        setPlans(formattedPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        // Fallback to empty if API fails (REMOVED STATIC FREE FALLBACK)
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanClick = (e) => {
    if (e) e.preventDefault();
    if (isAuthenticated && user) {
      const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
      if (role === "ADMIN") {
        // Admin should not go anywhere from public pricing buttons
        return;
      }
      if (role === "SELLER") {
        navigate("/seller/upgrade-plan");
      } else {
        navigate("/add-property");
      }
    } else {
      navigate("/add-property");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-white p-4 font-sans">
      
      {/* Main Container */}
      <div className="relative w-full max-w-6xl flex flex-col py-12">
        
        {/* TOP BANNER (Background) */}
        <div className="w-full bg-[#FFF6E9] rounded-[32px] pt-12 pb-32 px-8 md:px-16 flex flex-col justify-center items-center relative text-center">
          
          <div className="max-w-2xl z-10 flex flex-col items-center">
            {/* Badge Tag */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white px-4 py-1.5 rounded-full shadow-sm mb-4">
              <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
              <span className="text-[#091E42] text-[11px] font-bold tracking-wider uppercase">
                Dealer Plans
              </span>
            </div>
            
            <h1 className="text-[32px] sm:text-4xl font-bold text-[#091E42] leading-[1.2]">
              Pick a plan to sell properties faster
            </h1>
          </div>

        </div>

        {/* SLIDE SHOW (Foreground/Overlapping) */}
        <div className="relative w-full px-4 md:px-8 -mt-20 z-20 group/carousel">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              prevEl: '.prev-plan',
              nextEl: '.next-plan',
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            className="!pb-12 !pt-6 !overflow-visible"
          >
            {plans.map((plan) => (
              <SwiperSlide key={plan.id} className="!h-auto flex">
                <div 
                  className={`bg-white border ${plan.isPopular ? 'border-[#c5a059] shadow-[0_12px_32px_rgba(197,160,89,0.15)]' : 'border-[#0078DB] shadow-[0_8px_24px_rgba(0,0,0,0.08)]'} rounded w-full p-6 flex flex-col relative cursor-pointer group h-full`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c5a059] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-50 shadow-md whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  {/* Top Icon Area */}
                  <div className="mb-5">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 38V22L24 12L38 22V38H10Z" fill={plan.price === 0 ? "#F4B459" : plan.price < 2000 ? "#36B37E" : "#8777D9"}/>
                      <path d="M28 38V26H38V38H28Z" fill="#0078DB"/>
                      <circle cx="24" cy="18" r="4" fill="white"/>
                      <circle cx="24" cy="18" r="2" fill="#0078DB"/>
                      <path d="M14 18C14 18 19 12 24 12C29 12 34 18 34 18" stroke="#D1E4F9" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Title & Subtitle */}
                  <h2 className="text-[22px] font-bold text-[#091E42] mb-1">{plan.name}</h2>
                  <p className="text-[13px] text-[#5E6D82] leading-snug mb-6 h-10">
                    {plan.price === 0 ? "Basic plan to get started." : "Professional plan for better reach."}
                  </p>

                  {/* Pricing Info */}
                  <div className="mb-4">
                    <p className="text-[13px] text-[#091E42] font-medium uppercase tracking-wide">
                      {plan.price === 0 ? "3 Listings" : `${plan.duration} Days Plan`}
                    </p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-[26px] font-bold text-[#091E42]">₹{plan.price}</span>
                      <span className="text-[11px] text-[#8B95A5] font-bold lowercase">
                        {plan.price === 0 ? "/ Forever" : `/ ${plan.duration} Days`}
                      </span>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="mb-5 mt-4 flex-grow">
                    {plan.features?.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-[#091E42] uppercase tracking-wider mb-2">Included</p>
                        <ul className="space-y-3.5 mb-4">
                          {plan.features.map((feature, idx) => (
                            <BenefitItem key={idx} text={feature} iconType={idx === 0 ? "listings" : idx === 1 ? "visibility" : "placement"} />
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {plan.notIncluded?.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-[#8B95A5] uppercase tracking-wider mb-2 mt-4 border-t border-gray-100 pt-3">Not Included</p>
                        <ul className="space-y-3.5">
                          {plan.notIncluded.map((feature, idx) => (
                            <BenefitItem key={idx} text={feature} isNegative />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={handlePlanClick}
                    className={`w-full ${plan.isPopular ? 'bg-[#c5a059]' : 'bg-[#091E42]'} text-white py-3 rounded-[4px] font-semibold text-[14px] mb-2 hover:opacity-90 cursor-pointer transition duration-200 mt-auto`}
                  >
                    {plan.price === 0 ? "Get Started" : `Choose ${plan.name}`}
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <button className="prev-plan absolute left-[-20px] lg:left-0 top-[60%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#c5a059] hover:border-[#c5a059] transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="next-plan absolute right-[-20px] lg:right-0 top-[60%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#c5a059] hover:border-[#c5a059] transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Benefit Item Component to keep code DRY
const BenefitItem = ({ text, hasInfo, isNegative, iconType }) => {
  const getIcon = () => {
    const colorClass = isNegative ? 'text-red-500' : 'text-[#c5a059]';
    switch (iconType) {
      case 'listings':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
      case 'visibility':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        );
      case 'leads':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
      case 'placement':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
          </svg>
        );
      default:
        return isNegative ? (
          <span className="text-red-500 text-[10px] font-bold">✕</span>
        ) : (
          <svg className="w-2.5 h-2.5 text-[#c5a059]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        );
    }
  };

  return (
    <li className="flex items-center text-[13px] text-[#091E42]">
      <div className={`${isNegative ? 'bg-red-50' : 'bg-gray-50'} rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0`}>
        {getIcon()}
      </div>
      <span className={isNegative ? 'text-[#8B95A5]' : ''}>{text}</span>
      {hasInfo && <InfoIcon className="w-[14px] h-[14px] text-[#A0AABF] ml-auto shrink-0 cursor-pointer" />}
    </li>
  );
};

// Reusable Info SVG Icon
const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

export default DealerPlanBanner;