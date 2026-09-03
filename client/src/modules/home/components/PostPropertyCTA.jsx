import React from "react";
import { useNavigate } from "react-router-dom";

const PostPropertyCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1000px] mx-auto rounded-3xl bg-[#eef7f0] relative font-sans shadow-sm border border-[#e2efe4] flex items-center min-h-[190px] md:min-h-[300px]">
        {/* Left: Text and CTA */}
        <div className="w-[56%] p-6 md:p-16 z-10 flex flex-col justify-center">
          <h2 className="text-lg md:text-4xl font-bold text-[#0f172a] mb-1 md:mb-3 tracking-tight leading-snug">
            Find the Best Deal for Your Property!
          </h2>
          <p className="text-[#64748b] text-xs md:text-lg mb-3 md:mb-8">
            List your property today
          </p>
          <button
            onClick={() => navigate("/post-property")}
            className="bg-[#166aa8] hover:bg-[#0078d7] text-white font-bold py-2 px-4 md:py-3.5 md:px-8 rounded-xl shadow-sm transition-colors text-xs md:text-base w-fit cursor-pointer"
          >
            Post Property – It's FREE
          </button>
        </div>

        {/* Right: Image — anchored to card bottom, overflows top only */}
        <div className="absolute right-0 bottom-0 w-[44%] h-[130%] pointer-events-none flex items-end">
          <img
            src="/properties/adsman.webp"
            alt="Customer showing app"
            className="w-full h-full object-contain object-bottom drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
};

export default PostPropertyCTA;
