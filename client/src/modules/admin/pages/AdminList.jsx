import React, { useState, useEffect, useMemo } from "react";
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
  Input,
  Form,
  Checkbox,
  Divider,
  Tabs,
} from "antd";
import { getImageUrl } from "@/utils/imageUrl";
import { 
  Trash2, 
  AlertCircle, 
  MoreVertical, 
  CheckCircle, 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  Settings,
  Lock
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;

const PERMISSION_GROUPS = [
  {
    title: "Overview",
    options: [
      { label: "Dashboard", value: "/admin/dashboard" },
      { label: "Analytics", value: "/admin/view-count-manager" },
    ],
  },
  {
    title: "Properties",
    options: [
      { label: "Properties List", value: "/admin/properties" },
      { label: "Add Property", value: "/admin/properties/add" },
      { label: "Seller Listings", value: "/admin/seller-listings" },
      { label: "Business Types", value: "/admin/business-types" },
      { label: "Property Types", value: "/admin/property-types" },
      { label: "Approval Types", value: "/admin/approval-types" },
    ],
  },
  {
    title: "Marketing & Sales",
    options: [
      { label: "Marketing Plans", value: "/admin/marketing-plans" },
      { label: "Marketing Leads", value: "/admin/marketing-requests" },
      { label: "Subscription Plans", value: "/admin/subscription-plans" },
      { label: "Payment History", value: "/admin/payment-history" },
    ],
  },
  {
    title: "User Management",
    options: [
      { label: "User List", value: "/admin/users" },
      { label: "Admin Management", value: "/admin/admins" },
      { label: "Seller Management", value: "/admin/sellers" },
      { label: "Delete Seller Action", value: "delete_seller" },
      { label: "Failed Registrations", value: "/admin/failed-registrations" },
    ],
  },
  {
    title: "Enquiries & Communication",
    options: [
      { label: "Enquiry Leads", value: "/admin/enquiries" },
      { label: "Posted Requirements", value: "/admin/requirements" },
      { label: "Call Requests", value: "/admin/forms/call-requests" },
      { label: "Contact Messages", value: "/admin/forms/contact-messages" },
      { label: "Support Tickets", value: "/admin/support" },
      { label: "Testimonials", value: "/admin/testimonials" },
    ],
  },
  {
    title: "Content & Settings",
    options: [
      { label: "Banner Ads", value: "/admin/banner-ads" },
      { label: "Social Media", value: "/admin/social-media" },
      { label: "Profile Settings", value: "/admin/profile" },
    ],
  },
];

const AdminList = () => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);

  const fetchBusinessTypes = async () => {
    try {
      const response = await api.get("/business-types");
      setBusinessTypes(response.data.filter((t) => t.status === "active"));
    } catch (error) {
      console.error("Error fetching business types:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles/fetch-all-role");
      setRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const superAdmins = (admins || []).filter(admin => admin.isSuperAdmin);
  const subAdmins = (admins || []).filter(admin => !admin.isSuperAdmin); // Support Teams

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/get-all-users?role=admin");
      setAdmins(response.data);
    } catch (error) {
      console.error("Failed to fetch admins", error);
      message.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchRoles();
    fetchBusinessTypes();
  }, []);

  const permissionGroups = useMemo(() => {
    const groups = [...PERMISSION_GROUPS];
    
    if (businessTypes.length > 0) {
      groups.push({
        title: "Business Segment Access",
        options: businessTypes.map(type => ({
          label: `${type.name} Access`,
          value: `/admin/sellers?type=${type._id}`
        }))
      });
    }

    return groups;
  }, [businessTypes]);

  const handleRevoke = (id) => {
    if (!currentUser?.isSuperAdmin) return message.error("Only Super Admins can revoke access");
    
    const userRole = roles.find(r => r.role_name === "user");
    if (!userRole) return message.error("User role not found");

    Modal.confirm({
      title: "Revoke Admin Privileges?",
      icon: <ShieldAlert className="text-orange-500" />,
      content: "This user will lose all administrative access and become a regular user.",
      okText: "Yes, Revoke",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.put(`/users/update-user-by-id/${id}`, {
            role_id: userRole._id,
            isSuperAdmin: false,
            permissions: []
          });
          message.success("Admin privileges revoked");
          fetchAdmins();
        } catch (error) {
          message.error("Failed to revoke privileges");
          console.error(error);
        }
      },
    });
  };

  const handleAddAdmin = async (values) => {
    const adminRole = roles.find(r => r.role_name === "admin");
    if (!adminRole) return message.error("Admin role not found");

    try {
      await api.post("/users/create-user-by-admin", {
        ...values,
        role_id: adminRole._id,
      });
      message.success("New admin created successfully");
      setIsModalOpen(false);
      form.resetFields();
      fetchAdmins();
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to create admin");
    }
  };

  const handleEditPermissions = (record) => {
    setSelectedAdmin(record);
    editForm.setFieldsValue({
      name: record.name,
      phone: record.phone,
      permissions: record.permissions || [],
      isSuperAdmin: record.isSuperAdmin || false
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAdmin = async (values) => {
    try {
      await api.put(`/users/update-user-by-id/${selectedAdmin._id}`, values);
      message.success("Admin updated successfully");
      setIsEditModalOpen(false);
      fetchAdmins();
    } catch (error) {
      message.error("Failed to update admin");
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
            {text ? text.charAt(0).toUpperCase() : "A"}
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{text || "Admin User"}</span>
              {record.isSuperAdmin && (
                <Tag color="gold" className="m-0 text-[10px] h-4 leading-3 px-1 border-none font-bold">SUPER</Tag>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{record.userId || "NO ID"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Created By",
      key: "creator",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-indigo-600">
            {record.createdBy?.name || "System"}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            {record.createdAt ? moment(record.createdAt).format("DD MMM YYYY") : "Initial Setup"}
          </span>
        </div>
      ),
    },
    {
      title: "Role & Access",
      key: "role",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Tag color={record.isSuperAdmin ? "purple" : "blue"} className="w-fit rounded-md px-2">
            {record.isSuperAdmin ? "Super Admin" : "Support Team"}
          </Tag>
          {!record.isSuperAdmin && (
            <span className="text-[11px] text-gray-500">
              {record.permissions?.length || 0} sections accessible
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{record.phone || "No Phone"}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} className="rounded-full px-3">
          <span className="inline-flex items-center whitespace-nowrap">
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
        // Can't manage yourself or other super admins if you are not super
        const canManage = currentUser?.isSuperAdmin && (record._id !== currentUser._id);
        
        const items = [
          {
            key: "edit",
            label: (
              <div className="flex items-center gap-2" onClick={() => handleEditPermissions(record)}>
                <Lock size={14} />
                <span>Edit Access</span>
              </div>
            ),
          },
          {
            key: "revoke",
            danger: true,
            label: (
              <div className="flex items-center gap-2" onClick={() => handleRevoke(record._id)}>
                <ShieldAlert size={14} />
                <span>Revoke Admin</span>
              </div>
            ),
          },
          {
            key: "divider",
            type: "divider"
          },
          {
            key: "delete",
            danger: true,
            label: (
              <div className="flex items-center gap-2" onClick={() => {
                 Modal.confirm({
                    title: "Delete Admin Account?",
                    icon: <Trash2 className="text-red-500" />,
                    content: "This will permanently delete the admin account.",
                    okText: "Delete",
                    okType: "danger",
                    onOk: async () => {
                        try {
                            await api.delete(`/users/delete-user-by-id/${record._id}`);
                            message.success("Admin deleted");
                            fetchAdmins();
                        } catch (error) {
                            message.error("Failed to delete admin");
                        }
                    }
                 })
              }}>
                <Trash2 size={14} />
                <span>Delete Account</span>
              </div>
            ),
          },
        ];

        return canManage ? (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} />} />
          </Dropdown>
        ) : (
            <Tag color="default" className="text-[10px] opacity-50">MANAGEABLE BY SUPER</Tag>
        );
      },
    },
  ];

  return (
    <div className="p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={3} className="mb-0!">
            Admin Management
          </Title>
          <p className="text-gray-500 mt-1">Manage staff and administrative privileges</p>
        </div>
        {currentUser?.isSuperAdmin && (
          <Button 
            type="primary" 
            icon={<UserPlus size={18} />} 
            size="large"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 border-none shadow-md h-11"
            onClick={() => setIsModalOpen(true)}
          >
            Add New Admin
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-none bg-indigo-50/50 hover:bg-indigo-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Total Admins</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : admins.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-none bg-purple-50/50 hover:bg-purple-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-purple-600 font-semibold text-xs uppercase tracking-wider">Super Admins</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : superAdmins.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-none bg-blue-50/50 hover:bg-blue-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Support Teams</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : subAdmins.length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <Tabs
          defaultActiveKey="1"
          className="admin-tabs"
          items={[
            {
              key: "1",
              label: (
                <div className="flex items-center gap-2 px-4 py-2">
                  <ShieldCheck size={18} />
                  <span>Super Admins</span>
                  <Tag className="ml-1 border-none bg-indigo-100 text-indigo-600 rounded-full">{superAdmins.length}</Tag>
                </div>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={superAdmins}
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
              ),
            },
            {
              key: "2",
              label: (
                <div className="flex items-center gap-2 px-4 py-2">
                  <UserCheck size={18} />
                  <span>Support Teams</span>
                  <Tag className="ml-1 border-none bg-blue-100 text-blue-600 rounded-full">{subAdmins.length}</Tag>
                </div>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={subAdmins}
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
              ),
            },
          ]}
        />
      </Card>

      {/* Add Admin Modal */}
      <Modal
        title="Add New Admin"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAdmin}
          className="mt-4"
          initialValues={{ isSuperAdmin: false, permissions: [] }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter admin name" }]}
              >
                <Input placeholder="Enter name" prefix={<Users size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                  { pattern: /^[0-9]{10}$/, message: "Please enter a valid 10-digit number" }
                ]}
              >
                <Input placeholder="10-digit phone number" prefix={<span className="text-gray-400">+91</span>} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" className="text-gray-400 text-xs">Role & Access Control</Divider>

          <Form.Item name="isSuperAdmin" valuePropName="checked">
            <Checkbox className="font-semibold text-indigo-600">Give Super Admin Access (Full Permissions)</Checkbox>
          </Form.Item>

          <Form.Item 
            noStyle 
            shouldUpdate={(prev, curr) => prev.isSuperAdmin !== curr.isSuperAdmin}
          >
            {({ getFieldValue }) => !getFieldValue("isSuperAdmin") && (
              <Form.Item
                name="permissions"
                label="Grant Access To:"
                className="mt-4"
              >
                <Checkbox.Group className="w-full">
                  <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {permissionGroups.map((group) => {
                      const groupValues = group.options.map(o => o.value);
                      const currentPermissions = form.getFieldValue("permissions") || [];
                      const isAllSelected = groupValues.length > 0 && groupValues.every(val => currentPermissions.includes(val));

                      const toggleGroup = () => {
                        const otherPermissions = currentPermissions.filter(val => !groupValues.includes(val));
                        const newPermissions = isAllSelected 
                          ? otherPermissions 
                          : Array.from(new Set([...otherPermissions, ...groupValues]));
                        form.setFieldsValue({ permissions: newPermissions });
                      };

                      return (
                        <div key={group.title} className="mb-4">
                          <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded mb-2">
                            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                              {group.title}
                            </div>
                            <Button 
                              type="link" 
                              size="small" 
                              className="text-[10px] p-0 h-auto"
                              onClick={toggleGroup}
                            >
                              {isAllSelected ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <Row gutter={[16, 8]}>
                            {group.options.map((opt) => (
                              <Col span={12} key={opt.value}>
                                <Checkbox value={opt.value}>{opt.label}</Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Form.Item>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-indigo-600">
              Create Admin
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Access Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-indigo-600" />
            <span>Manage Admin Access - {selectedAdmin?.name}</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
        centered
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateAdmin}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter admin name" }]}
              >
                <Input disabled placeholder="Enter name" prefix={<Users size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                  { pattern: /^[0-9]{10}$/, message: "Please enter a valid 10-digit number" }
                ]}
              >
                <Input disabled placeholder="10-digit phone number" prefix={<span className="text-gray-400">+91</span>} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" className="text-gray-400 text-xs">Access Control</Divider>

          <Form.Item name="isSuperAdmin" valuePropName="checked">
            <Checkbox className="font-semibold text-indigo-600">Super Admin Mode (All access granted)</Checkbox>
          </Form.Item>

          <Form.Item 
            noStyle 
            shouldUpdate={(prev, curr) => prev.isSuperAdmin !== curr.isSuperAdmin}
          >
            {({ getFieldValue }) => !getFieldValue("isSuperAdmin") && (
              <Form.Item
                name="permissions"
                label="Select Accessible Sections:"
                className="mt-4"
              >
                <Checkbox.Group className="w-full">
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {permissionGroups.map((group) => {
                      const groupValues = group.options.map(o => o.value);
                      const currentPermissions = editForm.getFieldValue("permissions") || [];
                      const isAllSelected = groupValues.length > 0 && groupValues.every(val => currentPermissions.includes(val));

                      const toggleGroup = () => {
                        const otherPermissions = currentPermissions.filter(val => !groupValues.includes(val));
                        const newPermissions = isAllSelected 
                          ? otherPermissions 
                          : Array.from(new Set([...otherPermissions, ...groupValues]));
                        editForm.setFieldsValue({ permissions: newPermissions });
                      };

                      return (
                        <div key={group.title} className="mb-4">
                          <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded mb-2">
                            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                              {group.title}
                            </div>
                            <Button 
                              type="link" 
                              size="small" 
                              className="text-[10px] p-0 h-auto"
                              onClick={toggleGroup}
                            >
                              {isAllSelected ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <Row gutter={[16, 8]}>
                            {group.options.map((opt) => (
                              <Col span={12} key={opt.value}>
                                <Checkbox value={opt.value}>{opt.label}</Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Form.Item>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4 mb-4">
             <div className="flex gap-2 text-amber-800 text-[13px]">
               <AlertCircle size={16} className="shrink-0 mt-0.5" />
               <p className="mb-0">Changes will take effect the next time the sub-admin logs in or refreshes the page.</p>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-indigo-600">
              Update Permissions
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminList;
