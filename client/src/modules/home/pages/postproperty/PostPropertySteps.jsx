import React from 'react';
import { FileText, Camera, Home } from 'lucide-react';

const PostPropertySteps = () => {
    const steps = [
        {
            id: "01",
            title: "Add details of your property",
            description: "Begin by telling us the few basic details about your property like your property type, location, No. of rooms etc.",
            icon: (
                <div className="w-16 h-16 bg-[#eef7f0] rounded-[12px] flex items-center justify-center text-[#0B2149]">
                    <FileText className="w-8 h-8" strokeWidth={2.5} />
                </div>
            )
        },
        {
            id: "02",
            title: "Upload Photos & Videos",
            description: "Upload photos and videos of your property either via your desktop device or from your mobile phone.",
            icon: (
                <div className="w-16 h-16 bg-[#eef7f0] rounded-[12px] flex items-center justify-center text-[#0B2149]">
                    <Camera className="w-8 h-8" strokeWidth={2.5} />
                </div>
            )
        },
        {
            id: "03",
            title: "Add Pricing & Ownership",
            description: "Just update your property's ownership details and your expected price and your property is ready for posting.",
            icon: (
                <div className="w-16 h-16 bg-[#eef7f0] rounded-[12px] flex items-center justify-center text-[#0B2149]">
                    <Home className="w-8 h-8" strokeWidth={2.5} />
                </div>
            )
        }
    ];

    return (
        <section className="bg-white py-20 px-4 font-sans border-t border-slate-50" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-16">
                    <p className="text-[13px] font-bold text-[#8A94A5] uppercase tracking-wider mb-3">
                        HOW TO POST
                    </p>
                    <h2 className="text-3xl md:text-[40px] font-bold text-[#0B2149] leading-tight">
                        Post Your Property in 3 Simple Steps
                    </h2>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-20">
                    {steps.map((step) => (
                        <div key={step.id} className="group flex flex-col items-center text-center">
                            {/* Icon Container - Soft Green background with Navy Icon */}
                            <div className="mb-8 transform group-hover:scale-110 transition-transform duration-300">
                                {step.icon}
                            </div>

                            {/* Standardized Title */}
                            <h3 className="text-[20px] font-semibold text-[#0B2149] mb-3 flex items-center justify-center leading-tight">
                                <span className="text-[#0B2149] mr-2 text-[20px] font-bold">{step.id}.</span> {step.title}
                            </h3>

                            {/* Standardized Description */}
                            <p className="text-[16px] text-[#5C687B] leading-[1.65] font-normal max-w-[280px]">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Call to Action Button */}
                <div className="flex justify-center">
                    <button
                        onClick={() => document.getElementById('post-property-landing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-[#0B2149] hover:bg-[#1a2b4b] text-white text-[15px] font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform cursor-pointer"
                    >
                        Begin to Post your Property
                    </button>
                </div>

            </div>
        </section>
    );
};

export default PostPropertySteps;