import React from 'react';
import { ShieldCheck, Eye, Users, Zap } from 'lucide-react';

const AdditionalBenefitsInfo = () => {
    const benefits = [
        {
            id: 1,
            title: "Verified Property Listings",
            description: "Your property appears on a trusted platform that buyers rely on for authentic real estate opportunities.",
            icon: <ShieldCheck className="w-6 h-6 text-[#0B2149]" strokeWidth={2.5} />
        },
        {
            id: 2,
            title: "Maximum Visibility",
            description: "Your listing is systematically shown to thousands of individuals actively searching for properties daily.",
            icon: <Eye className="w-6 h-6 text-[#0B2149]" strokeWidth={2.5} />
        },
        {
            id: 3,
            title: "Direct Buyer Contact",
            description: "Facilitates transparent communication by allowing buyers to contact you directly without intermediaries.",
            icon: <Users className="w-6 h-6 text-[#0B2149]" strokeWidth={2.5} />
        },
        {
            id: 4,
            title: "Fast Property Exposure",
            description: "Your property goes live instantly upon submission, immediately opening the channel for incoming enquiries.",
            icon: <Zap className="w-6 h-6 text-[#0B2149]" strokeWidth={2.5} />
        }
    ];

    return (
        <section className="bg-white py-20 px-4 font-sans border-t border-slate-50" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="mb-16 border-b border-slate-50 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <p className="text-[13px] font-bold text-[#8A94A5] uppercase tracking-wider mb-3">
                            PLATFORM FEATURES
                        </p>
                        <h2 className="text-3xl md:text-[40px] font-bold text-[#0B2149] leading-tight max-w-2xl">
                            Listing Advantages
                        </h2>
                    </div>

                    {/* Dark Navy CTA Button */}
                    <button
                        onClick={() => document.getElementById('post-property-landing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-[#0B2149] hover:bg-[#1a2b4b] text-white text-[15px] font-bold py-4 px-10 rounded-full transition-all duration-300 w-fit shadow-lg hover:shadow-xl hover:-translate-y-1 transform cursor-pointer"
                    >
                        List My Property
                    </button>
                </div>

                {/* Structured Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    {benefits.map((benefit) => (
                        <div
                            key={benefit.id}
                            className="flex items-start gap-6 group"
                        >
                            {/* Soft Green Icon Container */}
                            <div className="flex-shrink-0 w-14 h-14 bg-[#eef7f0] rounded-[12px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                                {benefit.icon}
                            </div>

                            {/* Text Content */}
                            <div>
                                <h3 className="text-[20px] font-semibold text-[#0B2149] leading-tight mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-[16px] text-[#5C687B] leading-[1.65] font-normal">
                                    {benefit.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default AdditionalBenefitsInfo;