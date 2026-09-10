import { useState, useEffect, useCallback } from "react";
import { Badge, Dropdown, Button, Empty, Spin } from "antd";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import api from "@/services/api";

// Portal notification bell — Promoter Module Task 6.1. Distinct from the
// existing support-message Bell already in SellerLayout.jsx's header; that
// one is hardcoded to support-chat socket events and shared by every
// business type, so this is a second, separate icon rather than a change to it.
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/portal-notifications");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Light polling — no push/socket channel wired for portal notifications yet
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/portal-notifications/${notification._id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
        );
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put("/portal-notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const panel = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-800 text-sm">Notifications</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" className="p-0 h-auto text-xs" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="small" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8">
          <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleOpenNotification(n)}
            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
              !n.isRead ? "bg-blue-50/50" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              {!n.isRead && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate m-0">{n.title}</p>
                <p className="text-xs text-gray-500 m-0">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1 m-0">{moment(n.createdAt).fromNow()}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Badge count={unreadCount} size="small" offset={[-2, 2]}>
      <Dropdown popupRender={() => panel} trigger={["click"]} placement="bottomRight">
        <Button
          type="text"
          shape="circle"
          icon={<Bell size={22} className={unreadCount > 0 ? "text-blue-600" : ""} />}
        />
      </Dropdown>
    </Badge>
  );
};

export default NotificationBell;
