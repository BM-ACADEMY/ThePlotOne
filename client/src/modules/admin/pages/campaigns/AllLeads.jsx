import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Select, DatePicker, Tag, Button, Modal, message, Descriptions } from "antd";
import { Megaphone } from "lucide-react";
import moment from "moment";
import api from "@/services/api";

const { RangePicker } = DatePicker;

// Matches the promoterStatus enum used across MyLeads.jsx (promoter side)
// and CampaignDetail.jsx — kept in sync there, not derived from a shared
// constants file since none exists yet in this codebase.
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "site_visit_scheduled", label: "Site Visit Scheduled" },
  { value: "visited", label: "Visited" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "closed_won", label: "Closed (Won)" },
  { value: "closed_lost", label: "Closed (Lost)" },
];

const STATUS_COLOR = {
  pending: "default",
  contacted: "blue",
  site_visit_scheduled: "gold",
  visited: "cyan",
  interested: "green",
  not_interested: "orange",
  closed_won: "success",
  closed_lost: "red",
};

const formatBudget = (min, max) => {
  const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${Number(n).toLocaleString("en-IN")}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "—";
};

const formatPhone = (phone) => (phone && phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone || "—");
const formatPhoneIntl = (phone) => (phone && phone.length === 10 ? `+91 ${formatPhone(phone)}` : phone || "—");

// Requirement.source enum: meta_ad/reel/website/walkin/call.
const SOURCE_LABEL = {
  meta_ad: "Meta Ad",
  reel: "Reel",
  website: "Website",
  walkin: "Walk-in",
  call: "Call",
};

const TIER_LABEL = { tier1: "Tier 1", tier2: "Tier 2" };

const AllLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetched once, unfiltered — stable filter-dropdown options that don't
  // shrink as the lead list itself gets filtered (unlike deriving options
  // from the currently-filtered rows).
  const [allCampaigns, setAllCampaigns] = useState([]);

  const [campaignFilter, setCampaignFilter] = useState(null);
  const [projectFilter, setProjectFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const [detailLead, setDetailLead] = useState(null);

  useEffect(() => {
    api
      .get("/admin/campaigns")
      .then((res) => setAllCampaigns(res.data?.campaigns || []))
      .catch((err) => console.error("Failed to load campaigns for filters:", err));
  }, []);

  const campaignOptions = useMemo(
    () =>
      allCampaigns.map((c) => ({
        value: c._id,
        label: `${c.promoterName} — ${c.projectTitle} (${c.planName})`,
      })),
    [allCampaigns],
  );

  const projectOptions = useMemo(() => {
    const seen = new Map();
    allCampaigns.forEach((c) => {
      if (c.projectId && !seen.has(c.projectId)) seen.set(c.projectId, c.projectTitle);
    });
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [allCampaigns]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (campaignFilter) params.campaignId = campaignFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (statusFilter) params.promoterStatus = statusFilter;
      if (dateRange?.[0]) params.dateFrom = dateRange[0].startOf("day").toISOString();
      if (dateRange?.[1]) params.dateTo = dateRange[1].endOf("day").toISOString();

      const res = await api.get("/admin/leads", { params });
      setLeads(res.data?.leads || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error("Failed to load leads:", error);
      message.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, campaignFilter, projectFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const columns = [
    { title: "Name", dataIndex: "fullName", key: "fullName" },
    { title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber", render: formatPhone },
    { title: "Project", dataIndex: "projectTitle", key: "projectTitle" },
    {
      title: "Status",
      dataIndex: "promoterStatus",
      key: "promoterStatus",
      render: (status) => (
        <Tag color={STATUS_COLOR[status] || "default"}>
          {STATUS_OPTIONS.find((o) => o.value === status)?.label || status}
        </Tag>
      ),
    },
    {
      title: "Delivered",
      dataIndex: "deliveredAt",
      key: "deliveredAt",
      render: (v) => (v ? moment(v).format("DD MMM YYYY") : "—"),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-1">
        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
          <Megaphone size={22} />
        </div>
        All Campaign Leads
      </h1>
      <p className="text-gray-500 text-sm font-medium mb-6">
        Every lead delivered across every promoter's campaigns — full contact details.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          allowClear
          placeholder="All Campaigns"
          className="min-w-[220px]"
          value={campaignFilter}
          onChange={(v) => {
            setCampaignFilter(v || null);
            setPage(1);
          }}
          options={campaignOptions}
        />
        <Select
          allowClear
          placeholder="All Projects"
          className="min-w-[180px]"
          value={projectFilter}
          onChange={(v) => {
            setProjectFilter(v || null);
            setPage(1);
          }}
          options={projectOptions}
        />
        <Select
          allowClear
          placeholder="All Status"
          className="min-w-[180px]"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v || null);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
        <RangePicker
          value={dateRange}
          onChange={(v) => {
            setDateRange(v);
            setPage(1);
          }}
        />
      </div>

      <Table
        dataSource={leads}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        className="rounded-xl overflow-hidden"
        onRow={(row) => ({
          onClick: () => setDetailLead(row),
          className: "cursor-pointer",
        })}
      />

      <Modal
        title="Lead Detail"
        open={!!detailLead}
        onCancel={() => setDetailLead(null)}
        footer={<Button onClick={() => setDetailLead(null)}>Close</Button>}
      >
        {detailLead && (
          <Descriptions column={1} size="small" colon labelStyle={{ width: 130, fontWeight: 600 }}>
            <Descriptions.Item label="Name">{detailLead.fullName}</Descriptions.Item>
            <Descriptions.Item label="Phone">{formatPhoneIntl(detailLead.phoneNumber)}</Descriptions.Item>
            <Descriptions.Item label="Email">{detailLead.email || "—"}</Descriptions.Item>
            <Descriptions.Item label="Area">{detailLead.preferredLocation || "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Budget">
              {formatBudget(detailLead.minBudget, detailLead.maxBudget)}
            </Descriptions.Item>
            <Descriptions.Item label="Property Type">{detailLead.propertyType || "—"}</Descriptions.Item>
            <Descriptions.Item label="Usage">{detailLead.usageType || "—"}</Descriptions.Item>
            <Descriptions.Item label="Message">
              {detailLead.message ? <>&ldquo;{detailLead.message}&rdquo;</> : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Source">{SOURCE_LABEL[detailLead.source] || detailLead.source || "—"}</Descriptions.Item>
            <Descriptions.Item label="Tier">{TIER_LABEL[detailLead.tier] || detailLead.tier || "—"}</Descriptions.Item>
            <Descriptions.Item label="Matched To">
              {detailLead.projectTitle}
              {detailLead.promoterName && <> ({detailLead.promoterName})</>}
            </Descriptions.Item>
            <Descriptions.Item label="Campaign">
              {detailLead.planName ? `${detailLead.planName} Plan` : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Delivered">
              {detailLead.deliveredAt ? moment(detailLead.deliveredAt).format("DD MMM YYYY, h:mm A") : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Batch">
              {detailLead.batchNumber ? `Import #${detailLead.batchNumber}` : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Promoter Status">
              <Tag color={STATUS_COLOR[detailLead.promoterStatus] || "default"}>
                {STATUS_OPTIONS.find((o) => o.value === detailLead.promoterStatus)?.label || detailLead.promoterStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Promoter Notes">
              {detailLead.promoterNotes ? <>&ldquo;{detailLead.promoterNotes}&rdquo;</> : "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AllLeads;
