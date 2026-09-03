import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Tag,
  Button,
  message,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  Form,
  Input,
  Rate,
} from "antd";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  MoreVertical, 
  MessageSquare,
  Clock,
  AlertCircle,
  Plus
} from "lucide-react";
import dayjs from "dayjs";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;

const TestimonialManager = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/testimonials`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setTestimonials(res.data);
    } catch (error) {
      message.error("Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/testimonials/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      message.success(`Testimonial ${status} successfully`);
      fetchTestimonials();
    } catch (error) {
      message.error(`Failed to mark as ${status}`);
    }
  };

  const deleteTestimonial = (id) => {
    Modal.confirm({
      title: "Delete testimonial?",
      icon: <AlertCircle className="text-red-500" />,
      content: "Are you sure you want to permanently delete this testimonial?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No, Keep it",
      onOk: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/testimonials/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          message.success("Testimonial deleted");
          fetchTestimonials();
        } catch (error) {
          message.error("Failed to delete testimonial");
        }
      },
    });
  };

  const handleView = (record) => {
    setSelectedTestimonial(record);
    setIsModalOpen(true);
  };

  const handleAdd = async (values) => {
    try {
      setSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/testimonials`,
        { ...values, status: "approved" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      message.success("Testimonial added successfully");
      setIsAddModalOpen(false);
      form.resetFields();
      fetchTestimonials();
    } catch (error) {
      message.error("Failed to add testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Date Received",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <div className="flex flex-col">
           <span className="font-medium text-gray-900">{dayjs(date).format("MMM D, YYYY")}</span>
           <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{dayjs(date).format("h:mm A")}</span>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "User Info",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-semibold text-gray-900">{text}</div>
          <div className="text-xs text-gray-500">{record.role || "User"}</div>
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500 font-bold">★</span>
          <span className="font-semibold">{rating}/5</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "approved") color = "green";
        if (status === "rejected") color = "red";
        return (
          <Tag color={color} className="rounded-full px-3 py-0.5 border-none font-medium">
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: (
              <div className="flex items-center gap-2 py-1" onClick={() => handleView(record)}>
                <Eye size={14} />
                <span>View Message</span>
              </div>
            ),
          },
          {
            type: "divider"
          },
          {
            key: "approve",
            disabled: record.status === "approved",
            label: (
              <div className="flex items-center gap-2 py-1 text-emerald-600 font-medium" onClick={() => updateStatus(record._id, "approved")}>
                <CheckCircle size={14} />
                <span>Approve Review</span>
              </div>
            ),
          },
          {
            key: "reject",
            disabled: record.status === "rejected",
            label: (
              <div className="flex items-center gap-2 py-1 text-amber-600 font-medium" onClick={() => updateStatus(record._id, "rejected")}>
                <XCircle size={14} />
                <span>Reject Review</span>
              </div>
            ),
          },
          {
            key: "delete",
            danger: true,
            label: (
              <div className="flex items-center gap-2 py-1" onClick={() => deleteTestimonial(record._id)}>
                <Trash2 size={14} />
                <span>Permanent Delete</span>
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
        title: "Total Reviews",
        value: testimonials.length,
        icon: <MessageSquare size={22} />,
        bgColor: "bg-blue-50/50 hover:bg-blue-50",
        iconColor: "bg-blue-100 text-blue-600",
    },
    {
        title: "Approved",
        value: testimonials.filter(t => t.status === "approved").length,
        icon: <CheckCircle size={22} />,
        bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
        iconColor: "bg-emerald-100 text-emerald-600",
    },
    {
        title: "Pending/Rejected",
        value: testimonials.filter(t => t.status !== "approved").length,
        icon: <Clock size={22} />,
        bgColor: "bg-amber-50/50 hover:bg-amber-50",
        iconColor: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={3} className="mb-1!">Testimonials</Title>
          <Text type="secondary">Review and manage user feedback appearing on the public website</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 border-none shadow-md flex items-center gap-2 font-semibold"
        >
          Add Testimonial
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
          dataSource={testimonials}
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
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <MessageSquare size={20} className="text-blue-600" />
            <span>Testimonial Details</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        centered
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)} className="h-10 px-6 font-medium rounded-lg">
            Dismiss
          </Button>,
        ]}
      >
        {selectedTestimonial && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-full">
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {selectedTestimonial.name.charAt(0).toUpperCase()}
                     </div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg leading-tight">{selectedTestimonial.name}</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">{selectedTestimonial.role || "User"}</div>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <div className="text-yellow-500 text-xl font-bold">★ {selectedTestimonial.rating}</div>
                  <Tag color={selectedTestimonial.status === "approved" ? "green" : "blue"} className="mr-0 mt-1 rounded-full border-none px-3 font-medium">
                    {selectedTestimonial.status.toUpperCase()}
                  </Tag>
               </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl relative border border-gray-300">
              <div className="absolute -top-3 left-6 px-3 bg-white text-[10px] uppercase font-bold text-gray-400 tracking-widest border rounded-full">Review Content</div>
              <p className="text-gray-700 leading-relaxed text-base italic">
                "{selectedTestimonial.content}"
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Clock size={14} />
              <span>Received on: {dayjs(selectedTestimonial.createdAt).format("MMMM D, YYYY [at] h:mm A")}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Testimonial Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <Plus size={20} className="text-blue-600" />
            <span>Add New Testimonial</span>
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          form.resetFields();
        }}
        centered
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
          initialValues={{ rating: 5, role: "User" }}
          className="py-4"
        >
          <Form.Item
            name="name"
            label="User Name"
            rules={[{ required: true, message: "Please enter the name" }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role/Designation"
          >
            <Input placeholder="e.g. Home Buyer, Seller, etc." />
          </Form.Item>

          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="content"
            label="Review Content"
            rules={[{ required: true, message: "Please enter the testimonial content" }]}
          >
            <Input.TextArea rows={4} placeholder="What did they say?" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsAddModalOpen(false)} className="rounded-lg h-10 px-6">
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              className="rounded-lg h-10 px-6 bg-blue-600 hover:bg-blue-700"
            >
              Add Testimonial
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TestimonialManager;
