import { useState, useEffect } from "react";
import { Card, Table, Tag, Button, message, Spin, Empty } from "antd";
import { IndianRupee, FileDown, Building } from "lucide-react";
import api from "@/services/api";
import moment from "moment";

const CAMPAIGN_STATUS_LABEL = {
  draft: "Draft",
  payment_received: "Payment Received",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  expired: "Expired",
};

const CAMPAIGN_STATUS_COLOR = {
  draft: "default",
  payment_received: "gold",
  active: "green",
  paused: "orange",
  completed: "blue",
  expired: "red",
};

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [activePlans, setActivePlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/campaigns/my-billing");
        setActivePlans(res.data?.activePlans || []);
        setPaymentHistory(res.data?.paymentHistory || []);
      } catch (error) {
        console.error("Failed to load billing data:", error);
        message.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadInvoice = () => {
    // No invoice/PDF generation exists yet anywhere in the codebase.
    message.info("Invoice downloads aren't available yet.");
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("DD MMM YY"),
    },
    {
      title: "Project",
      dataIndex: "projectTitle",
      key: "projectTitle",
    },
    {
      title: "Plan",
      dataIndex: "planName",
      key: "planName",
    },
    {
      title: "Amount",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (amount) => (
        <span className="font-semibold text-gray-900 flex items-center gap-0.5">
          <IndianRupee size={14} />
          {Number(amount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Billing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Your active campaign plans and payment history, per project.
      </p>

      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Active Plans
      </h2>
      {activePlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 mb-10">
          <Building size={40} className="mx-auto mb-2 text-gray-200" />
          <p className="text-gray-500">No active campaign plans yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {activePlans.map((plan) => (
            <Card key={plan.subscriptionId} className="rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-1">{plan.projectTitle}</h3>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-700">
                  {plan.planName} Plan — ₹{Number(plan.amountPaid || 0).toLocaleString("en-IN")}
                </span>
                <Tag color={CAMPAIGN_STATUS_COLOR[plan.campaignStatus] || "default"}>
                  {CAMPAIGN_STATUS_LABEL[plan.campaignStatus] || plan.campaignStatus}
                </Tag>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Leads: {plan.deliveredLeads} / {plan.committedLeads}
              </p>
              <Button
                size="small"
                icon={<FileDown size={14} />}
                onClick={handleDownloadInvoice}
                className="rounded-lg"
              >
                Download Invoice
              </Button>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Payment History
      </h2>
      <Card className="rounded-xl" styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={paymentHistory}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No campaign payments yet" className="py-10" /> }}
        />
      </Card>
    </div>
  );
};

export default Billing;
