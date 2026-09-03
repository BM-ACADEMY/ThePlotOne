import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Modal,
  message,
  Tooltip,
  Form,
  Select,
} from "antd";
import { Search, Edit2, Trash2, Mail, Phone } from "lucide-react";
import api from "@/services/api";
// import { useAuth } from "@/context/AuthContext";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  // const { user } = useAuth(); // Current logged in admin (Unused)

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/get-all-users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (userId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this user?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/users/delete-user-by-id/${userId}`);
          message.success("User deleted successfully");
          fetchUsers();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete user");
        }
      },
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-medium text-gray-700">{text}</span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        record.email.toLowerCase().includes(value.toLowerCase()) ||
        (record.phone && record.phone.includes(value)),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <Mail size={14} className="mr-2" /> {record.email}
          </div>
          {record.phone && (
            <div className="flex items-center">
              <Phone size={14} className="mr-2" /> {record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role_id",
      key: "role",
      render: (role) => {
        const roleName = role?.role_name || "User";
        let color = "blue";
        if (roleName.toLowerCase() === "admin") color = "purple";
        if (roleName.toLowerCase() === "seller") color = "green";
        return (
          <Tag color={color} className="uppercase font-bold text-xs">
            {roleName}
          </Tag>
        );
      },
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Seller", value: "seller" },
        { text: "User", value: "user" },
      ],
      onFilter: (value, record) =>
        record.role_id?.role_name?.toLowerCase() === value,
    },
    {
      title: "Status",
      dataIndex: "isVerified",
      key: "status",
      render: (isVerified) => (
        <Tag color={isVerified ? "success" : "warning"}>
          {isVerified ? "Verified" : "Unverified"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit User">
            <Button
              icon={<Edit2 size={16} />}
              type="text"
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <Button
              icon={<Trash2 size={16} />}
              type="text"
              danger
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  /* ============================================================
     NEW: Edit User Logic
  ============================================================ */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [form] = Form.useForm();
  // Role ID for "Seller" (to conditionally show Business Type)
  const [sellerRoleId, setSellerRoleId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRolesAndTypes();
  }, []);

  const fetchRolesAndTypes = async () => {
    try {
      const rolesRes = await api.get("/roles/fetch-all-role");
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    setSelectedRole(record.role_id?._id);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role_id: record.role_id?._id,
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (values) => {
    try {
      await api.put(`/users/update-user/${editingUser._id}`, values);
      message.success("User updated successfully");
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh table
    } catch (error) {
      console.error("Update failed:", error);
      message.error("Failed to update user");
    }
  };

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    // If switching away from seller, maybe clear businessType?
    // Not strictly necessary but good UX if we wanted to enforce it.
  };

  /* ============================================================ */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 m-0">
          User Management
        </h2>

        <div className="flex gap-4">
          <Input
            prefix={<Search size={18} className="text-gray-400" />}
            placeholder="Search users..."
            className="w-64 max-w-xs"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Table
          columns={columns.map((col) => {
            if (col.key === "actions") {
              return {
                ...col,
                render: (_, record) => (
                  <Space size="middle">
                    <Tooltip title="Edit User">
                      <Button
                        icon={<Edit2 size={16} />}
                        type="text"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <Button
                        icon={<Trash2 size={16} />}
                        type="text"
                        danger
                        onClick={() => handleDelete(record._id)}
                      />
                    </Tooltip>
                  </Space>
                ),
              };
            }
            return col;
          })}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: "Please enter phone" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role_id"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select onChange={handleRoleChange}>
              {roles.map((role) => (
                <Select.Option key={role._id} value={role._id}>
                  {role.role_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>


          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
