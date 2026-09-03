import React, { useState, useEffect } from "react";
import { Form, Button, Checkbox, message, Typography, Card, Space } from "antd";
import { ShieldAlert, User as UserIcon, Phone as PhoneIcon, Mail as MailIcon, Send } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const RequestLimit = () => {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const handleRequestSubmit = async (values) => {
    if (!values.agreed) {
      message.error("Please agree to be contacted.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/seller-requests/create-request", {
        name: user.name,
        email: user.email,
        phone: user.phone,
        business_type: user.businessType?.name || "N/A",
        message: "Request to increase property upload limit.",
      });
      message.success("Request submitted! Admin will contact you.");
      navigate("/seller/my-properties");
    } catch (error) {
      console.error("Request failed:", error);
      message.error("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const BRAND_COLOR = "#166aa8";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <style>
        {`
          .seller-content-wrapper {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
        `}
      </style>
      <div className="max-w-2xl w-full relative">
        {/* Subtle background glow */}
        <div 
          className="absolute -inset-4 rounded-[4rem] opacity-20 blur-3xl -z-10"
          style={{ backgroundColor: BRAND_COLOR }}
        />
        
        <Card
          className="w-full border-0 shadow-none rounded-3xl overflow-hidden bg-transparent"
          styles={{ body: { padding: 0 } }}
        >
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner"
                style={{ backgroundColor: `${BRAND_COLOR}15`, color: BRAND_COLOR }}
              >
                <ShieldAlert size={32} strokeWidth={2.5} />
              </div>
              <Title level={2} style={{ margin: 0, color: BRAND_COLOR, fontWeight: 800 }}>
                Limit Reached
              </Title>
              <Paragraph className="text-gray-500 mt-2 max-w-md font-medium">
                You have already uploaded 5 properties. To expand your listing capacity, 
                please confirm your details below and our team will get back to you.
              </Paragraph>
            </div>

            <Form form={form} onFinish={handleRequestSubmit} layout="vertical" className="space-y-6">
              <div className="bg-[#166aa8]/5 border border-[#166aa8]/10 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-[#166aa8]/5 text-[#166aa8]/60">
                      <UserIcon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-gray-400">FullName</Text>
                      <Text className="text-gray-800 font-semibold text-base">{user?.name}</Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-[#166aa8]/5 text-[#166aa8]/60">
                      <PhoneIcon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Phone</Text>
                      <Text className="text-gray-800 font-semibold text-base">{user?.phone || "--"}</Text>
                    </div>
                  </div>

                  {user?.email && (
                    <div className="flex items-start gap-4 col-span-1 md:col-span-2">
                      <div className="p-2.5 rounded-xl bg-[#166aa8]/5 text-[#166aa8]/60">
                        <MailIcon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <Text className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email Address</Text>
                        <Text className="text-gray-800 font-semibold text-base">{user?.email}</Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Form.Item
                name="agreed"
                valuePropName="checked"
                rules={[{ required: true, message: "Required to proceed" }]}
                className="mb-0"
              >
                <Checkbox className="text-gray-600 font-medium select-none">
                  I agree to be contacted by the admin team regarding my request.
                </Checkbox>
              </Form.Item>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => navigate("/seller/my-properties")}
                  className="h-12 flex-1 rounded-xl border-gray-100 bg-gray-50/20 text-gray-400 font-semibold hover:bg-gray-100/50"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<Send size={18} />}
                  className="h-12 flex-2 rounded-xl font-bold flex items-center justify-center gap-2 border-none shadow-lg shadow-blue-200"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  Submit Request
                </Button>
              </div>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RequestLimit;
