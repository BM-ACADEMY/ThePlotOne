import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNav } from "@/context/NavContext";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";
import { message } from "antd";
import { PostPropertyRoute } from "../routes/PostPropertyRoute";

const PostPropertyLanding = () => {
  const { isAuthenticated, setLoginModalOpen, user } = useAuth();
  const {
    propertyCategories = ["Sell/Buy", "Rent"],
    propertyTypes = [],
    isLoading,
  } = useNav();
  const navigate = useNavigate();
  const nextSectionRef = useRef(null);

  // Derive usageTypes from propertyTypes
  const usageTypes = [...new Set(propertyTypes.map((t) => t.usageType))];

  const [selectedCategory, setSelectedCategory] = useState("Sell/Buy");
  const [selectedType, setSelectedType] = useState("Residential");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Effects to sync initial selections when data loads
  React.useEffect(() => {
    if (
      propertyCategories.length > 0 &&
      !propertyCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(propertyCategories[0]);
    }
  }, [propertyCategories, selectedCategory]);

  React.useEffect(() => {
    if (usageTypes.length > 0 && !usageTypes.includes(selectedType)) {
      setSelectedType(usageTypes[0]);
    }
  }, [usageTypes, selectedType]);

  const filteredSubtypes = propertyTypes.filter(
    (t) => t.usageType === selectedType,
  );

  React.useEffect(() => {
    if (filteredSubtypes.length > 0) {
      setSelectedSubtype(filteredSubtypes[0].name);
    }
  }, [selectedType, propertyTypes]);

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const role =
        user?.role_id?.role_name?.toUpperCase() ||
        user?.role?.name?.toUpperCase();
      if (role === "ADMIN") {
        navigate("/admin/properties/add");
      } else if (role === "SELLER") {
        navigate("/seller/add-property");
      } else {
        navigate("/add-property");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const benefits = [
    "Post your property listing for free",
    "Reach genuine buyers and tenants quickly",
    "Get shortlisted buyers and tenants",
    "Assistance in co-ordinating site visits",
  ];

  const handleStartNow = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
    } else {
      const {
        canPost,
        reason,
        message: limitMessage,
        redirectPath,
      } = checkPropertyListingLimit(user);

      if (!canPost) {
        message.warning({
          content: limitMessage,
          key: "verification-restricted",
        });

        if (reason === "unverified") {
          const role =
            user?.role_id?.role_name?.toUpperCase() ||
            user?.role?.name?.toUpperCase();
          if (role === "SELLER") {
            navigate("/seller/profile");
          } else {
            navigate("/user/profile");
          }
        } else if (reason === "limit_reached") {
          navigate(redirectPath || "/seller/upgrade-plan");
        }
        return;
      }

      // Redirect based on role
      const role =
        user?.role_id?.role_name?.toUpperCase() ||
        user?.role?.name?.toUpperCase();
      if (role === "ADMIN") {
        navigate("/admin/properties/add");
      } else if (role === "SELLER") {
        navigate("/seller/add-property");
      } else {
        navigate("/add-property");
      }
    }
  };

  const handlePhoneClick = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
    }
  };

  return (
    <div id="post-property-landing" className="mt-12 min-h-screen bg-[#fffbf7]">
      {/* Font Import */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            `,
        }}
      />

      {/* Main Redesigned Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-5">
        <div className="rounded-[32px] flex flex-col lg:flex-row items-start p-8 lg:p-0 lg:pl-16 relative">
          {/* Left Side: Content & Branding */}
          <div className="lg:w-[55%] py-4 lg:py-20 space-y-8 flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0e182b] leading-tight">
                Sell/Buy or rent faster at the right price!
                <span className="text-[#c19b48]">
                  online faster with ThePlotOne
                </span>
              </h1>

              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-center text-lg text-[#38526e] font-medium"
                  >
                    <div className="bg-white p-1 rounded-full mr-3 text-[#1aa554] shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Illustration Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block mt-8 w-full max-w-md"
            >
              <img
                src="/post/post.webp"
                alt="Post Property Illustration"
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </div>

          {/* Right Side: Posting Card (Overlapping) */}
          <div className="lg:w-[45%] flex justify-center lg:justify-end lg:pr-12 items-start lg:pt-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-[24px] shadow-[0_0_50px_0_rgba(14,24,43,0.08)] pt-8 pb-5 px-8 lg:pt-10 lg:pb-6 lg:px-10 w-full max-w-[480px] border border-gray-50 transform lg:translate-x-8 mt-8 lg:mt-0 z-10 h-fit"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0e182b] mb-2">
                  Start posting your property,{" "}
                  <span className="text-[#c19b48] font-medium">it's free</span>
                </h2>
                <p className="text-[#38526e] font-medium">Add Basic Details</p>
              </div>

              <div className="space-y-6">
                {/* Looking to select */}
                <div>
                  <p className="text-sm font-bold text-[#0e182b] mb-4 uppercase tracking-wider">
                    What would you like to do?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {propertyCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2.5 rounded-full border transition-all text-sm font-bold ${
                          selectedCategory === cat
                            ? "bg-[#0e182b] text-[white] border-[#0e182b] shadow-md"
                            : "bg-white text-[#38526e] border-gray-200 hover:border-[#c19b48]"
                        }`}
                      >
                        <span className="capitalize">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type selection */}
                <div>
                  <p className="text-sm font-bold text-[#0e182b] mb-4 uppercase tracking-wider">
                    Select Property Category
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {usageTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-6 py-2.5 rounded-xl border transition-all text-sm font-bold ${
                          selectedType === type
                            ? "bg-[#0e182b] text-[white] border-[#0e182b] shadow-md"
                            : "bg-white text-[#38526e] border-gray-200 hover:border-[#c19b48]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filteredSubtypes.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => setSelectedSubtype(sub.name)}
                        className={`px-4 py-2 rounded-full border transition-all text-[13px] font-medium ${
                          selectedSubtype === sub.name
                            ? "bg-[#f6f9fa] text-[#0e182b] border-[#0e182b]"
                            : "bg-white text-[#38526e] border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <p className="text-sm font-bold text-[#0e182b] mb-4 uppercase tracking-wider">
                    Your contact details
                  </p>
                  <div className="relative group">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={isAuthenticated ? user?.phone : phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onClick={handlePhoneClick}
                      readOnly={isAuthenticated}
                      className="w-full px-6 py-4 bg-[#f6f9fa] border border-gray-100 rounded-2xl outline-none focus:border-[#c19b48] focus:bg-white transition-all text-[#0e182b] font-medium placeholder-gray-400"
                    />
                    {!isAuthenticated && (
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={handlePhoneClick}
                      ></div>
                    )}
                  </div>
                  {!isAuthenticated && (
                    <p className="mt-3 text-xs text-[#38526e] font-medium">
                      Are you a registered user?{" "}
                      <button
                        onClick={() => setLoginModalOpen(true)}
                        className="text-[#c19b48] font-bold hover:underline"
                      >
                        Login
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Know More Button */}
      <div className="relative h-12">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: 1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-white px-8 py-3 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.1)] border border-gray-100 text-[#333333] text-[15px] font-medium hover:shadow-xl transition-all group"
            onClick={() => {
              nextSectionRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            Know More
            <ChevronDown className="w-4 h-4 text-[#0056b3] group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        </div>
      </div>

      {/* Post Property Sections */}
      <div ref={nextSectionRef} className="relative z-10 w-full">
        <PostPropertyRoute />
      </div>
    </div>
  );
};

export default PostPropertyLanding;
