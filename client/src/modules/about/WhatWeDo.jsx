import React from 'react';
import {
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const WhatWeDo = () => {
  const services = [
    {
      title: "Residential Plots",
      sub: "For Sale in Pondicherry",
      icon: <EnvironmentOutlined />,
      img: "/about/plot.webp"
    },
    {
      title: "Commercial Properties",
      sub: "Business Spaces",
      icon: <BankOutlined />,
      img: "/about/commercial.webp"
    },
    {
      title: "Investment Properties",
      sub: "High Value Assets",
      icon: <RiseOutlined />,
      img: "/about/investment.webp"
    },
    {
      title: "Property Selling Assistance",
      sub: "End-to-End Support",
      icon: <SafetyCertificateOutlined />,
      img: "/about/propperty.webp"
    },
  ];

  return (
    <div className="w-full bg-gray-50 py-24 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#050B14 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <div className="max-w-2xl flex-1">
            <div className="mb-6">
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs border border-[#D4AF37]/30 px-4 py-2 rounded-full bg-white shadow-sm">
                Our Expertise
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-[#050B14] mb-6">
              What We Do
            </h2>

            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              At The Plot One, we specialize in delivering safe, secure, and legally verified real estate opportunities for our clients.
            </p>

            <button className="flex items-center gap-3 bg-[#D4AF37] text-[white] font-bold py-4 px-8 rounded-lg hover:bg-[#050B14] hover:text-white transition-all duration-300 shadow-lg group">
              <span>Contact Us</span>
              <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-md">
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#D4AF37] p-8 rounded-r-xl shadow-md h-full flex flex-col justify-center">
              <p className="text-[#050B14] text-lg font-medium italic mb-4 leading-relaxed">
                "Every property listed with us is carefully verified to ensure proper documentation and clear ownership."
              </p>
              <div className="flex items-center gap-3 text-gray-500 text-sm font-semibold uppercase tracking-wider">
                <SafetyCertificateOutlined className="text-[#D4AF37] text-xl" />
                100% Verified Properties
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group bg-white border border-gray-200 p-8 rounded-3xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full relative overflow-hidden flex flex-col min-h-[320px]"
            >
              {/* Card Content */}
              <div className="relative z-20">
                <div className="w-14 h-14 bg-orange-50/50 rounded-2xl flex items-center justify-center text-2xl text-[#D4AF37] mb-6 shadow-sm border border-orange-100/50">
                  {service.icon}
                </div>

                <h3 className="text-xl font-bold text-[#050B14] mb-2 leading-tight">
                  {service.title}
                </h3>

                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                  {service.sub}
                </p>
              </div>

              {/* Illustration */}
              {service.img && (
                <div className="absolute bottom-0 right-0 w-3/4 h-1/2 mix-blend-multiply pointer-events-none z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  <img
                    src={service.img}
                    alt={service.title}
                    className="w-full h-full object-contain object-bottom"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatWeDo;