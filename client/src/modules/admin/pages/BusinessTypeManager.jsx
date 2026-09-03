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
  Briefcase, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL;

const BusinessTypeManager = () => {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  const fetchBusinessTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/business-types`);
      setBusinessTypes(res.data);
    } catch {
      message.error("Failed to fetch business types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
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
      title: "Are you sure you want to delete this business type?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`${API}/business-types/${id}`);
          message.success("Business Type deleted");
          fetchBusinessTypes();
        } catch {
          message.error("Failed to delete business type");
        }
      },
    });
  };

  const onFinish = async (values) => {
    try {
      if (editingType) {
        await axios.put(`${API}/business-types/${editingType._id}`, values);
        message.success("Business Type updated");
      } else {
        await axios.post(`${API}/business-types`, values);
        message.success("Business Type added");
      }
      setIsModalOpen(false);
      fetchBusinessTypes();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Operation failed";
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: "Business Type Name",
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
      title: "Total Types",
      value: businessTypes.length,
      icon: <Briefcase size={22} />,
      color: "blue",
      bgColor: "bg-blue-50/50 hover:bg-blue-50",
      iconContainerColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Types",
      value: businessTypes.filter(t => t.status === "active").length,
      icon: <CheckCircle size={22} />,
      color: "emerald",
      bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
      iconContainerColor: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Inactive Types",
      value: businessTypes.filter(t => t.status !== "active").length,
      icon: <XCircle size={22} />,
      color: "rose",
      bgColor: "bg-rose-50/50 hover:bg-rose-50",
      iconContainerColor: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={3} className="mb-1!">Business Types</Title>
          <Text type="secondary">Manage different types of businesses registered on the platform</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          className="bg-blue-600 h-10 px-6 rounded-lg font-medium flex items-center gap-2"
        >
          Add Business Type
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
                  <div className={`font-semibold text-xs uppercase tracking-wider opacity-80`}>{stat.title}</div>
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
          dataSource={businessTypes}
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
          className="modern-table"
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-300">
            {editingType ? <Edit size={20} /> : <Plus size={20} />}
            <span>{editingType ? "Edit Business Type" : "Add Business Type"}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
        className="modern-modal"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          className="pt-6"
        >
          <Form.Item
            name="name"
            label={<span className="font-medium">Business Type Name</span>}
            rules={[{ required: true, message: "Please enter business type name" }]}
          >
            <Input 
              placeholder="e.g. Real Estate Agency" 
              className="h-11 rounded-lg" 
              disabled={!!editingType} 
            />
          </Form.Item>

          <Form.Item 
            name="status" 
            label={<span className="font-medium">Status</span>}
            initialValue="active"
          >
            <Select className="h-11 w-full" classNames={{ popup: { root: "rounded-lg" } }}>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button 
              onClick={() => setIsModalOpen(false)} 
              className="h-11 px-6 rounded-lg font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="h-11 px-8 rounded-lg font-medium bg-blue-600"
            >
              {editingType ? "Update Changes" : "Save Business Type"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BusinessTypeManager;

