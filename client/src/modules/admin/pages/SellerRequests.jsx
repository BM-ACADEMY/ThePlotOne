import React, { useEffect, useState } from "react";
import { Table, Tag, message, Select, Typography } from "antd";
import api from "@/services/api";
import moment from "moment";

const { Title } = Typography;
const { Option } = Select;

const SellerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/seller-requests/all-requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      message.error("Failed to load seller requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/seller-requests/update-status/${id}`, { status });
      message.success("Status updated successfully");
      fetchRequests();
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "First Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("DD/MM/YYYY hh:mm A"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => text || "",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          defaultValue={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record._id, value)}
        >
          <Option value="pending">Pending</Option>
          <Option value="contacted">Contacted</Option>
          <Option value="resolved">Resolved</Option>
        </Select>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        Seller Property Requests
      </Title>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: "px-6 py-4 pagination-minimal",
            position: ['bottomRight']
          }}
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
};

export default SellerRequests;
