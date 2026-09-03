import React, { useState, useEffect } from "react";
import PropertyForm from "../../../../components/Property/PropertyForm";
import axios from "axios";
import { message, Button } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { checkPropertyListingLimit } from "@/utils/propertyLimits";
import PhoneUpdateModal from "../../../../components/Common/PhoneUpdateModal";
import Loader from "../../../../components/Common/Loader";

const AddProperty = () => {
  const [loading, setLoading] = useState(false);
  const [verifyingLimit, setVerifyingLimit] = useState(true);
  const warnedRef = React.useRef(false);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [initialData, setInitialData] = useState({});

  const { user, refetchUser } = useAuth();

  // Mobile number prompt state
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 🛡️ Centralized Plan & Verification Check
    const { canPost, reason, message: limitMessage, redirectPath } = checkPropertyListingLimit(user);

    if (!canPost && !editId) {
      if (!warnedRef.current) {
        message.warning({
          content: limitMessage,
          key: "verification-restricted"
        });
        warnedRef.current = true;
      }

      if (reason === "unverified") {
        const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
        navigate(role === "SELLER" ? "/seller/profile" : "/user/profile");
      } else if (reason === "limit_reached" || reason === "expired") {
        navigate(redirectPath || "/seller/upgrade-plan");
      }
      return;
    }

    setVerifyingLimit(false);

    // Show modal if user is logged in but has no phone number (only for new properties)
    if (!user.phone && !editId) {
      setShowPhoneModal(true);
    }
  }, [user, editId, navigate]);


  const fetchProperty = React.useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/properties/fetch-property-by-id/${editId}`,
      );
      setInitialData(res.data);
    } catch (error) {
      console.error("Error fetching property:", error);
      message.error("Failed to load property details");
    }
  }, [editId]);

  useEffect(() => {
    if (editId) {
      fetchProperty();
    }
    // Limit check is now handled in the main useEffect above
  }, [editId, fetchProperty, user]);
  const onSubmit = async (formData) => {
    setLoading(true);
    let response = null;

    try {
      if (editId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/properties/update-property-by-id/${editId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        message.success("Property updated successfully!");
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/properties/create-property`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        message.success("Property added successfully!");

        // 🔄 Refetch user to get the new 'SELLER' role
        await refetchUser();
      }

      // Redirect to My Properties in the dashboard
      navigate(
        `/seller/my-properties?success=true${!editId ? `&property_id=${response.data._id}` : ""}`,
      );
    } catch (error) {
      console.error("Error saving property:", error);
      const errorMessage = error.response?.data?.error;
      message.error(
        typeof errorMessage === "string"
          ? errorMessage
          : "Failed to save property",
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifyingLimit && !editId) {
    return (
      <Loader variant="panel" />
    );
  }

  return (
    <div className="pt-10 p-4 md:pt-12 md:p-8 bg-gray-50 min-h-full">
      <div className="max-w-8xl mx-auto">
        <div className="mb-6"></div>        <PropertyForm
          onSubmit={onSubmit}
          loading={loading}
          isSeller={true}
          initialData={initialData}
          isEdit={!!editId}
          user={user}
        />
      </div>

      <PhoneUpdateModal
        isOpen={showPhoneModal}
        onClose={() => {
          setShowPhoneModal(false);
          navigate(-1);
        }}
        onSuccess={() => setShowPhoneModal(false)}
      />
    </div>
  );
};

export default AddProperty;
