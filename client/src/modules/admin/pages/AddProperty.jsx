import React, { useState, useEffect } from "react";
import PropertyForm from "../../../components/Property/PropertyForm";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

const AddProperty = () => {
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("edit");

  useEffect(() => {
    if (editId) {
      const fetchProperty = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/properties/fetch-property-by-id/${editId}`,
          );
          setInitialData(response.data);
        } catch (error) {
          console.error("Error fetching property for editing:", error);
          toast.error("Failed to load property details");
          navigate("/admin/properties");
        } finally {
          setLoading(false);
        }
      };
      fetchProperty();
    }
  }, [editId, navigate]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      if (editId) {
        // Handle Update
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
        toast.success("Property updated successfully!");
      } else {
        // Handle Create
        // Append default status and verification for Admin if not present (PropertyForm handles fields, backend has defaults too)
        formData.append("status", "available");
        formData.append("is_verified", "true");

        await axios.post(
          `${import.meta.env.VITE_API_URL}/properties/create-property`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success("Property added successfully!");
      }
      navigate("/admin/properties");
    } catch (error) {
      console.error("Error saving property:", error);
      const errorMessage = error.response?.data?.error;
      toast.error(
        typeof errorMessage === "string"
          ? errorMessage
          : "Failed to save property",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 pt-10 md:pt-12">
      <div className="mb-6"></div>
      <PropertyForm
        onSubmit={onSubmit}
        loading={loading}
        initialData={initialData}
        isEdit={!!editId}
        user={user}
      />
    </div>
  );
};

export default AddProperty;
