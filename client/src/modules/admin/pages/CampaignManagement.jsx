import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Select, Tag, Card, Button, Modal, message } from "antd";
import { Megaphone, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import api from "@/services/api";

// Task 3.2 status badges: Active green, Pending (payment_received) amber,
// Paused grey, Completed blue, Expired red.
const STATUS_COLOR = {
  draft: "default",
  payment_received: "gold",
  active: "green",
  paused: "default",
  completed: "blue",
  expired: "red",
};

const STATUS_LABEL = {
  draft: "Draft",
  payment_received: "Pending",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  expired: "Expired",
};

const PACE_LABEL = {
  on_track: "On Track",
  behind: "Behind",
  ahead: "Ahead",
  completed: "Completed",
};

const CampaignManagement = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [promoterFilter, setPromoterFilter] = useState(null);
  const [planFilter, setPlanFilter] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (promoterFilter) params.promoterId = promoterFilter;
      if (planFilter) params.planId = planFilter;

      const res = await api.get("/admin/campaigns", { params });
      setCampaigns(res.data?.campaigns || []);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      message.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, promoterFilter, planFilter]);

  const fetchPendingCampaigns = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.get("/admin/campaigns/pending");
      setPendingCampaigns(res.data?.campaigns || []);
    } catch (error) {
      console.error("Failed to load pending campaigns:", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchPendingCampaigns();
  }, [fetchPendingCampaigns]);

  const handleActivate = (campaign) => {
    Modal.confirm({
      title: "Are you sure you want to activate this campaign?",
      content: (
        <div>
          <p className="m-0">Project: {campaign.projectTitle}</p>
          <p className="m-0">
            Plan: {campaign.planName} — {campaign.committedMinimum} leads committed
          </p>
          <p className="mt-2 mb-0">This will notify the promoter immediately.</p>
        </div>
      ),
      okText: "Activate",
      onOk: async () => {
        setActivatingId(campaign._id);
        try {
          await api.put(`/admin/campaigns/${campaign._id}/activate`);
          message.success("Campaign activated");
          await Promise.all([fetchPendingCampaigns(), fetchCampaigns()]);
        } catch (error) {
          message.error(error.response?.data?.message || "Failed to activate campaign");
        } finally {
          setActivatingId(null);
        }
      },
    });
  };

  // Filter dropdown options derived from the loaded campaigns themselves —
  // no separate "list all promoters/plans" endpoint needed for this page.
  const promoterOptions = useMemo(() => {
    const seen = new Map();
    campaigns.forEach((c) => {
      if (c.promoterId && !seen.has(c.promoterId)) seen.set(c.promoterId, c.promoterName);
    });
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [campaigns]);

  const planOptions = useMemo(() => {
    const seen = new Map();
    campaigns.forEach((c) => {
      if (c.planId && !seen.has(c.planId)) seen.set(c.planId, c.planName);
    });
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [campaigns]);

  const columns = [
    { title: "Promoter", dataIndex: "promoterName", key: "promoterName" },
    { title: "Project", dataIndex: "projectTitle", key: "projectTitle" },
    { title: "Plan", dataIndex: "planName", key: "planName" },
    {
      title: "Leads",
      key: "leads",
      render: (_, row) => `${row.deliveredCount} / ${row.committedMinimum}`,
    },
    {
      title: "Pace",
      key: "pace",
      render: (_, row) => {
        // Not yet delivering — pace isn't meaningful yet.
        if (row.status === "draft" || row.status === "payment_received") return "—";
        // Hit/exceeded the committed count takes priority over the underlying
        // paceStatus — mirrors the Dashboard's "Campaigns at Limit" stat.
        if (row.committedMinimum > 0 && row.deliveredCount >= row.committedMinimum) return "Limit";
        return PACE_LABEL[row.paceStatus] || "—";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={STATUS_COLOR[status] || "default"}>
          {STATUS_LABEL[status] || status}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-1">
        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
          <Megaphone size={22} />
        </div>
        Campaigns Overview
      </h1>
      <p className="text-gray-500 text-sm font-medium mb-6">
        All promoter campaigns across the platform.
      </p>

      {!pendingLoading && pendingCampaigns.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Pending Activation ({pendingCampaigns.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingCampaigns.map((c) => (
              <Card key={c._id} className="rounded-xl border-amber-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 m-0">
                    {c.promoterName}
                  </p>
                  {c.paidAt && (
                    <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                      Paid: {moment(c.paidAt).format("DD MMM YYYY")}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 mt-1">
                  <p className="text-sm text-gray-700 m-0">{c.projectTitle}</p>
                  <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">Plan: {c.planName}</span>
                </div>
                <div className="flex items-start justify-between gap-2 mt-1 mb-3">
                  <p className="text-sm text-gray-500 m-0 flex items-center gap-0.5">
                    {c.amountPaid !== null ? (
                      <>
                        <IndianRupee size={13} />
                        {c.amountPaid.toLocaleString("en-IN")} received via Razorpay
                      </>
                    ) : (
                      "Payment record not found"
                    )}
                  </p>
                  <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
                    {c.committedMinimum} leads committed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="small" onClick={() => navigate(`/admin/campaigns/${c._id}`)}>
                    View Campaign Details
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    loading={activatingId === c._id}
                    onClick={() => handleActivate(c)}
                  >
                    Activate Campaign
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          allowClear
          placeholder="All Status"
          className="min-w-[160px]"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v || null)}
          options={[
            { value: "draft", label: "Draft" },
            { value: "payment_received", label: "Payment Received" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
            { value: "expired", label: "Expired" },
          ]}
        />
        <Select
          allowClear
          placeholder="Promoter"
          className="min-w-[180px]"
          value={promoterFilter}
          onChange={(v) => setPromoterFilter(v || null)}
          options={promoterOptions}
        />
        <Select
          allowClear
          placeholder="Plan"
          className="min-w-[160px]"
          value={planFilter}
          onChange={(v) => setPlanFilter(v || null)}
          options={planOptions}
        />
      </div>

      <Table
        dataSource={campaigns}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        className="rounded-xl overflow-hidden"
        onRow={(row) => ({
          onClick: () => navigate(`/admin/campaigns/${row._id}`),
          className: "cursor-pointer",
        })}
      />
    </div>
  );
};

export default CampaignManagement;
