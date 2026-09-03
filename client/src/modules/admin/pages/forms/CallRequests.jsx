import { useState, useEffect } from "react";
import { Table, Card, Button, Input, Tag, message, Popconfirm, Row, Col, Typography, Tooltip, Avatar, Select } from "antd";
import { Download, Search, RefreshCw, Trash2, Phone, Mail, Clock, Calendar, Layout, CheckCircle, AlertCircle, Hash } from "lucide-react";
import api from "@/services/api";
import * as XLSX from "xlsx";
import moment from "moment";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

const timeMapping = {
  morning: "9 AM to 12 PM",
  afternoon: "12 PM to 3 PM",
  evening: "3 PM to 7 PM"
};

const CallRequests = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/forms/request-call");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching callback requests:", error);
      message.error("Failed to fetch callback requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    total: data.length,
    new: data.filter(d => d.status === "new").length,
    today: data.filter(d => moment(d.createdAt).isSame(moment(), 'day')).length,
    closed: data.filter(d => d.status === "closed").length
  };

  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = filteredData.map((item, index) => ({
      "S.No": index + 1,
      Name: item.fullName || "-",
      Phone: item.phone || "-",
      Email: item.email || "-",
      Category: item.category || "-",
      "Preferred Date": item.preferred_date ? moment(item.preferred_date).format("DD MMM, YYYY") : "-",
      "Preferred Time": timeMapping[item.preferredTime] || item.preferredTime || "-",
      "Date": moment(item.createdAt).format("DD MMM, YYYY"),
      "Time": moment(item.createdAt).format("hh:mm A"),
      Status: item.status || "new",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CallRequests");
    XLSX.writeFile(workbook, `Callback_Requests_${moment().format("DDMMYY")}.xlsx`);
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/forms/request-call/${id}`);
      if (res.data.success) {
        message.success("Request deleted successfully");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      message.error(error.response?.data?.message || "Failed to delete request");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.patch(`/forms/request-call/${id}/status`, { status });
      if (res.data.success) {
        message.success(`Status updated to ${status}`);
        fetchData();
        // Refresh sidebar counts
        window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Failed to update status");
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone?.includes(searchText) ||
      item.category?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1.5 text-gray-500 whitespace-nowrap">
          {/* <Hash size={14} /> */}
          <span>S.No</span>
        </div>
      ),
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => <span className="text-gray-400 font-medium">{index + 1}</span>,
    },
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
      render: (text) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <Avatar size={32} className="bg-blue-100 text-blue-600 font-bold shrink-0">
            {text?.charAt(0).toUpperCase()}
          </Avatar>
          <span className="font-semibold text-gray-900 truncate">{text || "Unknown User"}</span>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone) => (
        <div className="flex items-center gap-1 text-blue-600 font-medium whitespace-nowrap">
          <Phone size={14} className="shrink-0" />
          <span>{phone}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (email) => 
        email ? (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap">
            <Mail size={13} className="shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        ) : <span className="text-gray-300 italic text-xs whitespace-nowrap">No email</span>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (text) => (
        <Tag color="geekblue" className="rounded-full px-3 border-none whitespace-nowrap">
          <span className="inline-flex items-center gap-1 uppercase text-[10px] font-bold tracking-wider">
            <Layout size={10} />
            {text || "General"}
          </span>
        </Tag>
      ),
    },
    {
      title: "Pref. Date",
      dataIndex: "preferred_date",
      key: "preferred_date",
      width: 140,
      render: (date) => (
        <div className="flex items-center gap-1.5 text-indigo-600 font-semibold whitespace-nowrap text-xs">
          <Calendar size={14} />
          <span>{date ? moment(date).format("DD MMM, YYYY") : "-"}</span>
        </div>
      ),
    },
    {
      title: "Time Slot",
      dataIndex: "preferredTime",
      key: "preferredTime",
      width: 160,
      render: (text) => (
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold whitespace-nowrap">
          <Clock size={14} />
          <span>{timeMapping[text] || text}</span>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "reqDate",
      width: 130,
      render: (date) => (
        <div className="flex items-center gap-1.5 text-gray-700 font-medium whitespace-nowrap">
          <Calendar size={14} className="text-indigo-500" />
          <span>{moment(date).format("DD MMM, YYYY")}</span>
        </div>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "reqTime",
      width: 110,
      render: (date) => (
        <div className="flex items-center gap-1.5 text-gray-500 font-medium whitespace-nowrap">
          <Clock size={14} className="text-gray-400" />
          <span>{moment(date).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status, record) => (
        <Select
          value={status || "new"}
          onChange={(value) => handleStatusChange(record._id, value)}
          size="small"
          style={{ width: 120 }}
          className={`status-select-${status?.toLowerCase()}`}
        >
          <Option value="new">NEW REQUEST</Option>
          <Option value="contacted">CONTACTED</Option>
          <Option value="closed">COMPLETED</Option>
        </Select>
      ),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      width: 130,
      render: (updatedBy) => (
        <div className="flex flex-col">
          {updatedBy ? (
            <Tag color="cyan" className="font-bold text-[10px] uppercase border-none bg-cyan-50 text-cyan-700 m-0">
              {updatedBy.name}
            </Tag>
          ) : (
            <span className="text-gray-300 text-[10px] italic">No update yet</span>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Delete the request"
          description="Are you sure to delete this request?"
          onConfirm={() => handleDelete(record._id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="text" 
            danger 
            icon={<Trash2 size={16} />} 
            className="hover:bg-red-50 flex items-center justify-center p-2 rounded-lg"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="mb-0 text-gray-800">Callback Requests</Title>
          <Text type="secondary">Manage and track user requests for callbacks</Text>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Tooltip title="Refresh Data">
            <Button
              icon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchData}
              className="h-10 w-10 flex items-center justify-center rounded-xl border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-100"
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<Download size={18} />}
            onClick={handleExport}
            className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 border-none rounded-lg flex items-center gap-2 font-semibold shadow-sm transition-all"
          >
            Export Requests
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        {[
          { title: "Total Requests", value: stats.total, icon: <Phone size={24} />, bg: "bg-indigo-50", text: "text-indigo-600" },
          { title: "New Requests", value: stats.new, icon: <AlertCircle size={24} />, bg: "bg-yellow-50", text: "text-yellow-600" },
          { title: "Received Today", value: stats.today, icon: <Calendar size={24} />, bg: "bg-emerald-50", text: "text-emerald-600" },
          { title: "Completed", value: stats.closed, icon: <CheckCircle size={24} />, bg: "bg-blue-50", text: "text-blue-600" },
        ].map((item, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card className="hover:shadow-md transition-shadow duration-300 border-none shadow-sm bg-white overflow-hidden">
              <div className="flex items-center gap-4">
                <div className={`p-3 ${item.bg} ${item.text} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 font-semibold text-xs uppercase tracking-wider leading-none mb-1.5">{item.title}</span>
                  <span className="text-2xl font-bold text-gray-900 leading-none">{loading ? "..." : item.value}</span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Title level={4} className="m-0! text-gray-800! whitespace-nowrap">
              Recent Requests
            </Title>
            <Tag color="geekblue" className="rounded-full border-none px-3 font-semibold whitespace-nowrap">
              {filteredData.length} records found
            </Tag>
          </div>
          <div className="w-full lg:w-auto">
            <Input
              prefix={<Search size={18} className="text-gray-400" />}
              placeholder="Search leads..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full lg:w-60 rounded-lg bg-gray-50 border-gray-100 hover:border-indigo-300 focus:border-indigo-500 transition-all"
              size="large"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            loading={{
              spinning: loading,
              indicator: <Loader variant="panel" />
            }}
            pagination={{
              pageSize: 8,
              placement: "bottomRight",
              showTotal: (total) => `Total ${total} requests`,
              size: "default",
              className: "px-4 py-4 pt-6 border-t border-gray-50",
              responsive: true
            }}
            scroll={{ x: 1200 }}
            className="admin-forms-table"
          />
        </div>
      </Card>
    </div>
  );
};

export default CallRequests;
