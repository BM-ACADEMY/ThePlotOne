import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Input,
  message,
  Button,
  Popconfirm,
  Tooltip,
  Typography,
  Card,
  Modal,
  Carousel,
  Tabs,
  Badge,
  Avatar,
  Divider,
  Row,
  Col,
  Space,
  Select,
  DatePicker
} from "antd";
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
import {
  Search,
  Download,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Inbox,
  User,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";
import moment from "moment";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { formatIndianPrice, formatPriceRange } from "@/utils/formatPrice";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Common/Loader";
import { exportEnquiriesExcel } from "@/utils/exportEnquiriesExcel";

const CountdownTimer = ({ createdAt, validityDays = 21, isAdmin = false }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const calculateTimeLeft = () => {
      const createdDate = new Date(createdAt);
      const expiryDate = new Date(
        createdDate.getTime() + validityDays * 24 * 60 * 60 * 1000,
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
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [createdAt, validityDays, isAdmin]);

  const displayTime = isAdmin ? "No Expiry" : timeLeft;

  if (!isAdmin && displayTime === "Expired") return null;
  if (!isAdmin && !displayTime) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm ${
        isAdmin
          ? "bg-blue-50 text-blue-600 border-blue-100"
          : "bg-amber-50 text-amber-600 border-amber-100"
      }`}
    >
      <span className="text-[11px] font-medium whitespace-nowrap">
        {isAdmin ? displayTime : `Exp: ${displayTime}`}
      </span>
    </div>
  );
};

const SellerEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [subscriptionState, setSubscriptionState] = useState({
    isActive: true,
    isLimitReached: false,
    limit: 0,
    used: 0
  });
  const [filterStatus, setFilterStatus] = useState("new");
  const [dateRange, setDateRange] = useState(null);
  const [updatingLeadId, setUpdatingLeadId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewDetail = (property) => {
    navigate(`/properties/${property.slug || property._id}`);
  };

  useEffect(() => {
    const init = async () => {
      await checkSubscription();
      await fetchEnquiries();
    };
    init();
  }, []);

  const checkSubscription = async () => {
    try {
      const res = await api.get("/subscriptions/my-subscription");
      if (res.data) {
        const leadsLimit = res.data.plan?.leadsLimit ?? 0;
        const leadsUsed = res.data.leadsUsed ?? 0;
        const isLimitReached = leadsLimit !== -1 && leadsUsed >= leadsLimit;
        
        setSubscriptionState({
          isActive: true,
          isLimitReached: isLimitReached,
          limit: leadsLimit,
          used: leadsUsed
        });
      } else {
        setSubscriptionState({ isActive: false, isLimitReached: false, limit: 0, used: 0 });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionState({ isActive: false, isLimitReached: false, limit: 0, used: 0 });
    }
  };

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enquiries/fetch-all");
      setEnquiries(res.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      message.error("Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };


  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === "new").length,
    portal: enquiries.filter((e) => e.type !== "whatsapp_lead").length,
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {moment(date).format("DD MMM YYYY")}
          </span>
          <span className="text-xs text-gray-500">
            {moment(date).format("hh:mm A")}
          </span>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Property",
      dataIndex: "property_id",
      key: "property",
      render: (property, record) => {
        if (!property && !record.property_title) {
          return (
            <span className="text-gray-400 italic font-medium px-2 py-1 bg-gray-50 rounded-md text-xs">Property Removed</span>
          );
        }

        const title = property?.basicInfo?.title || property?.title || record.property_title || "Untitled Property";
        const locationStr = property 
          ? (typeof property.location === "string" 
              ? property.location 
              : (property.location?.locality || property.location?.city || "Pondicherry"))
          : "Pondicherry";

        const imageUrl = property
          ? getImageUrl(
              property.media?.featuredImage || 
              property.media?.images?.[0] || 
              property.images?.[0]?.image_url || 
              property.images?.[0]
            )
          : getImageUrl(null);

        if (!property) {
          return (
            <div className="flex items-center gap-3 opacity-60">
              <div className="relative shrink-0">
                <img
                  src={imageUrl}
                  alt="prop"
                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-100"
                />
              </div>
              <div className="flex flex-col max-w-50">
                <span className="font-semibold text-gray-700 truncate">
                  {title}
                </span>
                <span className="text-xs text-gray-400 truncate flex items-center gap-1">
                  {locationStr} <Tag color="default" className="text-[9px] px-1 py-0 m-0 border-none rounded bg-gray-100 text-gray-500">Removed</Tag>
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-all duration-300"
            onClick={() => handleViewDetail(property)}
          >
            <div className="relative shrink-0">
              <img
                src={imageUrl}
                alt="prop"
                className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-100 group-hover:border-blue-300 group-hover:shadow-md transition-all"
              />
            </div>
            <div className="flex flex-col max-w-50">
              <span className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {title}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {locationStr}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: "Enquirer",
      key: "enquirer",
      render: (record) => {
        const isLocked = record.enquirer_phone?.includes('X');
        return (
          <div className="relative group/lock">
            <div className={`flex items-center gap-3 ${isLocked ? "blur-[1px] select-none opacity-30" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              {(record.enquirer_name || "G").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">
                {record.enquirer_name || "Guest"}
              </span>
              <span className={`text-xs ${record.enquirer_phone?.includes('X') ? "text-gray-400 font-medium tracking-tighter" : "text-blue-600 font-medium"}`}>
                {record.enquirer_phone}
              </span>
            </div>
          </div>
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-white/90  border border-amber-200 p-2 rounded-full shadow-lg transform transition-transform group-hover/lock:scale-110">
                  <Lock size={16} className="text-amber-600" />
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      width: 250,
      render: (msg) => {
        const isLocked = msg?.includes("Locked");
        return (
          <div className={`${isLocked ? "blur-[1px] select-none opacity-30" : ""}`}>
          {msg?.includes("Locked") ? (
            <div className="text-[13px] text-gray-400 italic line-clamp-1">
              "This is a private message from a potential property buyer interested in your listing."
            </div>
          ) : (
            <Tooltip title={msg} placement="topLeft" styles={{ root: { maxWidth: "300px" } }}>
              <div className="max-w-60 truncate text-gray-600 text-sm italic">
                "{msg || "No message provided"}"
              </div>
            </Tooltip>
          )}
        </div>
      );
    },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag
          color={type === "whatsapp_lead" ? "green" : "blue"}
          className="rounded-full px-3 border-none flex items-center justify-center w-fit uppercase text-[10px] font-bold"
        >
          {type === "whatsapp_lead" ? "WhatsApp" : "Portal"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => (
        <Select
          value={status || "new"}
          loading={updatingLeadId === record._id}
          onChange={(val) => handleStatusUpdate(record._id, val, record.type)}
          className={`status-select ${status === "new" ? "select-new" : "select-contact"}`}
          variant="borderless"
          classNames={{ popup: { root: "rounded-xl border-none shadow-xl" } }}
        >
          <Option value="new">NEW</Option>
          <Option value="contacted">CONTACT</Option>
          <Option value="closed">CLOSED</Option>
        </Select>
      ),
    },
  ];

  // Combined multi-criteria filtering
  const filteredEnquiries = enquiries.filter((item) => {
    // 1. Search Text Match (Name, Phone, Property, Location)
    const matchesSearch = !searchText || 
      item.property_id?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.property_id?.basicInfo?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.property_title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.enquirer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.enquirer_phone?.includes(searchText) ||
      item.property_id?.location?.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.property_id?.location?.locality?.toLowerCase().includes(searchText.toLowerCase()) ||
      (typeof item.property_id?.location === 'string' && item.property_id?.location?.toLowerCase().includes(searchText.toLowerCase()));

    // 2. Status Match
    const matchesStatus = filterStatus === "all" || (item.status || "new") === filterStatus;

    // 3. Date Range Match
    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const leadDate = moment(item.createdAt);
      const startDate = moment(dateRange[0].$d || dateRange[0].toDate?.() || dateRange[0]);
      const endDate = moment(dateRange[1].$d || dateRange[1].toDate?.() || dateRange[1]);
      
      matchesDate = leadDate.isSameOrAfter(startDate, 'day') && 
                    leadDate.isSameOrBefore(endDate, 'day');
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("new");
    setDateRange(null);
  };

  const handleStatusUpdate = async (id, newStatus, leadType) => {
    setUpdatingLeadId(id);
    try {
      await api.patch(`/enquiries/update-status/${id}`, {
        status: newStatus,
        type: leadType
      });
      message.success(`Status updated to ${newStatus.toUpperCase()}`);
      // Update local state
      setEnquiries(prev => prev.map(item => 
        item._id === id ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error("Status update error:", error);
      message.error("Failed to update status");
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleDownloadExcel = () => {
    if (!filteredEnquiries.length) {
      message.warning("No data to export");
      return;
    }
    exportEnquiriesExcel(filteredEnquiries, false);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="bg-white border-b border-gray-100 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 py-6 sm:py-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Enquiry Dashboard</span>
            </div>
            <Title level={1} className="m-0! text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Property Enquiries <span className="text-blue-600">(Leads)</span></Title>
            <p className="text-gray-500 mt-2 max-w-lg text-xs sm:text-sm font-medium">Manage and track all incoming enquiries for your properties with real-time analytics and distribution insights.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <Button
              type="primary"
              icon={<Download size={18} />}
              onClick={handleDownloadExcel}
              className="h-11 px-6 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:scale-[0.98] w-full sm:w-auto"
            >
              Export Leads (Excel)
            </Button>
          </div>
        </div>
      </div>

      {(!subscriptionState.isActive || subscriptionState.isLimitReached) && !loading && (
        <div className="mb-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 backdrop-blur-sm" />
          <div className="relative p-6 border border-amber-200/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                <Lock size={28} strokeWidth={2.5} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-amber-900 m-0">
                  {subscriptionState.isLimitReached ? "Lead Limit Reached" : "Detail Access Restricted"}
                </h3>
                <p className="text-amber-800/70 text-sm m-0 mt-1 font-medium max-w-md">
                  {subscriptionState.isLimitReached 
                    ? `You've utilized your full quota of ${subscriptionState.limit} leads. Upgrade your plan to unlock more leads.` 
                    : "Your current plan doesn't include full lead visibility. Upgrade to access enquirer contact details and private messages."}
                </p>
              </div>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Button 
                type="primary" 
                size="large"
                className="w-full md:w-auto bg-amber-900! hover:bg-amber-800! hover:bg-black border-none text-white font-bold h-12 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={() => navigate("/seller/upgrade-plan")}
              >
                Unlock Lead Details
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-md transition-shadow duration-300 border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="flex items-center gap-5 p-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center shrink-0">
                <Inbox size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Total</span>
                <span className="text-3xl font-semibold text-slate-900 leading-none">{loading ? "..." : stats.total}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-md transition-shadow duration-300 border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="flex items-center gap-5 p-1">
              <div className="w-14 h-14 bg-cyan-50 rounded-2xl text-cyan-600 flex items-center justify-center shrink-0">
                <User size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">New</span>
                <span className="text-3xl font-semibold text-slate-900 leading-none">{loading ? "..." : stats.new}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-md transition-shadow duration-300 border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="flex items-center gap-5 p-1">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl text-indigo-600 flex items-center justify-center shrink-0">
                <MessageSquare size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Portal</span>
                <span className="text-3xl font-semibold text-slate-900 leading-none">{loading ? "..." : stats.portal}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-md transition-shadow duration-300 border-none shadow-sm bg-white overflow-hidden rounded-2xl border-l-4 border-l-amber-500!">
            <div className="flex items-center gap-5 p-1">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <Zap size={28} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Lead Allotment</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-semibold leading-none ${subscriptionState.isLimitReached ? 'text-red-600' : 'text-slate-900'}`}>
                    {loading ? "..." : subscriptionState.used}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">
                    / {subscriptionState.limit === -1 ? "∞" : subscriptionState.limit}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-none overflow-hidden">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Title level={4} className="m-0! text-gray-800! whitespace-nowrap">
                Recent Enquiries
              </Title>
              <Tag color="blue" className="rounded-full border-none px-4 py-1 font-bold whitespace-nowrap bg-blue-50 text-blue-600">
                {filteredEnquiries.length}
              </Tag>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1 xl:justify-end max-w-5xl">
              <div className="w-full md:w-64">
                <Input
                  prefix={<Search size={18} className="text-slate-400 mr-1.5" />}
                  placeholder="Search by Property Name, Buyer Name, Phone, or Location"
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-xl border-slate-200 bg-white hover:border-blue-400 focus:border-blue-500 transition-all h-11 shadow-xs"
                />
              </div>
              <div className="w-full md:w-44">
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  className="w-full enquiries-select-compact"
                  suffixIcon={<ArrowRight size={16} className="rotate-90 text-slate-400" />}
                >
                  <Option value="all">All Status</Option>
                  <Option value="new">New Leads</Option>
                  <Option value="contacted">Contacted</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </div>
              <div className="w-full md:w-80">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full rounded-xl border-slate-200 bg-white h-11 hover:border-blue-400 transition-all enquiries-range-compact shadow-xs"
                  format="DD MMM YYYY"
                  placeholder={["Start", "End"]}
                  separator={<span className="text-slate-300 mx-0.5">→</span>}
                />
              </div>
              {(searchText || filterStatus !== "new" || dateRange) && (
                <Button 
                  type="link" 
                  onClick={clearFilters} 
                  className="text-blue-600 font-bold p-0 h-auto hover:text-blue-700 whitespace-nowrap"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

        <div className="overflow-x-auto relative min-h-[400px]">
          <Table
            columns={columns}
            dataSource={filteredEnquiries}
            rowKey="_id"
            loading={{
              spinning: loading,
              indicator: <Loader variant="panel" />
            }}
            pagination={{
              pageSize: 8,
              placement: "bottomRight",
              showTotal: (total) => `Total ${total} enquiries`,
              size: "default",
              className: "px-4 py-4 pt-6 border-t border-gray-50",
              responsive: true
            }}
            scroll={{ x: 1000 }}
            className="enquiries-table"
          />
        </div>
      </Card>

      <style>{`
        .custom-leads-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #f1f5f9;
        }
        .custom-leads-tabs .ant-tabs-tab {
          font-weight: 800 !important;
          letter-spacing: 0.05em;
          font-size: 11px;
          color: #94a3b8;
          transition: all 0.3s ease;
        }
        .custom-leads-tabs .ant-tabs-tab-active {
          transform: translateY(-1px);
        }
        .custom-leads-tabs .ant-tabs-ink-bar {
          height: 3px !important;
          background: #6366f1 !important;
          border-radius: 10px;
        }

        .enquiries-select-compact .ant-select-selector {
          height: 44px !important;
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
          background-color: #ffffff !important;
          display: flex;
          align-items: center;
          transition: all 0.3s ease !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
        }
        .enquiries-select-compact .ant-select-selector:hover {
          border-color: #60a5fa !important;
        }
        .enquiries-select-compact .ant-select-selection-item {
          font-weight: 600;
          color: #334155;
          font-size: 13px;
        }
        .enquiries-range-compact {
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
          padding: 4px 12px !important;
          height: 44px !important;
        }
        .enquiries-range-compact input {
          font-weight: 500;
          color: #334155;
          font-size: 13px;
        }
        .enquiries-range-compact .ant-picker-range-separator {
          padding: 0 4px;
        }
        .enquiries-range-compact .ant-picker-suffix {
          color: #cbd5e1 !important;
          font-size: 14px;
        }

        .enquiries-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          padding: 16px 20px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .enquiries-table .ant-table-tbody > tr > td {
          padding: 16px 20px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .enquiries-table .ant-table-tbody > tr:hover > td {
          background-color: #fcfdfe !important;
        }

        .status-select {
          width: 100% !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
        }
        .status-select .ant-select-selector {
          padding: 0 12px !important;
          border-radius: 20px !important;
          transition: all 0.3s ease !important;
        }
        .select-new .ant-select-selector {
          background-color: #e0faff !important;
          color: #0891b2 !important;
        }
        .select-contact .ant-select-selector {
          background-color: #f0fdf4 !important;
          color: #16a34a !important;
        }
        .status-select:hover .ant-select-selector {
          filter: brightness(0.95);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SellerEnquiries;
