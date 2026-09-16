import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Select, DatePicker, Button, message, Tag } from "antd";
import { History, Download } from "lucide-react";
import moment from "moment";
import api from "@/services/api";

const { RangePicker } = DatePicker;

// Every action string actually written via writeAudit() across the codebase
// (campaignController.js, csvImportController.js, leadController.js,
// subscriptionController.js, cronJobs.js) — kept in sync there manually,
// same convention as the promoterStatus/pace option lists elsewhere.
const ACTION_OPTIONS = [
  "CAMPAIGN_CREATED",
  "CAMPAIGN_ACTIVATED",
  "CAMPAIGN_PAUSED",
  "CAMPAIGN_EXTENDED",
  "CAMPAIGN_COMPLETED",
  "CAMPAIGN_EXPIRED",
  "LEADS_IMPORTED",
  "LEAD_LIMIT_REACHED",
  "LEAD_STATUS_UPDATED",
  "PAYMENT_RECEIVED",
].map((v) => ({ value: v, label: v }));

// Requirement is the real model name for a Lead, and CsvImportBatch for a
// CSV import — surfaced here under the names the rest of the admin UI
// already uses for them (AllLeads.jsx, ImportLeads.jsx), not the internal
// Mongoose model name.
const ENTITY_LABEL = { Campaign: "Campaign", Requirement: "Lead", CsvImportBatch: "CSV Import" };
const ENTITY_OPTIONS = Object.entries(ENTITY_LABEL).map(([value, label]) => ({ value, label }));

const ACTOR_ROLE_COLOR = { admin: "blue", promoter: "green", system: "default" };

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Fetched once, unfiltered — stable "Actor" filter options that don't
  // shrink as the log itself gets filtered (same pattern as AllLeads.jsx's
  // campaign/project filter options).
  const [allActors, setAllActors] = useState([]);

  const [entityFilter, setEntityFilter] = useState(null);
  const [actorFilter, setActorFilter] = useState(null);
  const [actionFilter, setActionFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    api
      .get("/admin/audit-log", { params: { limit: 200 } })
      .then((res) => {
        const seen = new Map();
        (res.data?.logs || []).forEach((l) => {
          if (l.actorId && !seen.has(l.actorId)) seen.set(l.actorId, l.actorName);
        });
        setAllActors([...seen.entries()].map(([value, label]) => ({ value, label })));
      })
      .catch((err) => console.error("Failed to load actors for filter:", err));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (entityFilter) params.entity = entityFilter;
      if (actorFilter) params.actorId = actorFilter;
      if (actionFilter) params.action = actionFilter;
      if (dateRange?.[0]) params.dateFrom = dateRange[0].startOf("day").toISOString();
      if (dateRange?.[1]) params.dateTo = dateRange[1].endOf("day").toISOString();

      const res = await api.get("/admin/audit-log", { params });
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error("Failed to load audit log:", error);
      message.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, entityFilter, actorFilter, actionFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportParams = useMemo(() => {
    const params = {};
    if (entityFilter) params.entity = entityFilter;
    if (actorFilter) params.actorId = actorFilter;
    if (actionFilter) params.action = actionFilter;
    if (dateRange?.[0]) params.dateFrom = dateRange[0].startOf("day").toISOString();
    if (dateRange?.[1]) params.dateTo = dateRange[1].endOf("day").toISOString();
    return params;
  }, [entityFilter, actorFilter, actionFilter, dateRange]);

  const handleExport = async () => {
    try {
      const res = await api.get("/admin/audit-log/export", { params: exportParams, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${moment().format("YYYY-MM-DD")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export audit log:", error);
      message.error("Failed to export audit log");
    }
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (v) => moment(v).format("DD MMM h:mm A"),
    },
    {
      title: "Actor",
      key: "actor",
      render: (_, row) => (
        <span className="inline-flex items-center gap-2">
          {row.actorName}
          {row.actorRole && (
            <Tag color={ACTOR_ROLE_COLOR[row.actorRole] || "default"} className="capitalize">
              {row.actorRole}
            </Tag>
          )}
        </span>
      ),
    },
    { title: "Event", dataIndex: "action", key: "action", render: (v) => <code className="text-xs">{v}</code> },
    {
      title: "Entity",
      dataIndex: "entity",
      key: "entity",
      render: (v) => ENTITY_LABEL[v] || v,
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-1">
        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
          <History size={22} />
        </div>
        Audit Log
      </h1>
      <p className="text-gray-500 text-sm font-medium mb-6">
        Every campaign/lead/payment action across the platform. Click a row to see the before/after state.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          allowClear
          placeholder="All Events"
          className="min-w-[200px]"
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v || null);
            setPage(1);
          }}
          options={ACTION_OPTIONS}
        />
        <Select
          allowClear
          placeholder="All Actors"
          className="min-w-[180px]"
          value={actorFilter}
          onChange={(v) => {
            setActorFilter(v || null);
            setPage(1);
          }}
          options={allActors}
        />
        <Select
          allowClear
          placeholder="All Entities"
          className="min-w-[160px]"
          value={entityFilter}
          onChange={(v) => {
            setEntityFilter(v || null);
            setPage(1);
          }}
          options={ENTITY_OPTIONS}
        />
        <RangePicker
          value={dateRange}
          onChange={(v) => {
            setDateRange(v);
            setPage(1);
          }}
        />
        <Button icon={<Download size={14} />} onClick={handleExport} className="ml-auto">
          Export CSV
        </Button>
      </div>

      <Table
        dataSource={logs}
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
          onClick: () =>
            setExpandedRowKeys((prev) =>
              prev.includes(row._id) ? prev.filter((k) => k !== row._id) : [...prev, row._id],
            ),
          className: "cursor-pointer",
        })}
        expandable={{
          expandedRowKeys,
          expandIconColumnIndex: -1, // no dedicated expand-icon column — the whole row is the trigger
          expandedRowRender: (row) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Before</p>
                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto m-0">
                  {row.before ? JSON.stringify(row.before, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">After</p>
                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto m-0">
                  {row.after ? JSON.stringify(row.after, null, 2) : "—"}
                </pre>
              </div>
              {row.reason && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-gray-600 m-0">{row.reason}</p>
                </div>
              )}
            </div>
          ),
        }}
      />
    </div>
  );
};

export default AuditLog;
