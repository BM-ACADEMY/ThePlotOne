import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const WishlistButton = ({ propertyId, className = "" }) => {
  const { user, token, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "string" ? item : item._id) === propertyId,
  );

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    // Optimistic Update
    const previousWishlist = user.wishlist || [];
    const isCurrentlyWishlisted = previousWishlist.some(
      (item) => (typeof item === "string" ? item : item._id) === propertyId,
    );

    let newWishlist;
    if (isCurrentlyWishlisted) {
      newWishlist = previousWishlist.filter(
        (item) => (typeof item === "string" ? item : item._id) !== propertyId,
      );
    } else {
      newWishlist = [...previousWishlist, propertyId];
    }

    const optimisticUser = { ...user, wishlist: newWishlist };
    refreshUser(optimisticUser);

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const endpoint = isCurrentlyWishlisted
        ? `${import.meta.env.VITE_API_URL}/users/remove-from-wishlist`
        : `${import.meta.env.VITE_API_URL}/users/add-to-wishlist`;

      const res = await axios.post(
        endpoint,
        { propertyId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedWishlist = res.data.wishlist;
      refreshUser({ ...user, wishlist: updatedWishlist });

      toast.success(res.data.message);
    } catch (error) {
      console.error("Wishlist error:", error);
      refreshUser({ ...user, wishlist: previousWishlist });
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.button
        onClick={handleToggleWishlist}
        disabled={loading}
        whileTap={{ scale: 0.8 }}
        className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 cursor-pointer ${isWishlisted
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-black/20 text-white hover:bg-black/40 hover:scale-110"
          } ${className}`}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <motion.div
          key={isWishlisted ? "liked" : "unliked"}
          initial={{ scale: 1 }}
          animate={{ scale: isWishlisted ? [1, 1.4, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-current" : ""
              }`}
          />
        </motion.div>
      </motion.button>
    </AnimatePresence>
  );
};

export default WishlistButton;
