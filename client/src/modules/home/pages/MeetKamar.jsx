import React from "react";
import { Link } from "react-router-dom";

const MeetKamar = () => {
  return (
    <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 mt-8">
      <Link
        to="/about"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="max-w-[1100px] mx-auto relative flex flex-col md:flex-row items-stretch min-h-[520px] cursor-pointer group block"
      >
        {/* Background Layer */}
        <div className="absolute inset-0 rounded-[2rem] bg-[#fffbeb] shadow-xl border border-white/40 overflow-hidden z-0 transition-transform duration-30"></div>

        {/* Left Side: Text Content */}
        <div className="flex-1 p-10 md:p-14 lg:p-16 z-10 flex flex-col justify-center relative pointer-events-none">
          <h2 className="text-4xl md:text-[50px] font-bold text-[#0f172a] mb-3 tracking-tight">
            Meet Kamar
          </h2>

          <h3 className="text-[#b58e45] text-[20px] md:text-[24px] font-semibold mb-8">
            Founder of The Plot One
          </h3>

          <div className="space-y-6 text-[#475569] text-[17px] md:text-[18px] leading-relaxed max-w-[520px]">
            <p>
              Kamar started The Plot One to make buying and selling
              property in Pondicherry simple, transparent, and reliable.
            </p>
            <p>
              With strong local knowledge and real estate experience, he helps
              people find the right property for their home, investment, or
              future.
              {/* Removed the specific text colors. 
                                Now it naturally inherits the #475569 color from the paragraph above.
                            */}
              <span className="font-semibold text-[#475569] hover:underline text-[17px] md:text-[18px] tracking-widest ml-2 inline-block pointer-events-auto">
                read more
              </span>
            </p>
          </div>
        </div>

        {/* Right Side: Image container */}
        <div className="relative w-full md:w-[45%] min-h-[400px] md:min-h-full z-10 flex items-end justify-center md:justify-end">
          <img
            src="/about/kamarcta.webp"
            alt="Kamar - Asset Manager"
            className="absolute bottom-0 right-0 md:right-8 w-auto h-[100%] md:h-[115%] max-w-none object-contain object-bottom z-20 transition-transform duration-300 pointer-events-none"
            onError={(e) => {
              e.target.src = "/properties/adsman.webp";
            }}
          />
        </div>
      </Link>
    </section>
  );
};

export default MeetKamar;
