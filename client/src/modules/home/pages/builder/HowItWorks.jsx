import React, { useState, useEffect } from 'react';
import { Layout, Megaphone, Share2, CheckCircle2, ShieldCheck } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      title: "We create your project landing page",
      description: "A professional, conversion-optimized landing page designed specifically for your development.",
      icon: <Layout className="w-6 h-6 text-[#c19b48]" />,
    },
    {
      id: "02",
      title: "Run ads & generate leads",
      description: "Targeted digital marketing campaigns across Google, Meta, and local Pondicherry networks.",
      icon: <Megaphone className="w-6 h-6 text-[#c19b48]" />,
    },
    {
      id: "03",
      title: "Share leads instantly",
      description: "Buyer leads are delivered in real-time to your dashboard for immediate follow-up.",
      icon: <Share2 className="w-6 h-6 text-[#c19b48]" />,
    },
    {
      id: "04",
      title: "You close deals",
      description: "Focus on your project development while our verified leads fill your sales pipeline.",
      icon: <CheckCircle2 className="w-6 h-6 text-[#c19b48]" />,
    },
  ];

  // For carousel loop
  const displaySteps = [...steps, steps[0]];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % steps.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        
        {/* TOP BANNER */}
        <div className="w-full bg-[#FFF6E9] rounded-4xl pt-12 pb-32 px-8 md:px-16 flex flex-col justify-center items-center relative text-center">
          <div className="max-w-2xl z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white px-4 py-1.5 rounded-full shadow-sm mb-4">
              <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
              <span className="text-[#0e182b] text-[11px] font-bold tracking-wider uppercase">
                Success Process
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e182b] tracking-tight leading-[1.2]">
              Our Professional <span className="text-[#c19b48]">Workflow</span>
            </h2>
          </div>
        </div>

        {/* CAROUSEL AREA */}
        <div className="relative -mt-20 z-20 w-full max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (isMobile ? 100 : 50)}%)` }}
            >
              {displaySteps.map((step, index) => (
                <div key={index} className="w-full md:w-1/2 shrink-0 px-4">
                  <div className="bg-white rounded-2xl p-8 h-full mb-5 border border-gray-200 flex flex-col items-start text-left group transition-all duration-500 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {React.cloneElement(step.icon, { className: 'w-6 h-6 text-[#c19b48]' })}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0e182b] mb-4 tracking-tight">
                      <span className="opacity-90 mr-2">{step.id}.</span> 
                      {step.title}
                    </h3>
                    <p className="text-base text-[#38526e] font-medium leading-relaxed max-w-md opacity-80">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-12 pb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === index ? "w-8 h-2 bg-[#c19b48]" : "w-2 h-2 bg-[#c19b48] opacity-20"
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
