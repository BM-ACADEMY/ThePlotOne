import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Dropdown,
  Menu,
  Row,
  Col,
  Statistic,
  Avatar,
  Select,
} from "antd";
import { getImageUrl } from "@/utils/imageUrl";
import { Hash, UserPlus, UserCircle, ShieldCheck as ShieldIcon } from "lucide-react";
import {
  Trash2,
  AlertCircle,
  MoreVertical,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  UserCog, ChevronDown
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Common/Loader";
import moment from "moment";

const { Title, Text } = Typography;

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles/fetch-all-role");
      setRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch only users
      const response = await api.get("/users/get-all-users?role=user");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (currentUser?.isSuperAdmin) {
      fetchAdmins();
    }
  }, [currentUser]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this user?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/users/delete-user-by-id/${id}`);
          message.success("User deleted successfully");
          fetchUsers();
        } catch (error) {
          message.error("Failed to delete user");
          console.error(error);
        }
      },
    });
  };

  const handleAssignAdmin = async (adminId) => {
    setAssigningLoading(true);
    try {
      await api.put(`/users/update-user-by-id/${selectedUser._id}`, {
        assignedAdmin: adminId || null,
      });
      message.success("User assigned successfully");
      setIsAssignModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error("Failed to assign user");
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
      message.success(`${selectedRowKeys.length} users assigned successfully`);
      setIsAssignModalOpen(false);
      setSelectedRowKeys([]);
      setIsBulkMode(false);
      fetchUsers();
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
            className="bg-blue-100 text-blue-600 border border-blue-200"
          >
            {text ? text.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{text || "Unnamed User"}</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{record.userId || "NO ID"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Source / Manager",
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
      title: "Verification",
      key: "verification",
      render: (_, record) => (
        <Tag color={record.isVerified ? "success" : "warning"} className="rounded-full px-3 flex items-center w-fit">
          {record.isVerified ? <CheckCircle size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
          <span className="text-[11px] font-medium uppercase tracking-tight">
            {record.isVerified ? "VERIFIED" : "UNVERIFIED"}
          </span>
        </Tag>
      ),
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
                setSelectedUser(record);
                setIsBulkMode(false);
                setIsAssignModalOpen(true);
              }}>
                <UserCog size={14} className="text-indigo-600" />
                <span>Assign to Administrator</span>
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
                    message.success(`User ${record.status === "active" ? "deactivated" : "activated"} successfully`);
                    fetchUsers();
                  } catch (error) {
                    message.error("Failed to update status");
                  }
                }}
              >
                <AlertCircle size={14} />
                <span>{record.status === "active" ? "Deactivate" : "Activate"}</span>
              </div>
            ),
          },
          {
            key: "toggleVerify",
            label: (
              <div
                className="flex items-center gap-2"
                onClick={async () => {
                  try {
                    await api.put(`/users/update-user-by-id/${record._id}`, {
                      isVerified: !record.isVerified,
                    });
                    message.success(`User verification ${record.isVerified ? "removed" : "applied"}`);
                    fetchUsers();
                  } catch (error) {
                    message.error("Failed to update verification");
                  }
                }}
              >
                <CheckCircle size={14} />
                <span>{record.isVerified ? "Unverify User" : "Verify User"}</span>
              </div>
            ),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            danger: true,
            label: (
              <div className="flex items-center gap-2" onClick={() => handleDelete(record._id)}>
                <Trash2 size={14} />
                <span>Delete User</span>
              </div>
            ),
          },
          {
            type: "divider",
          },
          currentUser?.isSuperAdmin && {
            key: "makeAdmin",
            label: (
              <div
                className="flex items-center gap-2 text-indigo-600 font-medium"
                onClick={() => {
                  const adminRole = roles.find(r => r.role_name === "admin");
                  if (!adminRole) return message.error("Admin role not found");

                  Modal.confirm({
                    title: "Promote to Admin?",
                    icon: <ShieldAlert className="text-indigo-500" />,
                    content: `Are you sure you want to give administrative privileges to ${record.name || "this user"}?`,
                    okText: "Yes, Promote",
                    okType: "primary",
                    okButtonProps: { className: "bg-indigo-600" },
                    onOk: async () => {
                      try {
                        await api.put(`/users/update-user-by-id/${record._id}`, {
                          role_id: adminRole._id,
                        });
                        message.success("User promoted to Admin successfully");
                        fetchUsers();
                      } catch (error) {
                        message.error("Failed to promote user");
                      }
                    },
                  });
                }}
              >
                <ShieldAlert size={14} />
                <span>Make to SubAdmin</span>
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={3} className="mb-0!">
            User Management {currentUser?.isSuperAdmin ? "(All)" : "(Assigned)"}
          </Title>
          {selectedRowKeys.length > 0 && (
            <div className="flex items-center gap-4 mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-300">
              <span className="text-sm font-bold text-indigo-600">
                {selectedRowKeys.length} users selected
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
          <Card className="shadow-sm border-none bg-blue-50/50 hover:bg-blue-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <div className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Total Users</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : users.length}</div>
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
                <div className="text-emerald-600 font-semibold text-xs uppercase tracking-wider">Active Users</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : users.filter(u => u.status === 'active').length}</div>
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
                <div className="text-rose-600 font-semibold text-xs uppercase tracking-wider">Inactive Users</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : users.filter(u => u.status !== 'active').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-indigo-50/50 hover:bg-indigo-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Verified Users</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : users.filter(u => u.isVerified).length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            className: "px-4"
          }}
          scroll={{ x: true }}
        />
      </Card>

      {/* Assignment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-indigo-600" />
            <span>{isBulkMode ? "Bulk Portfolio Allocation" : "Allocate User to Support Administrator"}</span>
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
              ? `Assigning ${selectedRowKeys.length} selected users to an administrator.`
              : <>Assign <span className="font-bold text-gray-800">{selectedUser?.name}</span> to a sub-admin for portfolio maintenance.</>
            }
          </Text>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Administrator</label>
              <Select
                placeholder="Choose an administrator"
                className="w-full h-11"
                onChange={(val) => isBulkMode ? handleBulkAssign(val) : handleAssignAdmin(val)}
                loading={assigningLoading}
                value={isBulkMode ? undefined : selectedUser?.assignedAdmin?._id}
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
    </div>
  );
};

export default UserList;
