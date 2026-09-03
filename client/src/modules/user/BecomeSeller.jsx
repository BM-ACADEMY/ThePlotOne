import { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Select } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.VITE_API_URL;

export default function BecomeSeller() {
  const [loading, setLoading] = useState(false);
  const { user, refetchUser } = useAuth(); // Use refetchUser to update context after upgrade
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: values.name,
        phone: values.phone,
        // Email is usually not changeable here or needs verification if changed
      };

      const res = await axios.put(`${API}/users/upgrade-to-seller`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success(res.data.message || "Successfully upgraded to Seller!");

      // Refresh user context with the new seller role + token
      await refetchUser();

      // Smoothly navigate to dashboard
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to upgrade to seller";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Upgrade to Seller Account
        </h1>

        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input size="large" disabled />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input size="large" />
          </Form.Item>


          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Submit & Upgrade
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
