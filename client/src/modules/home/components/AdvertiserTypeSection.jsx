import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { useNav } from "../../../context/NavContext";
import { slugify } from "../../../utils/slugify";

const AdvertiserTypeSection = () => {
    const navigate = useNavigate();
    const { businessTypes = [] } = useNav();

    useEffect(() => {
        const fontLinkId = "google-font-outfit";
        if (!document.getElementById(fontLinkId)) {
            const link = document.createElement("link");
            link.id = fontLinkId;
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";
            document.head.appendChild(link);
        }
    }, []);

    const getAvatarIcon = () => (
        <User className="w-8 h-8 text-[#c19b48] mt-2" />
    );

    // Sort business types: Agent -> Builder/Promoter -> Owner
    const displayTypes = [...businessTypes].sort((a, b) => {
        const nameA = (typeof a.name === "string" ? a.name : a.name?.name || "").toLowerCase();
        const nameB = (typeof b.name === "string" ? b.name : b.name?.name || "").toLowerCase();

        const getIndex = (name) => {
            if (name.includes("agent")) return 0;
            if (name.includes("builder") || name.includes("promoter")) return 1;
            if (name.includes("owner") || name.includes("individual")) return 2;
            return 3;
        };

        return getIndex(nameA) - getIndex(nameB);
    });

    if (displayTypes.length === 0) return null;

    return (
        <section className="py-6 md:py-0 px-4 bg-white font-['Outfit',_sans-serif]">
            <div className="w-full max-w-5xl mx-auto">
                
                {/* Main Card Container */}
                <div className="bg-[#eef7f0] rounded-[24px] flex flex-col lg:flex-row items-center p-8 lg:p-0 lg:pl-16 relative mb-12 lg:mb-16">

                    {/* Left Side: Branding / Title */}
                    <div className="lg:w-1/2 py-8 lg:py-20 w-full flex flex-col items-start text-left">
                        <div className="flex items-end gap-2 mb-8">
                            <div className="w-5 h-16 bg-[#0e182b] rounded-sm"></div>
                            <div className="w-5 h-10 bg-[#c19b48] rounded-sm"></div>
                            <div className="ml-1 text-[#c19b48]">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0e182b] leading-tight mb-2">
                            Properties <br /> posted by
                        </h2>
                        <p className="text-[#38526e] text-base font-medium">
                            Choose type of lister
                        </p>
                    </div>

                    {/* Right Side: Information Card */}
                    <div className="lg:w-1/2 w-full flex justify-center lg:justify-end lg:pr-8">

                        {/* Overlapping White Card with ALL-SIDE SHADOW */}
                        <div className="bg-white rounded-[20px] shadow-[0_0_50px_0_rgba(14,24,43,0.08)] p-8 lg:p-10 w-full max-w-[480px] border border-gray-50 transform lg:translate-y-12 lg:translate-x-4 mt-8 lg:mt-0">

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-[#0e182b] mb-1">
                                    Choose type of property lister
                                </h3>
                                <p className="text-[15px] text-[#38526e]">
                                    Browse your listing category
                                </p>
                            </div>

                            <div className="space-y-4">
                                {displayTypes.map((type) => {
                                    const id = type._id?.toString() || type.name;
                                    const name = typeof type.name === "string" ? type.name : type.name?.name || "Unknown";

                                    return (
                                        <div
                                            key={id}
                                            onClick={() => navigate(`/business/${slugify(name)}`)}
                                            className="group flex items-center justify-between py-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <div className="w-12 h-12 overflow-hidden flex items-start justify-center bg-[#f6f9fa] rounded-full border border-gray-100">
                                                        {getAvatarIcon(name)}
                                                    </div>

                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0e182b] rounded-full flex items-center justify-center border-[1.5px] border-white z-10">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#c19b48" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div>
                                                    {/* CHANGED: Hover text color to #166aa8 */}
                                                    <h4 className="text-[17px] font-bold text-[#0e182b] group-hover:text-[#166aa8] transition-colors capitalize">
                                                        {name}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* CHANGED: Hover arrow color to #166aa8 */}
                                            <div className="text-[#0e182b] group-hover:text-[#166aa8] transition-transform transform group-hover:translate-x-1">
                                                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdvertiserTypeSection;