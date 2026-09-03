import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  ShieldCheck,
  Calendar,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Common/Loader";
import PhoneVerificationModal from "@/components/Auth/PhoneVerificationModal";
import api from "@/services/api";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { user, isLoading, refreshUser, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (isPhoneVerified = false) => {
    // Check if phone has changed
    if (formData.phone !== user.phone && !isPhoneVerified) {
      setIsSaving(true);
      try {
        const res = await api.post("/users/request-phone-update", { newPhone: formData.phone });
        if (res.data.success) {
          setPendingPhone(formData.phone);
          setShowVerifyModal(true);
          setIsSaving(false);
          return;
        }
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to request phone update");
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const response = await api.put(
        `/users/update-user-by-id/${user._id}`,
        formData // Now we can safely send the full formData including the new phone
      );

      if (response.data) {
        refreshUser(response.data);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (error) {
      console.error("Update failed", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleVerifySuccess = () => {
    if (refetchUser) refetchUser(); 
    // Now call handleSave with isPhoneVerified = true to save other changes
    // and finalize the UI state without re-triggering OTP
    handleSave(true);
  };

  const cancelEdit = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500">
        <User size={64} className="mb-4 text-gray-300" />
        <p className="text-xl font-semibold">User not found</p>
        <p className="text-sm">Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 px-6 py-3 rounded-xl shadow-2xl z-[9999] flex items-center gap-3 backdrop-blur-md border ${
                message.type === "success"
                  ? "bg-green-500/90 text-white border-green-400"
                  : "bg-red-500/90 text-white border-red-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Account Settings
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your profile information and account security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-100/50 border border-gray-300 overflow-hidden relative">
              {/* --- IMAGE COVER AREA --- */}
              <div className="h-32 relative">
                <img
                  src="/Logo/userprofile.webp"
                  alt="Profile Cover"
                  className="w-full h-full object-cover"
                />
                {/* Optional overlay to make text readable if you add text over image later */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              {/* ------------------------- */}

              <div className="px-6 pb-8 text-center relative">
                <div className="relative inline-block -mt-16 mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-50 shadow-lg flex items-center justify-center text-4xl font-bold text-indigo-600 uppercase overflow-hidden">
                    {/* You can add a user avatar image here if available, or keep initials */}
                    <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                      {user.name ? user.name.charAt(0) : " "}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex justify-center items-center gap-2 mb-2">
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    ID: {user.userId || "N/A"}
                  </span>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {user.isVerified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                      <ShieldCheck size={12} className="mr-1.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                      <AlertCircle size={12} className="mr-1.5" />
                      Unverified
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">
                    <Calendar size={12} className="mr-1.5" />
                    Member
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-300 p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-500">
                    Update your personal details here.
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-all border border-gray-200 font-medium text-sm"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md shadow-indigo-200 font-medium text-sm disabled:opacity-70"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-2.5 text-gray-700 bg-white border border-transparent border-b-gray-100">
                        {user.name}
                      </div>
                    )}
                  </div>
                </div>
                {/* Phone */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone size={18} />
                    </div>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setFormData((prev) => ({ ...prev, phone: value }));
                        }}
                        placeholder="Phone Number (10 digits)"
                        maxLength={10}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      />
                    ) : (
                      <div
                        className={`block w-full pl-10 pr-3 py-2.5 border border-transparent border-b-gray-100 ${!user.phone ? "text-gray-400 italic" : "text-gray-700"}`}
                      >
                        {user.phone || "No phone number added"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <PhoneVerificationModal 
        open={showVerifyModal} 
        onCancel={() => setShowVerifyModal(false)} 
        newPhone={pendingPhone}
        onSuccess={handleVerifySuccess}
      />
    </div>
  );
};

export default Profile;
