import React, { useState, useEffect } from "react";
import { Modal, Radio, Button, message } from "antd";
import axios from "axios";

import { User as UserIcon, Building2, Home, Briefcase } from "lucide-react";

const BusinessTypeModal = ({ isOpen, user, onSelected }) => {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Mapping icons to business types
  const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("agent")) return <Briefcase size={28} />;
    if (n.includes("builder") || n.includes("promoter")) return <Building2 size={28} />;
    if (n.includes("owner")) return <Home size={28} />;
    return <UserIcon size={28} />;
  };

  useEffect(() => {
    const fetchBusinessTypes = async () => {
      try {
        setFetching(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/business-types?status=active`);
        setBusinessTypes(response.data);
      } catch (error) {
        console.error("Error fetching business types:", error);
        message.error("Failed to load business types");
      } finally {
        setFetching(false);
      }
    };

    if (isOpen) {
      fetchBusinessTypes();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!selectedType) {
      message.warning("Please select a business type");
      return;
    }
    onSelected(selectedType);
  };

  return (
    <Modal
      open={isOpen}
      onOk={handleSave}
      closable={false}
      maskClosable={false}
      centered
      footer={null}
      width={500}
      className="custom-business-modal"
      styles={{
        content: {
          borderRadius: "24px",
          padding: "24px",
        },
      }}
    >
      <div className="flex flex-col gap-6 text-center">
        {/* Header Section */}
        <div className="flex flex-col items-center">
          <div className="inline-block bg-[#F1F5F9] rounded-lg px-3 py-1.5 mb-6">
            <h2 className="text-[#334155] font-bold text-lg m-0 leading-none">
              Select Your Business Type
            </h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-[#64748B] text-[15px] leading-relaxed m-0">
              To provide the best experience, please select how you will be listing properties on The Plot One.
            </p>
            <p className="text-[#0F172A] font-bold text-[15px] m-0">
              This selection is permanent once verified.
            </p>
          </div>
        </div>

        {/* Selection Area - CARD STYLE IN ROW */}
        <div>
          <div className="grid grid-cols-3 gap-3">
            {businessTypes.map((type) => (
              <button
                key={type._id}
                type="button"
                onClick={() => setSelectedType(type._id)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer h-32
                  ${selectedType === type._id 
                    ? "border-[#2563EB] text-[#2563EB] bg-[#EFF6FF] shadow-md shadow-blue-50" 
                    : "border-[#E2E8F0] text-[#475569] bg-white hover:border-[#CBD5E1] hover:bg-gray-50"
                  }`}
              >
                <div className={`transition-transform duration-300 ${selectedType === type._id ? "scale-110" : ""}`}>
                  {getIcon(type.name)}
                </div>
                <span className="font-bold text-xs sm:text-sm text-center leading-tight">
                  {type.name}
                </span>
              </button>
            ))}
          </div>
          {fetching && <div className="text-center py-4 text-[#94A3B8] text-sm">Loading options...</div>}
        </div>

        {/* Footer Action */}
        <div className="flex justify-center mt-2">
          <Button 
            type="primary" 
            loading={loading} 
            onClick={handleSave} 
            className="w-40 h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-base font-bold border-none shadow-lg shadow-blue-100"
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BusinessTypeModal;
