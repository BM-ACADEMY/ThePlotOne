import React from 'react';
import { Check } from 'lucide-react';

const WhyPostProperty = () => {
    const benefits = [
        "Advertise your property for FREE",
        "Get genuine buyer & tenant enquiries",
        "Reach local and NRI property seekers",
        "Easy listing with simple steps",
        "Direct contact with interested buyers"
    ];

    return (
        <section className="bg-white py-20 px-4 font-sans border-t border-slate-50" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                {/* Left Column: Text Content & CTA */}
                <div className="flex-1 w-full text-center lg:text-left">
                    {/* Standardized Label */}
                    <p className="text-[13px] font-bold text-[#8A94A5] uppercase tracking-wider mb-3">
                        WHY THE PLOT ONE
                    </p>
                    
                    {/* Standardized H2 */}
                    <h2 className="text-3xl md:text-[40px] font-bold text-[#0B2149] leading-tight mb-8">
                        Post Your Property & Connect With <span className="text-[#c19b48]">Genuine Buyers</span>
                    </h2>
                    
                    {/* Standardized Body Text */}
                    <p className="text-[16px] text-[#5C687B] leading-[1.65] font-normal mb-6">
                        List your property on The Plot One and reach thousands of active buyers and tenants searching for homes, plots, and commercial spaces in Pondicherry.
                    </p>
                    <p className="text-[16px] text-[#5C687B] leading-[1.65] font-normal mb-10">
                        Our platform helps property owners, agents, and builders showcase listings with maximum visibility and receive verified enquiries.
                    </p>

                    {/* Standardized Navy CTA Button */}
                    <button
                        onClick={() => document.getElementById('post-property-landing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-[#0B2149] hover:bg-[#1a2b4b] text-white text-[15px] font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform w-full sm:w-auto cursor-pointer"
                    >
                        Post Your Property Now
                    </button>
                </div>

                {/* Right Column: Key Benefits Card */}
                <div className="w-full lg:w-[500px] flex-shrink-0">
                    {/* Matched Card Styling (border-gray-200 and rounded-[12px]) */}
                    <div className="bg-white border border-gray-200 rounded-[12px] p-8 md:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        
                        {/* Standardized Card Heading */}
                        <h3 className="text-[20px] font-semibold text-[#0B2149] mb-8 pb-4 border-b border-gray-200 leading-tight">
                            Key Benefits
                        </h3>

                        <ul className="flex flex-col gap-6">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center group">
                                    {/* Kept Soft Green for Checkmarks (No Blue) */}
                                    <div className="w-8 h-8 bg-[#eef7f0] rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-[#1aa554]">
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </div>
                                    
                                    {/* Standardized List Text */}
                                    <span className="text-[16px] text-[#5C687B] font-normal group-hover:text-[#0B2149] transition-colors leading-[1.65]">
                                        {benefit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default WhyPostProperty;