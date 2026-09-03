import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const PhoneUpdateModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Enter WhatsApp Mobile Number",
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, refetchUser } = useAuth();

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      message.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/update-user-by-id/${user._id}`,
        { phone },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      message.success("WhatsApp mobile number updated successfully!");
      await refetchUser();
      onSuccess?.(phone);
      onClose();
    } catch (error) {
      console.error("Error updating phone:", error);
      message.error(
        error.response?.data?.error || "Failed to update mobile number",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="bg-blue-600"
        >
          Save & Continue
        </Button>,
      ]}
    >
      <div className="py-4">
        <p className="mb-4 text-gray-600">
          To proceed, please provide your WhatsApp mobile number. This ensures
          smooth communication.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            WhatsApp Number
          </label>
          <Input
            size="large"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            prefix={<span className="text-gray-400 font-medium">+91</span>}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
};

export default PhoneUpdateModal;
