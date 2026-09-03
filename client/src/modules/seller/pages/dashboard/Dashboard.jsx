import { useState, useEffect } from "react";
import {
  Building,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  ArrowRight,
  TrendingUp,
  Headphones,
  Clock,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import {
  message,
  Alert,
  Card,
  Row,
  Col,
  Typography,
  Select,
  List,
  Avatar,
  Tag,
  Pagination,
} from "antd";
import {
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

import Loader from "../../../../components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30d"); // 7d, 30d, 90d, all
  const [refreshKey, setRefreshKey] = useState(0);
  const [enquiryPage, setEnquiryPage] = useState(1);
  const ENQUIRIES_PER_PAGE = 5;
  const [data, setData] = useState({
    summary: {
      totalProperties: 0,
      activeProperties: 0,
      soldProperties: 0,
      pendingProperties: 0,
      totalSoldAmount: 0,
      totalViews: 0,
      totalLeads: 0,
    },
    chartData: [],
    recentEnquiries: [],
    topProperties: [],
  });
  const [supportTickets, setSupportTickets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, supportRes] = await Promise.all([
          api.get(`/properties/seller-stats?range=${range}`),
          api.get("/support-tickets/my-tickets"),
        ]);
        setData(statsRes.data);
        setSupportTickets(supportRes.data.tickets || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data.");
        message.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, refreshKey]);

  if (loading && !data.summary.totalProperties) {
    return <Loader variant="panel" />;
  }

  const handleRetry = () => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

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
              onClick={handleRetry}
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
      title: "Total Properties",
      value: data.summary.totalProperties,
      icon: <Building size={24} className="text-blue-500" />,
      color: "#e6f7ff",
      desc: "Detailed property analytics",
      path: "/seller/property-analytics",
    },
    {
      title: "Total Views",
      value: data.summary.totalViews,
      icon: <Eye size={24} className="text-purple-500" />,
      color: "#f9f0ff",
      desc: "All time analytics",
      path: "/seller/property-analytics",
    },
    {
      title: "Leads Overview",
      value: data.summary.totalLeads,
      icon: <ClipboardList size={24} className="text-orange-500" />,
      color: "#fff7e6",
      desc: "Manage shared leads",
      path: "/seller/leads-overview",
    },
    {
      title: "Lead Balance",
      value: (data.summary.activeSubscription?.leadsUsed === undefined ? 0 : (data.summary.activeSubscription?.plan?.leadsLimit === -1 ? "∞" : Math.max(0, data.summary.activeSubscription?.plan?.leadsLimit - data.summary.activeSubscription?.leadsUsed))) + (data.summary.carriedLeads || 0),
      icon: <CheckCircle size={24} className="text-emerald-500" />,
      color: "#f0fdf4",
      desc: data.summary.carriedLeads > 0 ? `Incl. ${data.summary.carriedLeads} carried forward` : "Available leads balance",
      path: "/seller/upgrade-plan",
    },
    {
      title: "Support Tickets",
      value: supportTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length,
      icon: <Headphones size={24} className="text-pink-500" />,
      color: "#fff1f0",
      desc: "Active support requests",
      path: "/seller/support",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[180px]">
          <div className="mb-4">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              {new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="space-y-3">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 text-[13px] font-semibold">{entry.name}</span>
                </div>
                <span className="text-white text-base font-black ml-6">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- PIE CHART DATA ---
  const statusData = [
    { name: "Active", value: data.summary.activeProperties, color: "#10b981" },
    { name: "Sold", value: data.summary.soldProperties, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const unlockedEnquiries = data.recentEnquiries.filter(
    (e) => !e.enquirer_phone?.includes("X")
  );

  const paginatedEnquiries = unlockedEnquiries.slice(
    (enquiryPage - 1) * ENQUIRIES_PER_PAGE,
    enquiryPage * ENQUIRIES_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <Title
            level={2}
            style={{ margin: 0 }}
            className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600"
          >
            Dashboard Overview
          </Title>
          <Text type="secondary">
            Real-time performance tracking & insights
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gray-500" />
          <Select
            defaultValue="30d"
            style={{ width: 140 }}
            onChange={setRange}
            className="shadow-sm rounded-md"
          >
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 3 Months</Option>
            <Option value="all">All Time</Option>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {statCardsData.map((stat, index) => (
          <Link
            to={stat.path}
            key={index}
            className="flex flex-col h-full no-underline group focus:outline-none"
          >
            <Card
              variant="borderless"
              className="shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group-hover:-translate-y-1 h-full flex flex-col pt-0 border border-gray-300"
              styles={{
                body: {
                  padding: "20px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div
                    style={{ background: stat.color }}
                    className="p-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                  >
                    {stat.icon}
                  </div>
                  <TrendingUp
                    size={16}
                    className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                <div className="grow flex flex-col justify-between">
                  <div>
                    <Text
                      type="secondary"
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400"
                    >
                      {stat.title}
                    </Text>
                    <Title
                      level={2}
                      className="text-2xl! font-black m-0! mt-1 tracking-tight text-gray-800"
                    >
                      {stat.value}
                    </Title>
                    <Text
                      type="secondary"
                      className="text-[10px] leading-tight text-gray-400 font-medium line-clamp-1 mt-1 block"
                    >
                      {stat.desc}
                    </Text>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between group-hover:border-blue-100 transition-colors">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">
                      {stat.path ? "View Detailed Analytics" : "Overview Statistics"}
                    </span>
                    <ArrowRight 
                      size={14} 
                      className={`${stat.path ? 'text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1' : 'text-gray-300'} transition-all`} 
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Row gutter={[24, 24]}>
        {/* Main Chart: Views & Enquiries */}        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex flex-col">
                <span>Performance Trends</span>
                <span className="text-xs font-normal text-gray-400">
                  Daily listing engagement metrics
                </span>
              </div>
            }
            className="shadow-sm border border-gray-300 rounded-2xl h-full"
            variant="borderless"
          >
            <div style={{ width: "100%", height: 350, minHeight: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  />
                  <Legend verticalAlign="top" align="right" height={40} iconType="circle" />
                  <Area
                    name="Page Views"
                    type="monotone"
                    dataKey="views"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    animationDuration={1500}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                  />
                  <Area
                    name="Enquiries"
                    type="monotone"
                    dataKey="enquiries"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                    animationDuration={1500}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>


        {/* Property Status Pie Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex flex-col">
                <span>Listing Status</span>
                <span className="text-xs font-normal text-gray-400">Inventory Distribution</span>
              </div>
            }
            className="shadow-sm border border-gray-300 rounded-2xl h-full"
            variant="borderless"
          >
            <div className="flex flex-col items-center justify-center min-h-[350px]">
              {statusData.length > 0 ? (
                <>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="gradSold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell key="cell-0" fill="url(#gradActive)" stroke="none" />
                          <Cell key="cell-1" fill="url(#gradSold)" stroke="none" />
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Refined Summary Legend */}
                  <div className="w-full mt-6 space-y-3 px-4">
                    <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-300">
                      <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> 
                        Active
                      </span>
                      <span className="text-lg font-black text-gray-800">
                        {data.summary.activeProperties}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-300">
                      <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" /> 
                        Sold
                      </span>
                      <span className="text-lg font-black text-gray-800">
                        {data.summary.soldProperties}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <AlertCircle size={32} className="text-gray-300" />
                  </div>
                  <Text type="secondary" className="font-medium">No inventory data available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Recent Enquiries */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex justify-between items-center w-full">
                <span>Recent Enquiries</span>
                <Link to="/seller/enquiries" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
            }
            className="shadow-sm border border-gray-200 rounded-xl h-full"
            bordered={false}
          >
            <div className="space-y-4">
              {unlockedEnquiries.length > 0 ? (
                <>
                  {paginatedEnquiries.map((item, idx) => (
                  <Link 
                    to="/seller/enquiries" 
                    state={{ targetEnquiry: item._id }} 
                    key={idx} 
                    className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200 block cursor-pointer group"
                  >
                    <div className="flex gap-4 min-w-0 flex-1">
                      <Avatar
                        style={{ backgroundColor: "#fde3cf", color: "#f56a00", flexShrink: 0 }}
                      >
                        {item.user_id?.name
                          ? item.user_id.name[0].toUpperCase()
                          : item.enquirer_name
                            ? item.enquirer_name[0].toUpperCase()
                            : "U"}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {item.user_id?.name || item.enquirer_name || "Guest User"}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1 truncate max-w-full">
                          For: {item.property_id?.basicInfo?.title || "Unknown Property"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Phone size={10} className="text-gray-400" />
                          {item.user_id?.phone || item.enquirer_phone || "N/A"}
                        </div>
                      </div>
                    </div>
                  </Link>
                  ))}
                  {unlockedEnquiries.length > ENQUIRIES_PER_PAGE && (
                    <div className="flex justify-end mt-4">
                      <Pagination
                        current={enquiryPage}
                        pageSize={ENQUIRIES_PER_PAGE}
                        total={unlockedEnquiries.length}
                        onChange={setEnquiryPage}
                        size="small"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                   <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <MessageSquare size={32} className="text-gray-300" />
                  </div>
                  <Text type="secondary" className="font-medium">No unlocked enquiries yet</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Support Tickets */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex justify-between items-center w-full">
                <span>Support Tickets</span>
                <Link to="/seller/support" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1">
                   Chat Support <ArrowRight size={14} />
                </Link>
              </div>
            }
            className="shadow-sm border border-gray-200 rounded-xl h-full"
            bordered={false}
          >
            <div className="space-y-4">
              {supportTickets.length > 0 ? (
                supportTickets.slice(0, 5).map((ticket, idx) => (
                  <Link 
                    to="/seller/support" 
                    key={idx}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 hover:border-gray-200 cursor-pointer group"
                  >
                    <div className={`p-2 rounded-lg ${ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Headphones size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <Text strong className="text-sm truncate pr-2">{ticket.subject}</Text>
                        <Tag 
                          color={ticket.status === 'open' ? 'orange' : ticket.status === 'resolved' ? 'success' : 'default'}
                          className="text-[10px] m-0 px-1 leading-4 h-4 uppercase font-bold"
                        >
                          {ticket.status}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500">
                           {new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Headphones size={32} className="text-gray-300" />
                  </div>
                  <Text type="secondary" className="font-medium">No active support tickets</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
