import React, { useState } from "react";
import { Row, Col, Form, Input, Button, Checkbox, ConfigProvider } from "antd";
import {
  HomeOutlined,
  BulbOutlined,
  LikeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet-async";
import api from "@/services/api";
import toast from "react-hot-toast";

const { TextArea } = Input;

export default function ContactHeroLayout() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/forms/contact', values);
      if (response.data.success) {
        toast.success(response.data.message || 'Contact message submitted successfully!');
        form.resetFields();
      }
    } catch (error) {
      console.error('Error submitting contact message:', error);
      toast.error(error.response?.data?.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goldColor = "#D4AF37";
  const darkColor = "#050B14";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: goldColor,
          borderRadius: 8,
          fontFamily: "inherit",
        },
        components: {
          Button: {
            colorPrimary: darkColor,
            colorPrimaryHover: "#333",
            borderRadius: 8,
          },
          Checkbox: {
            colorPrimary: goldColor,
            colorPrimaryHover: goldColor,
            borderRadius: 4,
          },
          Input: {
            colorBgContainer: "#F9FAFB",
            borderRadius: 8,
            activeBorderColor: goldColor,
            hoverBorderColor: goldColor,
          },
        },
      }}
    >
      <Helmet>
        <title>Contact The Plot One | Book Site Visit</title>
        <meta
          name="description"
          content="Get in touch with The Plot One for property inquiries, site visits, and investment guidance in Puducherry."
        />
      </Helmet>
      {/* --- HERO SECTION WITH FORM --- */}
      <section className="relative font-sans min-h-[750px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop')",
          }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-[#050B14]/80"></div>

        {/* Main Content Container */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10 py-20">
          <Row gutter={[64, 48]} align="middle">
            {/* --- LEFT SIDE: TEXT CONTENT --- */}
            <Col xs={24} lg={13}>
              <div className="text-white">
                <div className="inline-block px-3 py-1 border border-[#D4AF37]/50 rounded-full mb-6">
                  <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">
                    Premium Real Estate
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl leading-[1.15] mb-6">
                  <span className="font-medium block text-white">
                    Find your perfect
                  </span>
                  <span className="text-[#D4AF37] font-medium block">
                    property today.
                  </span>
                </h1>

                <p className="text-gray-300 text-lg font-medium leading-relaxed max-w-lg mb-10">
                  We verify every document to ensure 100% safe and secure land
                  transactions in Pondicherry.
                </p>

                {/* Feature Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050B14] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                      <span className="font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        Verified Lands
                      </h4>
                      <p className="text-sm text-gray-400 font-medium mt-1">
                        100% Clear Titles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050B14] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                      <span className="font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        Quick Support
                      </h4>
                      <p className="text-sm text-gray-400 font-medium mt-1">
                        Registration Assistance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* --- RIGHT SIDE: WHITE FLOATING CARD --- */}
            <Col xs={24} lg={11} className="mt-8 lg:mt-16">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-500">
                {/* Gold Top Bar */}
                <div className="h-2 w-full bg-[#D4AF37]"></div>

                <div className="p-8 md:p-10">
                  <div className="mb-8">
                    <h3 className="text-[#050B14] font-medium text-2xl mb-2">
                      Get a Free Quote
                    </h3>
                    <p className="text-gray-500 font-medium text-sm">
                      Fill out the form and our team will get back to you within
                      24 hours.
                    </p>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: "Required" }]}
                      className="mb-4"
                    >
                      <Input
                        placeholder="Full Name"
                        className="font-medium py-3 border-transparent hover:bg-white focus:bg-white transition-all"
                      />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      rules={[
                        { required: true, message: "Required" },
                        {
                          pattern: /^[0-9]{10}$/,
                          message: "Please enter a valid 10-digit phone number",
                        },
                      ]}
                      className="mb-4"
                    >
                      <Input
                        placeholder="Phone Number"
                        maxLength={10}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="font-medium py-3 border-transparent hover:bg-white focus:bg-white transition-all"
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      rules={[
                        {
                          required: true,
                          type: "email",
                          message: "Invalid Email",
                        },
                      ]}
                      className="mb-4"
                    >
                      <Input
                        placeholder="Email Address"
                        className="font-medium py-3 border-transparent hover:bg-white focus:bg-white transition-all"
                      />
                    </Form.Item>

                    <Form.Item name="message" className="mb-4">
                      <TextArea
                        rows={3}
                        placeholder="Tell us about your requirements..."
                        className="font-medium py-3 border-transparent hover:bg-white focus:bg-white transition-all"
                      />
                    </Form.Item>

                    {/* --- ADDED CHECKBOX --- */}
                    <Form.Item
                      name="sellProperty"
                      valuePropName="checked"
                      className="mb-6"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-[#D4AF37]/30 transition-colors cursor-pointer">
                        <Checkbox className="flex items-center">
                          <span className="font-medium text-gray-700 ml-2 text-sm">
                            I want to sell my property
                          </span>
                        </Checkbox>
                        <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded uppercase tracking-wider">
                          Promotion
                        </span>
                      </div>
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      disabled={loading}
                      className="h-14 !bg-[#D4AF37] hover:!bg-[#B8860B] !text-[#050B14] font-medium uppercase tracking-widest transition-all shadow-lg hover:shadow-[#D4AF37]/40 border-none"
                    >
                      {loading ? "Submitting..." : "Submit Enquiry"}
                    </Button>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* --- BOTTOM FEATURES BAR --- */}
      <section className="bg-white py-16 border-b border-gray-100 font-sans">
        <div className="container mx-auto px-6 lg:px-12">
          <Row gutter={[32, 32]} justify="center">
            <Col
              xs={24}
              sm={12}
              md={6}
              className="text-center group cursor-default"
            >
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300 shadow-sm">
                <HomeOutlined className="text-3xl" />
              </div>
              <h4 className="font-medium text-[#050B14] text-sm uppercase mb-2 tracking-wider">
                Real Estate Appraisal
              </h4>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
                Accurate market valuation for your lands and properties.
              </p>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
              className="text-center group cursor-default"
            >
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300 shadow-sm">
                <BulbOutlined className="text-3xl" />
              </div>
              <h4 className="font-medium text-[#050B14] text-sm uppercase mb-2 tracking-wider">
                Property Guidance
              </h4>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
                Expert advice on buying the right plot for your needs.
              </p>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
              className="text-center group cursor-default"
            >
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300 shadow-sm">
                <LikeOutlined className="text-3xl" />
              </div>
              <h4 className="font-medium text-[#050B14] text-sm uppercase mb-2 tracking-wider">
                Friendly Support
              </h4>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
                We are with you at every step of the registration process.
              </p>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
              className="text-center group cursor-default"
            >
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300 shadow-sm">
                <ClockCircleOutlined className="text-3xl" />
              </div>
              <h4 className="font-medium text-[#050B14] text-sm uppercase mb-2 tracking-wider">
                We Save Your Time
              </h4>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
                Quick verification and hassle-free documentation.
              </p>
            </Col>
          </Row>
        </div>
      </section>
    </ConfigProvider>
  );
}
