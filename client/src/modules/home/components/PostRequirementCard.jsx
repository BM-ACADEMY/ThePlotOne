import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PostRequirementCard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setLoginModalOpen } = useAuth();
  
  const handlePostClick = () => {
    navigate("/post-requirement");
  };
  return (
    <div
      onClick={handlePostClick}
      className="group relative bg-linear-to-br from-[#ffffff93] to-[#e6e5e9] rounded-2xl p-6 shadow-lg overflow-hidden cursor-pointer transition-all duration-300 border border-[#e6e5e99f]"
    >
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-transform" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#5b5e65] mb-2 leading-tight">
            Can't Find Your Property?
          </h3>
          <p className="text-[14px] text-[#5b5e65]/90 leading-relaxed pr-2">
            Post your requirement and let our experts find the perfect match
            for you.
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePostClick();
          }}
          className="bg-[#fb2c36] hover:bg-[#e7000b] text-white font-bold py-2 px-4 md:py-3 md:px-8 rounded-xl shadow-sm transition-all text-xs md:text-[14px] w-fit active:scale-95 cursor-pointer"
        >
          Post Requirement
        </button>
      </div>
    </div>
  );
};

export default PostRequirementCard;
