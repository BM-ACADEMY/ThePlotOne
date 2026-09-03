import { useState, useEffect } from "react";
import {
  Users,
  Building,
  FileCheck,
  Eye,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  UserPlus,
  Home,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import {
  message,
  Alert,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  List,
  Avatar,
  Tag,
  Button,
  Table,
  Grid,
} from "antd";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

import Loader from "../../../../components/Common/Loader";
import { getImageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30d"); // 7d, 30d, 90d, all
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState({
    summary: {
      totalUsers: 0,
      totalSellers: 0,
      totalBuyers: 0,
      totalProperties: 0,
      activeProperties: 0,
      soldProperties: 0,
      pendingApprovals: 0,
      totalSoldAmount: 0,
      totalViews: 0,
      totalEnquiries: 0,
    },
    chartData: [],
    recentUsers: [],
    recentProperties: [],
    recentEnquiries: [],
    expiringSubscriptions: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/properties/admin-stats?range=${range}`);
        const expiringRes = await api.get("/subscriptions/admin/expiring-soon");
        setData({ ...res.data, expiringSubscriptions: expiringRes.data });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
        setError("Failed to load dashboard data.");
        message.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range, refreshKey]);

  if (loading && !data.summary.totalProperties) {
    return <Loader variant="panel" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          title="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              type="primary"
              ghost
              onClick={() => setRefreshKey(prev => prev + 1)}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // --- STAT CARDS ---
  const statCardsData = [
    {
      title: "Total Users",
      value: data.summary.totalUsers,
      icon: <Users size={24} className="text-blue-500" />,
      color: "#e6f7ff",
      desc: `${data.summary.totalSellers} Sellers, ${data.summary.totalBuyers} Buyers`,
      path: "/admin/users",
    },
    {
      title: "Admin Properties",
      value: data.summary.adminPropertiesCount,
      icon: <UserPlus size={24} className="text-indigo-500" />,
      color: "#f0f5ff",
      desc: "Properties posted by Admin",
      path: "/admin/properties?seller=me",
    },
    {
      title: "Sold (Admin)",
      value: data.summary.soldAdminPropertiesCount,
      icon: <CheckCircle size={24} className="text-teal-500" />, // Changed from red for a fresher look
      color: "#e6fffb",
      desc: "Admin properties sold",
      path: "/admin/properties?status=sold&seller=me",
    },
    {
      title: "Marketing Leads",
      value: data.summary.marketingLeadsCount,
      icon: <TrendingUp size={24} className="text-pink-500" />,
      color: "#fff0f6",
      desc: "Total Marketing Requests",
      path: "/admin/marketing-requests",
    },
    {
      title: "Enquiry Leads",
      value: data.summary.totalEnquiries,
      icon: <MessageSquare size={24} className="text-purple-500" />,
      color: "#f9f0ff",
      desc: "All time leads",
      path: "/admin/enquiries",
    },
    {
      title: "Seller Properties",
      value: data.summary.sellerPropertiesCount,
      icon: <Building size={24} className="text-emerald-500" />,
      color: "#f6ffed",
      desc: "Properties by Sellers",
      path: "/admin/seller/overview",
    },
  ];

  // --- CHARTS DATA ---
  const userDistributionData = [
    { name: "Sellers", count: data.summary.totalSellers },
    { name: "Buyers", count: data.summary.totalBuyers },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0 }}
            className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 text-xl sm:text-2xl md:text-3xl font-bold"
          >
            {user?.isSuperAdmin ? "Admin Insights" : "Support Team Insights"}
          </Title>
          <Text type="secondary" className="text-xs sm:text-sm">Real-time system performance & activity</Text>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end bg-gray-50 p-2 rounded-xl sm:bg-transparent sm:p-0">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <Text className="text-xs font-medium sm:hidden">Filter Period</Text>
          </div>
          <Select
            defaultValue="30d"
            style={{ width: 140 }}
            onChange={setRange}
            className="shadow-xs rounded-md"
          >
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 3 Months</Option>
            <Option value="all">All Time</Option>
          </Select>
        </div>
      </div>

      {/* Stats Grid - Robust responsiveness using auto-fit */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {statCardsData.map((stat, index) => (
          <Link
            to={stat.path}
            key={index}
            className="flex flex-col h-full no-underline group focus:outline-none"
          >
            <Card
              variant="borderless"
              className="shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group-hover:-translate-y-1 h-full flex flex-col pt-0 overflow-hidden"
              styles={{
                body: {
                  padding: "16px sm:padding-20px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div
                    style={{ background: stat.color }}
                    className="p-2.5 sm:p-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                  >
                    {stat.icon}
                  </div>
                  <TrendingUp
                    size={16}
                    className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                <div className="grow">
                  <Text
                    type="secondary"
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    {stat.title}
                  </Text>
                  <Title
                    level={2}
                    className="text-xl sm:text-2xl! font-black m-0! mt-0.5 sm:mt-1 tracking-tight text-gray-800"
                  >
                    {stat.value}
                  </Title>
                </div>

                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Text
                    type="secondary"
                    className="text-[9px] sm:text-[10px] leading-tight text-gray-400 font-medium line-clamp-1"
                  >
                    {stat.desc}
                  </Text>
                  <ArrowRight
                    size={12}
                    className="text-gray-300 group-hover:text-blue-500 transform translate-x-0 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

  

      <Row gutter={[16, 16]}>
        {/* Main Chart: Views & Enquiries */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1">
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold">Platform Activity Trends</span>
                  <span className="text-[10px] sm:text-xs font-normal text-gray-400">
                    Cumulative admin property performance
                  </span>
                </div>
              </div>
            }
            className="shadow-sm rounded-2xl h-full"
            variant="borderless"
          >
            <div style={{ width: "100%", height: isMobile ? 250 : 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  style={{ outline: 'none' }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 5" vertical={false} horizontal={true} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    dy={10}
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="Property Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="enquiries"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEnquiries)"
                    name="Enquiries"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* User Distribution Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className="text-sm sm:text-base font-semibold">User Distribution</span>}
            className="shadow-sm rounded-2xl h-full"
            variant="borderless"
            styles={{ body: { padding: "16px sm:padding-24px" } }}
          >
            <div className="flex flex-col">
              <div style={{ width: "100%", height: isMobile ? 250 : 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userDistributionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {userDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#3b82f6" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 py-3 bg-gray-50/80 rounded-xl mt-4">
                {userDistributionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor: i === 0 ? "#3b82f6" : "#10b981",
                      }}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-700 font-bold uppercase tracking-wide">
                      {d.name}: {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
          {/* Marketing Trends Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex flex-col py-1">
                <span className="text-sm sm:text-base font-semibold">Marketing Performance Trends</span>
                <span className="text-[10px] sm:text-xs font-normal text-gray-400">Time-series of premium marketing requests</span>
              </div>
            }
            className="shadow-sm rounded-2xl"
            variant="borderless"
            styles={{ body: { padding: '16px sm:padding-24px' } }}
          >
            <div style={{ width: "100%", height: isMobile ? 250 : 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.chartData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  style={{ outline: 'none' }}
                >
                  <CartesianGrid strokeDasharray="1 5" vertical={false} horizontal={true} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    dy={10}
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Bar 
                    dataKey="marketingLeads" 
                    name="Leads" 
                    fill="#a78bfa" 
                    radius={[6, 6, 0, 0]} 
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Moved Pending Approvals to the side */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex justify-between items-center w-full">
                <span className="text-sm sm:text-base font-semibold">Pending Approvals</span>
                <Link to="/admin/seller-listings">
                  <Button type="link" size="small" className="p-0 text-blue-600 text-xs font-medium">View All</Button>
                </Link>
              </div>
            }
            className="shadow-sm rounded-2xl h-full border-0"
            styles={{ body: { padding: '12px' } }}
          >
            <List
              itemLayout="horizontal"
              dataSource={data.pendingProperties || []}
              renderItem={(record) => (
                <List.Item 
                  className="px-0 py-2 sm:py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg px-2 group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <img 
                      src={getImageUrl(record.media?.images?.[0])}
                      alt="Property"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <Text className="font-semibold text-gray-800 text-xs sm:text-[13px] truncate block leading-none mb-1 sm:mb-1.5">
                        {record.basicInfo?.title || 'Untitled'}
                      </Text>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Avatar size="small" className="bg-amber-100 text-amber-600 text-[8px] font-bold w-4 h-4 min-w-4 flex items-center justify-center">
                            {record.seller?.name?.charAt(0).toUpperCase() || 'S'}
                          </Avatar>
                          <Text type="secondary" className="text-[9px] sm:text-[10px] truncate max-w-[60px] sm:max-w-[80px]">{record.seller?.name || 'Unknown'}</Text>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <Tag className="text-[8px] sm:text-[9px] px-1 bg-gray-100 border-0 text-gray-400 rounded m-0">
                          {new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Tag>
                      </div>
                    </div>
                    <Link to={`/admin/seller-listings`}>
                      <Button type="text" size="small" className="text-blue-500 hover:bg-blue-50 p-1">
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </List.Item>
              )}
            />
            {(!data.pendingProperties || data.pendingProperties.length === 0) && (
              <div className="py-8 text-center bg-gray-50/50 rounded-xl">
                <CheckCircle size={32} className="text-green-500 opacity-20 mx-auto mb-2" />
                <Text type="secondary" className="text-xs">No pending items</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Expiring Soon Subscriptions */}
      <Card
        id="expiring-subscriptions-section"
        title={
          <div className="flex items-center gap-2 py-1">
            <Clock size={20} className="text-amber-500" />
            <span className="text-sm sm:text-base font-semibold">Subscriptions Expiring Soon (7 Days)</span>
          </div>
        }
        className="shadow-sm rounded-2xl border-0 mt-6"
        styles={{ body: { padding: '16px sm:padding-24px' } }}
      >
        <Table
          dataSource={data.expiringSubscriptions || []}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          className="subscription-expiring-table"
          scroll={{ x: 800 }}
          size={isMobile ? "small" : "middle"}
          columns={[
            {
              title: "Seller",
              dataIndex: "user",
              key: "user",
              fixed: 'left',
              width: 200,
              render: (user) => (
                <div className="flex items-center gap-3">
                  <Avatar className="bg-blue-100 text-blue-600 shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || "S"}
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <Text className="font-semibold text-gray-800 truncate block">{user?.name || "N/A"}</Text>
                    <Text type="secondary" className="text-[10px] sm:text-xs truncate">{user?.customId}</Text>
                  </div>
                </div>
              ),
            },
            {
              title: "Plan",
              dataIndex: "plan",
              key: "plan",
              width: 120,
              render: (plan) => (
                <Tag color="blue" className="rounded-md px-2 py-0.5 border-0 font-medium">
                  {plan?.name || "N/A"}
                </Tag>
              ),
            },
            {
              title: "Price",
              dataIndex: "amountPaid",
              key: "amountPaid",
              width: 100,
              render: (price) => <Text className="font-medium">₹{price?.toLocaleString('en-IN')}</Text>,
            },
            {
              title: "Expiry Date",
              dataIndex: "endDate",
              key: "endDate",
              width: 150,
              render: (date) => {
                const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="flex flex-col">
                    <Text className="font-medium text-xs sm:text-sm">{new Date(date).toLocaleDateString('en-IN')}</Text>
                    <Text type="danger" className="text-[9px] sm:text-[10px] font-bold uppercase">{daysLeft} days left</Text>
                  </div>
                );
              },
            },
            {
              title: "Contact",
              dataIndex: "user",
              key: "contact",
              width: 150,
              render: (user) => (
                <div className="flex items-center gap-2">
                  <Button 
                    type="default" 
                    size="small" 
                    icon={<Phone size={14} />} 
                    onClick={() => window.open(`tel:${user?.phone}`, '_self')}
                    className="flex items-center justify-center shrink-0"
                  />
                  <Text className="text-xs text-gray-500 truncate">{user?.phone}</Text>
                </div>
              ),
            },
            {
              title: "Action",
              key: "action",
              fixed: 'right',
              width: 100,
              render: (_, record) => (
                <Link to={`/admin/sellers?id=${record.user?._id}`}>
                  <Button type="link" size="small" className="text-blue-600 font-medium p-0">View Seller</Button>
                </Link>
              ),
            },
          ]}
        />
        {(!data.expiringSubscriptions || data.expiringSubscriptions.length === 0) && (
          <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <CheckCircle size={40} className="text-green-500 opacity-20 mx-auto mb-3" />
            <Text type="secondary" className="text-sm font-medium">All subscriptions are up to date</Text>
          </div>
        )}
      </Card>

    </div>
  );
};

export default Dashboard;
