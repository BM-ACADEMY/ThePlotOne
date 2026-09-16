import { useState, useEffect, useCallback } from "react";
import { Card, Tag, Table, Button, Tooltip, Modal, InputNumber, Input, message, Spin, Descriptions, Progress } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, IndianRupee } from "lucide-react";
import api from "@/services/api";
import moment from "moment";

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

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [csvBatches, setCsvBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extraDays, setExtraDays] = useState(7);
  const [extendReason, setExtendReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/campaigns/${id}`);
      setCampaign(res.data?.campaign || null);
      setCsvBatches(res.data?.csvImportBatches || []);
    } catch (error) {
      console.error("Failed to load campaign detail:", error);
      message.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (actionFn, successMessage) => {
    setActionLoading(true);
    try {
      await actionFn();
      message.success(successMessage);
      await load();
    } catch (error) {
      message.error(error.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = () => {
    Modal.confirm({
      title: "Pause Campaign?",
      content: "This will pause lead delivery. The promoter will be notified.",
      okText: "Pause",
      onOk: () =>
        runAction(() => api.put(`/admin/campaigns/${id}/pause`), "Campaign paused"),
    });
  };

  const handleExtend = async () => {
    await runAction(
      () => api.put(`/admin/campaigns/${id}/extend`, { extraDays, reason: extendReason || undefined }),
      `Campaign extended by ${extraDays} days`,
    );
    setExtendModalOpen(false);
    setExtendReason("");
  };

  const handleComplete = () => {
    Modal.confirm({
      title: "Mark Campaign Complete?",
      content: "This ends lead delivery for this project. The promoter will be notified.",
      okText: "Mark Complete",
      okButtonProps: { danger: true },
      onOk: () =>
        runAction(() => api.put(`/admin/campaigns/${id}/complete`), "Campaign marked complete"),
    });
  };

  const canPause = campaign?.status === "active";
  const canExtend = ["active", "paused"].includes(campaign?.status);
  const canComplete = ["active", "paused"].includes(campaign?.status);

  const batchColumns = [
    { title: "Batch", dataIndex: "batchNumber", key: "batchNumber", render: (v) => `#${v}` },
    { title: "File", dataIndex: "fileName", key: "fileName", render: (v) => v || "—" },
    { title: "Imported", dataIndex: "imported", key: "imported" },
    { title: "Duplicates", dataIndex: "duplicates", key: "duplicates" },
    { title: "Failed", dataIndex: "failed", key: "failed" },
    { title: "By", dataIndex: "uploadedByName", key: "uploadedByName" },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => moment(v).format("DD MMM YYYY"),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center text-gray-500">Campaign not found.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Button
        type="text"
        icon={<ArrowLeft size={16} />}
        onClick={() => navigate("/admin/campaigns")}
        className="mb-4"
      >
        Back to Campaigns
      </Button>

      <Card title="Campaign Info" className="rounded-xl mb-6">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Promoter">
            {campaign.promoterName}
            {campaign.promoterPhone && (
              <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                <Phone size={12} /> {campaign.promoterPhone}
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Project">
            {campaign.projectTitle}
            {campaign.projectLocation && (
              <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                <MapPin size={12} /> {campaign.projectLocation}
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Plan">
            {campaign.planName}
            {campaign.planPrice !== null && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-gray-500">
                (<IndianRupee size={12} />{Number(campaign.planPrice).toLocaleString("en-IN")})
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLOR[campaign.status] || "default"}>
              {STATUS_LABEL[campaign.status] || campaign.status}
            </Tag>
          </Descriptions.Item>
          {campaign.discountLabel && (
            <Descriptions.Item label="Discount">{campaign.discountLabel}</Descriptions.Item>
          )}
          <Descriptions.Item label="GoLive">
            {campaign.goLiveAt ? moment(campaign.goLiveAt).format("DD MMM YYYY") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Expires">
            {campaign.expiresAt ? moment(campaign.expiresAt).format("DD MMM YYYY") : "—"}
            {campaign.daysRemaining !== null && campaign.daysRemaining !== undefined && (
              <span className="text-gray-500"> ({campaign.daysRemaining} days remaining)</span>
            )}
          </Descriptions.Item>
          {campaign.activatedByName && (
            <Descriptions.Item label="Activated by">{campaign.activatedByName}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Delivery Progress" className="rounded-xl mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700 m-0">
              Leads Delivered — {campaign.deliveredCount} / {campaign.committedMinimum}
            </p>
          </div>
          <Progress
            percent={
              campaign.committedMinimum > 0
                ? Math.min(Math.round((campaign.deliveredCount / campaign.committedMinimum) * 100), 100)
                : 0
            }
            status={campaign.deliveredCount >= campaign.committedMinimum ? "success" : "active"}
          />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-gray-600">Tier 1 (General): <b>{campaign.tier1Count}</b></span>
          <span className="text-gray-600">Tier 2 (Ready): <b>{campaign.tier2Count}</b></span>
          <span className="text-gray-600">Pace Status: <b>{PACE_LABEL[campaign.paceStatus] || "—"}</b></span>
        </div>
      </Card>

      <Card title="CSV Import History" className="rounded-xl mb-6">
        <Table
          dataSource={csvBatches}
          columns={batchColumns}
          rowKey="_id"
          pagination={false}
          locale={{ emptyText: "No CSV imports yet" }}
          size="small"
        />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Tooltip title={campaign.status !== "active" ? "Campaign must be active to import leads" : ""}>
          <Button
            disabled={campaign.status !== "active"}
            onClick={() => navigate(`/admin/campaigns/${id}/import-leads`)}
          >
            Upload Leads CSV
          </Button>
        </Tooltip>

        <Button disabled={!canPause} loading={actionLoading} onClick={handlePause}>
          Pause Campaign
        </Button>
        <Button disabled={!canExtend} loading={actionLoading} onClick={() => setExtendModalOpen(true)}>
          Extend Campaign
        </Button>
        <Button danger disabled={!canComplete} loading={actionLoading} onClick={handleComplete}>
          Mark Complete
        </Button>
      </div>

      <Modal
        title="Extend Campaign Duration"
        open={extendModalOpen}
        onCancel={() => setExtendModalOpen(false)}
        onOk={handleExtend}
        confirmLoading={actionLoading}
        okText="Confirm Extension"
      >
        <p className="text-sm text-gray-600 mb-2">
          Current expiry: {campaign.expiresAt ? moment(campaign.expiresAt).format("DD MMM YYYY") : "—"}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">Extend by</span>
          <InputNumber min={1} value={extraDays} onChange={(v) => setExtraDays(v || 1)} />
          <span className="text-sm text-gray-600">days</span>
        </div>
        {campaign.expiresAt && (
          <p className="text-sm text-gray-500 mb-3">
            New expiry:{" "}
            {moment(campaign.expiresAt).add(extraDays, "days").format("DD MMM YYYY")}
          </p>
        )}
        <div>
          <p className="text-sm text-gray-600 mb-1">Reason (optional)</p>
          <Input
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
            placeholder="e.g. Promoter requested more time"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CampaignDetail;
