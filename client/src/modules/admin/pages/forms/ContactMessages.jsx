import { useState, useEffect } from "react";
import { Table, Card, Button, Input, Tag, message, Drawer, Descriptions, Popconfirm, Row, Col, Typography, Tooltip, Avatar, Select } from "antd";
import { Download, Search, RefreshCw, Eye, Trash2, Phone, Mail, Clock, Calendar, MessageSquare, CheckCircle, AlertCircle, User, Info } from "lucide-react";
import api from "@/services/api";
import * as XLSX from "xlsx";
import moment from "moment";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

const ContactMessages = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/forms/contact");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      message.error("Failed to fetch contact messages");
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
    seller: data.filter(d => d.sellProperty).length,
    today: data.filter(d => moment(d.createdAt).isSame(moment(), 'day')).length
  };

  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = filteredData.map((item, index) => ({
      "S.No": index + 1,
      Name: item.name || "-",
      Phone: item.phone || "-",
      Email: item.email || "-",
      "Enquiry Type": item.sellProperty ? "Seller Enquiry" : "General",
      Message: item.message || "-",
      "Date": moment(item.createdAt).format("DD MMM, YYYY"),
      "Time": moment(item.createdAt).format("hh:mm A"),
      Status: item.status || "new",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ContactMessages");
    XLSX.writeFile(workbook, `Contact_Messages_${moment().format("DDMMYY")}.xlsx`);
  };

  const handleView = (record) => {
    setSelectedMessage(record);
    setViewDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/forms/contact/${id}`);
      if (res.data.success) {
        message.success("Message deleted successfully");
        fetchData();
        if (selectedMessage && selectedMessage._id === id) {
          setViewDrawerOpen(false);
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      message.error(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.patch(`/forms/contact/${id}/status`, { status });
      if (res.data.success) {
        message.success(`Status updated to ${status}`);
        fetchData();
        // Refresh sidebar counts
        window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(res.data.data);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Failed to update status");
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone?.includes(searchText) ||
      item.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "S.No",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => <span className="text-gray-400 font-medium">{index + 1}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <Avatar size={32} className="bg-indigo-100 text-indigo-600 font-bold shrink-0">
            {text?.charAt(0).toUpperCase()}
          </Avatar>
          <span className="font-semibold text-gray-900 truncate">{text || "Guest User"}</span>
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
      render: (email) => (
        <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap">
          <Mail size={13} className="shrink-0" />
          <span className="truncate">{email || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Type",
      key: "sellProperty",
      width: 150,
      render: (_, record) => (
        <Tag color={record.sellProperty ? "purple" : "cyan"} className="rounded-full px-3 border-none whitespace-nowrap">
          <span className="inline-flex items-center gap-1 uppercase text-[10px] font-bold tracking-wider">
            <Info size={10} />
            {record.sellProperty ? "Seller Enquiry" : "General"}
          </span>
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
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
          <Option value="new">NEW MESSAGE</Option>
          <Option value="contacted">CONTACTED</Option>
          <Option value="closed">CLOSED</Option>
        </Select>
      ),
    },
    {
      title: "Handled By",
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
            <span className="text-gray-300 text-[10px] italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          <Tooltip title="View Message">
            <Button 
              type="text" 
              icon={<Eye size={16} className="text-blue-600" />} 
              onClick={() => handleView(record)}
              className="hover:bg-blue-50 flex items-center justify-center p-2 rounded-lg"
            />
          </Tooltip>
          <Popconfirm
            title="Delete the message"
            description="Are you sure to delete this message?"
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
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="mb-0 text-gray-800">Contact Messages</Title>
          <Text type="secondary">Manage and respond to general inquiries and seller requests</Text>
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
            Export Messages
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        {[
          { title: "Total Messages", value: stats.total, icon: <MessageSquare size={24} />, bg: "bg-indigo-50", text: "text-indigo-600" },
          { title: "New Enquiries", value: stats.new, icon: <AlertCircle size={24} />, bg: "bg-volcano-50", text: "text-volcano-600" },
          { title: "Seller Leads", value: stats.seller, icon: <User size={24} />, bg: "bg-purple-50", text: "text-purple-600" },
          { title: "Received Today", value: stats.today, icon: <Calendar size={24} />, bg: "bg-emerald-50", text: "text-emerald-600" },
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
              Recent Messages
            </Title>
            <Tag color="geekblue" className="rounded-full border-none px-3 font-semibold whitespace-nowrap">
              {filteredData.length} records found
            </Tag>
          </div>
          <div className="w-full lg:w-auto">
            <Input
              prefix={<Search size={18} className="text-gray-400" />}
              placeholder="Search by name, phone or email..."
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
              showTotal: (total) => `Total ${total} messages`,
              size: "default",
              className: "px-4 py-4 pt-6 border-t border-gray-50",
              responsive: true
            }}
            scroll={{ x: 1200 }}
            className="admin-forms-table"
          />
        </div>
      </Card>

      <Drawer
        title={<span className="text-lg font-bold text-gray-800">Message Details</span>}
        placement="right"
        width={500}
        onClose={() => setViewDrawerOpen(false)}
        open={viewDrawerOpen}
        headerStyle={{ borderBottom: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: '0' }}
      >
        {selectedMessage && (
          <div className="flex flex-col h-full bg-gray-50/30">
            {/* Header info */}
            <div className="p-6 bg-white border-b border-gray-100">
               <div className="flex items-center gap-4 mb-4">
                  <Avatar size={64} className="bg-indigo-100 text-indigo-600 text-2xl font-bold">
                    {selectedMessage.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 m-0">{selectedMessage.name}</h3>
                    <Tag color={selectedMessage.sellProperty ? "purple" : "cyan"} className="rounded-full mt-1 border-none font-semibold">
                      {selectedMessage.sellProperty ? "Seller Enquiry" : "General Inquiry"}
                    </Tag>
                    <div className="mt-2">
                      <Select
                        value={selectedMessage.status || "new"}
                        onChange={(value) => handleStatusChange(selectedMessage._id, value)}
                        size="small"
                        style={{ width: 140 }}
                      >
                        <Option value="new">NEW MESSAGE</Option>
                        <Option value="contacted">CONTACTED</Option>
                        <Option value="closed">CLOSED</Option>
                      </Select>
                      {selectedMessage.updatedBy && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                          Updated by: {selectedMessage.updatedBy.name}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={16} className="text-blue-500" />
                    <span className="font-medium">{selectedMessage.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={16} className="text-amber-500" />
                    <span className="font-medium">{selectedMessage.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={16} className="text-indigo-500" />
                    <span className="font-medium">{moment(selectedMessage.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                  </div>
               </div>
            </div>

            {/* Message Body */}
            <div className="p-6 flex-1 overflow-auto">
               <div className="flex items-center gap-2 mb-3 text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                  <MessageSquare size={14} />
                  <span>Message Content</span>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-700 leading-relaxed text-base min-h-40 whitespace-pre-wrap">
                  {selectedMessage.message || <span className="text-gray-300 italic">No message provided</span>}
               </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
              <Button 
                type="primary" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-bold text-white border-none shadow-md shadow-indigo-100"
                onClick={() => {
                  window.location.href = `mailto:${selectedMessage.email}`;
                }}
              >
                Reply via Email
              </Button>
              <Popconfirm
                title="Delete this message?"
                onConfirm={() => handleDelete(selectedMessage._id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button className="h-11 rounded-xl border-gray-200 text-gray-500 font-bold px-6">
                  Delete
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ContactMessages;
