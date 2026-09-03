import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Upload,
  Select,
  InputNumber,
} from "antd";
import { User, Mail, Phone, Lock, Save, Camera, ShieldCheck, Clock, CheckCircle, XCircle, Hash, Share2, CreditCard, IndianRupee, Edit3, X, Briefcase } from "lucide-react";
import { Table, Tag } from "antd";
import moment from "moment";
import ImgCrop from "antd-img-crop";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Loader from "../../../../components/Common/Loader";
import { getImageUrl } from "@/utils/imageUrl";
import { useSocket } from "@/context/SocketContext";
import PhoneVerificationModal from "@/components/Auth/PhoneVerificationModal";
import { toast } from "react-hot-toast";

const { Title, Text } = Typography;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user, refreshUser, refetchUser } = useAuth();
  const [fileList, setFileList] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [settings, setSettings] = useState(null);

  const [hasInitialImage, setHasInitialImage] = useState(false);
  const [logoFileList, setLogoFileList] = useState([]);
  const [hasInitialLogo, setHasInitialLogo] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const [logoSize, setLogoSize] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      const handleBadgeStatusChange = (data) => {
        if (refetchUser) {
          refetchUser(); // Ensure user context states are refreshed
        }
        if (data && data.message) {
          message.success(data.message);
        }
      };
      
      socket.on("badge-status-changed", handleBadgeStatusChange);
      
      return () => {
        socket.off("badge-status-changed", handleBadgeStatusChange);
      };
    }
  }, [socket, refetchUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get("/users/me");
        if (response.data.success) {
          const initialValues = {
            ...response.data.user,
            ...response.data.user.builderProfile,
            languagesKnown: response.data.user.builderProfile?.languagesKnown?.join(", "),
            website: response.data.user.builderProfile?.socialLinks?.website,
            instagram: response.data.user.builderProfile?.socialLinks?.instagram,
            facebook: response.data.user.builderProfile?.socialLinks?.facebook,
            linkedin: response.data.user.builderProfile?.socialLinks?.linkedin,
          };
          form.setFieldsValue(initialValues);

          // Set initial image if exists
          if (response.data.user.profile_image) {
            setFileList([
              {
                uid: "-1",
                name: "profile.png",
                status: "done",
                url: getImageUrl(response.data.user.profile_image),
              },
            ]);
            setHasInitialImage(true);
          } else {
            setFileList([]);
            setHasInitialImage(false);
          }

          // Set initial logo if exists
          if (response.data.user.builderProfile?.companyLogo) {
            setLogoFileList([
              {
                uid: "-2",
                name: "logo.webp",
                status: "done",
                url: getImageUrl(response.data.user.builderProfile.companyLogo),
              },
            ]);
            setHasInitialLogo(true);
          } else {
            setLogoFileList([]);
            setHasInitialLogo(false);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        message.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    const fetchSubscriptionData = async () => {
      try {
        const subRes = await api.get("/subscriptions/my-subscription");
        setActiveSub(subRes.data);
      } catch (error) {
        console.error("Failed to fetch subscription data", error);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await api.get("/website-settings");
        if (res.data && res.data.length > 0) {
          setSettings(res.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchProfile();
    fetchSubscriptionData();
    fetchSettings();
  }, [form]);

  const handleUpdateProfile = async (values, isPhoneVerified = false) => {
    // Check if phone has changed
    if (values.phone !== user.phone && !isPhoneVerified) {
      setSaving(true);
      try {
        const res = await api.post("/users/request-phone-update", { newPhone: values.phone });
        if (res.data.success) {
          setPendingPhone(values.phone);
          setShowVerifyModal(true);
          setSaving(false);
          return;
        }
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to request phone update");
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    try {
      if (!user || !user._id) return message.error("User ID missing");

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("phone", values.phone); // Use values.phone now

      const isBuilder =
        user?.businessType?.name?.match(/Builder|Promoter/i);
// ... existing logic for builderDetail and files ...
      if (isBuilder) {
        const builderDetailResource = {
          phonePrimary: values.phonePrimary || values.phone,
          email: values.email,
          companyName: values.companyName,
          gstNumber: values.gstNumber,
          officeAddress: values.officeAddress,
          experienceYears: values.experienceYears,
          aboutCompany: values.aboutCompany,
          reraNumber: values.reraNumber,
          nationality: values.nationality,
          languagesKnown: values.languagesKnown
            ? values.languagesKnown.split(",").map((s) => s.trim())
            : [],
          socialLinks: {
            website: values.website,
            instagram: values.instagram,
            facebook: values.facebook,
            linkedin: values.linkedin,
          },
        };
        formData.append("builderDetail", JSON.stringify(builderDetailResource));
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("profile_image", fileList[0].originFileObj);
      } else if (fileList.length === 0 && hasInitialImage) {
        formData.append("remove_image", "true");
      }

      if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
        formData.append("company_logo", logoFileList[0].originFileObj);
      } else if (logoFileList.length === 0 && hasInitialLogo) {
        formData.append("remove_company_logo", "true");
      }

      const response = await api.put(
        `/users/update-user-by-id/${user._id}`,
        formData,
        {
          headers: {
            "Content-Type": undefined,
          },
        },
      );

      if (response.data) {
        message.success("Profile updated successfully!");
        // Update local state to reflect change
        if (fileList.length > 0) {
          setHasInitialImage(true);
        } else if (formData.get("remove_image")) {
          setHasInitialImage(false);
        }
        if (refreshUser) refreshUser(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update failed", error);
      message.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySuccess = () => {
    if (refetchUser) refetchUser();
    // Trigger update for other fields and finalize UI
    const currentValues = form.getFieldsValue();
    handleUpdateProfile(currentValues, true);
  };

  const handleCancelEdit = () => {
    const initialValues = {
      ...user,
      ...user.builderProfile,
      languagesKnown: user.builderProfile?.languagesKnown?.join(", "),
      website: user.builderProfile?.socialLinks?.website,
      instagram: user.builderProfile?.socialLinks?.instagram,
      facebook: user.builderProfile?.socialLinks?.facebook,
      linkedin: user.builderProfile?.socialLinks?.linkedin,
    };
    form.setFieldsValue(initialValues);

    if (user?.profile_image) {
      setFileList([
        {
          uid: "-1",
          name: "profile.png",
          status: "done",
          url: getImageUrl(user.profile_image),
        },
      ]);
      setHasInitialImage(true);
    } else {
      setFileList([]);
      setHasInitialImage(false);
    }

    if (user?.builderProfile?.companyLogo) {
      setLogoFileList([
        {
          uid: "-2",
          name: "logo.webp",
          status: "done",
          url: getImageUrl(user.builderProfile.companyLogo),
        },
      ]);
      setHasInitialLogo(true);
    } else {
      setLogoFileList([]);
      setHasInitialLogo(false);
    }

    setImageSize(null);
    setLogoSize(null);
    setIsEditing(false);
  };

  const onLogoChange = ({ fileList: newFileList }) => {
    setLogoFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;
      const size = file.size / 1024 / 1024; // in MB
      if (size < 1) {
        setLogoSize(`${(file.size / 1024).toFixed(2)} KB`);
      } else {
        setLogoSize(`${size.toFixed(2)} MB`);
      }
    } else {
      setLogoSize(null);
    }
  };

  const onChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;
      const size = file.size / 1024 / 1024; // in MB
      if (size < 1) {
        setImageSize(`${(file.size / 1024).toFixed(2)} KB`);
      } else {
        setImageSize(`${size.toFixed(2)} MB`);
      }
    } else {
      setImageSize(null);
    }
  };

  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  if (loading) {
    return <Loader variant="panel" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-[#f4f4f5] min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-10">
        <Title level={1} className="!text-3xl !mb-2 !font-semibold text-slate-800">Seller Profile</Title>
        <Text className="text-slate-500 text-base">
          Manage your account details and security settings
        </Text>
        {activeSub && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-slate-600 font-medium">Current Plan:</span>
            <Tag color="#fef3c7" className="!text-amber-700 !border-amber-200 !rounded-md px-3 py-0.5 font-bold text-xs uppercase tracking-wider">
              {activeSub.plan?.name || settings?.defaultPlanName || "BASIC"}
            </Tag>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Profile Information Section */}
        <Card 
          title={<span className="text-lg font-semibold text-slate-800 pt-2 block">Profile Information</span>}
          extra={
            <div className="flex gap-3 pt-2">
              {!isEditing ? (
                <Button
                  type="default"
                  icon={<Edit3 size={18} className="mr-2" />}
                  className="h-10 px-6 rounded-xl border-blue-200 text-blue-600 hover:!border-blue-400 hover:!text-blue-700 font-bold text-sm bg-white transition-all shadow-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="default"
                    icon={<X size={18} className="mr-2" />}
                    className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:!border-slate-300 hover:!text-slate-700 font-semibold text-sm transition-all"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<Save size={18} className="mr-2" />}
                    loading={saving}
                    className="h-10 px-6 rounded-xl bg-blue-600 hover:!bg-blue-700 border-none font-bold text-sm shadow-lg shadow-blue-200/50 flex items-center transition-all"
                    onClick={() => form.submit()}
                  >
                    Save Profile
                  </Button>
                </>
              )}
            </div>
          }
          className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
          styles={{ 
            header: { borderBottom: 'none', padding: '24px 32px 0', display: 'flex', alignItems: 'center' },
            body: { padding: '32px' } 
          }}
        >
          <Form id="seller-profile-form" form={form} layout="vertical" onFinish={handleUpdateProfile} className="space-y-6">
            {/* Upload Section Centered */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <ImgCrop rotationSlider aspect={1/1} showGrid>
                    <Upload
                      action={null}
                      listType="picture-card"
                      fileList={fileList}
                      onChange={onChange}
                      onPreview={onPreview}
                      beforeUpload={(file) => {
                        const isJpgOrPngOrSvg =
                          file.type === "image/jpeg" ||
                          file.type === "image/png" ||
                          file.type === "image/svg+xml";
                        if (!isJpgOrPngOrSvg) {
                          message.error("You can only upload JPG/PNG/SVG file!");
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                      maxCount={1}
                      disabled={!isEditing}
                      className="profile-uploader"
                    >
                      {fileList.length < 1 && (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          <div className="bg-blue-600 p-3 rounded-full mb-3 shadow-md shadow-blue-200">
                            <User size={24} className="text-white" />
                          </div>
                          <div className="text-sm text-slate-600 font-medium">Upload profile photo</div>
                        </div>
                      )}
                    </Upload>
                  </ImgCrop>
                </div>
                
                {isEditing && fileList.length > 0 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    className="hover:!bg-transparent text-xs font-medium"
                    onClick={() => setFileList([])}
                  >
                    Remove Photo
                  </Button>
                )}

                {/* Verification Badge Status */}
                <div className="mt-4">
                  {user?.badgeVerified ? (
                    <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-100 font-semibold shadow-sm">
                      <CheckCircle size={18} />
                      <span>Verified Badge Active</span>
                    </div>
                  ) : user?.badgeRequestStatus === "pending" ? (
                    <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 font-semibold shadow-sm">
                      <Clock size={18} />
                      <span>Verification Pending</span>
                    </div>
                  ) : user?.badgeRequestStatus === "rejected" ? (
                    <div className="inline-flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2 rounded-xl border border-red-100 font-semibold shadow-sm">
                      <XCircle size={18} />
                      <span>Verification Rejected</span>
                    </div>
                  ) : (
                    <Button
                      icon={<ShieldCheck size={20} className="mr-2" />}
                      className="h-10 px-6 rounded-xl bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600 font-semibold shadow-sm flex items-center transition-all"
                      onClick={async () => {
                        const isBuilder = user?.businessType?.name?.match(/Builder|Promoter/i);
                        
                        if (isBuilder) {
                          const bp = user.builderProfile;
                          const missing = [];
                          if (!bp?.companyName) missing.push("Company Name");
                          if (!bp?.officeAddress) missing.push("Office Address");
                          if (!bp?.experienceYears) missing.push("Experience Years");
                          if (!bp?.companyLogo) missing.push("Company Logo");
                          
                          if (missing.length > 0) {
                            message.error({
                              content: `Please complete your profile first. Missing fields: ${missing.join(", ")}`,
                              duration: 4,
                              style: { marginTop: '10vh' }
                            });
                            return;
                          }
                        }

                        try {
                          const res = await api.post("/users/request-badge");
                          message.success(res.data.message);
                          refetchUser();
                        } catch (err) {
                          message.error(err.response?.data?.error || "Failed to send request");
                        }
                      }}
                    >
                      Request Verification Badge
                    </Button>
                  )}
                </div>
                </div>
              </div>

            {/* Inputs Section */}
            <div className="space-y-5">
              <Row gutter={20}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label={<span className="text-slate-600 font-medium">Full Name</span>}
                    rules={[{ required: true, message: "Please enter your name" }]}
                    required={false}
                    className="!mb-4"
                  >
                    <Input
                      disabled={!isEditing}
                      prefix={<User size={18} className="text-slate-400 mr-2" />}
                      className={`h-12 rounded-xl border-slate-200 ${!isEditing ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "hover:border-blue-400 focus:border-blue-500"} shadow-sm`}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label={<span className="text-slate-600 font-medium">Contact Phone Number</span>}
                    rules={[
                      { required: true, message: "Please enter phone number" },
                      { pattern: /^\d{10}$/, message: "Must be 10 digits" },
                    ]}
                    required={false}
                    className="!mb-4"
                  >
                    <Input
                      disabled={!isEditing}
                      prefix={<Phone size={18} className="text-slate-400 mr-2" />}
                      placeholder="8270652229"
                      className={`h-12 rounded-xl border-slate-200 ${!isEditing ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "hover:border-blue-400 focus:border-blue-500"} shadow-sm`}
                      maxLength={10}
                      onKeyPress={(e) => !/[0-9]/.test(e.key) && e.preventDefault()}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span className="text-slate-600 font-medium">Business Type</span>}
                className="!mb-4"
              >
                <Input
                  prefix={<Briefcase size={18} className="text-slate-400 mr-2" />}
                  disabled
                  value={user?.businessType?.name || "---"}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed shadow-sm"
                />
              </Form.Item>

              <Row gutter={20}>
                <Col xs={24} md={12}>
                  <Form.Item name="userId" label={<span className="text-slate-600 font-medium">User ID</span>} className="!mb-0">
                    <Input
                      prefix={<Hash size={18} className="text-slate-400 mr-2" />}
                      disabled
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="referralCode" label={<span className="text-slate-600 font-medium">Referral ID</span>} className="!mb-0">
                    <Input
                      prefix={<Share2 size={18} className="text-slate-400 mr-2" />}
                      disabled
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Builder Specific Fields */}
              {user?.businessType?.name?.match(/Builder|Promoter/i) && (
                <>
                  <div className="pt-8 border-t border-slate-100">
                    <Title level={4} className="!text-lg !font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <ShieldCheck size={20} className="text-blue-600" />
                       Builder Details
                    </Title>
                    
                    <Row gutter={20}>
                      <Col span={24}>
                        <Form.Item name="email" label={<span className="text-slate-600 font-medium">Email Address (Optional)</span>} className="!mb-4">
                          <Input disabled={!isEditing} prefix={<Mail size={18} className="text-slate-400 mr-2" />} className="h-12 rounded-xl shadow-sm" placeholder="builder@example.com" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div className="pt-6">
                    <Title level={5} className="!text-base !font-bold text-slate-800 mb-4 uppercase tracking-wider opacity-60">Company Information</Title>
                    
                    <div className="mb-6 flex flex-col items-center">
                       <Text className="text-slate-500 text-xs mb-3 font-semibold uppercase">Company Logo</Text>
                       <ImgCrop rotationSlider aspect={1/1}>
                         <Upload
                           action={null}
                           listType="picture-card"
                           fileList={logoFileList}
                           onChange={onLogoChange}
                           onPreview={onPreview}
                           disabled={!isEditing}
                           className="logo-uploader"
                           maxCount={1}
                           beforeUpload={(file) => {
                             const isJpgOrPngOrSvg =
                               file.type === "image/jpeg" ||
                               file.type === "image/png" ||
                               file.type === "image/svg+xml" ||
                               file.type === "image/webp";
                             if (!isJpgOrPngOrSvg) {
                               message.error("You can only upload JPG/PNG/SVG/WEBP file!");
                               return Upload.LIST_IGNORE;
                             }
                             return false;
                           }}
                         >
                           {logoFileList.length < 1 && (
                             <div className="flex flex-col items-center">
                               <Camera size={20} className="text-slate-400 mb-2" />
                               <div className="text-[10px] text-slate-500 font-bold uppercase">Upload Logo</div>
                             </div>
                           )}
                         </Upload>
                       </ImgCrop>
                       {isEditing && logoFileList.length > 0 && (
                          <Button type="text" danger size="small" className="mt-2 text-[10px] font-bold uppercase" onClick={() => setLogoFileList([])}>Remove Logo</Button>
                       )}
                    </div>

                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item name="companyName" label={<span className="text-slate-600 font-medium">Company Name</span>} className="!mb-4">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="ABC Constructions" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="gstNumber" 
                          label={<span className="text-slate-600 font-medium">GST Number (Optional)</span>} 
                          className="!mb-4"
                          rules={[
                            { pattern: /^[0-9]{2}[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9A-Za-z]{1}[Zz]{1}[0-9a-zA-Z]{1}$/, message: "Please enter a valid GST number (e.g. 22AAAAA0000A1Z5)" }
                          ]}
                        >
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm uppercase" placeholder="22AAAAA0000A1Z5" onChange={(e) => e.target.value = e.target.value.toUpperCase()} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="officeAddress" label={<span className="text-slate-600 font-medium">Office Address</span>} className="!mb-4">
                      <Input.TextArea disabled={!isEditing} rows={2} className="rounded-xl shadow-sm" placeholder="123, Business Park, Chennai" />
                    </Form.Item>

                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item name="experienceYears" label={<span className="text-slate-600 font-medium">Years of Experience</span>} className="!mb-4">
                          <InputNumber disabled={!isEditing} className="w-full h-12 rounded-xl flex items-center shadow-sm" placeholder="10" min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="reraNumber" 
                          label={<span className="text-slate-600 font-medium">RERA Registration No. (Optional)</span>} 
                          className="!mb-4"
                          rules={[
                            { pattern: /^[a-zA-Z0-9\/\-]+$/, message: "Please enter a valid RERA number" }
                          ]}
                        >
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm uppercase" placeholder="TN/01/Building/0001" onChange={(e) => e.target.value = e.target.value.toUpperCase()} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item 
                      name="aboutCompany" 
                      label={<span className="text-slate-600 font-medium">About Company</span>}
                      rules={[{ max: 250, message: "About Company cannot exceed 250 characters" }]}
                    >
                      <Input.TextArea 
                        disabled={!isEditing} 
                        rows={4} 
                        className="rounded-xl shadow-sm" 
                        placeholder="Briefly describe your company and achievements..." 
                        showCount 
                        maxLength={250} 
                      />
                    </Form.Item>
                  </div>

                  <div className="pt-6">
                    <Title level={5} className="!text-base !font-bold text-slate-800 mb-4 uppercase tracking-wider opacity-60">Personal Details</Title>
                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item name="nationality" label={<span className="text-slate-600 font-medium">Nationality</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="Indian" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="languagesKnown" label={<span className="text-slate-600 font-medium">Languages Known (comma separated)</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="English, Tamil, Hindi" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div className="pt-10">
                    <Title level={5} className="!text-base !font-bold text-slate-800 mb-4 uppercase tracking-wider opacity-60">Social Links</Title>
                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item name="website" label={<span className="text-slate-600 font-medium">Website</span>} className="!mb-4">
                          <Input disabled={!isEditing} prefix={<Share2 size={16} />} className="h-12 rounded-xl shadow-sm" placeholder="https://abc.com" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="linkedin" label={<span className="text-slate-600 font-medium">LinkedIn</span>} className="!mb-4">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="linkedin.com/in/builder" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="instagram" label={<span className="text-slate-600 font-medium">Instagram</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="instagram.com/builder" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="facebook" label={<span className="text-slate-600 font-medium">Facebook</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="facebook.com/builder" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </div>

            {/* Required Field Indicator */}
            <div className="text-center mt-6">
              <span className="text-slate-400 text-sm font-medium">* indicates required field</span>
            </div>
          </Form>
        </Card>

        {/* Subscription Status Section */}
        {/* <Card 
          title={
            <div className="pt-2">
              <span className="text-lg font-semibold text-slate-800">Subscription Status</span>
            </div>
          }
          className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
          styles={{ 
            header: { borderBottom: 'none', padding: '24px 32px 0' },
            body: { padding: '32px' } 
          }}
        >
          <div className="bg-[#f5f8ff] p-8 rounded-[2rem] border border-blue-50 relative mb-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Title level={3} className="!text-2xl !font-semibold !text-[#1a2b56] !mb-0">
                  {activeSub?.plan?.name || settings?.defaultPlanName || "BASIC"}
                </Title>
                <Text className="text-blue-600 text-base font-semibold block">
                  {activeSub?.plan?.propertyLimit === -1 ? "Unlimited" : activeSub?.plan?.propertyLimit || "Unlimited"} Properties Upload Limit
                </Text>
                {activeSub?.endDate && (
                  <Text className="flex items-center gap-3 text-slate-500 text-sm pt-2 font-medium">
                    <Clock size={16} />
                    <span>Expires on {moment(activeSub.endDate).format("DD MMM YYYY")}</span>
                  </Text>
                )}
              </div>
              <div className="bg-green-50 text-green-600 border border-green-100 rounded-lg px-3 py-1 font-bold text-xs tracking-widest uppercase">
                ACTIVE
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="primary" 
              icon={<CreditCard size={20} className="mr-2" />}
              className="h-12 px-10 rounded-xl bg-blue-600 hover:!bg-blue-700 border-none font-bold text-base shadow-lg shadow-blue-200/50 flex items-center transition-all"
              onClick={() => navigate("/seller/upgrade-plan")}
            >
              Upgrade Plan
            </Button>
          </div>
        </Card> */}
      </div>
      <PhoneVerificationModal 
        open={showVerifyModal} 
        onCancel={() => setShowVerifyModal(false)} 
        newPhone={pendingPhone}
        onSuccess={handleVerifySuccess}
      />

      <style>{`
        /* Target the specific upload box inside the profile-uploader wrapper */
        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select {
          width: 280px !important;
          height: 160px !important;
          border-radius: 24px !important;
          border: 1px solid #e2e8f0 !important;
          background: #f8fbff !important;
          margin: 0 !important;
          overflow: hidden !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select:hover {
          border-color: #3b82f6 !important;
          background: #f0f7ff !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05) !important;
        }

        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select:hover .rounded-full {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }

        /* Target the uploaded image container to match the new dimensions */
        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item-container,
        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item {
          width: 280px !important;
          height: 160px !important;
          border-radius: 24px !important;
        }

        .profile-uploader.ant-upload-wrapper .ant-upload-list-item-done,
        .logo-uploader.ant-upload-wrapper .ant-upload-list-item-done {
           border: 1px solid #e2e8f0 !important;
        }

        /* Logo Uploader Specifics (Square like Profile) */
        .logo-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select,
        .logo-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item-container,
        .logo-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item {
          width: 120px !important;
          height: 120px !important;
          border-radius: 16px !important;
        }

        .logo-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select {
          border: 1px dashed #ced4da !important;
          background: #f8fbff !important;
        }

        .logo-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select:hover {
          border-color: #3b82f6 !important;
          background: #f0f7ff !important;
        }

        .ant-form-item-label label {
          font-size: 14px !important;
        }
      `}</style>
    </div>
  );
};

export default Profile;

