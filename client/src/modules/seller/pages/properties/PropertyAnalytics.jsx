import { useState, useEffect } from "react";
import {
  Building,
  Eye,
  MessageSquare,
  ArrowLeft,
  Calendar,
  TrendingUp,
  ChevronRight,
  Filter
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  DatePicker
} from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import Loader from "../../../../components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PropertyAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    fetchStats();
  }, [range]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/properties/seller-stats?range=${range}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <Loader variant="panel" />;

  const columns = [
    {
      title: "Property Name",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record._id.substring(record._id.length - 8).toUpperCase()}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        if (record.isSold) return <Tag color="error">SOLD</Tag>;
        if (!record.isVerified) return <Tag color="warning">PENDING</Tag>;
        return <Tag color="success">ACTIVE</Tag>;
      },
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      sorter: (a, b) => a.viewCount - b.viewCount,
      render: (val) => (
        <Space>
          <Eye size={14} className="text-purple-500" />
          <Text>{val.toLocaleString()}</Text>
        </Space>
      )
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button 
            type="link" 
            onClick={() => navigate(`/seller/my-properties`)}
            icon={<ChevronRight size={16} />}
        >
          Details
        </Button>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[180px]">
          <div className="mb-4">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              {new Date(label).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
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

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Button 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate(-1)}
            style={{ marginBottom: '12px' }}
          >
            Back to Dashboard
          </Button>
          <Title level={2} style={{ margin: 0 }}>Property Performance Analytics</Title>
          <Text type="secondary">In-depth analysis of your property listings and engagement</Text>
        </div>
        <Space>
          <Select value={range} onChange={setRange} style={{ width: 150 }} size="large">
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 90 Days</Option>
            <Option value="all">All Time</Option>
          </Select>
        </Space>
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px' }}>
                <Building size={24} color="#4f46e5" />
              </div>
              <div>
                <Text type="secondary">Total Listings</Text>
                <Title level={3} style={{ margin: 0 }}>{data?.summary.totalProperties}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px' }}>
                <Eye size={24} color="#d97706" />
              </div>
              <div>
                <Text type="secondary">Total Views</Text>
                <Title level={3} style={{ margin: 0 }}>{data?.summary.totalViews.toLocaleString()}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '12px' }}>
                <MessageSquare size={24} color="#059669" />
              </div>
              <div>
                <Text type="secondary">Total Leads</Text>
                <Title level={3} style={{ margin: 0 }}>{data?.summary.totalLeads}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px' }}>
                <TrendingUp size={24} color="#dc2626" />
              </div>
              <div>
                <Text type="secondary">Sold Properties</Text>
                <Title level={3} style={{ margin: 0 }}>{data?.summary.soldProperties}</Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Chart */}
      <Card 
        title={
          <Space>
            <TrendingUp size={20} className="text-blue-500" />
            <span>Engagement Trends</span>
          </Space>
        }
        style={{ borderRadius: '16px', marginBottom: '24px', overflow: 'hidden' }}
      >
        <div style={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
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

      {/* Individual Property Stats Table */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Building size={20} className="text-purple-500" />
              <span>Property Breakdown</span>
            </Space>
          </div>
        }
        style={{ borderRadius: '16px' }}
      >
        <Table 
          columns={columns} 
          dataSource={data?.allPropertyStats || []} 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No properties found" /> }}
        />
      </Card>
    </div>
  );
};

export default PropertyAnalytics;
