import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  message,
  Popconfirm,
  Input,
  Typography,
  Modal,
  Form,
  Checkbox,
  Descriptions,
  Image,
  Carousel,
  Tabs,
  Badge,
  Avatar,
  Divider,
  Card,
} from "antd";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  MapPin,
  BedDouble,
  Ruler,
  Home,
  FileCheck,
  Calendar,
  X,
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Square,
  Layers,
  Zap,
  Layout,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bath,
  ShieldCheck,
  Droplet,
  MoreHorizontal,
  Phone,
  User,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  ArrowUpCircle,
} from "lucide-react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
import { checkPropertyListingLimit } from "@/utils/propertyLimits";

import { formatIndianPrice, formatPriceRange } from "@/utils/formatPrice";
import { getImageUrl } from "@/utils/imageUrl";

const CountdownTimer = ({
  createdAt,
  approvedAt,
  status,
  validityDays = 21,
  isAdmin = false,
}) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (isAdmin || status === "Pending") {
      return;
    }

    const calculateTimeLeft = () => {
      const baseDate = approvedAt ? new Date(approvedAt) : new Date(createdAt);
      const expiryDate = new Date(
        baseDate.getTime() + validityDays * 24 * 60 * 60 * 1000,
      );
      const now = new Date();
      const difference = expiryDate - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000); // Update every second

    return () => clearInterval(timer);
  }, [createdAt, approvedAt, status, validityDays, isAdmin]);

  const displayTime = isAdmin
    ? "No Expiry"
    : status === "Pending"
      ? "Pending Approval"
      : timeLeft;

  if (!isAdmin && status !== "Pending" && displayTime === "Expired")
    return null;
  if (!isAdmin && !displayTime) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm ${isAdmin ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}
    >
      <Calendar size={13} className="shrink-0" />
      <span className="text-[11px] font-bold whitespace-nowrap">
        {isAdmin ? displayTime : `Exp: ${displayTime}`}
      </span>
    </div>
  );
};

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [marketingPlans, setMarketingPlans] = useState([]);
  const [marketingRequests, setMarketingRequests] = useState([]);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [propertyToSell, setPropertyToSell] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const navigate = useNavigate();
  const { user, refetchUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [settings, setSettings] = useState(null);

  const handleViewDetail = (property) => {
    setSelectedProperty(property);
    setMainImage(property.media?.images?.[0] || "");
    setViewModalVisible(true);
    setIsDescriptionExpanded(false);
  };

  const handleCloseModal = () => {
    setViewModalVisible(false);
    setSelectedProperty(null);
    setMainImage("");
  };

  const fetchProperties = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/properties/fetch-all-property?limit=100&seller_id=${user._id}`,
      );

      if (response.data && response.data.properties) {
        setProperties(response.data.properties);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      message.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = React.useCallback(async () => {
    setLoadingSubscription(true);
    try {
      const res = await api.get("/subscriptions/my-subscription");
      setSubscription(res.data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

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

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchSubscription();
      fetchSettings();
    }
  }, [user, fetchProperties]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const property_id = params.get("property_id");

    if (success) {
      message.success("Payment successful! Your plan has been updated.");
      refetchUser();
      fetchSubscription();
      fetchProperties();
      
      if (properties.length > 0 && property_id) {
        const prop = properties.find((p) => p._id === property_id);
        if (prop) {
          setSelectedProperty(prop);
          setIsMarketingModalOpen(true);
        }
      }

      // Clear the query param without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [properties, refetchUser, fetchProperties, fetchSubscription]);

  const fetchMarketingRequests = async () => {
    try {
      const response = await api.get("/marketing/requests/seller");
      setMarketingRequests(response.data.data);
    } catch (error) {
      console.error("Failed to fetch marketing requests:", error);
    }
  };

  const fetchMarketingPlans = async () => {
    try {
      const response = await api.get("/marketing/plans");
      setMarketingPlans(response.data.data);
    } catch (error) {
      console.error("Failed to fetch marketing plans:", error);
    }
  };

  const handleMarkAsSoldClick = (property) => {
    setPropertyToSell(property);
    setSoldPrice(property.soldPrice || "");
    setSoldModalVisible(true);
  };

  const handleConfirmSold = async () => {
    try {
      const isSold = !propertyToSell.isSold;
      const payload = {
        isSold: isSold,
      };

      if (isSold && soldPrice) {
        payload.soldPrice = soldPrice;
      }

      const response = await api.put(
        `/properties/update-property-by-id/${propertyToSell._id}`,
        payload,
      );

      message.success(
        `Property marked as ${isSold ? "Sold Out" : "Available"}`,
      );

      // Update local state for immediate feedback in the detail modal if it's open
      if (selectedProperty && selectedProperty._id === propertyToSell._id) {
        setSelectedProperty((prev) => ({
          ...prev,
          isSold: isSold,
          status: isSold ? "sold" : "available",
          soldPrice: isSold ? soldPrice : undefined,
        }));
      }

      setSoldModalVisible(false);
      fetchProperties();
    } catch (error) {
      console.error("Error updating sold status:", error);
      message.error("Failed to update status");
    }
  };

  const handleRequestMarketing = async (planId) => {
    setLoadingPlanId(planId);
    try {
      await api.post("/marketing/requests", {
        property_id: selectedProperty._id,
        plan_id: planId,
      });
      message.success("Request sent! Our team will contact you shortly.");
      setIsMarketingModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to send request");
    } finally {
      setLoadingPlanId(null);
      fetchMarketingRequests(); // Refresh requests after submitting
    }
  };

  useEffect(() => {
    fetchMarketingPlans();
    if (user) fetchMarketingRequests();
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/properties/delete-property-by-id/${id}`);
      message.success("Property deleted successfully");
      fetchProperties();
      refetchUser(); // Refresh user state to update global property count
    } catch {
      message.error("Failed to delete property");
    }
  };

  // Filter properties logic
  const filteredProperties = properties.filter((property) => {
    const searchLower = searchText.toLowerCase();
    return (
      property.basicInfo?.title?.toLowerCase().includes(searchLower) ||
      property.location?.city?.toLowerCase().includes(searchLower) ||
      property.location?.street?.toLowerCase().includes(searchLower)
    );
  });

  const activePropertyCount = properties.filter(p => 
    ["Active", "Pending", "Edit Pending Approval"].includes(p.status)
  ).length;

  const { canPost, limit: propertyLimit, reason } = checkPropertyListingLimit(user, properties.length);
  const isPlanExpired = reason === "expired" || user?.activeSubscription?.status === "expired";
  const isLimitReached = !canPost && (reason === "limit_reached" || reason === "expired");
  const activePlan = user?.activeSubscription?.plan;
  const planName = isPlanExpired ? "PLAN EXPIRED" : (activePlan?.displayName || activePlan?.name || "FREE");
  const internalPlanName = activePlan?.name || "FREE";

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Subscription Banner */}
     <div className="relative rounded-3xl p-[1px] ">
  <div className="bg-white rounded-3xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6">

    {/* LEFT SECTION */}
    <div className="flex items-center gap-5 w-full">
      
      {/* ICON */}
      <div className={`p-4 bg-gradient-to-br ${isPlanExpired ? 'from-red-500 to-rose-600' : 'from-indigo-500 to-purple-600'} text-white rounded-2xl shadow-lg`}>
        <CreditCard size={30} />
      </div>

      {/* TEXT */}
      <div className="w-full">
        
        {/* PLAN LABEL */}
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Current Status
          </span>

          <span className={`${isPlanExpired ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"} text-xs font-bold px-3 py-1 rounded-full`}>
            {planName}
          </span>
        </div>

        {/* MAIN TITLE */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          {isPlanExpired 
            ? "Your Plan has Expired"
            : isLimitReached
              ? "Property Limit Reached"
              : `${activePropertyCount} / ${
                  propertyLimit === -1 ? "Unlimited" : propertyLimit
                } Properties Used`}
        </h2>

        {/* DESCRIPTION */}
        <p className="text-gray-500 text-sm mt-1">
          {isPlanExpired 
            ? "Please renew your subscription to continue listing and managing properties."
            : internalPlanName === "Standard"
            ? `${planName} plan supports up to ${propertyLimit} listings with better visibility.`
            : internalPlanName === "Premium"
            ? `${planName} plan gives enhanced listings with top priority exposure.`
            : internalPlanName === "Pro"
            ? `${planName} plan gives unlimited listings with the highest priority exposure.`
            : `${planName} plan allows up to ${propertyLimit} property listings.`}
        </p>
      </div>
    </div>

    {/* RIGHT SECTION */}
    <div className="flex flex-col items-center gap-3">

      {/* BUTTON */}
      <Button
        type="primary"
        size="large"
        icon={<ArrowUpCircle size={18} />}
        onClick={() => navigate("/seller/upgrade-plan")}
        className={`bg-gradient-to-r ${isPlanExpired ? 'from-red-600 to-rose-600' : 'from-indigo-600 to-purple-600'} border-none hover:opacity-90 rounded-xl px-6 py-3 font-semibold shadow-md flex items-center gap-2`}
      >
        {isPlanExpired ? "Renew Plan" : "Upgrade Plan"}
      </Button>
    </div>
  </div>
</div>
      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            My Properties
          </Title>
          <Text type="secondary">Manage and track your property listings</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            const { canPost, reason, message: limitMessage, redirectPath } = checkPropertyListingLimit(user, activePropertyCount);
            if (!canPost) {
              message.warning(limitMessage);
              if (reason === "unverified") {
                const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
                navigate(role === "SELLER" ? "/seller/profile" : "/user/profile");
              } else if (reason === "limit_reached" || reason === "expired") {
                navigate(redirectPath || "/seller/upgrade-plan");
              }
              return;
            }
            navigate("/seller/add-property");
          }}
          className={`h-11 px-8 rounded-xl font-bold flex items-center gap-2 border-none transition-all shadow-md hover:scale-105 ${
            isLimitReached
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLimitReached ? "Upgrade to Add More" : "Add New Property"}
        </Button>
      </div>

      {/* Search Bar */}
      {/* <div className="max-w-md w-full">
        <Card
          variant="borderless"
          className="shadow-sm rounded-xl overflow-hidden"
          styles={{ body: { padding: "4px 8px" } }}
        >
          <Input
            prefix={<Search size={18} className="text-gray-400 ml-1" />}
            placeholder="Search by Property Name or Location"
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full border-none h-9 text-sm focus:ring-0"
            size="middle"
            allowClear
          />
        </Card>
      </div> */}

      {loading ? (
        <div className="relative flex justify-center items-center py-60 bg-white/20 rounded-3xl border border-gray-100 w-full min-h-[500px] overflow-hidden">
          <Loader variant="panel" />
        </div>
      ) : filteredProperties.length > 0 ? (
        <div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' 
          }}
        >
          {filteredProperties.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-400/50 overflow-hidden group flex flex-col h-full w-full mx-auto sm:mx-0"
            >
              {/* Image Section */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={getImageUrl(
                    property.media?.featuredImage || (property.media?.images && property.media.images.length > 0 ? property.media.images[0] : null),
                  )}
                  alt={property.basicInfo?.title || "Property"}
                  className="w-full h-full object-cover transform transition-transform duration-700"
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-4 right-4 flex flex-row gap-2 z-10">
                  <div
                    className={`px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wider uppercase backdrop-blur-md border ${
                      property.status === "Active" ||
                      property.status === "available"
                        ? "bg-green-500/80 text-white border-green-400/50"
                        : property.status === "Pending"
                          ? "bg-amber-500/80 text-white border-amber-400/50"
                          : "bg-red-600 text-white border-red-400/50"
                    }`}
                  >
                    {property.status === "Pending"
                      ? "Awaiting Approval"
                      : property.status}
                  </div>
                  {property.isSold && (
                    <div className="px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-red-600 text-white border border-red-500/50 shadow-lg">
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Verification & Countdown Overlay */}
                <div className="absolute bottom-4 inset-x-4 flex justify-between items-end z-10">
                  <div className="flex flex-col gap-2">
                    {property.isVerified && (
                      <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider shadow-lg border border-blue-500/50">
                        <CheckCircle2 size={12} strokeWidth={3} />
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="scale-90 origin-bottom-right">
                    <CountdownTimer
                      createdAt={property.createdAt}
                      approvedAt={property.approvedAt}
                      status={property.status}
                      isAdmin={
                        user?.role_id?.role_name?.toUpperCase() === "ADMIN" ||
                        user?.role?.name?.toUpperCase() === "ADMIN"
                      }
                    />
                  </div>
                </div>

                {/* Gradient Overlay for better contrast */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-3">
                  <h3 className="text-lg font-medium capitalize text-gray-900 truncate mb-1 leading-tight transition-colors">
                    {property.basicInfo?.title}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    {/* <MapPin size={13} className="mr-1.5 text-blue-500/60" /> */}
                    <span className="truncate">
                      {property.location?.city || "Location N/A"}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex items-center">
                  <div className="bg-white py-2 flex items-center gap-1">
                    <span className="text-xl font-medium text-gray-900 leading-none">
                      {formatPriceRange(
                        property.pricing?.sell?.minPrice ||
                          property.pricing?.rent?.minRent,
                        property.pricing?.sell?.maxPrice ||
                          property.pricing?.rent?.maxRent,
                        property.pricing?.sell?.price ||
                          property.pricing?.rent?.monthlyRent ||
                          0,
                      )}
                    </span>
                  </div>
                </div>

                {/* Management Actions */}
                <div className="mt-auto space-y-3 pt-5 border-t border-gray-200">
                  {/* Primary Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      block
                      icon={<Eye size={16} />}
                      onClick={() => handleViewDetail(property)}
                      className="h-10 rounded-none font-medium border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-gray-50/50 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                      View
                    </Button>
                    <Button
                      block
                      icon={<Edit size={16} />}
                      onClick={() =>
                        navigate(`/seller/add-property?edit=${property._id}`)
                      }
                      className="h-10 rounded-none font-medium border-gray-100 text-gray-600 hover:text-orange-600 hover:border-orange-600 bg-gray-50/50 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                    >
                      Edit
                    </Button>
                  </div>

                  {/* Secondary/Promotion Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const request = marketingRequests.find(
                        (r) => r.property_id?._id === property._id,
                      );
                      const isPending = property.status === "Pending";
                      const hasActiveRequest =
                        request &&
                        ["pending", "contacted"].includes(request.status);

                      return (
                        <Button
                          block
                          disabled={hasActiveRequest || isPending}
                          icon={
                            hasActiveRequest ? (
                              <CheckCircle size={16} />
                            ) : isPending ? (
                              <Clock size={16} />
                            ) : (
                              <Sparkles size={16} />
                            )
                          }
                          onClick={() => {
                            setSelectedProperty(property);
                            setIsMarketingModalOpen(true);
                          }}
                          className={`h-10 rounded-none font-medium border-none shadow-sm transition-all flex items-center justify-center gap-2 ${
                            hasActiveRequest || isPending
                              ? "bg-indigo-50 text-indigo-400"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                          }`}
                        >
                          {hasActiveRequest
                            ? "Promoted"
                            : isPending
                              ? "Wait for Approval"
                              : "Promote"}
                        </Button>
                      );
                    })()}
                    <Button
                      block
                      onClick={() => handleMarkAsSoldClick(property)}
                      className={`h-10 rounded-none font-medium border-none shadow-sm transition-all flex items-center justify-center gap-2 ${
                        property.isSold
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                    >
                      {property.isSold ? "Available" : "Mark Sold"}
                    </Button>
                  </div>

                  {/* Delete Action */}
                  <Popconfirm
                    title="Delete Property"
                    description="This action cannot be undone. Delete this listing?"
                    onConfirm={() => handleDelete(property._id)}
                    okText="Delete"
                    cancelText="Keep"
                    okButtonProps={{ danger: true, className: "rounded-lg" }}
                    cancelButtonProps={{ className: "rounded-lg" }}
                  >
                    <Button
                      type="text"
                      block
                      icon={<Trash2 size={16} />}
                      className="h-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-100! bg-red-50! border border-gray-300! transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      Remove Listing
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-4 text-gray-200">
            <Building size={64} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Properties Found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchText
              ? "We couldn't find any properties matching your search. Try different keywords."
              : "You haven't listed any properties yet. Start by adding your first property!"}
          </p>
          {!searchText && (
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => navigate("/seller/add-property")}
              className="mt-6 bg-blue-600"
            >
              Add Property
            </Button>
          )}
        </div>
      )}

      {/* Marketing Promotion Modal - Compact */}
      <Modal
        title={null}
        open={isMarketingModalOpen}
        onCancel={() => setIsMarketingModalOpen(false)}
        footer={null}
        width={850} // Reduced modal width
        centered
        className="marketing-modal pb-0"
        styles={{
          body: {
            padding: 0,
            borderRadius: "16px",
            maxHeight: "90vh",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
          },
        }}
        closeIcon={
          <div className="bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full transition-colors mt-2 mr-2">
            <X size={16} className="text-slate-700" />
          </div>
        }
      >
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            .poppins-font, .poppins-font * {
                font-family: 'Poppins', sans-serif;
            }
          `}
        </style>

        {/* Reduced vertical padding from py-10 to py-8 */}
        <div className="poppins-font bg-slate-50 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              {/* Reduced title font size */}
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
                Promote Your Property
              </h1>
              {/* Reduced subtitle font size */}
              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto">
                Get access to premium features and faster visibility. No hidden
                subscriptions. No surprises.
              </p>
            </div>

            {/* Reduced gap between cards from gap-6 to gap-4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {marketingPlans.map((plan) => {
                const isPopular = plan.isPopular;

                return (
                  <div
                    key={plan._id}
                    // Reduced card padding from px-5 py-6 to px-5 py-5
                    className={`rounded-2xl px-5 py-5 ${
                      isPopular
                        ? "bg-slate-900 shadow-xl shadow-black/10"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <h3
                      className={`text-xs uppercase tracking-wider font-semibold mb-4 ${
                        isPopular ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {plan.serviceName}
                    </h3>
                    <p
                      className={`text-[13px] leading-snug mb-4 max-w-[200px] ${
                        isPopular ? "text-white/90" : "text-slate-700"
                      }`}
                    >
                      {plan.description ||
                        "Perfect for getting your property noticed by potential buyers fast."}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <div className="flex items-baseline gap-1">
                          {/* Reduced price font size */}
                          <span
                            className={`text-3xl font-semibold leading-none ${
                              isPopular ? "text-white" : "text-slate-900"
                            }`}
                          >
                            ₹{plan.priceRange}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestMarketing(plan._id)}
                      disabled={loadingPlanId !== null}
                      // Reduced button padding and text size
                      className={`w-full py-2.5 rounded-sm text-xs font-medium mb-2.5 transition cursor-pointer flex justify-center items-center ${
                        isPopular
                          ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500"
                          : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      } ${loadingPlanId === plan._id ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {loadingPlanId === plan._id
                        ? "Processing..."
                        : "Request Plan"}
                    </button>

                    <p
                      className={`text-[11px] leading-tight max-w-[200px] mb-3 ${
                        isPopular ? "text-white/70" : "text-black/50"
                      }`}
                    >
                      Pay later. Our team will contact you.
                    </p>

                    <div
                      className={`border-t mb-3 ${
                        isPopular ? "border-white/20" : "border-slate-200"
                      }`}
                    ></div>

                    {/* Reduced spacing between features */}
                    <div className="space-y-2">
                       {/* Features list removed as per simplified fields */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Sold Modal */}
      <Modal
        title={
          propertyToSell?.isSold ? "Mark as Available" : "Mark as Sold Out"
        }
        open={soldModalVisible}
        onOk={handleConfirmSold}
        onCancel={() => setSoldModalVisible(false)}
        okText="Update Status"
        cancelText="Cancel"
      >
        <p className="mb-4">
          Are you sure you want to mark{" "}
          <b>{propertyToSell?.basicInfo?.title || "this property"}</b> as{" "}
          {propertyToSell?.isSold ? "Available" : "Sold Out"}?
        </p>
        {!propertyToSell?.isSold && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sold Price (Optional)
            </label>
            <Input
              prefix="₹"
              placeholder="Enter sold amount"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              type="number"
            />
          </div>
        )}
      </Modal>

      {/* Property Detail Modal - Updated Premium Design */}
      <Modal
        title={null}
        open={viewModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width="100%"
        style={{
          maxWidth: "900px",
          top: 20,
          paddingBottom: 20,
        }}
        closeIcon={
          <div className="bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-600" />
          </div>
        }
        className="property-detail-modal-premium rounded-2xl overflow-hidden p-0"
        styles={{
          body: {
            padding: 0,
            maxHeight: "85vh",
            overflowY: "auto",
          },
        }}
      >
        {selectedProperty && (
          <div className="bg-white">
            {/* Image Header */}
            <div className="relative bg-gray-100">
              {selectedProperty.media?.images &&
              selectedProperty.media.images.length > 0 ? (
                <Carousel autoplay className="property-carousel">
                  {selectedProperty.media.images.map((img, index) => (
                    <div key={index} className="h-75 md:h-100 w-full">
                      <img
                        src={getImageUrl(img)}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </Carousel>
              ) : (
                <img
                  src={getImageUrl(null)}
                  alt="No Property Images"
                  className="w-full h-75 md:h-100 object-cover"
                />
              )}

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white z-10 pointer-events-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Tag
                        color={
                          selectedProperty.status === "available"
                            ? "success"
                            : "error"
                        }
                        className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-white/20 text-white"
                      >
                        {selectedProperty.status?.toUpperCase()}
                      </Tag>
                      {selectedProperty.isVerified && (
                        <Tag
                          color="blue"
                          className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-blue-500/80 text-white"
                        >
                          Verified
                        </Tag>
                      )}
                      <Tag className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-black/40 text-white">
                        {selectedProperty.basicInfo?.propertyType || "Unknown"}
                      </Tag>
                      {selectedProperty.isSold && (
                        <Tag className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-red-600/80 text-white">
                          SOLD OUT
                        </Tag>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 shadow-sm wrap-break-word">
                      {selectedProperty.basicInfo?.title || "Untitled Property"}
                    </h1>
                    <p className="flex items-center gap-2 text-gray-200 text-sm md:text-base font-medium">
                      <MapPin size={16} />
                      {selectedProperty.location?.city || "Unknown City"},{" "}
                      {selectedProperty.location?.state || ""} (
                      {selectedProperty.location?.pincode})
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-300 mb-1 font-medium">
                      Price
                    </p>
                    <div className="flex flex-col items-start md:items-end">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white shadow-sm">
                        {formatPriceRange(
                          selectedProperty.pricing?.sell?.minPrice ||
                            selectedProperty.pricing?.rent?.minRent,
                          selectedProperty.pricing?.sell?.maxPrice ||
                            selectedProperty.pricing?.rent?.maxRent,
                          selectedProperty.pricing?.sell?.price ||
                            selectedProperty.pricing?.rent?.monthlyRent ||
                            0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="p-6 md:p-8">
              <Tabs
                defaultActiveKey="1"
                type="card"
                size="large"
                className="custom-tabs"
                items={[
                  {
                    key: "1",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <Home size={18} /> Overview
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-8 animate-fadeIn">
                        {/* Key Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                            <span className="text-blue-400 mb-2">
                              <Ruler size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              {selectedProperty.specifications?.area?.minArea ||
                              selectedProperty.specifications?.area?.maxArea
                                ? "Area Range"
                                : "Area Size"}
                            </span>
                            <span className="text-base font-bold text-gray-800">
                              {(() => {
                                const minA =
                                  selectedProperty.specifications?.area
                                    ?.minArea;
                                const maxA =
                                  selectedProperty.specifications?.area
                                    ?.maxArea;
                                const total =
                                  selectedProperty.specifications?.area
                                    ?.totalArea;
                                if (minA && maxA)
                                  return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sqft`;
                                if (minA)
                                  return `${Number(minA).toLocaleString()}+ sqft`;
                                return total ? `${total} sqft` : "N/A";
                              })()}
                            </span>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
                            <span className="text-purple-400 mb-2">
                              <Building size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              Type
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                              {selectedProperty.basicInfo?.propertyType ||
                                "N/A"}
                            </span>
                          </div>
                          {selectedProperty.basicInfo?.approvalType && (Array.isArray(selectedProperty.basicInfo.approvalType) ? selectedProperty.basicInfo.approvalType.length > 0 : selectedProperty.basicInfo.approvalType) && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                              <span className="text-green-400 mb-2">
                                <FileCheck size={24} />
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                Approval
                              </span>
                              <span className="text-lg font-bold text-gray-800">
                                {(() => {
                                  const types = Array.isArray(selectedProperty.basicInfo.approvalType) 
                                    ? selectedProperty.basicInfo.approvalType 
                                    : [selectedProperty.basicInfo.approvalType];
                                  return types.map(t => t.toLowerCase().includes("approved") ? t : `${t} Approved`).join(", ");
                                })()}
                              </span>
                            </div>
                          )}
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
                            <span className="text-orange-400 mb-2">
                              <Calendar size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              Posted
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                              {new Date(
                                selectedProperty.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-3">
                            Description
                          </h3>
                          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                              {isDescriptionExpanded
                                ? selectedProperty.basicInfo?.description || "No Description"
                                : (() => {
                                    const desc = selectedProperty.basicInfo?.description || "No Description";
                                    if (desc === "No Description") return desc;
                                    const words = desc.trim().split(/\s+/);
                                    if (words.length <= 200) return desc;
                                    return words.slice(0, 200).join(" ") + "...";
                                  })()}
                            </p>
                            {selectedProperty.basicInfo?.description?.trim().split(/\s+/).filter(w => w.length > 0).length > 200 && (
                              <Button
                                type="link"
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="p-0 h-auto mt-2 text-blue-600 font-semibold flex items-center gap-1"
                              >
                                {isDescriptionExpanded ? (
                                  <>Show Less <ChevronLeft size={14} className="rotate-90" /></>
                                ) : (
                                  <>Show More <ChevronRight size={14} className="rotate-90" /></>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "2",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <BedDouble size={18} /> Features
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-8 animate-fadeIn">
                        {selectedProperty.amenities &&
                        selectedProperty.amenities.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {selectedProperty.amenities.map(
                              (amenity, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                                >
                                  <span className="text-gray-700 font-medium text-center">
                                    {amenity}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">
                              No amenities listed.
                            </p>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "3",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <Layout size={18} /> Specifications
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Area Specs */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Square className="text-orange-500" /> Area Info
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">
                                  {selectedProperty.specifications?.area
                                    ?.minArea ||
                                  selectedProperty.specifications?.area?.maxArea
                                    ? "Area Range"
                                    : "Total Area"}
                                </span>
                                <span className="font-bold text-gray-800">
                                  {(() => {
                                    const minA =
                                      selectedProperty.specifications?.area
                                        ?.minArea;
                                    const maxA =
                                      selectedProperty.specifications?.area
                                        ?.maxArea;
                                    const total =
                                      selectedProperty.specifications?.area
                                        ?.totalArea;
                                    if (minA && maxA)
                                      return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sqft`;
                                    if (minA)
                                      return `${Number(minA).toLocaleString()}+ sqft`;
                                    return total ? `${total} sqft` : "N/A";
                                  })()}
                                </span>
                              </div>
                              {selectedProperty.specifications?.area
                                ?.builtupArea && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">
                                    Built-up Area
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {
                                      selectedProperty.specifications.area
                                        .builtupArea
                                    }{" "}
                                    sqft
                                  </span>
                                </div>
                              )}
                              {selectedProperty.specifications?.area
                                ?.carpetArea && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">
                                    Carpet Area
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {
                                      selectedProperty.specifications.area
                                        .carpetArea
                                    }{" "}
                                    sqft
                                  </span>
                                </div>
                              )}
                              {(selectedProperty.specifications?.facing ||
                                selectedProperty.specifications?.residential
                                  ?.facing) && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">Facing</span>
                                  <span className="font-bold text-blue-600">
                                    {selectedProperty.specifications.facing ||
                                      selectedProperty.specifications
                                        .residential.facing}
                                  </span>
                                </div>
                              )}
                              {selectedProperty.legal?.propertyStatus && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">
                                    Property Status
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    {selectedProperty.legal.propertyStatus}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedProperty.specifications?.floor &&
                            (selectedProperty.specifications.floor.totalFloor ||
                              selectedProperty.specifications.floor
                                .propertyOnFloor) && (
                              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Layers className="text-purple-500" /> Floor
                                  Info
                                </h3>
                                <div className="space-y-3">
                                  {selectedProperty.specifications.floor
                                    .totalFloor && (
                                    <div className="flex justify-between border-b pb-2">
                                      <span className="text-gray-500">
                                        Total Floors
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        {
                                          selectedProperty.specifications.floor
                                            .totalFloor
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.floor
                                    .propertyOnFloor && (
                                    <div className="flex justify-between border-b pb-2">
                                      <span className="text-gray-500">
                                        Property on Floor
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        {
                                          selectedProperty.specifications.floor
                                            .propertyOnFloor
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedProperty.specifications?.residential &&
                            (selectedProperty.specifications.residential
                              .bedrooms > 0 ||
                              selectedProperty.specifications.residential
                                .bathrooms > 0 ||
                              selectedProperty.specifications.residential
                                .balconies > 0 ||
                              selectedProperty.specifications.residential
                                .facing ||
                              selectedProperty.specifications.residential
                                .furnishing) && (
                              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Home className="text-blue-500" /> Residential
                                  details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {selectedProperty.specifications.residential
                                    .bedrooms > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        BHK
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .residential.bedrooms
                                        }{" "}
                                        BHK
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.residential
                                    .bathrooms > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Bathrooms
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .residential.bathrooms
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.residential
                                    .balconies > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Balconies
                                      </p>
                                      <p className="font-bold">
                                        {selectedProperty.specifications
                                          .residential.balconies || 0}
                                      </p>
                                    </div>
                                  )}
                                  {(selectedProperty.specifications.residential
                                    .hall !== undefined ||
                                    selectedProperty.specifications.residential
                                      .kitchens !== undefined) && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Hall/Kitchen
                                      </p>
                                      <p className="font-bold">
                                        {selectedProperty.specifications
                                          .residential.hall ?? 0}
                                        H /{" "}
                                        {selectedProperty.specifications
                                          .residential.kitchens ?? 0}
                                        K
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.residential
                                    .furnishing && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Furnishing
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .residential.furnishing
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedProperty.specifications?.utilities &&
                            (selectedProperty.specifications.utilities
                              .waterSupply ||
                              selectedProperty.specifications.utilities
                                .powerBackup) && (
                              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Zap className="text-yellow-500" /> Utilities
                                </h3>
                                <div className="space-y-3">
                                  {selectedProperty.specifications.utilities
                                    .waterSupply && (
                                    <div className="flex justify-between border-b pb-2">
                                      <span className="text-gray-500">
                                        Water Supply
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        {
                                          selectedProperty.specifications
                                            .utilities.waterSupply
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.utilities
                                    .powerBackup && (
                                    <div className="flex justify-between border-b pb-2">
                                      <span className="text-gray-500">
                                        Power Backup
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        Yes
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Plot Specs */}
                          {selectedProperty.specifications?.plot &&
                            (selectedProperty.specifications.plot.plotLength ||
                              selectedProperty.specifications.plot.plotWidth ||
                              selectedProperty.specifications.plot.roadWidth ||
                              selectedProperty.specifications.plot.cornerPlot ||
                              selectedProperty.specifications.plot
                                .gatedCommunity) && (
                              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Compass className="text-green-500" /> Plot
                                  details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {selectedProperty.specifications.plot
                                    .plotLength && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Length
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications.plot
                                            .plotLength
                                        }{" "}
                                        ft
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.plot
                                    .plotWidth && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Width
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications.plot
                                            .plotWidth
                                        }{" "}
                                        ft
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.plot
                                    .roadWidth && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Road Width
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications.plot
                                            .roadWidth
                                        }{" "}
                                        ft
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.plot
                                    .cornerPlot && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Corner Plot
                                      </p>
                                      <p className="font-bold">Yes</p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.plot
                                    .gatedCommunity && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Gated Community
                                      </p>
                                      <p className="font-bold">Yes</p>
                                    </div>
                                  )}
                                  {(selectedProperty.specifications?.facing ||
                                    selectedProperty.specifications?.residential
                                      ?.facing) && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Facing
                                      </p>
                                      <p className="font-bold">
                                        {selectedProperty.specifications
                                          .facing ||
                                          selectedProperty.specifications
                                            .residential.facing}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedProperty.specifications?.commercial &&
                            (selectedProperty.specifications.commercial
                              .cabins ||
                              selectedProperty.specifications.commercial
                                .meetingRooms ||
                              selectedProperty.specifications.commercial
                                .workstations ||
                              selectedProperty.specifications.commercial
                                .washrooms ||
                              selectedProperty.specifications.commercial
                                .pantry ||
                              selectedProperty.specifications.commercial
                                .receptionArea ||
                              selectedProperty.specifications.commercial
                                .suitableFor) && (
                              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Building className="text-orange-500" />{" "}
                                  Commercial details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {selectedProperty.specifications.commercial
                                    .cabins && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Cabins
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .commercial.cabins
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .meetingRooms && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Meeting Rooms
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .commercial.meetingRooms
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .workstations && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Workstations
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .commercial.workstations
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .washrooms && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Washrooms
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .commercial.washrooms
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .pantry && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Pantry
                                      </p>
                                      <p className="font-bold">Yes</p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .receptionArea && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Reception
                                      </p>
                                      <p className="font-bold">Yes</p>
                                    </div>
                                  )}
                                  {selectedProperty.specifications.commercial
                                    .suitableFor && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-gray-400 uppercase">
                                        Suitable For
                                      </p>
                                      <p className="font-bold">
                                        {
                                          selectedProperty.specifications
                                            .commercial.suitableFor
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {(selectedProperty.specifications?.facing ||
                                    selectedProperty.specifications?.residential
                                      ?.facing) && (
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase">
                                        Facing
                                      </p>
                                      <p className="font-bold">
                                        {selectedProperty.specifications
                                          .facing ||
                                          selectedProperty.specifications
                                            .residential.facing}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "4",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <MapPin size={18} /> Location
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-6 animate-fadeIn">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1">
                            <MapPin className="text-blue-500" /> Address Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Street / Building
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.addressLine1 ||
                                  "N/A"}
                              </p>
                              {selectedProperty.location?.addressLine2 && (
                                <p className="text-gray-600 mt-1">
                                  {selectedProperty.location.addressLine2}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                City & State
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.city
                                  ? `${selectedProperty.location.city}, `
                                  : ""}
                                {selectedProperty.location?.state || ""}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Country
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.country || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Pincode
                              </label>
                              <Tag className="text-base px-3 py-1 bg-gray-100 text-gray-700 border-gray-200 rounded-md mt-1 font-mono">
                                {selectedProperty.location?.pincode || "N/A"}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap sm:justify-end gap-3">
                <Button
                  size="large"
                  onClick={handleCloseModal}
                  className="hover:bg-gray-100 rounded-xl"
                >
                  Close
                </Button>

                {(() => {
                  const request = marketingRequests.find(
                    (r) => r.property_id?._id === selectedProperty._id,
                  );
                  const hasActiveRequest =
                    request &&
                    ["pending", "contacted"].includes(request.status);

                  return (
                    <Button
                      size="large"
                      disabled={hasActiveRequest}
                      icon={
                        hasActiveRequest ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Sparkles size={18} />
                        )
                      }
                      onClick={() => {
                        setIsMarketingModalOpen(true);
                      }}
                      className={`rounded-xl font-semibold border-none flex items-center gap-2 ${
                        hasActiveRequest
                          ? "bg-indigo-50 text-indigo-400"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                      }`}
                    >
                      {hasActiveRequest ? "Promoted" : "Promote Property"}
                    </Button>
                  );
                })()}

                <Button
                  size="large"
                  onClick={() => handleMarkAsSoldClick(selectedProperty)}
                  className={`rounded-xl font-semibold border-none flex items-center gap-2 ${
                    selectedProperty.isSold
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                      : "bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                  }`}
                >
                  {selectedProperty.isSold ? "Mark Available" : "Mark Sold Out"}
                </Button>

                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    navigate(
                      `/seller/add-property?edit=${selectedProperty?._id}`,
                    );
                    handleCloseModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl font-semibold shadow-md"
                >
                  Edit Property
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Styles */}
      <style>{`
        .property-detail-modal-premium .ant-modal-content {
          border-radius: 24px !important;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-tabs .ant-tabs-nav-list {
          gap: 8px;
        }
        .custom-tabs .ant-tabs-tab {
          border-radius: 12px 12px 0 0 !important;
          border: 1px solid #f3f4f6 !important;
          background: #f9fafb !important;
          margin-right: 0 !important;
        }
        .custom-tabs .ant-tabs-tab-active {
          background: #fff !important;
          border-bottom-color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default MyProperties;
