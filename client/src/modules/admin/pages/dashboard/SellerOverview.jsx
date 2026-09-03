import { useState, useEffect } from "react";
import {
  Building,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Avatar,
  Button,
  Input,
  message,
  Tooltip as AntTooltip,
} from "antd";
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  BarChart,
  LineChart,
} from "recharts";
import Loader from "../../../../components/Common/Loader";

const { Title, Text } = Typography;

const SellerOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sellerStats: [],
    topPerformer: null,
    totalSellerProperties: 0,
    totalSellerViews: 0,
  });
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSellerStats = async () => {
      try {
        const res = await api.get("/properties/seller-overview-stats");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch seller stats", err);
        message.error("Failed to load seller statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerStats();
  }, []);

  if (loading) return <Loader variant="panel" />;

  const filteredSellers = data.sellerStats.filter(
    (s) =>
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.email.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    {
      title: "Seller",
      key: "seller",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-blue-100 text-blue-600 font-bold">
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Properties",
      dataIndex: "propertyCount",
      key: "propertyCount",
      sorter: (a, b) => a.propertyCount - b.propertyCount,
      render: (count) => (
        <div className="flex items-center gap-2">
          <Building size={14} className="text-gray-400" />
          <span className="font-semibold">{count}</span>
        </div>
      ),
    },
    {
      title: "Total Views",
      dataIndex: "totalViews",
      key: "totalViews",
      sorter: (a, b) => a.totalViews - b.totalViews,
      render: (views) => (
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-gray-400" />
          <span>{views.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: "Sold",
      dataIndex: "soldCount",
      key: "soldCount",
      render: (count) => (
        <Tag color={count > 0 ? "green" : "default"}>{count} Sold</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
          className="border-none shadow-none hover:bg-gray-100"
        />
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Seller Property Overview
          </Title>
          <Text type="secondary">
            Performance tracking across all platform vendors
          </Text>
        </div>
      </div>

      {/* Summary Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="shadow-sm rounded-2xl border-none bg-linear-to-br from-blue-600 to-blue-700 text-white h-full">
            <div className="flex justify-between items-start">
              <div>
                <Text className="text-blue-100 text-xs font-medium uppercase tracking-wider">
                  Total Seller Inventory
                </Text>
                <Title level={2} className="text-black m-0! mt-2!">
                  {data.totalSellerProperties}
                </Title>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Building size={24} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm rounded-2xl border-none bg-white h-full">
            <div className="flex justify-between items-start">
              <div>
                <Text
                  type="secondary"
                  className="text-xs font-medium uppercase tracking-wider"
                >
                  Accumulated Views
                </Text>
                <Title level={2} className="m-0! mt-2!">
                  {data.totalSellerViews.toLocaleString()}
                </Title>
              </div>
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                <Eye size={24} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm rounded-2xl border-none bg-white h-full">
            <div className="flex justify-between items-start">
              <div>
                <Text
                  type="secondary"
                  className="text-xs font-medium uppercase tracking-wider"
                >
                  Top Performer
                </Text>
                <Title level={4} className="m-0! mt-2! truncate max-w-37.5">
                  {data.topPerformer?.name || "N/A"}
                </Title>
                <Text type="secondary" className="text-[10px]">
                  {data.topPerformer?.propertyCount || 0} Properties
                </Text>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts & Performance Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title="Properties per Seller"
            className="shadow-sm rounded-2xl border-none h-full"
            extra={
              <Text type="secondary" className="text-xs">
                Top 10 Sellers
              </Text>
            }
          >
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.sellerStats.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#c2c2c2"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#c2c2c2" }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="propertyCount"
                    name="Properties"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {data.sellerStats.slice(0, 10).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(217, 91%, ${60 - index * 4}%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Performance & Interaction"
            className="shadow-sm rounded-2xl border-none h-full"
            extra={
              <Text type="secondary" className="text-xs">
                Views, Sold & Inventory
              </Text>
            }
          >
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data.sellerStats.slice(0, 10)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalViews"
                    name="View Tracker"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Bar 
                    dataKey="soldCount" 
                    name="Sold Growth" 
                    barSize={20} 
                    fill="#fbbf24" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Line
                    type="monotone"
                    dataKey="propertyCount"
                    name="Inventory Status"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <Text className="text-[10px] font-semibold text-gray-500 uppercase">Views</Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <Text className="text-[10px] font-semibold text-gray-500 uppercase">Sold</Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <Text className="text-[10px] font-semibold text-gray-500 uppercase">Inventory</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Sellers Table */}
      <Card className="shadow-sm rounded-2xl border-none p-0 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-50">
          <Title level={4} style={{ margin: 0 }}>
            Vendor Performance Stack
          </Title>
          <Text type="secondary" className="text-xs">
            Comprehensive breakdown of all platform sellers and their activity
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredSellers}
          pagination={{ pageSize: 10 }}
          className="admin-table"
          rowKey="_id"
        />
      </Card>
    </div>
  );
};

export default SellerOverview;
