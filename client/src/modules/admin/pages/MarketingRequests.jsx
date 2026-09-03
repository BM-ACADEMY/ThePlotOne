import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  message,
  Typography,
  Card,
  Modal,
  Form,
  Select,
  Input,
  Popconfirm,
  Avatar,
  Tooltip,
} from "antd";
import {
  Clock,
  Phone,
  Mail,
  User,
  CheckCircle,
  Trash2,
  Building2,
  Edit2,
  RefreshCcw,
  Users
} from "lucide-react";
import Loader from "@/components/Common/Loader";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const { Title } = Typography;

const MarketingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/marketing/requests/admin`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRequests(res.data.data);
    } catch {
      message.error("Failed to fetch marketing requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/marketing/requests/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      message.success("Marketing request deleted");
      fetchRequests();
    } catch {
      message.error("Failed to delete marketing request");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = (record) => {
    setSelectedRequest(record);
    form.setFieldsValue({
      status: record.status,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      await axios.put(
        `${API}/marketing/requests/${selectedRequest._id}`,
        values,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      message.success("Request status updated");
      setIsModalOpen(false);
      fetchRequests();
      // Refresh sidebar counts
      window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
    } catch {
      message.error("Failed to update status");
    }
  };

  // Helper arrays for cleaner JSX
  const statCards = [
    {
      title: "Total Leads",
      count: requests.length,
      icon: <Users size={24} />,
      colors: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
    },
    {
      title: "New Leads",
      count: requests.filter((r) => r.status === "pending").length,
      icon: <Clock size={24} />,
      colors: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300",
    },
    {
      title: "Contacted",
      count: requests.filter((r) => r.status === "contacted").length,
      icon: <Phone size={24} />,
      colors: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
    },
    {
      title: "Successful",
      count: requests.filter((r) => r.status === "completed").length,
      icon: <CheckCircle size={24} />,
      colors: "bg-green-50 text-green-600 border-green-100 hover:border-green-300",
    },
  ];

  const columns = [
    {
      title: "Seller Details",
      key: "seller",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            className="bg-indigo-100 text-indigo-600"
            icon={<User size={18} />}
          />
          <Space direction="vertical" size={0}>
            <div className="font-semibold text-gray-800">
              {record.seller_id?.name || "Unknown Seller"}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Phone size={10} /> {record.seller_id?.phone}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              CID: {record.seller_id?.customId || "N/A"}
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: "Property & Plan",
      key: "property",
      render: (_, record) => (
        <div className="flex items-start gap-2">
          <Building2 size={18} className="text-gray-400 mt-0.5" />
          <Space direction="vertical" size={0}>
            <div className="font-medium text-gray-800">
              {record.property_id?.title || "Property Not Found"}
            </div>
            <Tag color="cyan" bordered={false} className="m-0 mt-1 uppercase text-[10px] font-semibold">
              {record.plan_id?.serviceName} (₹{record.plan_id?.priceRange})
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = {
          pending: "warning",
          contacted: "processing",
          completed: "success",
          cancelled: "error",
        };
        return (
          <Tag color={colors[status]} bordered={false} className="px-2 py-0.5 rounded-md font-medium whitespace-nowrap inline-flex items-center">
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Requested Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => (
        <span className="text-gray-600 font-medium">
          {new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Update Status">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<Edit2 size={14} />}
              onClick={() => handleUpdateStatus(record)}
            >
              Manage
            </Button>
          </Tooltip>
          <Tooltip title="Delete Request">
            <Popconfirm
              title="Delete Request"
              description="Are you sure you want to delete this lead?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
              placement="topRight"
            >
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Title level={2} className="mb-1! mt-0! text-gray-800">Marketing Leads</Title>
          <p className="text-gray-500 m-0">
            Track and follow up with sellers who requested property promotion.
          </p>
        </div>
        <Button
          icon={<RefreshCcw size={16} />}
          onClick={fetchRequests}
          loading={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <Card
            key={idx}
            className={`shadow-sm transition-all duration-300 border ${stat.colors.split(' ').slice(-2).join(' ')}`}
            styles={{ body: { padding: '20px' } }}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.colors.split(' ').slice(0, 2).join(' ')}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {stat.count}
                </div>
                <div className="text-gray-500 font-medium uppercase text-[11px] tracking-wider">
                  {stat.title}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
        <Table
          columns={columns}
          dataSource={requests}
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Management Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <Edit2 size={20} className="text-indigo-600" />
            Manage Marketing Request
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <div className="mb-6 mt-4 p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Avatar size="large" className="bg-indigo-600" icon={<User />} />
            <div>
              <div className="font-bold text-gray-800 text-base">
                {selectedRequest?.seller_id?.name}
              </div>
              <div className="text-gray-500 text-sm flex items-center gap-1">
                <Building2 size={14} />
                {selectedRequest?.property_id?.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              href={`tel:${selectedRequest?.seller_id?.phone}`}
              type="primary"
              className="bg-indigo-600 w-full flex items-center justify-center gap-2"
              icon={<Phone size={16} />}
            >
              Call Seller
            </Button>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Form.Item
            name="status"
            label={<span className="font-medium text-gray-700">Update Status</span>}
            rules={[{ required: true }]}
          >
            <Select size="large" className="w-full">
              <Select.Option value="pending">
                <div className="flex items-center gap-2"><Tag color="warning" bordered={false}>Pending</Tag></div>
              </Select.Option>
              <Select.Option value="contacted">
                <div className="flex items-center gap-2"><Tag color="processing" bordered={false}>Contacted</Tag></div>
              </Select.Option>
              <Select.Option value="completed">
                <div className="flex items-center gap-2"><Tag color="success" bordered={false}>Completed / Active</Tag></div>
              </Select.Option>
              <Select.Option value="cancelled">
                <div className="flex items-center gap-2"><Tag color="error" bordered={false}>Cancelled</Tag></div>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span className="font-medium text-gray-700">Internal Notes</span>}
          >
            <Input.TextArea
              rows={4}
              placeholder="Track conversation details, next steps, or reasons for cancellation..."
              className="resize-none rounded-lg"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="bg-indigo-600">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MarketingRequests;
