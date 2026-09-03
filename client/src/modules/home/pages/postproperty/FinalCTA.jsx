import React from 'react';
import { ArrowRight } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="relative py-24 px-4 bg-[#0078D7] overflow-hidden" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      
      {/* Subtle Background Decorative Elements (Optional, makes it feel premium) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto text-center">
        
        {/* Main Title */}
        <h2 className="text-3xl md:text-[42px] font-bold text-white leading-tight mb-6">
          Ready to Sell or Rent Your Property?
        </h2>
        
        {/* Description */}
        <p className="text-[18px] md:text-[20px] text-blue-100 leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
          Join thousands of property owners who trust The Plot One to find buyers and tenants faster.
        </p>
        
        {/* High-Contrast Action Button */}
        <button className="group inline-flex items-center justify-center bg-white text-[#0078D7] text-[16px] md:text-[18px] font-bold py-4 px-10 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">
          Post Property FREE
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
        </button>

        {/* Optional Micro-copy to build final trust */}
        <p className="text-[13px] text-blue-200 mt-5 font-medium">
          No hidden charges. Setup takes less than 2 minutes.
        </p>

      </div>
    </section>
  );
};

export default FinalCTA;