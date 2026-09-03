import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  InputNumber,
  DatePicker,
  Switch,
  Card,
  Space,
  Typography,
  Select
} from "antd";
import { Plus, Edit, Trash2, Ticket, CheckCircle, XCircle, Calendar, Users, Percent, IndianRupee, FileText } from "lucide-react";
import axios from "axios";
import Loader from "@/components/Common/Loader";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API = import.meta.env.VITE_API_URL;

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form] = Form.useForm();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/coupons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCoupons(res.data);
    } catch {
      message.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = () => {
    setEditingCoupon(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCoupon(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      status: record.status === "active",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      message.success("Coupon deleted");
      fetchCoupons();
    } catch {
      message.error("Failed to delete coupon");
    }
  };

  const onFinish = async (values) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };

      const payload = {
        ...values,
        code: values.code.toUpperCase(),
        status: values.status ? "active" : "inactive",
      };

      if (editingCoupon) {
        await axios.put(`${API}/coupons/${editingCoupon._id}`, payload, config);
        message.success("Coupon updated");
      } else {
        await axios.post(`${API}/coupons`, payload, config);
        message.success("Coupon created");
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      message.error(error.response?.data?.message || "Operation failed");
    }
  };

  const columns = [
    {
      title: "Coupon Code",
      dataIndex: "code",
      key: "code",
      render: (text) => <Tag color="purple" className="font-bold text-sm px-3 py-1 rounded-md">{text}</Tag>,
    },
    {
      title: "Discount",
      key: "discount",
      render: (_, record) => (
        <span className="font-bold text-blue-600">
          {record.discountType === "percentage" ? `${record.discountValue}% OFF` : `₹${record.discountValue} OFF`}
        </span>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          <span>Total: <b>{record.usedCount}</b> / {record.maxUsageTotal || "∞"}</span>
          <span>Per User: <b>{record.maxUsagePerUser}</b></span>
        </div>
      ),
    },
    {
      title: "Min Spend",
      dataIndex: "minSpend",
      key: "minSpend",
      render: (val) => <span>₹{val}</span>,
    },
    {
      title: "Validity",
      key: "validity",
      render: (_, record) => (
        <div className="flex flex-col text-xs text-gray-500">
          <span>Start: {record.startDate ? dayjs(record.startDate).format("DD MMM YYYY") : "N/A"}</span>
          <span>End: {record.endDate ? dayjs(record.endDate).format("DD MMM YYYY") : "No Expiry"}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} className="rounded-full px-3 capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Edit size={16} className="text-blue-500" />}
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-50 rounded-full"
          />
          <Popconfirm
            title="Delete this coupon?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<Trash2 size={16} className="text-red-500" />}
              className="hover:bg-red-50 rounded-full"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Title level={2} className="!mb-1 flex items-center gap-3">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg">
                <Ticket size={24} />
              </div>
              Coupon Management
            </Title>
            <Text className="text-gray-500 font-medium">
              Create and manage promotional discounts for subscription plans.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={handleAdd}
            className="bg-purple-600 hover:bg-purple-700 h-auto py-3 px-8 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            Add New Coupon
          </Button>
        </div>

        {/* Content Section */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <Table
            dataSource={coupons}
            columns={columns}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            className="premium-table"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={editingCoupon ? "Edit Coupon" : "Create New Coupon"}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={650}
          centered
          className="coupon-modal"
        >
          <Form 
            layout="vertical" 
            form={form} 
            onFinish={onFinish} 
            initialValues={{ status: true, maxUsagePerUser: 1, minSpend: 0 }}
            className="compact-form"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[{ required: true, message: "Enter coupon code" }]}
                normalize={(value) => value ? value.toUpperCase().replace(/[^A-Z0-9_]/g, "") : ""}
              >
                <Input placeholder="E.g. WELCOME50" />
              </Form.Item>

              <Form.Item
                name="discountType"
                label="Discount Type"
                rules={[{ required: true }]}
                initialValue="percentage"
              >
                <Select className="w-full">
                  <Select.Option value="percentage">Percentage (%)</Select.Option>
                  <Select.Option value="fixed">Fixed Amount (₹)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name="discountValue"
                    label={getFieldValue('discountType') === 'percentage' ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                    rules={[{ required: true, message: "Enter value" }]}
                  >
                    <InputNumber 
                      min={0} 
                      max={getFieldValue('discountType') === 'percentage' ? 100 : undefined} 
                      className="w-full" 
                      placeholder="0"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                    />
                  </Form.Item>
                )}
              </Form.Item>

              <Form.Item
                name="maxUsageTotal"
                label="Max Users (Total Usage)"
                tooltip="How many times this coupon can be used overall. Leave empty for unlimited."
              >
                <InputNumber 
                  min={1} 
                  className="w-full" 
                  placeholder="Unlimited" 
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                />
              </Form.Item>

              <Form.Item
                name="maxUsagePerUser"
                label="Max Usage Per User"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  min={1} 
                  className="w-full" 
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                />
              </Form.Item>

              <Form.Item
                name="minSpend"
                label="Minimum Spend (₹)"
              >
                <InputNumber 
                  min={0} 
                  className="w-full" 
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>

              <Form.Item
                name="startDate"
                label="Start Date"
              >
                <DatePicker className="w-full" inputReadOnly={true} />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="End Date"
              >
                <DatePicker className="w-full" placeholder="No Expiry" inputReadOnly={true} />
              </Form.Item>
            </div>

            <Form.Item
              name="termsAndConditions"
              label="Terms and Conditions"
              className="mt-2"
            >
              <Input.TextArea rows={3} placeholder="Enter T&C here..." />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={() => setIsModalOpen(false)} className="rounded-xl px-6 h-10 font-semibold text-gray-500">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-purple-600 rounded-xl px-10 h-10 font-semibold shadow-md hover:bg-purple-700"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>

      <style>{`
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
          font-size: 13px;
        }
        .coupon-modal .ant-modal-content {
          border-radius: 16px !important;
          padding: 24px !important;
        }
        .coupon-modal .ant-modal-header {
          margin-bottom: 20px !important;
        }
        .ant-input-number, .ant-input, .ant-select-selector, .ant-picker {
          height: 44px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-select-selector {
           padding: 0 12px !important;
        }
        .compact-form .ant-form-item {
          margin-bottom: 12px !important;
        }
        .ant-form-item-label > label {
          font-size: 13px !important;
          color: #4b5563 !important;
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
};

export default CouponManager;
