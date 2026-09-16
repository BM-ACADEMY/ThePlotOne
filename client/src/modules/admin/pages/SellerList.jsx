import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import {
  Badge,
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Switch,
  Dropdown,
  Menu,
  Row,
  Col,
  Statistic,
  Avatar,
  Select,
} from "antd";
import { Hash, UserPlus, UserCircle, ShieldCheck as ShieldIcon, UserCog, ChevronDown } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Briefcase,
  UserCheck,
  UserX,
  ShieldCheck,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Home,
  Megaphone,
  IndianRupee,
  Phone
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Common/Loader";
import moment from "moment";

const { Title, Text } = Typography;

// Promoter Module Task 9.1 — campaign status labels for a promoter's
// per-project row. 'no_plan' and 'limit_reached' are derived client-side
// values from getPromoterCampaigns, not real Campaign.status enum values.
const CAMPAIGN_PROJECT_STATUS_LABEL = {
  no_plan: "No Plan",
  limit_reached: "Limit Reached",
  draft: "Draft",
  payment_received: "Payment Received",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  expired: "Expired",
};
const CAMPAIGN_PROJECT_STATUS_COLOR = {
  no_plan: "default",
  limit_reached: "gold",
  draft: "default",
  payment_received: "gold",
  active: "green",
  paused: "orange",
  completed: "blue",
  expired: "red",
};
// PaymentHistory.paymentStatus enum: completed/failed/refunded.
const PAYMENT_STATUS_LABEL = { completed: "Paid", failed: "Failed", refunded: "Refunded" };
const PAYMENT_STATUS_COLOR = { completed: "green", failed: "red", refunded: "gold" };

const isPromoterRecord = (record) => /Builder|Promoter/i.test(record?.businessType?.name || "");

const SellerList = () => {
  const { user: currentUser } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState({ projects: [], paymentHistory: [] });
  const [campaignSummaryLoading, setCampaignSummaryLoading] = useState(false);
  const [campaignPromoterName, setCampaignPromoterName] = useState("");
  const [campaignPromoterPhone, setCampaignPromoterPhone] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeFilter = searchParams.get("type");
  const [businessTypes, setBusinessTypes] = useState([]);
  const socket = useSocket();

  const filteredSellers = (typeFilter
    ? sellers.filter((s) => s.businessType?._id === typeFilter)
    : sellers
  ).sort((a, b) => {
    const aPending = (a.pendingPropertyCount || 0) + (a.editPendingCount || 0);
    const bPending = (b.pendingPropertyCount || 0) + (b.editPendingCount || 0);
    return bPending - aPending;
  });


  const fetchSellers = async () => {
    setLoading(true);
    try {
      // Fetch only sellers
      const response = await api.get("/users/get-all-users?role=seller");
      setSellers(response.data);
    } catch (error) {
      console.error("Failed to fetch sellers", error);
      message.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/users/get-all-users?role=admin");
      setAdmins(response.data);
    } catch (error) {
      console.error("Failed to fetch admins", error);
    }
  };

  const fetchBusinessTypes = async () => {
    try {
      const response = await api.get("/business-types");
      setBusinessTypes(response.data.filter((t) => t.status === "active"));
    } catch (error) {
      console.error("Failed to fetch business types", error);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchBusinessTypes();
    if (currentUser?.isSuperAdmin) {
      fetchAdmins();
    }
  }, [currentUser]);

  useEffect(() => {
    if (socket) {
      const handleBadgeRequest = (data) => {
        // We can just fetch the sellers again, or update the specific seller if we want to be more efficient
        // For simplicity and to ensure data consistency, we'll fetch sellers
        fetchSellers();
        if (data && data.message) {
           message.info(data.message);
        }
      };

      socket.on("badge-verification-requested", handleBadgeRequest);

      return () => {
        socket.off("badge-verification-requested", handleBadgeRequest);
      };
    }
  }, [socket]);

  const handleViewCampaigns = async (record) => {
    setCampaignPromoterName(record.name || "Promoter");
    setCampaignPromoterPhone(record.phone || "");
    setCampaignModalVisible(true);
    setCampaignSummaryLoading(true);
    try {
      const res = await api.get(`/admin/campaigns/by-promoter/${record._id}`);
      setCampaignSummary({ projects: res.data?.projects || [], paymentHistory: res.data?.paymentHistory || [] });
    } catch (error) {
      console.error("Failed to fetch promoter campaigns:", error);
      message.error("Failed to load campaign details");
    } finally {
      setCampaignSummaryLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this seller?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/users/delete-user-by-id/${id}`);
          message.success("Seller deleted successfully");
          fetchSellers();
        } catch (error) {
          message.error("Failed to delete seller");
          console.error(error);
        }
      },
    });
  };

  const handleAssignAdmin = async (adminId) => {
    setAssigningLoading(true);
    try {
      await api.put(`/users/update-user-by-id/${selectedSeller._id}`, {
        assignedAdmin: adminId || null,
      });
      message.success("Seller assigned successfully");
      setIsAssignModalOpen(false);
      fetchSellers();
    } catch (error) {
      message.error("Failed to assign seller");
    } finally {
      setAssigningLoading(false);
    }
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: !!record.assignedAdmin,
    }),
  };

  const handleBulkAssign = async (adminId) => {
    setAssigningLoading(true);
    try {
      await api.put("/users/bulk-assign-admin", {
        userIds: selectedRowKeys,
        assignedAdminId: adminId || null,
      });
      message.success(`${selectedRowKeys.length} sellers assigned successfully`);
      setIsAssignModalOpen(false);
      setSelectedRowKeys([]);
      setIsBulkMode(false);
      fetchSellers();
    } catch (error) {
      message.error("Failed to perform bulk assignment");
    } finally {
      setAssigningLoading(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={getImageUrl(record.profile_image)} 
            size={40}
            className="bg-indigo-100 text-indigo-600 border border-indigo-200"
          >
            {text ? text.charAt(0).toUpperCase() : "S"}
          </Avatar>
          <div className="flex flex-col">
            <a
              href={`/properties/user/${record._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              {text || "Unnamed Seller"}
            </a>
            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{record.userId || "NO ID"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Portfolio Manager",
      key: "attribution",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <UserCircle size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500">
              Created By: <span className="font-medium text-gray-700">{record.createdBy?.name || (record.role_id?.role_name === "admin" ? "System" : "Self Registered")}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserPlus size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500">
              Assigned: <span className="font-medium text-indigo-600">{record.assignedAdmin?.name || (currentUser?.isSuperAdmin ? "Unassigned" : "Me")}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{record.phone || "No Phone"}</span>
          <span className="text-xs text-gray-500">{record.email}</span>
        </div>
      ),
    },
    {
      title: "Registered At",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (_, record) => (
        <span className="text-xs text-gray-500 font-medium">
          {record.createdAt ? moment(record.createdAt).format("DD MMM YYYY, hh:mm A") : "---"}
        </span>
      ),
    },
    {
      title: "Business Type",
      dataIndex: "businessType",
      key: "businessType",
      render: (bt) => (
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-600">
            {bt?.name || "---"}
          </span>
        </div>
      ),
    },
    {
      title: "Properties",
      key: "pendingProperties",
      render: (_, record) => {
        const pending = record.pendingPropertyCount || 0;
        const editPending = record.editPendingCount || 0;
        const totalPending = pending + editPending;

        if (totalPending === 0) return <span className="text-gray-400 text-xs">None</span>;

        return (
          <Space direction="vertical" size={2}>
            {pending > 0 && (
              <Badge count={pending} overflowCount={99}>
                <Tag color="orange" className="mr-0">New Pending</Tag>
              </Badge>
            )}
            {editPending > 0 && (
              <Badge count={editPending} overflowCount={99}>
                <Tag color="cyan" className="mr-0">Edit Pending</Tag>
              </Badge>
            )}
          </Space>
        );
      },
    },
    {
      title: "Badge Verification",
      key: "badgeVerification",
      render: (_, record) => {
        let color = "default";
        let text = "None";
        let icon = <AlertCircle size={14} className="mr-1" />;

        if (record.badgeVerified) {
          color = "success";
          text = "Verified";
          icon = <ShieldCheck size={14} className="mr-1" />;
        } else if (record.badgeRequestStatus === "pending") {
          color = "warning";
          text = "Pending Request";
          icon = <Clock size={14} className="mr-1" />;
        } else if (record.badgeRequestStatus === "rejected") {
          color = "error";
          text = "Rejected";
          icon = <XCircle size={14} className="mr-1" />;
        }

        return (
          <Tag color={color} className="rounded-full px-3 flex items-center w-fit">
            {icon}
            <span className="text-[11px] font-medium uppercase tracking-tight">{text}</span>
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} className="rounded-full px-3">
          <span className="inline-flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-tight">
            {status ? status.toUpperCase() : "ACTIVE"}
          </span>
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        const items = [
          currentUser?.isSuperAdmin && {
            key: "assign",
            label: (
              <div className="flex items-center gap-2" onClick={() => {
                setSelectedSeller(record);
                setIsBulkMode(false);
                setIsAssignModalOpen(true);
              }}>
                <UserCog size={14} className="text-indigo-600" />
                <span>Assign to SubAdmin</span>
              </div>
            ),
          },
          {
            key: "toggleStatus",
            label: (
              <div
                className="flex items-center gap-2"
                onClick={async () => {
                  try {
                    await api.put(`/users/update-user-by-id/${record._id}`, {
                      status: record.status === "active" ? "inactive" : "active",
                    });
                    message.success(`Seller ${record.status === "active" ? "deactivated" : "activated"} successfully`);
                    fetchSellers();
                  } catch (error) {
                    message.error("Failed to update status");
                  }
                }}
              >
                <AlertCircle size={14} />
                <span>{record.status === "active" ? "Deactivate Seller" : "Activate Seller"}</span>
              </div>
            ),
          },
          {
            key: "verifyBadge",
            label: (
              <div
                className="flex items-center gap-2"
                onClick={async () => {
                  try {
                    await api.put(`/users/update-user-by-id/${record._id}`, {
                      badgeVerified: !record.badgeVerified,
                      badgeRequestStatus: !record.badgeVerified ? "approved" : "none",
                    });
                    message.success(`Verified badge ${record.badgeVerified ? "removed" : "applied"} successfully`);
                    fetchSellers();
                  } catch (error) {
                    message.error("Failed to update badge");
                  }
                }}
              >
                <CheckCircle size={14} />
                <span>{record.badgeVerified ? "Unverify Seller" : "Verify Seller"}</span>
              </div>
            ),
          },
          record.badgeRequestStatus === "pending" && {
            key: "rejectBadge",
            danger: true,
            label: (
              <div
                className="flex items-center gap-2"
                onClick={async () => {
                  try {
                    await api.put(`/users/update-user-by-id/${record._id}`, {
                      badgeRequestStatus: "rejected",
                      badgeVerified: false
                    });
                    message.success("Badge request rejected");
                    fetchSellers();
                  } catch (error) {
                    message.error("Failed to reject badge");
                  }
                }}
              >
                <XCircle size={14} />
                <span>Reject Badge Request</span>
              </div>
            ),
          },
          {
            type: "divider",
          },
          {
            key: "viewProperties",
            label: (
              <div className="flex items-center gap-2" onClick={() => navigate(`/admin/properties?seller=${record._id}`)}>
                <Home size={14} className="text-blue-600" />
                <span>View Properties</span>
              </div>
            ),
          },
          isPromoterRecord(record) && {
            key: "viewCampaigns",
            label: (
              <div className="flex items-center gap-2" onClick={() => handleViewCampaigns(record)}>
                <Megaphone size={14} className="text-indigo-600" />
                <span>View Campaigns</span>
              </div>
            ),
          },
          (currentUser?.isSuperAdmin || currentUser?.permissions?.includes("delete_seller")) && {
            key: "delete",
            danger: true,
            label: (
              <div className="flex items-center gap-2" onClick={() => handleDelete(record._id)}>
                <Trash2 size={14} />
                <span>Delete Seller</span>
              </div>
            ),
          },
        ].filter(Boolean);

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Title level={3} className="mb-0! text-left">
            Seller Management {currentUser?.isSuperAdmin ? "(All)" : "(Assigned)"}
          </Title>
          <div className="flex items-center gap-3 mt-2">
            <Select
              className="w-64 h-10 rounded-lg shadow-sm"
              placeholder="Filter by Business Type"
              allowClear
              value={typeFilter}
              onChange={(val) => {
                if (val) {
                  setSearchParams({ type: val });
                } else {
                  setSearchParams({});
                }
              }}
            >
              {businessTypes.map((type) => (
                <Select.Option key={type._id} value={type._id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedRowKeys.length > 0 && (
            <div className="flex items-center gap-4 mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-300">
              <span className="text-sm font-bold text-indigo-600">
                {selectedRowKeys.length} sellers selected
              </span>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "unassign",
                      label: "(Unassigned / Super Admin)",
                      onClick: () => handleBulkAssign(null),
                    },
                    { type: "divider" },
                    ...admins.map((admin) => ({
                      key: admin._id,
                      label: (
                        <div className="flex items-center gap-2">
                          <Avatar size="small" src={getImageUrl(admin.profile_image)}>
                            {admin.name?.charAt(0)}
                          </Avatar>
                          <span>{admin.name}</span>
                        </div>
                      ),
                      onClick: () => handleBulkAssign(admin._id),
                    })),
                  ],
                }}
                trigger={["click"]}
              >
                <Button 
                  type="primary" 
                  size="small" 
                  className="bg-indigo-600 flex items-center gap-2"
                  loading={assigningLoading}
                >
                  Assign to Admin <ChevronDown size={14} />
                </Button>
              </Dropdown>
              <Button 
                type="text" 
                size="small" 
                onClick={() => setSelectedRowKeys([])}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-indigo-50/50 hover:bg-indigo-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <Briefcase size={24} />
              </div>
              <div>
                <div className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Total Sellers</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : filteredSellers.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-emerald-50/50 hover:bg-emerald-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="text-emerald-600 font-semibold text-xs uppercase tracking-wider">Active Sellers</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : filteredSellers.filter(s => s.status === 'active').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-rose-50/50 hover:bg-rose-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                <UserX size={24} />
              </div>
              <div>
                <div className="text-rose-600 font-semibold text-xs uppercase tracking-wider">Inactive Sellers</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : filteredSellers.filter(s => s.status !== 'active').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-blue-50/50 hover:bg-blue-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Verified Sellers</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : filteredSellers.filter(s => s.badgeVerified).length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <div className="overflow-x-auto">
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredSellers}
            rowKey="_id"
            loading={{
              spinning: loading,
              indicator: <Loader variant="panel" />
            }}
            pagination={{
              pageSize: 10,
              size: "small",
              responsive: true,
              className: "px-4"
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      {/* Assignment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-indigo-600" />
            <span>{isBulkMode ? "Bulk Portfolio Allocation" : "Allocate Seller to Support Administrator"}</span>
          </div>
        }
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <div className="py-4">
          <Text className="text-gray-500 block mb-4">
            {isBulkMode 
              ? `Assigning ${selectedRowKeys.length} selected sellers to an administrator.`
              : <>Assign <span className="font-bold text-gray-800">{selectedSeller?.name}</span> to a sub-admin for portfolio maintenance.</>
            }
          </Text>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Portfolio Manager</label>
              <Select
                placeholder="Choose an administrator"
                className="w-full h-11"
                onChange={(val) => isBulkMode ? handleBulkAssign(val) : handleAssignAdmin(val)}
                loading={assigningLoading}
                value={isBulkMode ? undefined : selectedSeller?.assignedAdmin?._id}
              >
                <Select.Option value="">(Unassigned / Super Admin)</Select.Option>
                {admins.map(admin => (
                  <Select.Option key={admin._id} value={admin._id}>
                    <div className="flex items-center gap-2">
                      <Avatar size="small" src={getImageUrl(admin.profile_image)}>
                        {admin.name?.charAt(0)}
                      </Avatar>
                      <span>{admin.name} ({admin.phone})</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Promoter Module Task 9.1 — Campaign summary (Projects + Payment History) */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-0">
            <Megaphone size={20} className="text-indigo-600" />
            <span className="text-lg font-bold">{campaignPromoterName} — Campaigns</span>
          </div>
        }
        open={campaignModalVisible}
        onCancel={() => setCampaignModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCampaignModalVisible(false)} className="rounded-lg h-10 px-6">
            Close
          </Button>,
        ]}
        width={800}
        centered
        styles={{ body: { maxHeight: "70vh", overflowY: "auto", padding: "24px" } }}
      >
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-900 m-0">Promoter: {campaignPromoterName}</p>
          {campaignPromoterPhone && (
            <p className="text-sm text-gray-500 mt-0.5 mb-0 flex items-center gap-1.5">
              <Phone size={13} /> {campaignPromoterPhone}
            </p>
          )}
        </div>

        <Title level={5} className="mb-3!">
          Projects and Campaigns
        </Title>
        <Table
          dataSource={campaignSummary.projects}
          rowKey="projectId"
          loading={campaignSummaryLoading}
          pagination={false}
          size="small"
          className="mb-8"
          locale={{ emptyText: "No campaigns found" }}
          columns={[
            { title: "Project", dataIndex: "projectTitle", key: "projectTitle" },
            {
              title: "Plan",
              dataIndex: "planName",
              key: "planName",
              render: (v) => v || <span className="text-gray-400">—</span>,
            },
            {
              title: "Leads",
              key: "leads",
              render: (_, row) =>
                row.committedMinimum !== null ? (
                  <span>
                    {row.deliveredCount} / {row.committedMinimum}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => (
                <Tag color={CAMPAIGN_PROJECT_STATUS_COLOR[status] || "default"} className="rounded-full px-3 capitalize">
                  {CAMPAIGN_PROJECT_STATUS_LABEL[status] || status}
                </Tag>
              ),
            },
            {
              title: "Action",
              key: "action",
              render: (_, row) =>
                row.campaignId ? (
                  <Button
                    size="small"
                    onClick={() => {
                      setCampaignModalVisible(false);
                      navigate(`/admin/campaigns/${row.campaignId}`);
                    }}
                  >
                    View
                  </Button>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
          ]}
        />

        <Title level={5} className="mb-3!">
          Payment History
        </Title>
        <Table
          dataSource={campaignSummary.paymentHistory}
          rowKey="_id"
          loading={campaignSummaryLoading}
          pagination={{ pageSize: 5 }}
          size="small"
          locale={{ emptyText: "No payment history found" }}
          columns={[
            {
              title: "Date",
              dataIndex: "date",
              key: "date",
              render: (v) => moment(v).format("DD MMM YYYY"),
            },
            { title: "Project", dataIndex: "projectTitle", key: "projectTitle" },
            { title: "Plan", dataIndex: "planName", key: "planName" },
            {
              title: "Amount",
              dataIndex: "amountPaid",
              key: "amountPaid",
              render: (v) => (
                <span className="flex items-center font-semibold">
                  <IndianRupee size={12} className="mr-0.5" />
                  {Number(v || 0).toLocaleString("en-IN")}
                </span>
              ),
            },
            {
              title: "Status",
              dataIndex: "paymentStatus",
              key: "paymentStatus",
              render: (status) => (
                <Tag color={PAYMENT_STATUS_COLOR[status] || "default"}>
                  {PAYMENT_STATUS_LABEL[status] || status}
                </Tag>
              ),
            },
          ]}
        />
      </Modal>

      {/* Builder Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-gray-300 pb-4 mb-0">
            <Briefcase size={20} className="text-indigo-600" />
            <span className="text-lg font-bold">Builder Professional Profile</span>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)} className="rounded-lg h-10 px-6">
            Close
          </Button>
        ]}
        width={850}
        centered
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' } }}
        className="builder-detail-modal"
      >
        {selectedSeller?.builderProfile ? (
          <div className="py-2">
            <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex-shrink-0">
                <Avatar 
                  src={getImageUrl(selectedSeller.builderProfile.companyLogo)} 
                  size={100} 
                  shape="square"
                  className="rounded-xl border-2 border-white shadow-md bg-white p-1"
                >
                  {selectedSeller.builderProfile.companyName?.charAt(0)}
                </Avatar>
              </div>
              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedSeller.builderProfile.companyName}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Tag color="blue" className="rounded-full px-3 m-0">RERA: {selectedSeller.builderProfile.reraNumber || "N/A"}</Tag>
                  <Tag color="cyan" className="rounded-full px-3 m-0">GST: {selectedSeller.builderProfile.gstNumber || "N/A"}</Tag>
                  <Tag color="purple" className="rounded-full px-3 m-0">{selectedSeller.builderProfile.experienceYears} Years Exp.</Tag>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <AlertCircle size={14} />
                  <span>Verified Identity: {selectedSeller.name}</span>
                </div>
              </div>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={24}>
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertCircle size={14} className="text-indigo-500" />
                    Office Address
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-0">
                    {selectedSeller.builderProfile.officeAddress || "No address provided"}
                  </p>
                </div>
              </Col>
              
              <Col span={24}>
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Briefcase size={14} className="text-indigo-500" />
                    About Company
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-0 italic">
                    {selectedSeller.builderProfile.aboutCompany || "No bio provided"}
                  </p>
                </div>
              </Col>

              <Col span={12}>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Contact</div>
                  <div className="text-slate-800 font-semibold">{selectedSeller.builderProfile.phonePrimary || selectedSeller.phone}</div>
                </div>
              </Col>
              
              <Col span={12}>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Email</div>
                  <div className="text-slate-800 font-semibold">{selectedSeller.builderProfile.email || selectedSeller.email || "N/A"}</div>
                </div>
              </Col>

              <Col span={24}>
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Social & Web Links</div>
                  <div className="flex flex-wrap gap-3">
                    {selectedSeller.builderProfile.socialLinks?.website && (
                      <a href={selectedSeller.builderProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                        <Globe size={16} />
                        <span className="font-medium">Website</span>
                      </a>
                    )}
                    {selectedSeller.builderProfile.socialLinks?.linkedin && (
                      <a href={selectedSeller.builderProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        <Linkedin size={16} />
                        <span className="font-medium">LinkedIn</span>
                      </a>
                    )}
                    {selectedSeller.builderProfile.socialLinks?.instagram && (
                      <a href={selectedSeller.builderProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-xl border border-pink-100 hover:bg-pink-100 transition-colors">
                        <Instagram size={16} />
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {selectedSeller.builderProfile.socialLinks?.facebook && (
                      <a href={selectedSeller.builderProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                        <Facebook size={16} />
                        <span className="font-medium">Facebook</span>
                      </a>
                    )}
                    {!selectedSeller.builderProfile.socialLinks?.website && 
                     !selectedSeller.builderProfile.socialLinks?.linkedin && 
                     !selectedSeller.builderProfile.socialLinks?.instagram && 
                     !selectedSeller.builderProfile.socialLinks?.facebook && (
                      <span className="text-slate-400 italic text-sm">No social links provided</span>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
            <p>No builder details found for this seller.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SellerList;
