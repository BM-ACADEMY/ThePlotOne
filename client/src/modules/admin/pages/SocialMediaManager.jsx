import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Dropdown,
  Space,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Globe,
  MoreVertical,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

// Mapping for icon preview
const iconMap = {
  Facebook: <Facebook size={18} />,
  Twitter: <Twitter size={18} />,
  Instagram: <Instagram size={18} />,
  Linkedin: <Linkedin size={18} />,
  Youtube: <Youtube size={18} />,
  Github: <Github size={18} />,
  Globe: <Globe size={18} />,
};

const SocialMediaManager = () => {
  const [socialMedias, setSocialMedias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSocialMedias();
  }, []);

  const fetchSocialMedias = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/social-media/fetch-all-social-media`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setSocialMedias(res.data);
    } catch (error) {
      message.error("Failed to fetch social media links");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete social media link?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This link will be removed from the website footer.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/social-media/delete-social-media-by-id/${id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            },
          );
          message.success("Social media link deleted");
          fetchSocialMedias();
        } catch (error) {
          message.error("Failed to delete social media link");
        }
      },
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/social-media/update-social-media-by-id/${editingItem._id}`,
          values,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          },
        );
        message.success("Social media link updated");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/social-media/create-social-media`,
          values,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          },
        );
        message.success("Social media link created");
      }
      setIsModalVisible(false);
      fetchSocialMedias();
    } catch (error) {
      message.error("Failed to save social media link");
    }
  };

  const updateStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/social-media/update-social-media-by-id/${id}`,
        { status: !currentStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      message.success("Status updated");
      fetchSocialMedias();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg text-blue-600 border border-gray-200">
            {iconMap[record.icon] || <Globe size={18} />}
          </div>
          <span className="font-semibold text-gray-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Navigation URL",
      dataIndex: "url",
      key: "url",
      render: (text) => (
        <a 
          href={text} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline flex items-center gap-1 max-w-62.5 truncate"
        >
          <Link size={12} />
          {text}
        </a>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag 
          color={status ? "green" : "red"} 
          className="rounded-full px-3 py-0.5 border-none font-medium"
        >
          {status ? "ACTIVE" : "INACTIVE"}
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
                <span>Edit Link</span>
              </div>
            ),
          },
          {
            key: "toggle",
            label: (
              <div className="flex items-center gap-2 py-1" onClick={() => updateStatus(record._id, record.status)}>
                {record.status ? <XCircle size={14} className="text-red-500" /> : <CheckCircle size={14} className="text-green-500" />}
                <span>{record.status ? "Deactivate" : "Activate"}</span>
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
                <span>Remove Link</span>
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
        title: "Total Links",
        value: socialMedias.length,
        icon: <Link size={22} />,
        bgColor: "bg-blue-50/50 hover:bg-blue-50",
        iconColor: "bg-blue-100 text-blue-600",
    },
    {
        title: "Active Icons",
        value: socialMedias.filter(s => s.status).length,
        icon: <CheckCircle size={22} />,
        bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
        iconColor: "bg-emerald-100 text-emerald-600",
    },
    {
        title: "Hidden Links",
        value: socialMedias.filter(s => !s.status).length,
        icon: <XCircle size={22} />,
        bgColor: "bg-rose-50/50 hover:bg-rose-50",
        iconColor: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={3} className="mb-1!">Social Media</Title>
          <Text type="secondary">Manage external connection links displayed in the website footer</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          className="bg-blue-600 h-10 px-6 rounded-lg font-medium flex items-center gap-2"
        >
          Add New Link
        </Button>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card className={`shadow-sm border-none transition-all duration-300 ${stat.bgColor} py-2`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.iconColor}`}>
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
          dataSource={socialMedias}
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
            {editingItem ? <Edit size={20} /> : <Plus size={20} />}
            <span>{editingItem ? "Edit Social Media Link" : "Add New Social Media Link"}</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        centered
        footer={null}
        width={450}
      >
        <Form form={form} layout="vertical" className="pt-6">
          <Form.Item
            name="platform"
            label={<span className="font-medium">Platform Name</span>}
            rules={[{ required: true, message: "Please enter platform name" }]}
          >
            <Input placeholder="e.g. Facebook, Twitter" className="h-11 rounded-lg" />
          </Form.Item>
          <Form.Item
            name="url"
            label={<span className="font-medium">Navigation URL</span>}
            rules={[
              { required: true, message: "Please enter URL" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://..." className="h-11 rounded-lg" />
          </Form.Item>
          <Form.Item name="icon" label={<span className="font-medium">Display Icon</span>} initialValue="Globe">
            <Select className="h-11" classNames={{ popup: { root: "rounded-lg" } }}>
              {Object.keys(iconMap).map((key) => (
                <Option key={key} value={key}>
                  <Space>
                    {iconMap[key]}
                    {key}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label={<span className="font-medium">Status</span>}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button onClick={() => setIsModalVisible(false)} className="h-11 px-6 rounded-lg font-medium">Cancel</Button>
            <Button type="primary" onClick={handleOk} className="h-11 px-8 rounded-lg font-medium bg-blue-600">
              {editingItem ? "Update Link" : "Create Link"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SocialMediaManager;
