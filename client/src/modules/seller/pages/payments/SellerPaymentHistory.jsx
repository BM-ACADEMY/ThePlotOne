import { useState, useEffect, useCallback } from "react";
import { Table, Card, Typography, message, Tag, Row, Col, Progress, Button, Empty, Tooltip, Modal, List, Divider } from "antd";
import {
  Clock,
  IndianRupee,
  CreditCard,
  ArrowUpCircle,
  Zap,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Ticket
} from "lucide-react";
import api from "@/services/api";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;

const SellerPaymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [propertyCount, setPropertyCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, subRes, propertiesRes] = await Promise.all([
        api.get("/subscriptions/my-history"),
        api.get("/subscriptions/my-subscription"),
        api.get(`/properties/fetch-all-property?limit=100&seller_id=${user._id}`)
      ]);

      setHistory(historyRes.data);
      setSubscription(subRes.data);
      if (propertiesRes.data && propertiesRes.data.properties) {
        setPropertyCount(propertiesRes.data.properties.length);
      }
    } catch (error) {
      console.error("Failed to fetch billing data", error);
      message.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const planName = subscription?.plan?.name || "Free Plan";
  const planPrice = subscription?.plan?.price || 0;
  const propertyLimit = subscription?.plan?.propertyLimit || 3;
  const usagePercent = propertyLimit === -1 ? 0 : Math.round(Math.min(100, (propertyCount / propertyLimit) * 100));

  const leadsLimit = subscription?.plan?.leadsLimit || 0;
  const leadsUsed = subscription?.leadsUsed || 0;
  const leadsPercent = leadsLimit === -1 ? 0 : Math.round(Math.min(100, (leadsUsed / leadsLimit) * 100));

  const columns = [
    {
      title: "Transaction Date",
      dataIndex: "transactionDate",
      key: "date",
      render: (date) => (
        <div className="flex flex-col">
          <span className="text-gray-800 font-semibold text-sm">
            {moment(date).format("MMM DD, YYYY")}
          </span>
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <Clock size={10} /> {moment(date).format("hh:mm A")}
          </span>
        </div>
      ),
    },
    {
      title: "Plan Details",
      dataIndex: "planName",
      key: "description",
      render: (name) => (
        <div className="flex flex-col gap-1">
          <Tag color="blue" className="bg-blue-50 text-blue-600 border-blue-100 rounded-lg px-3 py-1 font-bold text-xs w-fit capitalize">
            {name} Plan
          </Tag>
        </div>
      ),
    },
    {
      title: "Pricing Summary",
      key: "amountPaid",
      render: (_, record) => {
        const discountAmount = record.discountAmount || 0;
        const finalAmount = record.finalAmount || record.amountPaid || 0;

        return (
          <div className="flex flex-col gap-1.5 min-w-[180px] bg-white p-3 rounded-2xl border border-gray-50 shadow-sm">
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-gray-400 font-medium uppercase tracking-wider">Discount Applied:</span>
                <span className="flex items-center" style={{ color: "#16A34A", fontWeight: "600" }}>
                  -<IndianRupee size={10} />{parseFloat(discountAmount).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className={`flex items-center justify-between ${discountAmount > 0 ? "mt-1 pt-2 border-t border-dashed border-gray-200" : ""}`}>
              <span className="text-gray-900 font-bold text-[10px] uppercase tracking-widest">Paid Amount:</span>
              <span className="text-gray-900 flex items-center" style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em" }}>
                <IndianRupee size={16} className="mr-0.5 text-gray-400" />
                {parseFloat(finalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "status",
      render: (status) => {
        const isSuccess = status === "completed" || status === "success";
        return (
          <Tag
            color={isSuccess ? "green" : "red"}
            className="rounded-full px-3 py-1 border-none font-bold flex items-center w-fit capitalize text-[10px]"
          >
            {isSuccess ? "Paid Success" : "Failed"}
          </Tag>
        );
      },
    },
    {
      title: "Expiration Details",
      dataIndex: "expiryDate",
      key: "expiry",
      render: (date) => {
        if (!date) return <span className="text-gray-400 italic font-medium">Lifetime Access</span>;
        
        const isExpired = moment(date).isBefore(moment());
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isExpired ? "text-red-500" : "text-blue-600"}`}>
                {moment(date).format("MMM DD, YYYY")}
              </span>
              
            </div>
            <span className="text-gray-400 text-xs flex items-center gap-1 font-medium italic">
               Expires at {moment(date).format("hh:mm A")}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white px-8 py-12 border-b border-gray-100">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative">
          <Title level={1} className="mb-2! text-4xl! font-bold tracking-tight text-gray-900">Billing</Title>
          <Text className="text-gray-500 text-lg">
            Manage your subscription, view payment history, and update your billing details — all in one place.
          </Text>
        </div>
      </div>

      <div className="p-8">
        <Title level={4} className="mb-6! text-gray-800 flex items-center gap-2">
          Subscription Overview
        </Title>

        <Row gutter={[24, 24]} className="mb-12" justify="start">
          {/* Current Plan Card */}
          <Col xs={24} lg={8} xl={7}>
            <Card className="rounded-3xl border-gray-200/60 shadow-sm h-full hover:shadow-md transition-all group overflow-hidden">
               <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                        <Text className="text-gray-400 font-semibold uppercase tracking-widest text-xs mb-2 block">Current Plan</Text>
                        <div className="flex items-center gap-3">
                            <Tag color="blue" className="bg-blue-50 text-blue-600 border-blue-100 rounded-full px-4 py-1 font-bold">
                                {planName}
                            </Tag>
                            <Tooltip title="View Plan Details">
                                <Info 
                                    size={18} 
                                    className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                                    onClick={() => setIsModalOpen(true)}
                                />
                            </Tooltip>
                        </div>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate("/seller/upgrade-plan")}
                      className="bg-blue-600 hover:bg-blue-500! border-none h-12 px-8 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-transform group-hover:scale-[1.02]"
                    >
                      Upgrade <Zap size={18} fill="currentColor" />
                    </Button>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-bold text-gray-900">₹{planPrice.toLocaleString('en-IN')}</span>
                        <Text className="text-gray-400 font-medium">/ {subscription?.plan?.duration ? `${subscription.plan.duration} Days` : "Lifetime"}</Text>
                    </div>

                    {subscription && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div>
                          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Activated On</Text>
                          <Text className="text-gray-700 font-semibold">{moment(subscription.startDate).format("DD MMM YYYY")}</Text>
                        </div>
                        <div>
                          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Expires On</Text>
                          <Text className="text-blue-500 font-bold">{subscription.endDate ? moment(subscription.endDate).format("DD MMM YYYY") : "Lifetime"}</Text>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </Card>
          </Col>

          {/* Usage Summary Card */}
          <Col xs={24} md={12} lg={8} xl={7}>
            <Card className="rounded-3xl border-gray-200/60 shadow-sm h-full hover:shadow-md transition-all group">
                <div className="flex flex-col h-full">
                  <Text className="text-gray-400 font-semibold uppercase tracking-widest text-[10px] mb-6 block">Usage Summary</Text>

                  <div className="flex items-center justify-between mt-auto">
                    {/* Left side: Stats */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className={propertyLimit !== -1 && usagePercent > 90 ? "text-4xl font-black text-red-500" : "text-4xl font-black text-gray-900"}>
                          {propertyCount}
                        </span>
                        <span className="text-gray-400 text-xl font-bold">/ {propertyLimit === -1 ? "∞" : propertyLimit}</span>
                      </div>
                      <Text className="text-gray-800 text-sm font-bold block mb-3">Properties Uploaded</Text>
                      
                      <Tag color={propertyLimit === -1 ? "blue" : usagePercent > 90 ? "red" : "blue"} className="rounded-md px-2 py-0.5 font-black border-none uppercase text-[9px] w-fit">
                        {propertyLimit === -1 ? "UNLIMITED" : `${usagePercent}% UTILIZATION`}
                      </Tag>
                    </div>

                    {/* Right side: Circular Progress */}
                    <div className="shrink-0 scale-110">
                      <Progress
                        type="dashboard"
                        percent={propertyLimit === -1 ? 100 : Math.min(100, usagePercent)}
                        gapDegree={60}
                        strokeWidth={12}
                        size={120}
                        strokeColor={{
                          '0%': propertyLimit === -1 ? '#93C5FD' : usagePercent > 90 ? '#FCA5A5' : '#93C5FD',
                          '100%': propertyLimit === -1 ? '#1D4ED8' : usagePercent > 90 ? '#B91C1C' : '#1D4ED8',
                        }}
                        trailColor="#F1F5F9"
                        format={(percent) => (
                          <span className={`${propertyLimit !== -1 && usagePercent > 90 ? "text-red-500" : "text-blue-600"} text-lg font-black`}>
                            {percent}%
                          </span>
                        )}
                      />
                    </div>
                  </div>
                </div>
            </Card>
          </Col>

          {/* Leads Allotment Card - Only show if active subscription exists */}
          {subscription && (
            <Col xs={24} md={12} lg={8} xl={7}>
              <Card className="rounded-3xl border-gray-200/60 shadow-sm h-full hover:shadow-md transition-all group">
                <div className="flex flex-col h-full">
                  <Text className="text-gray-400 font-semibold uppercase tracking-widest text-[10px] mb-6 block">Leads Allotment</Text>

                  <div className="flex items-center justify-between mt-auto">
                    {/* Left side: Stats */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className={leadsLimit !== -1 && leadsUsed > leadsLimit ? "text-4xl font-black text-red-500" : "text-4xl font-black text-gray-900"}>
                          {leadsUsed}
                        </span>
                        <span className="text-gray-400 text-xl font-bold">/ {leadsLimit === -1 ? "∞" : leadsLimit}</span>
                      </div>
                      <Text className="text-gray-800 text-sm font-bold block mb-3">Leads Processed</Text>
                      
                      <Tag color={leadsLimit === -1 ? "blue" : (leadsUsed > leadsLimit ? "red" : "blue")} className="rounded-md px-2 py-0.5 font-black border-none uppercase text-[9px] w-fit">
                        {leadsLimit === -1 ? "UNLIMITED" : (leadsUsed > leadsLimit ? "OVER LIMIT" : `${leadsPercent}% UTILIZATION`)}
                      </Tag>
                    </div>

                    {/* Right side: Circular Progress */}
                    <div className="shrink-0 scale-110">
                      <Progress
                        type="dashboard"
                        percent={leadsLimit === -1 ? 100 : Math.round(Math.min(100, (leadsUsed / (leadsLimit || 1)) * 100))}
                        gapDegree={60}
                        strokeWidth={12}
                        size={120}
                        strokeColor={{
                          '0%': '#A5B4FC',
                          '100%': '#6366F1',
                        }}
                        trailColor="#F1F5F9"
                        format={(percent) => (
                          <span className={`${leadsLimit !== -1 && leadsUsed > leadsLimit ? "text-red-500" : "text-indigo-600"} text-lg font-black`}>
                            {Math.round(percent)}%
                          </span>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          )}
        </Row>

        <div className="flex justify-between items-center mb-6">
            <Title level={4} className="m-0! text-gray-800">Billing History</Title>
        </div>

        <Card className="rounded-3xl border-gray-100 shadow-xl shadow-slate-200/20 overflow-hidden" styles={{ body: { padding: 0 } }}>
          <Table
            dataSource={history}
            columns={columns}
            loading={{
              spinning: loading,
              indicator: <Loader variant="inline" />
            }}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              className: "px-6 py-4",
            }}
            scroll={{ x: true }}
            className="billing-table"
            locale={{
              emptyText: <Empty description="No transactions found" className="py-20" />
            }}
          />
        </Card>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)} className="bg-blue-600 rounded-lg">
            Got it
          </Button>
        ]}
        centered
        width={500}
        styles={{ 
          body: { padding: '24px 32px' },
          mask: { backdropFilter: 'blur(4px)' }
        }}
        className="plan-details-modal"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} fill="currentColor" />
          </div>
          <Title level={3} className="m-0! font-bold text-gray-900">{planName} Details</Title>
          <Text className="text-gray-400 font-medium">Full benefits and limitations included in your plan</Text>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-1 text-center">Price</Text>
            <Text className="text-gray-900 font-bold text-lg block text-center">₹{planPrice.toLocaleString('en-IN')}</Text>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-1 text-center">Duration</Text>
            <Text className="text-gray-900 font-bold text-lg block text-center">
              {subscription?.plan?.duration ? `${subscription.plan.duration} Days` : "Lifetime"}
            </Text>
          </div>
        </div>

        <Divider className="my-6 border-gray-100">Plan Benefits</Divider>

        <List
          dataSource={subscription?.plan?.features || [
            `Post up to ${propertyLimit === -1 ? "unlimited" : propertyLimit} properties`,
            "Property visibility management",
            "Dashboard access for enquiries",
            "Billing and invoice history",
            "Seller support access"
          ]}
          renderItem={(item) => (
            <List.Item className="border-none py-2 px-0">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
                <Text className="text-gray-600 font-medium">{item}</Text>
              </div>
            </List.Item>
          )}
        />
      </Modal>

      <style>{`
        .billing-table :global(.ant-table-thead > tr > th) {
          background: #F8FAFC;
          color: #94A3B8;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #F1F5F9;
          padding: 16px 24px;
        }
        .billing-table :global(.ant-table-tbody > tr > td) {
          padding: 20px 24px;
          border-bottom: 1px solid #F8FAFC;
        }
        .billing-table :global(.ant-table-tbody > tr:hover > td) {
          background: #FBFDFF !important;
        }
      `}</style>
    </div>
  );
};

export default SellerPaymentHistory;
