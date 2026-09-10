import { useState, useEffect, useCallback } from "react";
import { Select, DatePicker, Card, Tag, Button, Modal, Input, message, Spin, Empty, Pagination } from "antd";
import { MapPin, IndianRupee, Home, Phone, Mail, StickyNote } from "lucide-react";
import api from "@/services/api";
import moment from "moment";
import { useSearchParams } from "react-router-dom";

const { RangePicker } = DatePicker;

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
  const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${n?.toLocaleString("en-IN")}`);
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "Budget N/A";
};

const MyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [searchParams] = useSearchParams();
  const [projectFilter, setProjectFilter] = useState(searchParams.get("projectId") || null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const [notesModalLead, setNotesModalLead] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    api
      .get("/properties/my-listings?limit=100")
      .then((res) => setProjects(res.data?.properties || []))
      .catch((err) => console.error("Failed to load projects:", err));
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (projectFilter) params.projectId = projectFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.dateFrom = dateRange[0].startOf("day").toISOString();
      if (dateRange?.[1]) params.dateTo = dateRange[1].endOf("day").toISOString();

      const res = await api.get("/leads/my-leads", { params });
      setLeads(res.data?.leads || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error("Failed to load leads:", error);
      message.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, projectFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (lead, newStatus) => {
    setUpdatingId(lead._id);
    const previousStatus = lead.promoterStatus;
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, promoterStatus: newStatus } : l)));
    try {
      await api.put(`/leads/${lead._id}/status`, { promoterStatus: newStatus });
      message.success("Status updated");
    } catch (error) {
      // Revert on failure (e.g. an invalid transition, rejected by the backend)
      setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, promoterStatus: previousStatus } : l)));
      message.error(error.response?.data?.message || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openNotesModal = (lead) => {
    setNotesModalLead(lead);
    setNotesDraft(lead.promoterNotes || "");
  };

  const handleSaveNotes = async () => {
    if (!notesModalLead) return;
    setSavingNotes(true);
    try {
      await api.put(`/leads/${notesModalLead._id}/status`, {
        promoterStatus: notesModalLead.promoterStatus, // same status — notes-only update
        promoterNotes: notesDraft,
      });
      setLeads((prev) =>
        prev.map((l) => (l._id === notesModalLead._id ? { ...l, promoterNotes: notesDraft } : l)),
      );
      message.success("Notes saved");
      setNotesModalLead(null);
    } catch (error) {
      message.error(error.response?.data?.message || "Could not save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-gray-800 mb-1">My Leads</h1>
      <p className="text-gray-500 text-sm mb-6">Leads delivered to your campaigns, across all projects.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          allowClear
          placeholder="All Projects"
          className="min-w-[200px]"
          value={projectFilter}
          onChange={(v) => {
            setProjectFilter(v || null);
            setPage(1);
          }}
          options={projects.map((p) => ({ value: p._id, label: p.basicInfo?.title }))}
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Empty description="No leads found" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {leads.map((lead) => (
              <Card key={lead._id} className="rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{lead.fullName}</h3>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {lead.deliveredAt ? moment(lead.deliveredAt).calendar() : "—"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {lead.matchedProject?.locality || lead.preferredLocation || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee size={13} /> {formatBudget(lead.minBudget, lead.maxBudget)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home size={13} /> {lead.propertyType}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {lead.phoneNumber}
                  </span>
                  {lead.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={13} /> {lead.email}
                    </span>
                  )}
                </div>

                {lead.message && (
                  <p className="text-sm text-gray-500 italic mb-3">&ldquo;{lead.message}&rdquo;</p>
                )}

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <Select
                    size="small"
                    value={lead.promoterStatus}
                    loading={updatingId === lead._id}
                    onChange={(v) => handleStatusChange(lead, v)}
                    options={STATUS_OPTIONS}
                    className="min-w-[160px]"
                  />
                  <Tag color={STATUS_COLOR[lead.promoterStatus]}>
                    {STATUS_OPTIONS.find((o) => o.value === lead.promoterStatus)?.label || lead.promoterStatus}
                  </Tag>
                  <Button size="small" icon={<StickyNote size={14} />} onClick={() => openNotesModal(lead)}>
                    Add Notes
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}

      <Modal
        title={`Notes — ${notesModalLead?.fullName || ""}`}
        open={!!notesModalLead}
        onCancel={() => setNotesModalLead(null)}
        onOk={handleSaveNotes}
        confirmLoading={savingNotes}
        okText="Save"
      >
        <Input.TextArea
          rows={4}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="Called, interested in 30x40 plot..."
        />
      </Modal>
    </div>
  );
};

export default MyLeads;
