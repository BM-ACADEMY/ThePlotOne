import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropertySearchBar from "./PropertySearchBar";

const HeroSection = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection to hide hero search
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 170);
      }
    };

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className="relative h-[260px] md:h-[320px] flex items-end justify-center font-sans">
      {/* Background Image */}
      <div className="absolute inset-0">
        {/* Desktop Image */}
        <img
          src="/banner/banner1.webp"
          alt="Hero Background Desktop"
          className="hidden md:block w-full h-full object-cover object-center"
          fetchpriority="high"
          loading="eager"
          width="1920"
          height="320"
        />
        {/* Mobile/Tablet Image */}
        <img
          src="/banner/Banner.webp"
          alt="Hero Background Mobile"
          className="block md:hidden w-full h-full object-cover object-center"
          fetchpriority="high"
          loading="eager"
          width="768"
          height="260"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* --- SEARCH BAR --- */}
      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-[60%] lg:top-[100%] -translate-y-1/2 left-0 right-0 z-50 flex justify-center px-4"
          >
            <PropertySearchBar variant="hero" showFilters={true} showKeyword={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSection;
