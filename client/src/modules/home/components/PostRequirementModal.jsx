import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const PostRequirementModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't show if we're already on the post-requirement page
    if (location.pathname === "/post-requirement") {
      setIsOpen(false);
      return;
    }

    const checkModal = () => {
      const lastShown = localStorage.getItem("lastRequirementModalShown");
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (!lastShown || now - parseInt(lastShown) > fiveMinutes) {
        setIsOpen(true);
      }
    };

    // Initial check after a short delay for better UX
    const timer = setTimeout(checkModal, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("lastRequirementModalShown", Date.now().toString());
  };

  const handleAction = () => {
    handleClose();
    navigate("/post-requirement");
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          {/* Darker Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#2d3436]/80 backdrop-blur-sm"
          />

          {/* Modal Content Wrapper - Replicating reference layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-[650px] flex flex-col items-center justify-center"
          >
            {/* 1. Behind/Dark Box (Top layer) */}
            <div className="relative  w-[92%] bg-[#1a1a1a] rounded-t-xl py-8 px-10 shadow-lg border-b border-white/5">
              <button
                onClick={handleClose}
                className="absolute cursor-pointer  top-1 right-5 p-2 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. Front/White Box (Main card) */}
            <div className="relative -mt-6 w-full bg-[#e6f4ea] shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[340px] isolate">
              {/* Decorative Decoration (Bottom-Left) */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#e7000b]/5 rotate-45 -translate-x-12 translate-y-12 pointer-events-none" />

              {/* Main Content Area - Left */}
              <div className="w-full md:w-[70%] p-10 flex flex-col justify-center items-center md:items-start z-10">
                <h2 className="text-[32px] md:text-[32px] font-bold text-[#2d3436] mb-4 leading-[1.1] tracking-tight text-center md:text-left">
                  Your Dream Property <br />
                  <span className="text-[#166aa8]">Starts Here</span>
                </h2>

                <p className="text-[#747d8c] text-[15px] font-medium mb-8 max-w-[280px] text-center md:text-left">
                  Can't find a property? Submit your requirement and we will
                  search for you.
                </p>

                {/* Bottom Row: Action Button */}
                <button
                  onClick={handleAction}
                  className="bg-[#166aa8] cursor-pointer hover:bg-[#0078d7] text-white font-bold py-4 px-10 uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Post Requirement
                </button>

                <p className="mt-4 text-[10px] text-[#303030] font-bold uppercase tracking-widest">
                  Trusted by 100+ Home Hunters
                </p>
              </div>

              {/* Right Side: Professional Advisor */}
              <div className="hidden md:block w-[40%] relative">
                <img
                  src="/properties/adsman.webp"
                  alt="Property Advisor"
                  className="w-full h-full object-cover object-top filter brightness-105"
                />
                <div className="absolute inset-0 " />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostRequirementModal;
