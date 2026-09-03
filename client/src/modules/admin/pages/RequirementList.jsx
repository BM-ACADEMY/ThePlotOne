import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Tooltip,
  Input,
  Select,
  Row,
  Col,
  Popover,
  Checkbox,
  Form,
  InputNumber,
  Switch,
  Pagination
} from "antd";
import { 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Phone,
  MapPin,
  ClipboardList,
  Share2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  CheckCircle2,
  Plus
} from "lucide-react";
import { 
  getRequirements, 
  updateRequirementStatus, 
  deleteRequirement,
  getSubscriptionStats,
  shareRequirement,
  postRequirement,
  triggerLeadSharingTimer,
  stopLeadSharingTimer,
  checkRequirementExpiry,
  getWebsiteSettings,
  updateWebsiteSetting
} from "@/services/api";
import axios from "axios";
import { useNav } from "@/context/NavContext";
import { useSocket } from "@/context/SocketContext";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

// Converts a raw number to Indian-scale label: ₹25 Lakhs, ₹1.5 Crores
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

const CountdownTimer = ({ startTime, timerInMinutes, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diffMs = (start.getTime() + timerInMinutes * 60000) - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("00:00");
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTime, timerInMinutes]);

  return <span className="text-orange-600 font-mono font-bold tracking-wider ml-2">{timeLeft}</span>;
};

const RequirementList = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [showOtherType, setShowOtherType] = useState(false);
  const { propertyTypes } = useNav();
  const [subscriptionStats, setSubscriptionStats] = useState([]);
  const [hasGlobalBuilderMatch, setHasGlobalBuilderMatch] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [timerLoading, setTimerLoading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalForm] = Form.useForm();
  const [minBudgetVal, setMinBudgetVal] = useState(null);
  const [maxBudgetVal, setMaxBudgetVal] = useState(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [viewingSellers, setViewingSellers] = useState([]);
  const [sellerPagination, setSellerPagination] = useState({ current: 1, pageSize: 5 });
  const [planDisplayNameMap, setPlanDisplayNameMap] = useState({});

  const selectedUsageType = Form.useWatch("usageType", addForm);

  // Filter property types based on usage type
  const filteredPropertyTypes = propertyTypes.filter(
    (type) => type.usageType === selectedUsageType
  );

  // Reset property type when usage type changes
  useEffect(() => {
    if (selectedUsageType) {
      addForm.setFieldsValue({ propertyType: undefined });
      setShowOtherType(false);
    }
  }, [selectedUsageType, addForm]);

  const togglePlan = (planId) => {
    setExpandedPlans((prev) => 
      prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]
    );
  };

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const response = await getRequirements();
      setRequirements(response.data.data);
    } catch (error) {
      console.error("Failed to fetch requirements", error);
      message.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  const fetchGlobalSettings = async () => {
    try {
      const response = await getWebsiteSettings();
      if (response.data && response.data.length > 0) {
        setGlobalSettings(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch global settings", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get("/subscriptions/plans");
      const map = {};
      const plans = response.data.data || response.data; // Handle potential wrapping
      if (Array.isArray(plans)) {
        plans.forEach(p => {
          if (!map[p.name]) map[p.name] = p.displayName || p.name;
        });
      }
      setPlanDisplayNameMap(map);
    } catch (error) {
      console.error("Failed to fetch plans for mapping", error);
    }
  };

  useEffect(() => {
    fetchRequirements();
    fetchGlobalSettings();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("admin-lead-updated", (data) => {
        message.info("Lead status updated internationally");
        fetchRequirements();
      });
      return () => socket.off("admin-lead-updated");
    }
  }, [socket]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateRequirementStatus(id, newStatus);
      message.success(`Status updated to ${newStatus}`);
      fetchRequirements();
      // Refresh sidebar counts
      window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this requirement?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteRequirement(id);
          message.success("Requirement deleted successfully");
          fetchRequirements();
        } catch (error) {
          message.error("Failed to delete requirement");
        }
      },
    });
  };

  const showDetails = (record) => {
    setSelectedRequirement(record);
    setIsDetailModalOpen(true);
  };

  const showShareModal = async (record) => {
    setSelectedRequirement(record);
    setIsShareModalOpen(true);
    fetchStats(record._id);
  };



  const handleStartTimer = async (values) => {
    setTimerLoading(true);
    try {
      if (selectedRowKeys.length > 0 && !selectedRequirement) {
        // Bulk mode
        let successCount = 0;
        for (const id of selectedRowKeys) {
          try {
            await triggerLeadSharingTimer(id, values);
            successCount++;
          } catch (err) {
            console.error(`Failed to start timer for ${id}`, err);
          }
        }
        message.success(`Lead sharing timer started for ${successCount} requirements!`);
        setSelectedRowKeys([]);
      } else if (selectedRequirement) {
        // Single mode
        await triggerLeadSharingTimer(selectedRequirement._id, values);
        message.success("Lead sharing timer started successfully!");
      }
      
      setIsTimerModalOpen(false);
      setSelectedRequirement(null);
      fetchRequirements();
      // Refresh sidebar counts
      window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to start lead sharing timer");
    } finally {
      setTimerLoading(false);
    }
  };

  const handleSaveGlobalTimer = async (values) => {
    setTimerLoading(true);
    try {
      if (!globalSettings?._id) {
         message.error("System settings not found. Please contact support.");
         return;
      }
      await updateWebsiteSetting(globalSettings._id, {
        leadSharingInterval: values.timer,
        leadSharingIntervalUnit: values.timerUnit
      });
      
      message.success("Global lead timer settings updated!");
      fetchGlobalSettings();
      setIsGlobalModalOpen(false);
    } catch (error) {
      message.error("Failed to update global settings");
    } finally {
      setTimerLoading(false);
    }
  };

  const showGlobalModal = () => {
    setIsGlobalModalOpen(true);
    globalForm.setFieldsValue({
      timer: globalSettings?.leadSharingInterval || 10,
      timerUnit: globalSettings?.leadSharingIntervalUnit || "minutes"
    });
  };

  const handleStopTimer = async (id) => {
    try {
      await stopLeadSharingTimer(id);
      message.success("Lead sharing timer stopped");
      fetchRequirements();
      // Refresh sidebar counts
      window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
    } catch (error) {
      message.error("Failed to stop lead sharing timer");
    }
  };

  const fetchStats = async (requirementId) => {
    setFetchingStats(true);
    try {
      const response = await getSubscriptionStats(requirementId);
      setSubscriptionStats(response.data.data.stats);
      setHasGlobalBuilderMatch(response.data.data.hasGlobalBuilderMatch);
    } catch (error) {
      message.error("Failed to load subscription statistics");
    } finally {
      setFetchingStats(false);
    }
  };

  const handleShare = async (planIdOrIds, matchType, matchPriority) => {
    setSharingLoading(true);
    const data = Array.isArray(planIdOrIds)
      ? { planIds: planIdOrIds, matchType, matchPriority }
      : { planId: planIdOrIds, matchType, matchPriority };

    try {
      await shareRequirement(selectedRequirement._id, data);
      message.success("Lead shared successfully!");
      setIsShareModalOpen(false);
      setSelectedPlanIds([]); // Reset selection
      fetchRequirements(); 
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to share lead");
    } finally {
      setSharingLoading(false);
    }
  };

  const togglePlanSelection = (planId) => {
    setSelectedPlanIds(prev => 
      prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]
    );
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
        
        addForm.setFieldsValue({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          locationText: display_name,
          locality: locality,
        });
        message.success("Location verified successfully!");
      } else {
        message.warning("Location not found.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      message.error("Error searching location.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddLead = async (values) => {
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
      message.success("Lead created successfully!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchRequirements();
    } catch (error) {
      console.error("Error creating lead:", error);
      message.error(error.response?.data?.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const selectAllMatches = (plans) => {
    const matchedIds = plans
      .filter(plan => hasGlobalBuilderMatch 
        ? plan.sellers.some(s => s.isBuilder && s.isMatch)
        : plan.sellers.some(s => s.isAgent && s.isMatch)
      )
      .map(p => p.planId);
    setSelectedPlanIds(matchedIds);
  };

  const selectAllFallbacks = (plans) => {
    const agentsIds = plans
      .filter(plan => plan.sellers.some(s => s.isAgent))
      .map(p => p.planId);
    setSelectedPlanIds(agentsIds);
  };

  const isInMatchMode = subscriptionStats.some(plan => {
    if (hasGlobalBuilderMatch) {
      return plan.sellers.some(s => s.isBuilder && s.isMatch);
    } else {
      return plan.sellers.some(s => s.isAgent && s.isMatch);
    }
  });

  const filteredData = requirements.filter((item) => {
    const searchLower = searchText.toLowerCase();
    return (
      item.fullName?.toLowerCase().includes(searchLower) ||
      item.phoneNumber?.includes(searchText) ||
      item.propertyType?.toLowerCase().includes(searchLower) ||
      item.preferredLocation?.toLowerCase().includes(searchLower) ||
      item.locationText?.toLowerCase().includes(searchLower) ||
      item.createdBy?.name?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "User / Manager",
      key: "user",
      render: (_, record) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Text strong className="text-gray-900">{record.fullName}</Text>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <Phone size={12} className="text-slate-400" /> {record.phoneNumber}
          </div>
          {record.user?.assignedAdmin && (
             <div className="mt-1 flex items-center gap-1">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Managed By:</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">{record.user.assignedAdmin.name || "Manager"}</span>
             </div>
          )}
        </div>
      ),
    },
    {
      title: "Requirement",
      key: "requirement",
      render: (_, record) => (
        <div className="flex flex-col">
          <Tag color="blue" className="w-fit">{record.category}</Tag>
          <Text className="text-xs mt-1">
            <span className="font-semibold">{record.usageType}:</span> {record.propertyType}
          </Text>
          {(record.preferredLocation || record.locationText) && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 italic mt-0.5">
              <MapPin size={10} /> {record.locationText || record.preferredLocation}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "When do you need it?",
      dataIndex: "needTimeframe",
      key: "needTimeframe",
      render: (timeframe) => (
        <Tag color="orange" className="m-0 font-bold text-[10px] uppercase border-none bg-orange-50 text-orange-600">
          {timeframe || "Not specified"}
        </Tag>
      ),
    },

    {
      title: "Budget",
      key: "budget",
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          {record.minBudget || record.maxBudget ? (
            <>
              {record.minBudget && <span>Min: ₹{record.minBudget.toLocaleString()}</span>}
              {record.maxBudget && <span>Max: ₹{record.maxBudget.toLocaleString()}</span>}
            </>
          ) : (
            <Text type="secondary">Not specified</Text>
          )}
        </div>
      ),
    },
    {
      title: "Created By",
      key: "createdBy",
      render: (_, record) => (
        <div className="flex flex-col">
          {record.createdBy ? (
            <Tag color="cyan" className="font-bold text-[11px] uppercase border-none bg-cyan-50 text-cyan-700">
              {record.createdBy.name}
            </Tag>
          ) : (
            <Tag className="font-bold text-[11px] uppercase border-none bg-slate-50 text-slate-400">
              Direct/Public
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Sellers & Progress",
      key: "acceptedSeller",
      render: (_, record) => {
        if (record.allSellers && record.allSellers.length > 0) {
          return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-[12px] font-bold text-emerald-800">
                    {record.allSellers.length} {record.allSellers.length === 1 ? 'Seller' : 'Sellers'}
                  </span>
                </div>
                <Tooltip title="View Detailed Status">
                  <Button 
                    type="text" 
                    size="small" 
                    className="p-0 h-6 w-6 flex items-center justify-center hover:bg-emerald-100 rounded-md transition-colors"
                    onClick={() => {
                      setViewingSellers(record.allSellers);
                      setSellerPagination({ current: 1, pageSize: 5 });
                      setIsSellerModalOpen(true);
                    }}
                  >
                    <Eye size={16} className="text-emerald-700" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          );
        }
        
        // Timer/Sharing status logic remains same...
        if (record.sharingStatus === "in-progress") {
          const plans = record.sharingConfig?.plans || [];
          const currentPlanName = plans[record.sharingConfig?.currentPlanIndex] || "N/A";
          const currentPlanDisplay = planDisplayNameMap[currentPlanName] || currentPlanName;
          
          return (
            <div className="flex flex-col gap-1">
              <Tag color="processing" icon={<Clock size={12} className="animate-pulse" />} className="m-0 font-bold uppercase text-[10px] flex items-center justify-between">
                <span>Timer: {currentPlanDisplay} ({currentPlanName})</span>
                <CountdownTimer 
                  startTime={record.sharingConfig?.startTime} 
                  timerInMinutes={record.sharingConfig?.timer} 
                  onExpire={async () => {
                    try {
                      await checkRequirementExpiry(record._id);
                      fetchRequirements();
                    } catch (err) {
                      console.error("Auto-expiry trigger failed:", err);
                      fetchRequirements();
                    }
                  }}
                />
              </Tag>
              <Button 
                type="link" 
                danger 
                size="small" 
                className="p-0 h-auto text-[10px] text-left"
                onClick={() => handleStopTimer(record._id)}
              >
                Stop Timer
              </Button>
            </div>
          );
        }

        if (record.sharingStatus === "expired") {
          return (
            <div className="flex flex-col gap-1">
              <Tag color="error" className="m-0 font-bold uppercase text-[10px]">Deal Closed (Plan Level)</Tag>
              <Button 
                type="link" 
                size="small" 
                className="p-0 h-auto text-[10px] text-left text-indigo-600 font-bold"
                onClick={async () => {
                  try {
                    setTimerLoading(true);
                    await triggerLeadSharingTimer(record._id, {
                       timer: globalSettings?.leadSharingInterval || 10,
                       timerUnit: globalSettings?.leadSharingIntervalUnit || "minutes"
                    });
                    message.success("Lead sharing timer started successfully!");
                    fetchRequirements();
                  } catch (error) {
                    message.error(error.response?.data?.message || "Failed to start lead sharing timer");
                  } finally {
                    setTimerLoading(false);
                  }
                }}
              >
                Reshare Lead
              </Button>
            </div>
          );
        }

        if (record.sharingStatus === "completed") {
           return <Tag color="success" className="m-0 font-bold uppercase text-[10px]">Shared & Accepted</Tag>;
        }

        if (record.isShared) {
          let label = "Shared (Pending)";
          let color = "orange";
          
          if (record.matchPriority === 1) {
            label = "Builder Match";
            color = "indigo";
          } else if (record.matchPriority === 2) {
            label = "Agent Match";
            color = "blue";
          }

          return (
            <Tag 
              color={color} 
              className="m-0 font-medium whitespace-nowrap"
            >
              {label}
            </Tag>
          );
        }
        return <Tag className="border-none bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Not Shared</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color = "gold";
        if (status === "Contacted") color = "blue";
        if (status === "Closed") color = "green";
        
        return (
          <Select
            value={status}
            onChange={(value) => handleStatusChange(record._id, value)}
            size="small"
            style={{ width: 110 }}
            className={`status-select-${status.toLowerCase()}`}
          >
            <Option value="Pending">Pending</Option>
            <Option value="Contacted">Contacted</Option>
            <Option value="Closed">Closed</Option>
          </Select>
        );
      },
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      width: 130,
      render: (updatedBy) => (
        <div className="flex flex-col">
          {updatedBy ? (
            <Tag color="cyan" className="font-bold text-[10px] uppercase border-none bg-cyan-50 text-cyan-700 m-0 w-fit">
              {updatedBy.name}
            </Tag>
          ) : (
            <span className="text-gray-300 text-[10px] italic">No update yet</span>
          )}
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<Eye size={18} className="text-blue-500" />} 
              onClick={() => showDetails(record)}
            />
          </Tooltip>
          <Tooltip title={record.acceptedBy ? "Deal Closed" : record.isShared ? "Lead Already Shared" : "Share Lead"}>
            <Button 
              type="text" 
              disabled={!!record.acceptedBy}
              icon={
                record.acceptedBy ? (
                  <CheckCircle size={18} className="text-slate-300" />
                ) : record.isShared ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Share2 size={18} className="text-indigo-500" />
                )
              } 
              onClick={() => showShareModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              icon={<Trash2 size={18} className="text-red-500" />} 
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Title level={3} className="m-0! flex items-center gap-2 text-xl md:text-2xl">
            <ClipboardList size={28} className="text-indigo-600" />
            Property Requirements
          </Title>
          <p className="text-slate-500 mt-1 text-sm">Manage and track user property requirements and leads.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search requirements..."
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-lg w-full md:w-64"
          />
          <Button 
            icon={<Clock size={18} />} 
            className="bg-orange-500 hover:bg-orange-600 h-10 px-6 rounded-lg font-bold flex items-center gap-2 text-white border-none shadow-lg shadow-orange-100"
            onClick={showGlobalModal}
          >
            Lead Timer
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={18} />} 
            className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-lg font-bold flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record) => ({
              disabled: !!record.acceptedBy || record.sharingStatus === "in-progress",
            }),
          }}
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold m-0">Requirement Details</h3>
              <Text type="secondary" className="text-xs">Submitted on {selectedRequirement && new Date(selectedRequirement.createdAt).toLocaleString()}</Text>
            </div>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button 
            key="contacted" 
            type="primary" 
            className="bg-blue-600"
            onClick={() => {
              handleStatusChange(selectedRequirement._id, "Contacted");
              setIsDetailModalOpen(false);
            }}
          >
            Mark as Contacted
          </Button>
        ]}
        width={650}
        destroyOnClose
        centered
      >
        {selectedRequirement && (
          <div className="py-2">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">User Information</Text>
                  <p className="m-0 font-bold text-base">{selectedRequirement.fullName}</p>
                  <p className="m-0 text-slate-600 flex items-center gap-2 mt-1">
                    <Phone size={14} /> {selectedRequirement.phoneNumber}
                  </p>
                </div>
                
                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Location Preference</Text>
                  <p className="m-0 text-slate-700 font-medium">
                    {selectedRequirement.locationText || selectedRequirement.preferredLocation || "Not specified"}
                  </p>
                </div>

                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Lead Source (Marketing)</Text>
                  <div className="mt-1">
                    <Tag color="purple" className="font-bold">{selectedRequirement.heardFrom || "Direct"}</Tag>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Property Type</Text>
                  <div className="mt-1">
                    <Tag color="blue" className="mb-1">{selectedRequirement.category}</Tag>
                    <Tag color="cyan">{selectedRequirement.usageType}</Tag>
                  </div>
                  <p className="m-0 mt-1 font-bold">{selectedRequirement.propertyType}</p>
                </div>
                
                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Budget Range</Text>
                  <p className="m-0 text-slate-700 font-bold">
                    {selectedRequirement.minBudget ? `₹${selectedRequirement.minBudget.toLocaleString()}` : "Any"} 
                    {" - "} 
                    {selectedRequirement.maxBudget ? `₹${selectedRequirement.maxBudget.toLocaleString()}` : "Any"}
                  </p>
                </div>
              </Col>
              
              <Col span={24}>
                <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Property Preferences</Text>
                  <p className="m-0 mt-2 text-slate-700 italic">
                    {selectedRequirement.propertyPreferences || "No specific preferences mentioned."}
                  </p>
                </div>
                
                <div className="mb-4">
                  <Text type="secondary" className="text-xs uppercase font-semibold">Message / Additional Info</Text>
                  <p className="m-0 mt-1 text-slate-700">
                    {selectedRequirement.message || "No additional message."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {selectedRequirement.needTimeframe && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <Text type="secondary" className="text-xs uppercase font-semibold text-blue-600 block">Requirement Timeframe</Text>
                      <p className="m-0 text-blue-800 font-bold text-base mt-1">
                        {selectedRequirement.needTimeframe}
                      </p>
                    </div>
                  )}

                  {selectedRequirement.closureDate && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <Text type="secondary" className="text-xs uppercase font-semibold text-emerald-600 block">Lead Closure Date</Text>
                        <p className="m-0 text-emerald-800 font-bold text-base mt-1">
                          {dayjs(selectedRequirement.closureDate).format("DD MMMM YYYY")}
                        </p>
                      </div>
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-4 border-b border-gray-200 pb-5 mb-1">
            <div className="w-12 h-12 rounded-[14px] bg-[#f0efff] text-[#6366f1] flex items-center justify-center shrink-0">
              <Share2 size={24} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold m-0 text-slate-800">Share Lead with Sellers</h3>
              <Text type="secondary" className="text-[13.5px] text-slate-500">Distribute this requirement based on priority matching.</Text>
            </div>
          </div>
        }
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsShareModalOpen(false)} className="rounded-lg h-9 px-5 border-gray-200 text-slate-700 font-medium">
            Cancel
          </Button>,
          selectedRequirement?.sharingStatus !== "in-progress" && !isInMatchMode && (
            <Button 
              key="trigger-timer"
              className="bg-[#fff7ed] text-[#ea580c] border-[#ffedd5] hover:bg-[#ffedd5] h-9 px-5 rounded-lg font-bold flex items-center gap-2"
              onClick={async () => {
                try {
                  setTimerLoading(true);
                  await triggerLeadSharingTimer(selectedRequirement._id, {
                     timer: globalSettings?.leadSharingInterval || 10,
                     timerUnit: globalSettings?.leadSharingIntervalUnit || "minutes"
                  });
                  message.success("Automated lead sharing started successfully!");
                  setIsShareModalOpen(false);
                  fetchRequirements();
                } catch (error) {
                  message.error(error.response?.data?.message || "Failed to start automated lead sharing");
                } finally {
                  setTimerLoading(false);
                }
              }}
              loading={timerLoading}
            >
              <Clock size={16} /> Start Automated Sharing
            </Button>
          ),
          selectedPlanIds.length > 0 && (
            <Button 
              key="share-selected" 
              type="primary" 
              className="bg-indigo-600 hover:bg-indigo-700 h-9 px-6 rounded-lg font-bold"
              loading={sharingLoading}
              onClick={() => handleShare(
                selectedPlanIds, 
                isInMatchMode ? "exact" : "not-exact", 
                isInMatchMode ? (hasGlobalBuilderMatch ? 1 : 2) : 3
              )}
            >
              Share with {selectedPlanIds.length} Plan{selectedPlanIds.length > 1 ? 's' : ''}
            </Button>
          )
        ]}
        width={600}
        destroyOnClose
        centered
      >
        <div className="py-2 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          {fetchingStats ? (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-slate-500">Matching sellers and plans...</p>
            </div>
          ) : (
            <div className="space-y-8">
               {/* MATCHED REQUIREMENTS SECTION */}
               {subscriptionStats.some(plan => {
                  if (hasGlobalBuilderMatch) {
                    return plan.sellers.some(s => s.isBuilder && s.isMatch);
                  } else {
                    return plan.sellers.some(s => s.isAgent && s.isMatch);
                  }
               }) ? (
                <div>
                  <div className="flex items-center justify-between mb-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200"></div>
                            <h4 className="text-[15px] font-extrabold uppercase tracking-tight text-indigo-900 m-0">MATCH REQUIREMENT</h4>
                        </div>
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<CheckCircle2 size={14} />}
                          className="text-indigo-600 font-bold text-[11px] hover:bg-indigo-100/50 flex items-center gap-1.5 px-2 bg-indigo-50/50 rounded-lg"
                          onClick={() => selectAllMatches(subscriptionStats)}
                        >
                          Select All Matches
                        </Button>
                    </div>
                    <Tag color="indigo" className="m-0 border-none font-bold uppercase text-[10px] scale-90 origin-right">
                      {hasGlobalBuilderMatch ? "Priority: Builder" : "Priority: Agent"}
                    </Tag>
                  </div>
                  
                  <div className="space-y-4">
                    {subscriptionStats.map((plan) => {
                      let matchedSellers = hasGlobalBuilderMatch 
                        ? plan.sellers.filter(s => s.isBuilder && s.isMatch)
                        : plan.sellers.filter(s => s.isAgent && s.isMatch);
                      
                      const hasMatchesInPlan = matchedSellers.length > 0;
                      if (!hasMatchesInPlan) return null;

                      return (
                        <div 
                          key={`match-${plan.planId}`} 
                          className={`flex flex-col rounded-[20px] border transition-all duration-300 ${selectedPlanIds.includes(plan.planId) ? 'border-indigo-500 bg-indigo-50/30' : 'border-indigo-200 bg-white shadow-sm'}`}
                          onClick={() => togglePlanSelection(plan.planId)}
                        >
                          <div className="flex items-center justify-between p-5 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="shrink-0 pt-0.5">
                                <Checkbox 
                                  checked={selectedPlanIds.includes(plan.planId)} 
                                  className="scale-110 custom-indigo-checkbox"
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => togglePlanSelection(plan.planId)}
                                />
                              </div>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-600 text-white shadow-md shadow-indigo-100">
                                {(plan.displayName || plan.planName).charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <Text strong className="text-[14.5px] font-bold text-slate-800">
                                    {plan.displayName || plan.planName} 
                                    <span className="text-[11px] text-slate-400 font-normal ml-1">({plan.planName})</span>
                                  </Text>
                                  <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ring-1 ring-emerald-200">Match Found</span>
                                </div>
                                <div className="flex flex-col mt-0.5">
                                  <Text className="text-[12px] text-slate-500 font-medium">{hasGlobalBuilderMatch ? "Builder / Promoter" : "Agent"}</Text>
                                  <Text className="text-[10px] text-slate-400">{matchedSellers.length} Matching Sellers</Text>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Popover
                                  placement="right"
                                  title={<span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Eligible Sellers ({matchedSellers.length})</span>}
                                  content={
                                    <div className="w-[280px] py-1">
                                      <div className="flex flex-col gap-2">
                                        {matchedSellers.map(s => (
                                          <div key={s.id} className="bg-slate-50/50 p-2.5 rounded-[12px] border border-slate-100 flex items-center gap-3 hover:bg-indigo-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                              {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-700 text-[12px] truncate">{s.name}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.leadsLimit !== -1 && s.leadsUsed >= s.leadsLimit ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                  {s.leadsUsed}/{s.leadsLimit === -1 ? '∞' : s.leadsLimit}
                                                </span>
                                              </div>
                                              <span className="text-slate-400 text-[9px] font-medium mb-1">{s.businessType}</span>
                                              {s.leadsLimit !== -1 && s.leadsUsed >= s.leadsLimit && (
                                                <span className="text-[9px] text-red-500 font-bold mb-1 italic">Limit Reached</span>
                                              )}
                                              {s.matchingProperties && s.matchingProperties.length > 0 && (
                                                <div className="flex flex-col gap-1 mt-0.5 pt-1 border-t border-slate-100">
                                                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">Matching Properties:</span>
                                                  {s.matchingProperties.slice(0, 3).map((title, idx) => (
                                                    <span key={idx} className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate shadow-sm">
                                                      • {title}
                                                    </span>
                                                  ))}
                                                  {s.matchingProperties.length > 3 && (
                                                    <span className="text-[9px] text-slate-400 ml-1 italic">+{s.matchingProperties.length - 3} more...</span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  }
                                  trigger="click"
                                  overlayClassName="seller-popover"
                                  getPopupContainer={() => document.body}
                                >
                                  <Button 
                                    type="text" 
                                    size="small"
                                    className="text-indigo-600 font-bold text-[11px] hover:bg-indigo-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Review
                                  </Button>
                                </Popover>
                                <Button 
                                  type="primary"
                                  className={`h-9 px-4 rounded-xl shadow-none font-bold text-xs border-none ${plan.isAlreadyShared ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                  disabled={sharingLoading}
                                  loading={sharingLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (plan.isAlreadyShared) {
                                      message.info("This lead has already been shared with this plan.");
                                      return;
                                    }
                                    handleShare(plan.planId, "exact", hasGlobalBuilderMatch ? 1 : 2);
                                  }}
                                >
                                  {plan.isAlreadyShared ? "Already Shared" : "Share Now"}
                                </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
               ) : (
                <div>
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div>
                      <p className="text-amber-900 font-bold text-sm m-0">No Direct Matches Found</p>
                      <p className="text-amber-700 text-xs m-0">No sellers in your plans match this requirement's specific criteria.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 bg-slate-100/50 p-3 rounded-xl border border-slate-200">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-slate-500 rounded-full shadow-sm shadow-slate-200"></div>
                        <h4 className="text-[15px] font-extrabold uppercase tracking-tight text-slate-700 m-0">NOT MATCH REQUIREMENT</h4>
                     </div>
                     <Tag className="m-0 border-none bg-slate-600 text-white font-bold uppercase text-[9px] rounded-md py-0.5">Agents Only</Tag>
                  </div>
                  
                  <div className="space-y-4">
                    {subscriptionStats.map((plan) => {
                      const agents = plan.sellers.filter(s => s.isAgent);
                      const hasAgents = agents.length > 0;
                      
                      return (
                        <div 
                          key={`not-match-${plan.planId}`} 
                          className={`flex flex-col rounded-[20px] border transition-all duration-300 ${hasAgents ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-40 grayscale pointer-events-none'}`}
                        >
                           <div className="flex items-center justify-between p-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${hasAgents ? 'bg-slate-700 text-white shadow-md shadow-slate-100' : 'bg-slate-200 text-slate-400'}`}>
                                   {(plan.displayName || plan.planName).charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <Text strong className={`text-[14.5px] font-bold ${hasAgents ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {plan.displayName || plan.planName}
                                    <span className="text-[11px] text-slate-400 font-normal ml-1">({plan.planName})</span>
                                  </Text>
                                  <Text className="text-[12px] text-slate-400 font-medium">Shared as fallback (masked)</Text>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                 {hasAgents && (
                                   <Popover
                                     placement="right"
                                     title={<span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Plan Sellers ({agents.length})</span>}
                                     content={
                                       <div className="w-[280px] py-1">
                                          <div className="flex flex-col gap-2">
                                            {agents.map(s => (
                                              <div key={s.id} className="bg-slate-50/50 p-2.5 rounded-[12px] border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                  {s.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                  <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-700 text-[12px] truncate">{s.name}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.leadsLimit !== -1 && s.leadsUsed >= s.leadsLimit ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                      {s.leadsUsed}/{s.leadsLimit === -1 ? '∞' : s.leadsLimit}
                                                    </span>
                                                  </div>
                                                  <span className="text-slate-400 text-[9px] font-medium mb-1">{s.businessType}</span>
                                                  {s.leadsLimit !== -1 && s.leadsUsed >= s.leadsLimit && (
                                                    <span className="text-[9px] text-red-500 font-bold mb-1 italic">Limit Reached</span>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                       </div>
                                     }
                                     trigger="click"
                                     overlayClassName="seller-popover"
                                     getPopupContainer={() => document.body}
                                   >
                                     <Button 
                                       type="text" 
                                       size="small"
                                       className="text-slate-500 font-bold text-[11px] hover:bg-slate-100"
                                     >
                                       View
                                     </Button>
                                   </Popover>
                                 )}
                                 <Button 
                                  className={`h-9 px-4 rounded-xl shadow-none font-bold text-xs transition-all border-none ${!hasAgents ? 'bg-slate-200 text-slate-400' : plan.isAlreadyShared ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                                  disabled={!hasAgents || sharingLoading}
                                  loading={sharingLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (plan.isAlreadyShared) {
                                      message.info("This lead has already been shared with this plan.");
                                      return;
                                    }
                                    handleShare(plan.planId, "not-exact", 3);
                                  }}
                                >
                                  {plan.isAlreadyShared ? "Already Shared" : "Send Fallback"}
                                </Button>
                              </div>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
               )}
            </div>
          )}
        </div>
      </Modal>

      {/* Add Lead Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold m-0">Create New Lead</h3>
              <Text type="secondary" className="text-xs">Add a property requirement manually</Text>
            </div>
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
        centered
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAddLead}
            requiredMark="optional"
            className="admin-add-lead-form"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item
                name="fullName"
                label={<span className="font-semibold text-slate-700">Full Name</span>}
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="Lead's full name" className="rounded-lg h-10" />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label={<span className="font-semibold text-slate-700">Mobile Number</span>}
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
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="rounded-lg h-10"
                  onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (!/^\d+$/.test(pasted)) e.preventDefault();
                  }}
                />
              </Form.Item>

              <Form.Item
                name="category"
                label={<span className="font-semibold text-slate-700">Category</span>}
                rules={[{ required: true, message: "Selection required" }]}
              >
                <Select placeholder="Rent or Buy?" className="rounded-lg h-10" size="large">
                  <Option value="Rent">Rent</Option>
                  <Option value="Sell/Buy">Sell/Buy</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="usageType"
                label={<span className="font-semibold text-slate-700">Usage Type</span>}
                rules={[{ required: true, message: "Selection required" }]}
              >
                <Select placeholder="Purpose of use" className="rounded-lg h-10" size="large">
                  <Option value="Residential">Residential</Option>
                  <Option value="Commercial">Commercial</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="propertyType"
                label={<span className="font-semibold text-slate-700">Property Type</span>}
                rules={[{ required: true, message: "Selection required" }]}
              >
                <Select
                  placeholder="Select type"
                  className="rounded-lg h-10"
                  size="large"
                  disabled={!selectedUsageType}
                  onChange={(val) => setShowOtherType(val === "Others")}
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
                  label={<span className="font-semibold text-slate-700">Specify Type</span>}
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter property type" className="rounded-lg h-10" />
                </Form.Item>
              )}

              <div className="md:col-span-2 mb-4">
                <Form.Item
                  label={<span className="font-semibold text-slate-700">Preferred Location</span>}
                  required
                >
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input.Search
                      placeholder="Search location (e.g. White Town)"
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
                        placeholder="Verified location" 
                        prefix={<MapPin size={16} className="text-blue-500" />}
                        readOnly
                        className="bg-blue-50/30"
                      />
                    </Form.Item>
                  </div>
                </Form.Item>

                {/* Hidden fields for coordinates and locality */}
                <Form.Item name="lat" hidden><Input /></Form.Item>
                <Form.Item name="lng" hidden><Input /></Form.Item>
                <Form.Item name="locality" hidden><Input /></Form.Item>
              </div>

              <div className="md:col-span-2">
                {/* Budget label */}
                <span className="font-semibold text-slate-700 text-sm">
                  Budget Range
                  <span className="ml-2 text-[11px] font-normal text-slate-400">(e.g. 2500000 = ₹25 Lakhs)</span>
                </span>

                {/* Quick-pick preset chips */}
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {BUDGET_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        addForm.setFieldsValue({ maxBudget: p.value });
                        setMaxBudgetVal(p.value);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        maxBudgetVal === p.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-400 self-center ml-1">← Quick-set Max Budget</span>
                </div>

                <div className="flex gap-4">
                  {/* Min Budget */}
                  <div className="flex-1">
                    <Form.Item name="minBudget" className="!mb-0"
                      rules={[{
                        validator: (_, value) => {
                          if (value !== undefined && value !== null && value < 0)
                            return Promise.reject(new Error("Amount cannot be negative"));
                          return Promise.resolve();
                        }
                      }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder="Min (e.g. 1000000)"
                        controls={false}
                        min={0}
                        className="rounded-lg h-10 flex items-center"
                        formatter={(value) => value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                        parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                        onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                        onChange={(val) => setMinBudgetVal(val)}
                      />
                    </Form.Item>
                    {formatBudgetLabel(minBudgetVal) && (
                      <div className="mt-1 text-xs font-bold text-indigo-600 pl-1">
                        = {formatBudgetLabel(minBudgetVal)}
                      </div>
                    )}
                  </div>

                  {/* Max Budget */}
                  <div className="flex-1">
                    <Form.Item name="maxBudget" className="!mb-0"
                      rules={[{
                        validator: (_, value) => {
                          if (value !== undefined && value !== null && value < 0)
                            return Promise.reject(new Error("Amount cannot be negative"));
                          return Promise.resolve();
                        }
                      }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder="Max (e.g. 5000000)"
                        controls={false}
                        min={0}
                        className="rounded-lg h-10 flex items-center"
                        formatter={(value) => value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                        parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                        onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                        onChange={(val) => setMaxBudgetVal(val)}
                      />
                    </Form.Item>
                    {formatBudgetLabel(maxBudgetVal) && (
                      <div className="mt-1 text-xs font-bold text-indigo-600 pl-1">
                        = {formatBudgetLabel(maxBudgetVal)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Form.Item
                name="propertyPreferences"
                label={<span className="font-semibold text-slate-700">Property Preferences</span>}
                className="md:col-span-2"
              >
                <Input.TextArea 
                  rows={2} 
                  placeholder="e.g. 2BHK, Gated community, South facing..." 
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="heardFrom"
                label={<span className="font-semibold text-slate-700">Lead Source (Marketing)</span>}
                className="md:col-span-2"
              >
                <Select placeholder="General source of the lead" className="rounded-lg h-10">
                  <Option value="Social Media">Social Media</Option>
                  <Option value="Facebook">Facebook</Option>
                  <Option value="Instagram">Instagram</Option>
                  <Option value="YouTube">YouTube</Option>
                  <Option value="LinkedIn">LinkedIn</Option>
                  <Option value="WhatsApp">WhatsApp</Option>
                  <Option value="Google Search">Google Search</Option>
                  <Option value="Reference">Reference</Option>
                  <Option value="Newspaper/Ad">Newspaper/Ad</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="message"
                label={<span className="font-semibold text-slate-700">Additional Message</span>}
                className="md:col-span-2"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Any other specific notes for the sellers..." 
                  className="rounded-lg"
                />
              </Form.Item>


            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <Button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  addForm.resetFields();
                }}
                className="rounded-lg h-10 px-6"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-10 px-8 font-bold"
              >
                Create Lead
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
      {/* Global Lead Timer Settings Modal */}
      <Modal
        title={
          <div className="flex items-center gap-4 border-b border-gray-200 pb-5 mb-1">
            <div className="w-12 h-12 rounded-[14px] bg-[#fff7ed] text-[#ea580c] flex items-center justify-center shrink-0">
              <Clock size={24} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold m-0 text-slate-800">Global Lead Timer</h3>
              <Text type="secondary" className="text-[13.5px] text-slate-500">Automatically distribute leads as they arrive.</Text>
            </div>
          </div>
        }
        open={isGlobalModalOpen}
        onCancel={() => setIsGlobalModalOpen(false)}
        footer={null}
        width={500}
        destroyOnClose
        centered
      >
        <Form
          form={globalForm}
          layout="vertical"
          onFinish={handleSaveGlobalTimer}
          className="mt-6"
        >


          <Form.Item
            label={<span className="font-bold text-slate-700 uppercase text-[12px] tracking-wider">Interval (Time Duration)</span>}
            required
            extra={<Text className="text-[11px] text-slate-400 italic">This time applies to each tier before moving to the next.</Text>}
          >
            <div className="flex gap-2">
              <Form.Item name="timer" noStyle rules={[{ required: true, message: "Please set a timer" }]}>
                <InputNumber 
                  min={1} 
                  style={{ width: "100%" }} 
                  className="rounded-xl h-11 bg-slate-50 border-slate-200 w-full" 
                  placeholder="e.g. 10"
                />
              </Form.Item>
              <Form.Item name="timerUnit" noStyle>
                <Select className="h-11 w-32">
                  <Select.Option value="minutes">Minutes</Select.Option>
                  <Select.Option value="hours">Hours</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Form.Item>

          <div className="mt-8 flex flex-col gap-3 pt-4 border-t border-slate-100">
            {selectedRowKeys.length > 0 && (
              <Button 
                onClick={() => {
                  const values = globalForm.getFieldsValue();
                  handleStartTimer({ timer: values.timer, timerUnit: values.timerUnit });
                }}
                className="w-full h-11 rounded-xl font-bold text-orange-600 border-orange-200 hover:border-orange-500 hover:text-orange-700 flex items-center justify-center gap-2"
              >
                Trigger Timer for {selectedRowKeys.length} Selected Leads
              </Button>
            )}
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={timerLoading}
              className="w-full bg-slate-900 hover:bg-black border-none rounded-xl h-11 font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
              Save Global Settings
            </Button>
          </div>
        </Form>
          </Modal>

      {/* Seller Status Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 size={22} />
             </div>
             <div>
                <h3 className="text-lg font-bold m-0 text-slate-800">Connected Sellers</h3>
                <Text type="secondary" className="text-xs">Individual progress tracking for this lead</Text>
             </div>
          </div>
        }
        open={isSellerModalOpen}
        onCancel={() => setIsSellerModalOpen(false)}
        footer={[
          <Button key="close" type="primary" className="bg-emerald-600 hover:bg-emerald-700 h-10 px-8 rounded-lg" onClick={() => setIsSellerModalOpen(false)}>
            Close
          </Button>
        ]}
        width={500}
        centered
        styles={{ body: { padding: '24px 24px 8px 24px' } }}
      >
        <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1">
          {viewingSellers
            .slice((sellerPagination.current - 1) * sellerPagination.pageSize, sellerPagination.current * sellerPagination.pageSize)
            .map((seller, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <Text strong className="text-base text-slate-900">{seller.name}</Text>
                  <div className="flex items-center gap-2 mt-1">
                    {seller.businessType && (
                      <Tag color="blue" className="m-0 text-[10px] font-black uppercase rounded-md border-none px-2">
                        {seller.businessType.name || seller.businessType}
                      </Tag>
                    )}
                    <span className="text-slate-300">|</span>
                    <Text type="secondary" className="text-[12px] flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" /> {seller.phone}
                    </Text>
                  </div>
                </div>
                <Tag 
                  color={
                    seller.leadStatus === 'done' ? 'success' : 
                    seller.leadStatus === 'holded' ? 'error' : 
                    seller.leadStatus === 'in process' ? 'processing' : 'default'
                  }
                  className="m-0 text-[10px] font-black uppercase py-1 px-3 rounded-lg border-none shadow-sm"
                >
                  {seller.leadStatus || 'not connected'}
                </Tag>
              </div>
              
              <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
                <Text className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Email Contact</Text>
                <Text className="text-[12px] font-semibold text-slate-600">{seller.email}</Text>
              </div>
            </div>
          ))}

          {viewingSellers.length > sellerPagination.pageSize && (
            <div className="flex justify-center mt-4 pb-2">
              <Pagination
                current={sellerPagination.current}
                pageSize={sellerPagination.pageSize}
                total={viewingSellers.length}
                onChange={(page) => setSellerPagination({ ...sellerPagination, current: page })}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}

          {viewingSellers.length === 0 && (
            <div className="text-center py-10">
              <Text type="secondary">No sellers have accepted this lead yet.</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RequirementList;
