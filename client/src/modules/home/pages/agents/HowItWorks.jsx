import React, { useState, useEffect } from 'react';
import { Upload, Users, PhoneCall, ArrowRight, ShieldCheck } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      title: "Post your property",
      description: "Submit your listings with photos and details to our high-traffic marketplace.",
      icon: <Upload className="w-6 h-6 text-[#c19b48]" />,
    },
    {
      id: "02",
      title: "Receive buyer leads",
      description: "Get direct inquiries from genuine buyers interested in your Pondicherry properties.",
      icon: <Users className="w-6 h-6 text-[#c19b48]" />,
    },
    {
      id: "03",
      title: "Call & close deals",
      description: "Connect instantly with leads, schedule visits, and close deals 3x faster.",
      icon: <PhoneCall className="w-6 h-6 text-[#c19b48]" />,
    },
  ];

  // For 2-card desktop loop: [0, 1, 2, 0]
  const displaySteps = [...steps, steps[0]];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for carousel logic
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-sliding logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % steps.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        
        {/* TOP BANNER (Background) */}
        <div className="w-full bg-[#FFF6E9] rounded-4xl pt-12 pb-32 px-8 md:px-16 flex flex-col justify-center items-center relative text-center">
          
          <div className="max-w-2xl z-10 flex flex-col items-center">
            {/* Badge Tag */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white px-4 py-1.5 rounded-full shadow-sm mb-4">
              <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
              <span className="text-[#0e182b] text-[11px] font-bold tracking-wider uppercase">
                Get More Buyers
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e182b] tracking-tight leading-[1.2]">
              How it <span className="text-[#c19b48]">Works</span>
            </h2>
          </div>

        </div>

        {/* CAROUSEL AREA (Foreground/Overlapping) */}
        <div className="relative -mt-20 z-20 w-full max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden w-full">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * (isMobile ? 100 : 50)}%)` 
              }}
            >
              {displaySteps.map((step, index) => (
                <div 
                  key={index} 
                  className="w-full md:w-1/2 shrink-0 px-4"
                >
                  <div className="bg-white rounded-2xl p-8 h-full mb-5 border border-gray-200 flex flex-col items-start text-left group transition-all duration-500 cursor-pointer">
                    
                    {/* Icon Container */}
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {React.cloneElement(step.icon, { className: 'w-6 h-6 text-[#c19b48]' })}
                    </div>

                    {/* Title with Number */}
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0e182b] mb-4 tracking-tight">
                      <span className="text-[#0e182b] opacity-90 mr-2">{step.id}.</span> 
                      {step.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-base text-[#38526e] font-medium leading-relaxed max-w-md opacity-80">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicating current slide */}
          <div className="flex justify-center gap-3 mt-12 pb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === index 
                  ? "w-8 h-2 bg-[#c19b48]" 
                  : "w-2 h-2 bg-[#c19b48] opacity-20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
