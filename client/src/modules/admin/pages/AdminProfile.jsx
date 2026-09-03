import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Upload,
  Select,
  InputNumber,
} from "antd";
import { User, Mail, Phone, Lock, Save, Camera, ShieldCheck, Briefcase, Share2, Edit3, X, Hash, UserPlus } from "lucide-react";
import ImgCrop from "antd-img-crop";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Loader from "../../../components/Common/Loader";
import { getImageUrl } from "@/utils/imageUrl";
import PhoneVerificationModal from "@/components/Auth/PhoneVerificationModal";
import { toast } from "react-hot-toast";

const { Title, Text } = Typography;
const { Option } = Select;

const AdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { user, refreshUser, refetchUser } = useAuth();
  const [fileList, setFileList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [hasInitialImage, setHasInitialImage] = useState(false);
  const [imageSize, setImageSize] = useState(null);

  const [logoFileList, setLogoFileList] = useState([]);
  const [hasInitialLogo, setHasInitialLogo] = useState(false);
  const [logoSize, setLogoSize] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    const fetchBusinessTypes = async () => {
      try {
        const response = await api.get("/business-types");
        setBusinessTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch business types", error);
      }
    };
    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get("/users/me");
        if (response.data.success) {
          const userData = response.data.user;
          const initialValues = {
            ...userData,
            ...userData.builderProfile,
            businessType: userData.businessType?._id,
            languagesKnown: userData.builderProfile?.languagesKnown?.join(", "),
            website: userData.builderProfile?.socialLinks?.website,
            instagram: userData.builderProfile?.socialLinks?.instagram,
            facebook: userData.builderProfile?.socialLinks?.facebook,
            linkedin: userData.builderProfile?.socialLinks?.linkedin,
          };
          form.setFieldsValue(initialValues);
          setSelectedBusinessType(userData.businessType?._id);

          // Set initial image if exists
          if (userData.profile_image) {
            setHasInitialImage(true);
            setFileList([
              {
                uid: "-1",
                name: "profile.png",
                status: "done",
                url: getImageUrl(userData.profile_image),
              },
            ]);
          } else {
            setHasInitialImage(false);
            setFileList([]);
          }

          // Set initial logo if exists
          if (userData.builderProfile?.companyLogo) {
            setHasInitialLogo(true);
            setLogoFileList([
              {
                uid: "-2",
                name: "logo.webp",
                status: "done",
                url: getImageUrl(userData.builderProfile.companyLogo),
              },
            ]);
          } else {
            setHasInitialLogo(false);
            setLogoFileList([]);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        message.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
      if (values.businessType) {
        formData.append("businessType", values.businessType);
      }

      const selectedBT = businessTypes.find(bt => bt._id === values.businessType);
      const isBuilder = selectedBT?.name?.match(/Builder|Promoter/i);

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
        if (fileList.length > 0) setHasInitialImage(true);
        else if (formData.get("remove_image")) setHasInitialImage(false);

        if (logoFileList.length > 0) setHasInitialLogo(true);
        else if (formData.get("remove_company_logo")) setHasInitialLogo(false);

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
    // Finalize update for all fields
    const currentValues = form.getFieldsValue();
    handleUpdateProfile(currentValues, true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form values to current user state
    const initialValues = {
      ...user,
      ...user.builderProfile,
      businessType: user.businessType?._id,
      languagesKnown: user.builderProfile?.languagesKnown?.join(", "),
      website: user.builderProfile?.socialLinks?.website,
      instagram: user.builderProfile?.socialLinks?.instagram,
      facebook: user.builderProfile?.socialLinks?.facebook,
      linkedin: user.builderProfile?.socialLinks?.linkedin,
    };
    form.setFieldsValue(initialValues);
    setSelectedBusinessType(user.businessType?._id);

    if (user.profile_image) {
      setFileList([{ uid: "-1", name: "profile.png", status: "done", url: getImageUrl(user.profile_image) }]);
      setHasInitialImage(true);
    } else {
      setFileList([]);
      setHasInitialImage(false);
    }

    if (user.builderProfile?.companyLogo) {
      setLogoFileList([{ uid: "-2", name: "logo.webp", status: "done", url: getImageUrl(user.builderProfile.companyLogo) }]);
      setHasInitialLogo(true);
    } else {
      setLogoFileList([]);
      setHasInitialLogo(false);
    }
  };

  const onLogoChange = ({ fileList: newFileList }) => {
    setLogoFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;
      const size = file.size / 1024 / 1024;
      setLogoSize(size < 1 ? `${(file.size / 1024).toFixed(2)} KB` : `${size.toFixed(2)} MB`);
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
        <Title level={1} className="!text-3xl !mb-2 !font-semibold text-slate-800">Admin Profile</Title>
        <Text className="text-slate-500 text-base">
          Manage your account details and security settings
        </Text>
      </div>

      <div className="space-y-8">
        {/* Profile Information Section */}
        <Card 
          title={<span className="text-lg font-semibold text-slate-800 pt-2 block">Profile Information</span>}
          extra={
            <div className="flex justify-end gap-2 pt-2">
              {!isEditing ? (
                <Button
                  type="default"
                  icon={<Edit3 size={18} className="mr-1" />}
                  className="h-10 px-4 rounded-xl border-blue-200 text-blue-600 hover:!border-blue-400 hover:!text-blue-700 font-bold text-sm bg-white transition-all shadow-sm"
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
                    icon={<X size={18} className="mr-1" />}
                    className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:!border-slate-300 hover:!text-slate-700 font-semibold text-sm transition-all"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => form.submit()}
                    icon={<Save size={18} className="mr-1" />}
                    loading={saving}
                    className="h-10 px-4 rounded-xl bg-blue-600 hover:!bg-blue-700 border-none font-bold text-sm shadow-md shadow-blue-200/50 flex items-center transition-all"
                  >
                    Save Profile
                  </Button>
                </>
              )}
            </div>
          }
          className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
          styles={{ 
            header: { borderBottom: 'none', padding: '24px 32px 0' },
            body: { padding: '32px' } 
          }}
        >
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile} className="space-y-6">
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
                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) {
                          message.error("Image must smaller than 5MB!");
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
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-5">
              <Form.Item
                name="name"
                label={<span className="text-slate-600 font-medium">Full Name</span>}
                rules={[{ required: true, message: "Please enter your name" }]}
                required={false}
                className="!mb-0"
              >
                <Input
                  disabled={!isEditing}
                  prefix={<User size={18} className="text-slate-400 mr-2" />}
                  className={`h-12 rounded-xl border-slate-200 ${!isEditing ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "hover:border-blue-400 focus:border-blue-500"} shadow-sm`}
                />
              </Form.Item>

              <Form.Item
                name="businessType"
                label={<span className="text-slate-600 font-medium">Business Type</span>}
                className="!mb-0"
              >
                <Select
                  disabled={!isEditing}
                  placeholder="Select Business Type"
                  className={`h-12 w-full rounded-xl custom-select-height ${!isEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                  onChange={(val) => setSelectedBusinessType(val)}
                  prefix={<Briefcase size={18} className="text-slate-400 mr-2" />}
                >
                  {businessTypes.map((bt) => (
                    <Option key={bt._id} value={bt._id}>
                      {bt.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={20}>
                <Col xs={24} md={12}>
                  <Form.Item name="userId" label={<span className="text-slate-600 font-medium">User ID</span>} className="!mb-0">
                    <Input
                      prefix={<Hash size={18} className="text-slate-400 mr-2" />}
                      disabled
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed shadow-sm"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="referralCode" label={<span className="text-slate-600 font-medium">Referral ID</span>} className="!mb-0">
                    <Input
                      prefix={<Share2 size={18} className="text-slate-400 mr-2" />}
                      disabled
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed shadow-sm"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="phone"
                label={<span className="text-slate-600 font-medium">Contact Phone Number</span>}
                rules={[
                  { required: true, message: "Please enter phone number" },
                  { pattern: /^\d{10}$/, message: "Must be 10 digits" },
                ]}
                required={false}
                className="!mb-0"
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

              {/* Builder Specific Fields */}
              {businessTypes.find(bt => bt._id === selectedBusinessType)?.name?.match(/Builder|Promoter/i) && (
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
                             const isJpgOrPngOrSvg = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/webp";
                             if (!isJpgOrPngOrSvg) {
                               message.error("You can only upload JPG/PNG/SVG/WEBP file!");
                               return Upload.LIST_IGNORE;
                             }
                             const isLt5M = file.size / 1024 / 1024 < 5;
                             if (!isLt5M) {
                               message.error("Image must smaller than 5MB!");
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
                      <Col xs={24} md={12}>
                        <Form.Item name="companyName" label={<span className="text-slate-600 font-medium">Company Name</span>} className="!mb-4">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="ABC Constructions" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="gstNumber"
                          label={<span className="text-slate-600 font-medium">GST Number (Optional)</span>}
                          className="!mb-4"
                          rules={[
                            {
                              validator: (_, value) => {
                                if (!value || value.trim() === "") return Promise.resolve();
                                const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                                if (gstRegex.test(value.trim().toUpperCase())) return Promise.resolve();
                                return Promise.reject(new Error("Invalid GSTIN format. Expected: 22AAAAA0000A1Z5 (15 characters)"));
                              },
                            },
                          ]}
                        >
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="22AAAAA0000A1Z5" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="officeAddress" label={<span className="text-slate-600 font-medium">Office Address</span>} className="!mb-4">
                      <Input.TextArea disabled={!isEditing} rows={2} className="rounded-xl shadow-sm" placeholder="123, Business Park, Chennai" />
                    </Form.Item>

                    <Row gutter={20}>
                      <Col xs={24} md={12}>
                        <Form.Item name="experienceYears" label={<span className="text-slate-600 font-medium">Years of Experience</span>} className="!mb-4">
                          <InputNumber 
                            disabled={!isEditing} 
                            className="w-full h-12 rounded-xl flex items-center shadow-sm" 
                            placeholder="10" 
                            min={0} 
                            precision={0}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="reraNumber" label={<span className="text-slate-600 font-medium">RERA Registration No. (Optional)</span>} className="!mb-4">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="TN/01/Building/0001" />
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
                      <Col xs={24} md={12}>
                        <Form.Item name="nationality" label={<span className="text-slate-600 font-medium">Nationality</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="Indian" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="languagesKnown" label={<span className="text-slate-600 font-medium">Languages Known (comma separated)</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="English, Tamil, Hindi" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div className="pt-10">
                    <Title level={5} className="!text-base !font-bold text-slate-800 mb-4 uppercase tracking-wider opacity-60">Social Links</Title>
                    <Row gutter={20}>
                      <Col xs={24} md={12}>
                        <Form.Item name="website" label={<span className="text-slate-600 font-medium">Website</span>} className="!mb-4">
                          <Input disabled={!isEditing} prefix={<Share2 size={16} />} className="h-12 rounded-xl shadow-sm" placeholder="https://abc.com" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="linkedin" label={<span className="text-slate-600 font-medium">LinkedIn</span>} className="!mb-4">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="linkedin.com/in/builder" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="instagram" label={<span className="text-slate-600 font-medium">Instagram</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="instagram.com/builder" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="facebook" label={<span className="text-slate-600 font-medium">Facebook</span>} className="!mb-0">
                          <Input disabled={!isEditing} className="h-12 rounded-xl shadow-sm" placeholder="facebook.com/builder" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6">
              <div className="text-center mt-2">
                <span className="text-slate-400 text-sm font-medium">* indicates required field</span>
              </div>
            </div>
          </Form>
        </Card>
      </div>

      <PhoneVerificationModal 
        open={showVerifyModal} 
        onCancel={() => setShowVerifyModal(false)} 
        newPhone={pendingPhone}
        onSuccess={handleVerifySuccess}
      />

      <style>{`
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

        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item-container,
        .profile-uploader.ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item {
          width: 280px !important;
          height: 160px !important;
          border-radius: 24px !important;
        }

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
        
        .custom-select-height .ant-select-selector {
          height: 48px !important;
          padding-top: 8px !important;
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
        }
        
        .custom-select-height.ant-select-disabled .ant-select-selector {
          background-color: #f8fafc !important;
          color: #64748b !important;
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;
