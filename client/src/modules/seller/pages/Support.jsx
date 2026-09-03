import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Card,
  List,
  Tag,
  Input,
  Button,
  Avatar,
  Typography,
  Empty,
  Modal,
  Form,
  message,
  Badge,
  Tooltip,
  Divider,
  Dropdown,
} from "antd";
import {
  SendOutlined,
  PlusOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import moment from "moment";
import Loader from "@/components/Common/Loader";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [form] = Form.useForm();

  const { user } = useAuth();
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const activeTicketRef = useRef(null);

  useEffect(() => {
    activeTicketRef.current = activeTicket?._id;
  }, [activeTicket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeTicket?.messages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { ticketId, message: newMessage } = data;

      // If the message is for the currently active ticket, mark it as read
      if (activeTicket?._id === ticketId) {
        fetchTicketDetails(ticketId);
      }

      setTickets((prev) => {
        const updated = prev.map((t) =>
          t._id === ticketId
            ? {
                ...t,
                lastMessageAt: newMessage.createdAt,
                isSellerRead:
                  activeTicketRef.current === ticketId || !newMessage.isAdmin
                    ? t.isSellerRead
                    : false,
              }
            : t,
        );
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
        );
      });

      setActiveTicket((prev) => {
        if (prev && prev._id === ticketId) {
          const exists = prev.messages.some(
            (m) =>
              (m._id && m._id === newMessage._id) ||
              (m.content === newMessage.content &&
                Math.abs(
                  new Date(m.createdAt) - new Date(newMessage.createdAt),
                ) < 5000),
          );
          if (exists) return prev;

          return {
            ...prev,
            messages: [...prev.messages, newMessage],
          };
        }
        return prev;
      });
    };

    const handleMessagesRead = (data) => {
      if (data.ticketId === activeTicket?._id) {
        setActiveTicket((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              !m.isAdmin ? { ...m, read: true } : m,
            ),
          };
        });
      }
    };

    const handleStatusUpdated = (data) => {
      const updatedTicket = data.ticket;
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t)),
      );
      if (activeTicket?._id === updatedTicket._id) {
        setActiveTicket(updatedTicket);
      }
    };

    socket.on("new-support-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);
    socket.on("ticket-status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-support-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
      socket.off("ticket-status-updated", handleStatusUpdated);
    };
  }, [socket, activeTicket?._id]);

  useEffect(() => {
    let result = tickets;
    if (searchTerm) {
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t._id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    setFilteredTickets(result);
  }, [tickets, searchTerm, statusFilter]);

  // Auto-remove expired tickets from UI in real-time
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setTickets((prev) => {
        const now = moment();
        const filtered = prev.filter((t) => {
          if (!t.resolvedAt) return true;
          // Use 30 days for production
          const expiryTime = moment(t.resolvedAt).add(30, "days");
          return now.isBefore(expiryTime);
        });

        if (filtered.length !== prev.length) {
          // If the active ticket was removed, clear it
          if (
            activeTicket &&
            !filtered.find((t) => t._id === activeTicket._id)
          ) {
            setActiveTicket(null);
          }
          return filtered;
        }
        return prev;
      });
    }, 60000); // Check every minute in production

    return () => clearInterval(cleanupInterval);
  }, [activeTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get("/support-tickets/my-tickets");
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      message.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    // Immediate feedback: switch to the ticket instantly using data we already have
    const existingTicket = tickets.find((t) => t._id === id);
    if (existingTicket) {
      setActiveTicket(existingTicket);
    }

    try {
      const response = await api.get(`/support-tickets/${id}`);
      if (response.data.success) {
        setActiveTicket(response.data.ticket);
        // Mark as read in the list locally to hide red dot
        setTickets((prev) =>
          prev.map((t) => (t._id === id ? { ...t, isSellerRead: true } : t)),
        );
      }
    } catch (error) {}
  };

  const handleCreateTicket = async (values) => {
    setSending(true);
    try {
      const response = await api.post("/support-tickets", values);
      if (response.data.success) {
        message.success("Ticket created!");
        setIsModalOpen(false);
        form.resetFields();
        fetchTickets();
        setActiveTicket(response.data.ticket);
      }
    } catch (error) {
      message.error("Failed to create ticket");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeTicket || sending) return;
    
    const content = messageText;
    setMessageText(""); // Clear input immediately for "fast" feel
    
    // Optimistically update the UI
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: {
        _id: user?._id,
        name: user?.name,
        profile_image: user?.profile_image
      },
      content,
      isAdmin: false,
      createdAt: new Date(),
      read: false,
      isOptimistic: true
    };

    // Update active ticket messages
    setActiveTicket(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage]
    }));

    // Update tickets list last message
    setTickets(prev => prev.map(t => 
      t._id === activeTicket._id 
        ? { ...t, lastMessageAt: new Date() } 
        : t
    ));

    try {
      const response = await api.post(
        `/support-tickets/message/${activeTicket._id}`,
        { content, isAdmin: false },
      );
      if (response.data.success) {
        // Replace optimistic message with real one from server
        setActiveTicket(response.data.ticket);
      }
    } catch (error) {
      message.error("Failed to send message");
      // Revert optimistic message on error
      setActiveTicket(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m._id !== tempId)
      }));
      // Restore input text if failed
      setMessageText(content);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "processing";
      case "closed":
        return "default";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <Layout className="flex-1 bg-white">
        {/* Sidebar */}
        {(!isMobile || !activeTicket) && (
          <Sider
            width={isMobile ? "100%" : 400}
            className="bg-white border-r border-gray-200 flex flex-col h-full z-20"
            theme="light"
          >
            <div className="pt-3 border-t border-gray-100 p-2 bg-white">
              <div className="flex justify-between items-center px-2 mb-2">
                <Title level={4} className="m-0 font-bold text-[#111b21]">
                  Support
                </Title>
                <Tooltip title="New Ticket">
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#00a884] border-none"
                  />
                </Tooltip>
              </div>
              <Input
                placeholder="Search tickets..."
                prefix={<SearchOutlined className="text-[#54656f] mr-2" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg bg-[#f0f2f5] border-none h-9 text-sm focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-white border-b border-gray-100">
              {["all", "open", "resolved", "closed"].map((status) => (
                <Tag.CheckableTag
                  key={status}
                  checked={statusFilter === status}
                  onChange={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-0.5 text-[12px] border transition-all m-0 whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-[#00a884] text-white border-[#00a884]"
                      : "bg-[#f0f2f5] text-[#54656f] border-transparent hover:bg-[#e9edef]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag.CheckableTag>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 bg-white">
              <List
                loading={{
                  spinning: loading,
                  indicator: <Loader variant="inline" />
                }}
                dataSource={filteredTickets}
                renderItem={(item) => (
                  <div
                    className={`relative cursor-pointer transition-all border-b border-gray-50 hover:bg-[#f5f6f6] ${
                      activeTicket?._id === item._id ? "bg-[#ebebeb]" : ""
                    }`}
                    onClick={() => fetchTicketDetails(item._id)}
                  >
                    <div className="flex p-3 gap-3 items-center">
                      <Avatar
                        size={48}
                        icon={<MessageOutlined />}
                        className="flex-shrink-0 bg-blue-100 text-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Text
                              strong
                              className="text-[16px] text-[#111b21] truncate"
                            >
                              {item.subject}
                            </Text>
                            <Text className="text-[10px] text-gray-400 font-mono mt-0.5 flex-shrink-0">
                              #{item._id.slice(-6).toUpperCase()}
                            </Text>
                          </div>
                          <Text
                            className={`text-[12px] ${!item.isSellerRead ? "text-[#a82a00] font-semibold" : "text-[#667781]"}`}
                          >
                            {moment(item.lastMessageAt).format("hh:mm A")}
                          </Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center min-w-0 flex-1">
                            {item.status !== "open" && (
                              <Tag
                                color={getStatusColor(item.status)}
                                className="m-0 border-none px-1.5 py-0 rounded-sm text-[10px] uppercase font-bold mr-1"
                              >
                                {item.status}
                              </Tag>
                            )}
                            <Text className="text-[14px] text-[#667781] truncate">
                              {item.messages?.[item.messages.length - 1]
                                ?.content || "No messages yet"}
                            </Text>
                          </div>
                          {!item.isSellerRead && (
                            <div className="bg-[#ef0202] w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                locale={{
                  emptyText: (
                    <Empty description="No tickets found" className="my-10" />
                  ),
                }}
              />
            </div>
          </Sider>
        )}

        {/* Chat Area */}
        {(!isMobile || activeTicket) && (
          <Content className="bg-[#f0f2f5] flex flex-col h-full relative overflow-hidden">
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-[#f0f2f5] sticky top-0 z-10 h-[60px]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isMobile && (
                      <Button
                        type="text"
                        icon={<ArrowLeftOutlined className="text-[#54656f]" />}
                        onClick={() => setActiveTicket(null)}
                        className="mr-1"
                      />
                    )}
                    <Avatar
                      size={40}
                      icon={<MessageOutlined />}
                      className="bg-blue-600 text-white"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <Text
                          strong
                          className="text-[16px] text-[#111b21] truncate leading-tight"
                        >
                          {activeTicket.subject}
                        </Text>
                        <Tag
                          color={getStatusColor(activeTicket.status)}
                          className="m-0 border-none px-1.5 py-0 rounded-sm text-[10px] uppercase font-bold"
                        >
                          {activeTicket.status}
                        </Tag>
                      </div>
                      <Text className="text-[12px] text-[#667781] truncate">
                        Ref ID:{" "}
                        <span className="font-mono">
                          #{activeTicket._id.slice(-8).toUpperCase()}
                        </span>
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      icon={<MoreOutlined className="text-[#000000]" />}
                      type="text"
                      shape="circle"
                    />
                  </div>
                </div>

                {/* Messages Container with WhatsApp Background */}
                <div
                  className={`flex-1 overflow-y-auto ${isMobile ? "p-3" : "p-8"} space-y-3 bg-[#efeae2] relative`}
                  style={{
                    backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                    backgroundBlendMode: "overlay",
                    backgroundColor: "#efeae2",
                  }}
                >
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="bg-[#fff9c2] px-3 py-1.5 rounded-lg border border-gray-200/50 shadow-sm flex items-center gap-2">
                      <ClockCircleOutlined className="text-gray-500 text-[10px]" />
                      <Text className="text-[11px] font-medium text-gray-700 uppercase tracking-wide">
                        Ticket Created{" "}
                        {moment(activeTicket.createdAt).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                    {activeTicket.resolvedAt && (
                      <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm flex items-center gap-2">
                        <DeleteOutlined className="text-red-500 text-[10px]" />
                        <Text className="text-[11px] font-bold text-red-600 uppercase tracking-wide">
                          Auto-deletion in{" "}
                          {Math.max(
                            0,
                            30 -
                              moment().diff(
                                moment(activeTicket.resolvedAt),
                                "days",
                              ),
                          )}{" "}
                          days
                        </Text>
                      </div>
                    )}
                  </div>

                  {activeTicket.messages.map((msg, idx) => {
                    const isMe = !msg.isAdmin; // In seller panel, seller is "me"
                    return (
                      <div
                        key={idx}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200`}
                      >
                        <div
                          className={`relative max-w-[85%] lg:max-w-[65%] min-w-[80px] px-3 py-1.5 rounded-lg shadow-sm ${
                            isMe
                              ? "bg-[#d9fdd3] rounded-tr-none ml-10"
                              : "bg-white rounded-tl-none mr-10"
                          }`}
                        >
                          {/* WhatsApp Bubble Tail */}
                          <div
                            className={`absolute top-0 w-3 h-3 ${isMe ? "-right-2" : "-left-2"}`}
                            style={{
                              background: isMe ? "#d9fdd3" : "#ffffff",
                              clipPath: isMe
                                ? "polygon(0 0, 0 100%, 100% 0)"
                                : "polygon(100% 0, 100% 100%, 0 0)",
                            }}
                          />

                          <div className="text-[14px] lg:text-[15px] text-[#111b21] leading-relaxed whitespace-pre-wrap pb-2 pr-14">
                            {msg.content}
                          </div>

                          <div className="absolute bottom-1 right-2 flex items-center gap-1">
                            <span className="text-[10px] text-[#667781] leading-none">
                              {moment(msg.createdAt).format("HH:mm")}
                            </span>
                            {isMe && (
                              <div className="flex items-center -mb-0.5">
                                {msg.read ? (
                                  <svg
                                    viewBox="0 0 16 11"
                                    width="16"
                                    height="11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.5 5.5L5.5 9.5L14.5 0.5"
                                      stroke="#53bdeb"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M5.5 5.5L9.5 9.5L18.5 0.5"
                                      stroke="#53bdeb"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      transform="translate(-4, 0)"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 16 11"
                                    width="16"
                                    height="11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.5 5.5L5.5 9.5L14.5 0.5"
                                      stroke="#667781"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-4" />
                </div>

                <div className="px-4 py-2 bg-[#f0f2f5] flex items-center gap-2">
                  {activeTicket.status === "open" ? (
                    <>
                      <div className="flex-1 px-3 flex items-center">
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 6 }}
                          placeholder="Type a message"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onPressEnter={(e) => {
                            if (!e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1 border-none bg-transparent shadow-none focus:ring-0 text-[15px] py-2 px-1 resize-none leading-relaxed text-[#111b21]"
                          style={{ boxShadow: "none" }}
                        />
                      </div>
                      <Button
                        type="primary"
                        shape="circle"
                        style={{
                          backgroundColor: messageText.trim()
                            ? "#00a884"
                            : "transparent",
                          boxShadow: "none",
                          width: "45px",
                          height: "45px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                        icon={
                          <SendOutlined
                            style={{
                              fontSize: "20px",
                              color: messageText.trim() ? "#fff" : "#54656f",
                              marginLeft: messageText.trim() ? "3px" : "0",
                            }}
                          />
                        }
                        onClick={handleSendMessage}
                        loading={sending}
                        disabled={!messageText.trim() && !sending}
                        className="transition-all duration-200"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-100 rounded-2xl border border-dashed border-gray-300 text-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-1">
                        <CheckCircleOutlined className="text-gray-600 text-xs" />
                      </div>
                      <Text className="font-bold text-[10px] uppercase tracking-widest text-gray-500">
                        THIS TICKET IS {activeTicket.status.toUpperCase()}
                      </Text>
                      <Text className="text-[11px] text-gray-400 mt-1">
                        Please create a new ticket if you need further help.
                      </Text>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 lg:p-20">
                <div className="w-72 h-72 lg:w-[400px] lg:h-[400px] flex items-center justify-center opacity-90">
                  <img
                    src="/chat/contact.webp"
                    alt="Support"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Title
                  level={isMobile ? 4 : 3}
                  className="text-gray-900 font-black mb-3 text-center uppercase tracking-tight"
                >
                  SUPPORT HUB
                </Title>
                <Text className="max-w-xs lg:max-w-md text-gray-500 text-xs lg:text-sm font-medium leading-relaxed uppercase tracking-tight">
                  Our team is ready to help. Select a ticket or create a new
                  one.
                </Text>
                <Button
                  type="primary"
                  size="large"
                  className="mt-8 rounded-full px-10 h-14 shadow-xl shadow-blue-100 font-bold"
                  onClick={() => setIsModalOpen(true)}
                >
                  NEW SUPPORT REQUEST
                </Button>
              </div>
            )}
          </Content>
        )}
      </Layout>

      <Modal
        title={
          <div className="pb-2 border-b border-gray-100">
            <Text strong className="text-lg">
              Create Support Ticket
            </Text>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        className="rounded-3xl overflow-hidden"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTicket}
          className="mt-6"
        >
          <Form.Item
            name="subject"
            label={
              <Text className="font-bold text-gray-600 uppercase text-[11px] tracking-wider">
                Subject
              </Text>
            }
            rules={[{ required: true, message: "Please enter a subject" }]}
          >
            <Input
              placeholder="Describe your issue briefly..."
              size="large"
              className="rounded-xl border-gray-200 h-12 focus:border-blue-500"
            />
          </Form.Item>
          <Form.Item
            name="message"
            label={
              <Text className="font-bold text-gray-600 uppercase text-[11px] tracking-wider">
                Detailed Description
              </Text>
            }
            rules={[{ required: true, message: "Please describe your issue" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Provide as much detail as possible so our team can help you faster..."
              className="rounded-xl border-gray-200 focus:border-blue-500 p-4"
            />
          </Form.Item>
          <div className="flex justify-end pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={sending}
              size="large"
              className="rounded-2xl px-12 h-14 font-bold shadow-lg shadow-blue-100"
            >
              SUBMIT TICKET
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Support;
