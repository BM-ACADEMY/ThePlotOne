import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Dropdown,
} from "antd";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ShieldCheck, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL;

const ApprovalTypeManager = () => {
  const [approvalTypes, setApprovalTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  const fetchApprovalTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/approval-types`);
      setApprovalTypes(res.data);
    } catch {
      message.error("Failed to fetch approval types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalTypes();
  }, []);

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingType(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this approval type?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${API}/approval-types/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success("Approval Type deleted");
          fetchApprovalTypes();
        } catch {
          message.error("Failed to delete approval type");
        }
      },
    });
  };

  const onFinish = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (editingType) {
        await axios.put(`${API}/approval-types/${editingType._id}`, values, config);
        message.success("Approval Type updated");
      } else {
        await axios.post(`${API}/approval-types`, values, config);
        message.success("Approval Type added");
      }
      setIsModalOpen(false);
      fetchApprovalTypes();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Operation failed";
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: "Approval Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag 
          color={status === "active" ? "green" : "red"} 
          className="rounded-full px-3 py-0.5 border-none font-medium"
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Seller Visible",
      dataIndex: "visible_to_seller",
      key: "visible_to_seller",
      render: (visible) => (
        <Tag 
          color={visible ? "blue" : "default"} 
          className="rounded-full px-3 py-0.5 border-none font-medium"
        >
          {visible ? "YES" : "NO"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        const items = [
          {
            key: "edit",
            label: (
              <div className="flex items-center gap-2 py-1" onClick={() => handleEdit(record)}>
                <Edit size={14} />
                <span>Edit Type</span>
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
              <div className="flex items-center gap-2 py-1" onClick={() => handleDelete(record._id)}>
                <Trash2 size={14} />
                <span>Delete Type</span>
              </div>
            ),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={18} className="text-gray-500" />} />
          </Dropdown>
        );
      },
    },
  ];

  const stats = [
    {
      title: "Total Approvals",
      value: approvalTypes.length,
      icon: <ShieldCheck size={22} />,
      bgColor: "bg-blue-50/50 hover:bg-blue-50",
      iconContainerColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Types",
      value: approvalTypes.filter(t => t.status === "active").length,
      icon: <CheckCircle size={22} />,
      bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
      iconContainerColor: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Inactive Types",
      value: approvalTypes.filter(t => t.status !== "active").length,
      icon: <XCircle size={22} />,
      bgColor: "bg-rose-50/50 hover:bg-rose-50",
      iconContainerColor: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={3} className="mb-1!">Approval Types</Title>
          <Text type="secondary">Manage property approval certifications (e.g. DTCP, RERA)</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          className="bg-blue-600 h-10 px-6 rounded-lg font-medium flex items-center gap-2"
        >
          Add Approval Type
        </Button>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card className={`shadow-sm border-none transition-all duration-300 ${stat.bgColor} py-2`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.iconContainerColor}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="font-semibold text-xs uppercase tracking-wider opacity-80">{stat.title}</div>
                  <div className="text-2xl font-bold text-gray-800">{loading ? "..." : stat.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-none overflow-hidden rounded-xl relative min-h-[400px]">
        <Table
          columns={columns}
          dataSource={approvalTypes}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: "px-6 py-4"
          }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-300">
            {editingType ? <Edit size={20} /> : <Plus size={20} />}
            <span>{editingType ? "Edit Approval Type" : "Add Approval Type"}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="pt-6">
          <Form.Item
            name="name"
            label={<span className="font-medium">Approval Name</span>}
            rules={[{ required: true, message: "Please enter approval name" }]}
          >
            <Input placeholder="e.g. DTCP, RERA" className="h-11 rounded-lg" disabled={!!editingType} />
          </Form.Item>

          <Form.Item name="status" label={<span className="font-medium">Status</span>} initialValue="active">
            <Select className="h-11" classNames={{ popup: { root: "rounded-lg" } }}>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="visible_to_seller"
            label={<span className="font-medium">Visible to Seller</span>}
            initialValue={true}
          >
            <Select className="h-11" classNames={{ popup: { root: "rounded-lg" } }}>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-lg font-medium">Cancel</Button>
            <Button type="primary" htmlType="submit" className="h-11 px-8 rounded-lg font-medium bg-blue-600">
              {editingType ? "Update Changes" : "Save Approval Type"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalTypeManager;

