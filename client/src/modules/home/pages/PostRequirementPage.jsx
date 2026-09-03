import React, { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Button, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { postRequirement } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useNav } from "@/context/NavContext";
import {
  Timer,
  UserCheck,
  ListChecks,
  MapPin,
  Phone,
  Mail,
  User,
  MessageCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import axios from "axios";

const { Option } = Select;
const { TextArea } = Input;

// Converts a raw number to an Indian-scale label
const formatBudgetLabel = (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  if (isNaN(num) || num === 0) return null;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1)} Crore${num >= 20000000 ? "s" : ""}`;
  if (num >= 100000)  return `₹${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)} Lakh${num >= 200000 ? "s" : ""}`;
  if (num >= 1000)    return `₹${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const BUDGET_PRESETS = [
  { label: "10 L",  value: 1000000 },
  { label: "25 L",  value: 2500000 },
  { label: "50 L",  value: 5000000 },
  { label: "75 L",  value: 7500000 },
  { label: "1 Cr",  value: 10000000 },
  { label: "2 Cr",  value: 20000000 },
  { label: "5 Cr",  value: 50000000 },
];

// No map helpers needed if map is removed


const PostRequirementPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showOtherType, setShowOtherType] = useState(false);
  const [searching, setSearching] = useState(false);
  const [minBudgetVal, setMinBudgetVal] = useState(null);
  const [maxBudgetVal, setMaxBudgetVal] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { propertyTypes } = useNav();

  const usageType = Form.useWatch("usageType", form);

  // Filter property types based on usage type
  const filteredPropertyTypes = propertyTypes.filter(
    (type) => type.usageType === usageType
  );

  // Reset property type when usage type changes
  useEffect(() => {
    if (usageType) {
      form.setFieldsValue({ propertyType: undefined });
      setShowOtherType(false);
    }
  }, [usageType, form]);

  useEffect(() => {
    if (isAuthenticated && user) {
      form.setFieldsValue({
        fullName: user.name || "",
        phoneNumber: user.phone || "",
      });
    }
  }, [user, isAuthenticated, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const finalPropertyType =
        values.propertyType === "Others"
          ? values.otherPropertyType
          : values.propertyType;

      const submissionData = {
        ...values,
        propertyType: finalPropertyType,
      };

      await postRequirement(submissionData);
      message.success(
        "Requirement posted successfully! Our team will contact you soon."
      );
      form.resetFields();
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Error posting requirement:", error);
      message.error(
        error.response?.data?.message ||
          "Failed to post requirement. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyTypeChange = (value) => {
    setShowOtherType(value === "Others");
  };

  const handleLocationSearch = async (value) => {
    if (!value || value.length < 3) return;
    setSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&limit=1&addressdetails=1`
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name, address } = response.data[0];
        const locality = address.suburb || address.town || address.village || address.hamlet || address.city_district || "";
        
        form.setFieldsValue({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          locationText: display_name,
          locality: locality,
        });
      } else {
        message.warning("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      message.error("Error searching location.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section with Gradient */}
      <div className="bg-linear-to-r from-[#1e3a8a] to-[#06b6d4] pt-28 md:pt-36 lg:pt-48 pb-20 md:pb-28 lg:pb-32 px-4 text-center text-white">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
          Let Us Know What You Need
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-blue-50 opacity-90 max-w-2xl mx-auto">
          Just complete these simple steps. Get Instant quotes from Verified Suppliers
        </p>
      </div>

      {/* Main Form Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          {/* Left Section: Form */}
          <div className="lg:w-2/3 p-6 md:p-10 border-r border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Requirement Details
              </h2>
              <div className="h-1 w-20 bg-[#f15b22] mt-2 rounded-full" />
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                <Form.Item
                  name="fullName"
                  label={<span className="font-semibold">Full Name</span>}
                  rules={[{ required: true, message: "Please enter name" }]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>

                <Form.Item
                  name="phoneNumber"
                  label={<span className="font-semibold">Mobile Number</span>}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || String(value).trim() === "") return Promise.reject(new Error("Enter a valid 10-digit phone number"));
                        const digits = String(value).replace(/\D/g, "");
                        if (digits.length !== 10) return Promise.reject(new Error("Enter a valid 10-digit phone number"));
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="9876543210"
                    maxLength={10}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (!/^\d+$/.test(pasted)) e.preventDefault();
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="heardFrom"
                  label={<span className="font-semibold">Lead Source (Marketing)</span>}
                >
                  <Select placeholder="Select source">
                    <Option value="Social Media">Social Media</Option>
                    <Option value="Facebook">Facebook</Option>
                    <Option value="Instagram">Instagram</Option>
                    <Option value="YouTube">YouTube</Option>
                    <Option value="LinkedIn">LinkedIn</Option>
                    <Option value="WhatsApp">WhatsApp</Option>
                    <Option value="Google Search">Google Search</Option>
                    <Option value="Reference">Reference from Known Person</Option>
                    <Option value="Newspaper/Ad">Newspaper/Ad</Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="needTimeframe"
                  label={<span className="font-semibold">When do you need it?</span>}
                  rules={[{ required: true, message: "Please select your timeframe" }]}
                >
                  <Select placeholder="e.g. Immediate, 30 days, etc.">
                    <Option value="Immediate">Immediate</Option>
                    <Option value="Within 15 days">Within 15 days</Option>
                    <Option value="Within 30 days">Within 30 days</Option>
                    <Option value="Within 2 months">Within 2 months</Option>
                    <Option value="Needed, but no time enclosure">Needed, but no time enclosure</Option>
                    <Option value="Just looking">Just looking</Option>
                  </Select>
                </Form.Item>


                <Form.Item
                  name="category"
                  label={<span className="font-semibold">Category</span>}
                  rules={[{ required: true, message: "Field required" }]}
                >
                  <Select placeholder="Looking to Rent or Sell/Buy?">
                    <Option value="Rent">Rent</Option>
                    <Option value="Sell/Buy">Sell/Buy</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="usageType"
                  label={<span className="font-semibold">Usage Type</span>}
                  rules={[{ required: true, message: "Field required" }]}
                >
                  <Select placeholder="Residential or Commercial?">
                    <Option value="Residential">Residential</Option>
                    <Option value="Commercial">Commercial</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="propertyType"
                  label={<span className="font-semibold">Property Type</span>}
                  rules={[{ required: true, message: "Field required" }]}
                >
                  <Select
                    placeholder="Select type"
                    onChange={handlePropertyTypeChange}
                    disabled={!usageType}
                  >
                    {filteredPropertyTypes.map((type) => (
                      <Option key={type._id} value={type.name}>
                        {type.name}
                      </Option>
                    ))}
                    <Option value="Others">Others</Option>
                  </Select>
                </Form.Item>

                {showOtherType && (
                  <Form.Item
                    name="otherPropertyType"
                    label={<span className="font-semibold">Specify Type</span>}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Enter property type" />
                  </Form.Item>
                )}

                <div className="lg:col-span-2 mb-4">
                  <Form.Item
                    label={<span className="font-semibold text-slate-700">Preferred Location</span>}
                    required
                    className="mb-0"
                  >
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input.Search
                        placeholder="Type to search location (e.g. Kottakuppam)"
                        onSearch={handleLocationSearch}
                        loading={searching}
                        enterButton={<Search size={18} />}
                        className="w-full"
                      />
                      <Form.Item
                        name="locationText"
                        noStyle
                        rules={[{ required: true, message: "Please search and select a location" }]}
                      >
                        <Input 
                          placeholder="Verified location will appear here..." 
                          prefix={<MapPin size={18} className="text-blue-500" />}
                          readOnly
                          className="bg-blue-50/50 border-blue-100 font-medium"
                        />
                      </Form.Item>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      Note: You must search and select a location from the search bar to ensure accurate matching.
                    </p>
                  </Form.Item>

                  {/* Hidden inputs for coordinates */}
                  <Form.Item name="lat" hidden><Input /></Form.Item>
                  <Form.Item name="lng" hidden><Input /></Form.Item>
                </div>

                <Form.Item
                  label={
                    <span className="font-semibold">
                      Approx. Budget Range
                      <span className="ml-2 text-[11px] font-normal text-slate-400 normal-case">
                        (e.g. 2500000 = ₹25 Lakhs)
                      </span>
                    </span>
                  }
                  className="lg:col-span-2"
                >
                  {/* Quick-pick preset chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {BUDGET_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          form.setFieldsValue({ maxBudget: p.value });
                          setMaxBudgetVal(p.value);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          maxBudgetVal === p.value
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400 self-center ml-1">← Quick-set Max Budget</span>
                  </div>

                  <div className="flex gap-4">
                    {/* Min Budget */}
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        name="minBudget"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Min (e.g. 1000000)"
                          controls={false}
                          min={0}
                          formatter={(value) => value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                          parser={(value) => value.replace(/[^0-9]/g, "")}
                          onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                          onChange={(val) => setMinBudgetVal(val)}
                        />
                      </Form.Item>
                      {formatBudgetLabel(minBudgetVal) && (
                        <div className="mt-1 text-xs font-bold text-blue-600 pl-1">
                          = {formatBudgetLabel(minBudgetVal)}
                        </div>
                      )}
                    </div>

                    {/* Max Budget */}
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        name="maxBudget"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Max (e.g. 5000000)"
                          controls={false}
                          min={0}
                          formatter={(value) => value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                          parser={(value) => value.replace(/[^0-9]/g, "")}
                          onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                          onChange={(val) => setMaxBudgetVal(val)}
                        />
                      </Form.Item>
                      {formatBudgetLabel(maxBudgetVal) && (
                        <div className="mt-1 text-xs font-bold text-blue-600 pl-1">
                          = {formatBudgetLabel(maxBudgetVal)}
                        </div>
                      )}
                    </div>
                  </div>
                </Form.Item>

                <Form.Item
                  name="propertyPreferences"
                  label={<span className="font-semibold">Property Preferences</span>}
                  className="lg:col-span-2"
                >
                  <TextArea rows={2} placeholder="e.g. 3 BHK, Semi-furnished, Gated Community, Near Metro station..." />
                </Form.Item>

                <Form.Item
                  name="message"
                  label={<span className="font-semibold">Message Box</span>}
                  className="lg:col-span-2"
                >
                  <TextArea rows={3} placeholder="Any additional details or specific requirements..." />
                </Form.Item>


              </div>

              <div className="mt-8 pt-6 flex flex-col items-center justify-center border-t border-gray-100">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full md:w-auto px-16 h-14 bg-[#f15b22]! hover:bg-[#d84315]! border-none text-lg font-bold rounded-xl shadow-lg shadow-orange-500/20"
                >
                  Submit Requirement
                </Button>
                <p className="text-xs text-slate-400 mt-4">
                  By clicking Submit Requirement, I accept the <Link to="/terms-and-condition" className="underline! cursor-pointer hover:text-orange-500!">T&C</Link> and <Link to="/privacy-policy" className="underline! cursor-pointer hover:text-orange-500!">Privacy Policy</Link>
                </p>
              </div>
            </Form>
          </div>

          {/* Right Section: Advantages */}
          <div className="lg:w-1/3 p-6 md:p-10 bg-gray-50/50 flex flex-col gap-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 border-b-2 border-[#f15b22] w-fit pb-2 mb-8">
                Buyers Advantages?
              </h2>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-md shrink-0 flex items-center justify-center text-[#1e3a8a]">
                    <Timer size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Immediate Matches</h3>
                    <p className="text-sm text-slate-500 mt-1">Get contacted by property owners and verified agents instantly.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-md shrink-0 flex items-center justify-center text-[#1e3a8a]">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Verified Listings</h3>
                    <p className="text-sm text-slate-500 mt-1">High-quality, verified properties tailored to your specific needs.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-md shrink-0 flex items-center justify-center text-[#1e3a8a]">
                    <ListChecks size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Curated Choices</h3>
                    <p className="text-sm text-slate-500 mt-1">Get the power to choose from the best handpicked properties.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-md shrink-0 flex items-center justify-center text-[#1e3a8a]">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Trusted Assistance</h3>
                    <p className="text-sm text-slate-500 mt-1">Our verified agents or builders will contact you.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-[#166aa8] mb-2 uppercase text-xs tracking-wider">Need Quick Help?</h4>
              <p className="text-sm text-slate-600 mb-4 font-medium">Talk to our support team for any custom requirements.</p>
              <Button 
                onClick={() => navigate('/contact')}
                className="w-full h-11 border-[#166aa8] text-[#166aa8] hover:bg-blue-50 font-bold rounded-lg flex items-center justify-center gap-2"
              >
                Contact Us <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRequirementPage;
