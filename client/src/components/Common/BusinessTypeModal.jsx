import { useState, useEffect } from "react";
import { X, User, Briefcase, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const BusinessTypeModal = ({ open, onCancel, onSuccess }) => {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();

  useEffect(() => {
    const fetchBusinessTypes = async () => {
      try {
        const res = await axios.get(`${API}/business-types`);
        setBusinessTypes(res.data);
      } catch (error) {
        console.error("Error fetching business types:", error);
      }
    };
    if (open) fetchBusinessTypes();
  }, [open]);

  if (!open) return null;

  const handleSelection = async () => {
    if (!selectedType) {
      toast.error("Please select a business type");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/users/upgrade-to-seller`,
        {
          businessType: selectedType._id,
          name: user?.name,
          phone: user?.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Profile updated successfully!");
        // Update local auth state with new user data (including new role)
        login(res.data.user, token);
        if (onSuccess) onSuccess(res.data.user);
        onCancel();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name) => {
    if (name === "Owner") return <User className="w-8 h-8" />;
    if (name === "Agent") return <Briefcase className="w-8 h-8" />;
    if (name === "Builders / Promoter") return <Building2 className="w-8 h-8" />;
    return <User className="w-8 h-8" />;
  };

  const getDescription = (name) => {
    if (name === "Owner") return "I am selling or renting out my own property.";
    if (name === "Agent") return "I am a real estate agent helping others sell/rent.";
    if (name === "Builders / Promoter") return "I am a builder or developer with multiple projects.";
    return "";
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#166aa8] to-[#11254a] p-8 text-white relative">
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold mb-2">Select Business Type</h2>
          <p className="text-blue-100 opacity-90">
            Choose how you want to represent yourself on The Plot One.
            This will customize your profile and property listings.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {businessTypes.map((type) => (
              <div
                key={type._id}
                onClick={() => setSelectedType(type)}
                className={`cursor-pointer relative group p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center ${
                  selectedType?._id === type._id
                    ? "border-[#166aa8] bg-blue-50/50 scale-[1.02] shadow-lg"
                    : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {selectedType?._id === type._id && (
                  <div className="absolute top-3 right-3 text-[#166aa8]">
                    <CheckCircle2 className="w-5 h-5 fill-[#166aa8] text-white" />
                  </div>
                )}

                <div className={`mb-4 p-4 rounded-xl transition-colors duration-300 ${
                  selectedType?._id === type._id ? "bg-[#166aa8] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-[#166aa8]"
                }`}>
                  {getIcon(type.name)}
                </div>

                <h3 className={`text-lg font-bold mb-2 ${
                  selectedType?._id === type._id ? "text-[#11254a]" : "text-gray-700"
                }`}>
                  {type.name === "Builders / Promoter" ? "Builder" : type.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {getDescription(type.name)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex gap-3 items-start">
            <div className="p-1 bg-amber-100 rounded-full text-amber-600 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-amber-800 font-medium">
              Note: Once your profile is verified by admin, your business type and role will be locked and cannot be changed.
            </p>
          </div>

          <button
            onClick={handleSelection}
            disabled={loading || !selectedType}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-all active:scale-[0.98] ${
              selectedType
                ? "bg-[#166aa8] text-white hover:bg-[#11254a] shadow-xl shadow-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating Profile...
              </span>
            ) : (
              "Confirm & Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeModal;
