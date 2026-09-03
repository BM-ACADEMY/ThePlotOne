import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Typography, Space, Tooltip } from "antd";
import {
  Megaphone,
  Clock,
  CheckCircle,
  Home,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from "@/utils/imageUrl";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;

const SellerAdvertisements = () => {
  const [properties, setProperties] = useState([]);
  const [marketingRequests, setMarketingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsRes, reqsRes] = await Promise.all([
        api.get(`/properties/fetch-all-property?seller_id=${user._id}`),
        api.get("/marketing/requests/seller"),
      ]);
      setProperties(propsRes.data.properties || []);
      setMarketingRequests(reqsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch advertisement data:", error);
      message.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const columns = [
    {
      title: "Property Details",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div className="flex items-center gap-4 py-1">
          {record.images?.[0] ? (
            <img
              src={getImageUrl(record.images[0].image_url)}
              alt={text}
              className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-sm"
            />
          ) : (
            <img
              src={getImageUrl(null)}
              alt="No Image"
              className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 text-base">
              {text}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
              ID: {record._id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Campaign Status",
      key: "status",
      render: (_, record) => {
        const request = marketingRequests.find(
          (r) => r.property_id._id === record._id,
        );

        if (!request) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Not Promoted
            </span>
          );
        }

        const statusStyles = {
          pending: "bg-amber-50 text-amber-700 border-amber-200",
          contacted: "bg-blue-50 text-blue-700 border-blue-200",
          completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
          cancelled: "bg-rose-50 text-rose-700 border-rose-200",
        };

        return (
          <Space direction="vertical" size={2}>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[request.status]}`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
            {request.plan_id?.serviceName && (
              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mt-1">
                <Sparkles size={10} /> {request.plan_id.serviceName}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Action",
      key: "actions",
      align: "right",
      render: (_, record) => {
        const hasActiveRequest = marketingRequests.some(
          (r) =>
            r.property_id._id === record._id &&
            ["pending", "contacted"].includes(r.status),
        );

        return (
          <Button
            disabled={hasActiveRequest}
            type={hasActiveRequest ? "default" : "primary"}
            className={`rounded-lg flex items-center justify-center gap-2 px-4 shadow-sm ${
              hasActiveRequest
                ? ""
                : "bg-blue-600 hover:bg-blue-700 border-none"
            }`}
            icon={
              hasActiveRequest ? (
                <CheckCircle size={16} />
              ) : (
                <Megaphone size={16} />
              )
            }
            onClick={() => {
              navigate(`/seller/my-properties?advertise=${record._id}`);
            }}
          >
            {hasActiveRequest ? "Request Pending" : "Boost Listing"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">
            Property Promotions
          </Title>
          <Text className="text-gray-500 text-base">
            Manage your marketing campaigns and boost visibility to sell faster.
          </Text>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Properties
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              {properties.length}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Home size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Pending Requests
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              {marketingRequests.filter((r) => r.status === "pending").length}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Active Campaigns
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              {marketingRequests.filter((r) => r.status === "completed").length}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <TrendingUp size={28} />
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-semibold text-gray-800">Your Listings</h3>
        </div>
        <Table
          columns={columns}
          dataSource={properties}
          loading={{
            spinning: loading,
            indicator: <Loader variant="inline" />
          }}
          rowKey="_id"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            className: "pr-6",
          }}
          className="custom-antd-table"
        />
      </div>
    </div>
  );
};

export default SellerAdvertisements;
