import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  message,
  Modal,
  Dropdown,
  Row,
  Col,
  Avatar,
  Tooltip,
} from "antd";
import { getImageUrl } from "@/utils/imageUrl";
import { 
  Trash2, 
  AlertCircle, 
  MoreVertical, 
  CheckCircle, 
  UserX, 
  Clock,
  Phone
} from "lucide-react";
import api from "@/services/api";
import Loader from "@/components/Common/Loader";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const FailedRegistrations = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFailedUsers = async () => {
    setLoading(true);
    try {
      // Fetch only unverified users
      const response = await api.get("/users/get-all-users?verified=false");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch failed registrations", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedUsers();
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this record?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This will remove the failed registration attempt from the database.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/users/delete-user-by-id/${id}`);
          message.success("Record deleted successfully");
          fetchFailedUsers();
        } catch (error) {
          message.error("Failed to delete record");
          console.error(error);
        }
      },
    });
  };

  const handleVerify = (id) => {
    Modal.confirm({
      title: "Manually verify this user?",
      icon: <CheckCircle className="text-emerald-500" />,
      content: "This will mark the user as verified despite them not completing the OTP process.",
      okText: "Yes, Verify",
      onOk: async () => {
        try {
          await api.put(`/users/update-user-by-id/${id}`, {
            isVerified: true,
          });
          message.success("User verified successfully");
          fetchFailedUsers();
        } catch (error) {
          message.error("Failed to verify user");
        }
      },
    });
  };

  const columns = [
    {
      title: "User Info",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={getImageUrl(record.profile_image)} 
            size={40}
            className="bg-rose-100 text-rose-600 border border-rose-200"
          >
            {record.name ? record.name.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{record.name || "Unnamed Attempt"}</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{record.userId || "NO ID"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Details",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone size={14} className="text-gray-400" />
            <span>{record.phone || "No Phone"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Attempt Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} className="text-gray-400" />
          <Tooltip title={dayjs(date).format("DD MMM YYYY, hh:mm A")}>
            <span className="text-sm">{dayjs(date).fromNow()}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <Tag color="volcano" className="rounded-full px-3 border-none">
          <span className="inline-flex items-center whitespace-nowrap font-medium text-[10px]">
            PENDING VERIFICATION
          </span>
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
            key: "verify",
            label: (
              <div className="flex items-center gap-2" onClick={() => handleVerify(record._id)}>
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Verify Manually</span>
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
              <div className="flex items-center gap-2" onClick={() => handleDelete(record._id)}>
                <Trash2 size={14} />
                <span>Remove Record</span>
              </div>
            ),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} />} className="hover:bg-gray-100" />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={3} className="mb-1!">
            Failed Registrations
          </Title>
          <Text type="secondary">
            Users who initiated registration but did not complete OTP verification.
          </Text>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-none bg-rose-50/50 hover:bg-rose-50 transition-colors py-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                <UserX size={24} />
              </div>
              <div>
                <div className="text-rose-600 font-semibold text-xs uppercase tracking-wider">Failed Attempts</div>
                <div className="text-2xl font-bold text-gray-800">{loading ? "..." : users.length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-none overflow-hidden relative min-h-[400px]">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: "px-4"
          }}
          scroll={{ x: true }}
          locale={{ emptyText: "No failed registrations found" }}
        />
      </Card>
    </div>
  );
};

export default FailedRegistrations;
