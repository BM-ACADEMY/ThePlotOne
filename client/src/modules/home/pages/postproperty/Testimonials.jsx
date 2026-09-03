import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ArrowRight, ArrowLeft } from "lucide-react"; // Imported ArrowLeft
import "swiper/css";
import "swiper/css/navigation";

const Testimonials = () => {
    const testimonialsData = [
        {
            id: 1,
            name: "Anuj Velankar",
            role: "Owner, Gurgaon",
            text: "Great efforts and regular follow-up to get leads for my rental apartment. Because of your enthusiasm and dedication, various parties who saw the house were in a positive frame of mind.",
        },
        {
            id: 2,
            name: "Mohan Rao",
            role: "Owner, Hyderabad",
            text: "I found Relationship Managers of 99acres beneficial as they responded to my issues very promptly. I will surely recommend 99acres to my family and friends.",
        },
        {
            id: 3,
            name: "Ranganath RK",
            role: "Owner, Bangalore",
            text: "The team was constantly looking for the match of tenants and coordinating parties to get the deal fixed. I would recommend 99acres within my rate 5/5 for the services provided.",
        },
        {
            id: 4,
            name: "Priya Sharma",
            role: "Tenant, Chennai",
            text: "The platform made it incredibly easy to find a verified property within my budget. The direct contact with the owner saved me a lot of time and brokerage fees.",
        },
        {
            id: 5,
            name: "Vikram Desai",
            role: "Commercial Owner, Mumbai",
            text: "I was struggling to lease my office space for months. Within two weeks of listing here, I received multiple verified inquiries and closed a great deal.",
        },
        {
            id: 6,
            name: "Sneha Patil",
            role: "Buyer, Pune",
            text: "The exact plot I was looking for to build my weekend home was listed here. The transparent pricing and direct connection with the seller made the process seamless.",
        }
    ];

    return (
        <section className="bg-white py-20 px-4 font-sans border-t border-slate-50" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="mb-12">
                    <p className="text-[13px] font-bold text-[#8A94A5] uppercase tracking-wider mb-3">
                        TESTIMONIALS
                    </p>
                    <h2 className="text-3xl md:text-[40px] font-bold text-[#0B2149] leading-tight max-w-2xl">
                        This is what other Owners &<br className="hidden md:block" /> Dealers have to say...
                    </h2>
                </div>

                {/* Carousel Section */}
                <div className="relative group/testi">

                    {/* NEW: Custom Left Navigation Arrow */}
                    <button className="swiper-button-prev-testi absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-[#0078D7] hover:bg-[#0066B8] text-white rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-0 disabled:pointer-events-none cursor-pointer">
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    {/* Custom Right Navigation Arrow */}
                    <button className="swiper-button-next-testi absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-[#1a2b4b] hover:bg-[#1a2b4b] text-white rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-0 disabled:pointer-events-none cursor-pointer">
                        <ArrowRight className="w-6 h-6" />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        navigation={{
                            nextEl: ".swiper-button-next-testi",
                            prevEl: ".swiper-button-prev-testi", // Linked the left button here
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 1.5,
                            },
                            768: {
                                slidesPerView: 2,
                            },
                            1024: {
                                slidesPerView: 3,
                            },
                        }}
                        className="py-4 px-1"
                    >
                        {testimonialsData.map((testimonial) => (
                            <SwiperSlide key={testimonial.id} className="h-auto">
                                {/* Testimonial Card */}
                                <div className="bg-white border border-gray-200 rounded-[12px] p-7 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">

                                    {/* Author Info */}
                                    <div className="mb-4">
                                        <h3 className="text-[20px] font-semibold text-[#0B2149] leading-tight">
                                            {testimonial.name}
                                        </h3>
                                        {/* <p className="text-[14px] text-[#5C687B] mt-1 font-normal">
                                            {testimonial.role}
                                        </p> */}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-[16px] text-[#0B2149] leading-[1.65] font-normal flex-1">
                                        {testimonial.text}
                                    </p>

                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

            </div>
        </section>
    );
};

export default Testimonials;