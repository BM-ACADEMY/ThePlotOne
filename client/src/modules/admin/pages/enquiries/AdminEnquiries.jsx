import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Input, Popconfirm, Card, Row, Col, Typography, Tooltip, Space, Select } from "antd";
import { Search, Download, Trash2, MessageSquare, Phone, User, Inbox } from "lucide-react";
import api from "@/services/api";
import moment from "moment";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getImageUrl } from "@/utils/imageUrl";
import Loader from "@/components/Common/Loader";
import { exportEnquiriesExcel } from "@/utils/exportEnquiriesExcel";

const { Title, Text } = Typography;
const { Option } = Select;

const AdminEnquiries = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get("view") === "seller" ? "seller" : "all";
  const [viewMode, setViewMode] = useState(initialView);

  useEffect(() => {
    const currentView = searchParams.get("view") === "seller" ? "seller" : "all";
    if (currentView !== viewMode) {
      setViewMode(currentView);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enquiries/fetch-all?view=${viewMode}`);
      setEnquiries(res.data);
    } catch (error) {
      console.error("Error fetching enquiries", error);
      message.error("Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      const endpoint =
        record.type === "whatsapp_lead"
          ? `/enquiries/whatsapp/delete/${record._id}`
          : `/enquiries/delete/${record._id}`;

      await api.delete(endpoint);
      message.success("Enquiry deleted successfully");
      fetchEnquiries();
    } catch (error) {
      console.error("Error deleting enquiry", error);
      message.error("Failed to delete enquiry");
    }
  };

  const handleStatusChange = async (id, status, type) => {
    try {
      await api.patch(`/enquiries/update-status/${id}`, { status, type });
      message.success(`Status updated to ${status}`);
      fetchEnquiries();
      // Refresh sidebar counts
      window.dispatchEvent(new CustomEvent("refresh-admin-counts"));
    } catch (error) {
      console.error("Error updating status", error);
      message.error("Failed to update status");
    }
  };

  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === "new").length,
    whatsapp: enquiries.filter((e) => e.type === "whatsapp_lead").length,
    responded: enquiries.filter((e) => e.status !== "new").length,
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (date) => (
        <div className="ae-date-cell">
          <span className="ae-date-primary">{moment(date).format("DD MMM YYYY")}</span>
          <span className="ae-date-secondary">{moment(date).format("hh:mm A")}</span>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Property",
      dataIndex: "property_id",
      key: "property",
      width: 240,
      render: (property) =>
        property ? (
          <div
            className="ae-property-cell"
            onClick={() => navigate(`/properties/${property.slug || property._id}`)}
          >
            <img
              src={getImageUrl(
                property.media?.featuredImage ||
                property.media?.images?.[0] ||
                property.images?.[0]?.image_url ||
                property.images?.[0]
              )}
              alt="property"
              className="ae-property-thumb"
            />
            <div className="ae-property-info">
              <span className="ae-property-title">
                {property.basicInfo?.title || property.title || "Untitled Property"}
              </span>
              <span className="ae-property-location">
                {typeof property.location === "string"
                  ? property.location
                  : (property.location?.locality || property.location?.addressLine1 || "Pondicherry")}
              </span>
            </div>
          </div>
        ) : (
          <span className="ae-deleted-badge">Deleted Property</span>
        ),
    },
    {
      title: "Seller",
      dataIndex: "seller_id",
      key: "seller",
      width: 180,
      render: (seller) => (
        <div className="ae-seller-cell">
          <div className="ae-seller-name-row">
            <div className="ae-seller-avatar">
              {(seller?.name || "U").charAt(0).toUpperCase()}
            </div>
            <span className="ae-seller-name">{seller?.name || "Unknown"}</span>
          </div>
          {seller?.assignedAdmin && (
            <div className="ae-seller-managed">
              <span className="ae-managed-label">via</span>
              <span className="ae-managed-name">{seller.assignedAdmin.name || "Manager"}</span>
            </div>
          )}
          <span className="ae-seller-phone">{seller?.phone || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Enquirer",
      key: "enquirer",
      width: 180,
      render: (record) => (
        <div className="ae-enquirer-cell">
          <div className="ae-enquirer-avatar">
            {(record.enquirer_name || "G").charAt(0).toUpperCase()}
          </div>
          <div className="ae-enquirer-info">
            <span className="ae-enquirer-name">{record.enquirer_name || "Guest"}</span>
            <span className="ae-enquirer-phone">{record.enquirer_phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      width: 220,
      render: (msg) => (
        <Tooltip title={msg} placement="topLeft" styles={{ root: { maxWidth: "320px" } }}>
          <div className="ae-message-cell">
            "{msg || "No message provided"}"
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (type) => (
        <Tag
          color={type === "whatsapp_lead" ? "green" : "blue"}
          className="ae-type-tag"
        >
          {type === "whatsapp_lead" ? (
            <Phone size={10} style={{ marginRight: 4 }} />
          ) : (
            <MessageSquare size={10} style={{ marginRight: 4 }} />
          )}
          {type === "whatsapp_lead" ? "WhatsApp" : "Portal"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => (
        <Select
          value={status || "new"}
          onChange={(value) => handleStatusChange(record._id, value, record.type)}
          size="small"
          className={`ae-status-select ae-status-${(status || "new").toLowerCase()}`}
          disabled={viewMode === "seller"}
          style={{ width: 120 }}
        >
          <Option value="new">NEW</Option>
          <Option value="contacted">CONTACTED</Option>
          <Option value="closed">CLOSED</Option>
        </Select>
      ),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      width: 130,
      render: (updatedBy) => (
        <div>
          {updatedBy ? (
            <Tag className="ae-updated-tag">{updatedBy.name}</Tag>
          ) : (
            <span className="ae-no-update">No update yet</span>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record) => (
        <div className="ae-actions-cell">
          {viewMode === "seller" ? (
            <Tag className="ae-view-only-tag">VIEW ONLY</Tag>
          ) : (
            <Popconfirm
              title="Delete Enquiry"
              description="Are you sure you want to delete this enquiry?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={15} />}
                className="ae-delete-btn"
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  // Filter data based on search
  const filteredEnquiries = enquiries.filter(
    (item) =>
      item.property_id?.title
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.seller_id?.name?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleDownloadExcel = () => {
    if (!filteredEnquiries.length) {
      message.warning("No data to export");
      return;
    }
    exportEnquiriesExcel(filteredEnquiries, true);
  };

  return (
    <div className="ae-page">
      {/* Page Header */}
      <div className="ae-page-header">
        <div>
          <div className="ae-header-eyebrow">
            <div className="ae-header-accent-bar" />
            <span className="ae-header-label">Enquiry Management</span>
          </div>
          <Title
            level={2}
            style={{ margin: 0 }}
            className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 text-xl sm:text-2xl md:text-3xl font-bold ae-page-title"
          >
            Property Enquiry Leads
          </Title>
          <Text type="secondary" className="text-xs sm:text-sm ae-page-subtitle">
            Monitor and manage all incoming property inquiries and direct WhatsApp leads platform-wide
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Download size={16} />}
          onClick={handleDownloadExcel}
          className="ae-export-btn"
        >
          Export Leads
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[20, 20]} className="ae-stats-row">
        <Col xs={12} sm={12} lg={6}>
          <Card className="ae-stat-card ae-stat-indigo">
            <div className="ae-stat-icon ae-stat-icon-indigo">
              <Inbox size={22} />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                Total Leads
              </Text>
              <Title level={2} className="text-xl sm:text-2xl! font-black m-0! mt-0.5 sm:mt-1 tracking-tight text-gray-800">
                {loading ? "—" : stats.total}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="ae-stat-card ae-stat-cyan">
            <div className="ae-stat-icon ae-stat-icon-cyan">
              <User size={22} />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                New Leads
              </Text>
              <Title level={2} className="text-xl sm:text-2xl! font-black m-0! mt-0.5 sm:mt-1 tracking-tight text-gray-800">
                {loading ? "—" : stats.new}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="ae-stat-card ae-stat-emerald">
            <div className="ae-stat-icon ae-stat-icon-emerald">
              <Phone size={22} />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                WhatsApp
              </Text>
              <Title level={2} className="text-xl sm:text-2xl! font-black m-0! mt-0.5 sm:mt-1 tracking-tight text-gray-800">
                {loading ? "—" : stats.whatsapp}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="ae-stat-card ae-stat-blue">
            <div className="ae-stat-icon ae-stat-icon-blue">
              <MessageSquare size={22} />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                Responded
              </Text>
              <Title level={2} className="text-xl sm:text-2xl! font-black m-0! mt-0.5 sm:mt-1 tracking-tight text-gray-800">
                {loading ? "—" : stats.responded}
              </Title>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table Card */}
      <Card className="ae-table-card">
        {/* Card Toolbar */}
        <div className="ae-toolbar">
          <div className="ae-toolbar-left">
            <span className="ae-section-title">
              {viewMode === "seller" ? "Seller Property Inquiries" : "Platform Inquiries"}
            </span>
            <Tag className="ae-count-tag">
              {filteredEnquiries.length} leads
            </Tag>
          </div>
          <div className="ae-toolbar-right">
            <Input
              prefix={<Search size={16} className="ae-search-icon" />}
              placeholder="Search by property or seller…"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              className="ae-search-input"
              size="middle"
            />
          </div>
        </div>

        {/* Table */}
        <div className="ae-table-wrap">
          <Table
            columns={columns}
            dataSource={filteredEnquiries}
            rowKey="_id"
            loading={{
              spinning: loading,
              indicator: <Loader variant="panel" />,
            }}
            pagination={{
              pageSize: 8,
              showTotal: (total) => `Total ${total} enquiries`,
              size: "default",
              className: "ae-pagination",
              responsive: true,
            }}
            scroll={{ x: 1200 }}
            className="ae-table"
            rowClassName={() => "ae-table-row"}
          />
        </div>
      </Card>

      <style>{`
        /* ── Page Layout ── */
        .ae-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100%;
        }

        /* ── Page Header ── */
        .ae-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .ae-header-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .ae-header-accent-bar {
          width: 28px;
          height: 3px;
          background: #6366f1;
          border-radius: 99px;
        }
        /* eyebrow: matches Dashboard's text-[9px] sm:text-[10px] font-bold uppercase tracking-widest */
        .ae-header-label {
          font-size: 10px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.1em; /* tracking-widest */
        }
        .ae-page-title {
          /* gradient applied via Tailwind classes — no color override needed */
          margin-bottom: 4px !important;
          line-height: 1.25 !important;
        }
        .ae-page-subtitle {
          /* size + color controlled by Tailwind text-xs sm:text-sm + type=secondary */
        }
        .ae-export-btn {
          background: #6366f1 !important;
          border: none !important;
          border-radius: 10px !important;
          height: 40px !important;
          padding: 0 20px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow: 0 2px 8px rgba(99,102,241,0.25) !important;
          transition: all 0.2s ease !important;
          white-space: nowrap;
        }
        .ae-export-btn:hover {
          background: #4f46e5 !important;
          box-shadow: 0 4px 12px rgba(99,102,241,0.35) !important;
          transform: translateY(-1px);
        }

        /* ── Stats Cards ── */
        .ae-stats-row {
          margin-bottom: 24px !important;
        }
        .ae-stat-card {
          border: none !important;
          border-radius: 14px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
          transition: box-shadow 0.25s ease, transform 0.2s ease !important;
          overflow: hidden;
        }
        .ae-stat-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.09) !important;
          transform: translateY(-2px);
        }
        .ae-stat-card .ant-card-body {
          padding: 18px 20px !important;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ae-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ae-stat-icon-indigo { background: #eef2ff; color: #6366f1; }
        .ae-stat-icon-cyan   { background: #ecfeff; color: #0891b2; }
        .ae-stat-icon-emerald { background: #ecfdf5; color: #059669; }
        .ae-stat-icon-blue   { background: #eff6ff; color: #2563eb; }
        /* stat label/value: driven by Tailwind classes on JSX — no CSS override needed */
        .ae-stat-content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Table Card ── */
        .ae-table-card {
          border: none !important;
          border-radius: 16px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
          overflow: hidden;
        }
        .ae-table-card .ant-card-body {
          padding: 0 !important;
        }

        /* ── Toolbar ── */
        .ae-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 24px;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .ae-toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        /* section title: matches Dashboard card titles — text-sm sm:text-base font-semibold */
        .ae-section-title {
          font-size: 14px;
          font-weight: 600;  /* semibold not bold */
          color: #1e293b;
          white-space: nowrap;
          line-height: 1.4;
        }
        .ae-count-tag {
          background: #eef2ff !important;
          color: #6366f1 !important;
          border: none !important;
          border-radius: 20px !important;
          padding: 2px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
        }
        .ae-toolbar-right {
          display: flex;
          gap: 10px;
          flex: 1;
          justify-content: flex-end;
          min-width: 0;
        }
        .ae-search-input {
          max-width: 260px !important;
          width: 100% !important;
          border-radius: 10px !important;
          border-color: #e2e8f0 !important;
          background: #f8fafc !important;
          font-size: 13px !important;
          transition: all 0.2s ease !important;
        }
        .ae-search-input:hover,
        .ae-search-input:focus,
        .ae-search-input .ant-input-affix-wrapper:hover {
          border-color: #a5b4fc !important;
          background: #fff !important;
        }
        .ae-search-icon { color: #94a3b8; }

        /* ── Table Wrap ── */
        .ae-table-wrap {
          overflow-x: auto;
        }

        /* ── Table Global ── */
        .ae-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          padding: 14px 18px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          white-space: nowrap;
        }
        .ae-table .ant-table-tbody > tr > td {
          padding: 14px 18px !important;
          border-bottom: 1px solid #f8fafc !important;
          vertical-align: middle !important;
        }
        .ae-table-row:hover > td {
          background: #fafbff !important;
        }
        .ae-pagination {
          padding: 16px 24px !important;
          border-top: 1px solid #f1f5f9 !important;
          margin-top: 0 !important;
        }

        /* ── Date Cell ── */
        .ae-date-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        /* date: matches Dashboard table text tokens */
        .ae-date-primary {
          font-size: 13px;   /* sm:text-[13px] */
          font-weight: 600;
          color: #1e293b;    /* text-gray-800 */
          white-space: nowrap;
        }
        .ae-date-secondary {
          font-size: 10px;   /* text-[10px] */
          color: #94a3b8;    /* text-gray-400 */
          white-space: nowrap;
          font-weight: 500;
        }

        /* ── Property Cell ── */
        .ae-property-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .ae-property-cell:hover { opacity: 0.75; }
        .ae-property-thumb {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #f1f5f9;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: box-shadow 0.2s ease;
        }
        .ae-property-cell:hover .ae-property-thumb {
          box-shadow: 0 4px 12px rgba(99,102,241,0.2);
          border-color: #a5b4fc;
        }
        .ae-property-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        /* property title: text-[13px] font-semibold text-gray-800 — Dashboard pattern */
        .ae-property-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
          display: block;
          transition: color 0.2s ease;
        }
        .ae-property-cell:hover .ae-property-title { color: #6366f1; }
        /* location: text-[10px] text-gray-400 — Dashboard secondary text */
        .ae-property-location {
          font-size: 10px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
          display: block;
          font-weight: 500;
        }
        .ae-deleted-badge {
          font-size: 11px;
          color: #94a3b8;
          font-style: italic;
          background: #f8fafc;
          border-radius: 6px;
          padding: 3px 8px;
        }

        /* ── Seller Cell ── */
        .ae-seller-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .ae-seller-name-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .ae-seller-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #eef2ff;
          color: #6366f1;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        /* seller name: font-semibold text-gray-800 text-[13px] */
        .ae-seller-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .ae-seller-managed {
          display: flex;
          align-items: center;
          gap: 4px;
          padding-left: 33px;
        }
        /* managed-by: text-[9px] text-gray-400 — Dashboard secondary micro-text */
        .ae-managed-label {
          font-size: 9px;
          color: #cbd5e1;
          font-weight: 500;
        }
        .ae-managed-name {
          font-size: 9px;
          font-weight: 700;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        /* phone: text-[10px] text-gray-400 — Dashboard sub-text */
        .ae-seller-phone {
          font-size: 10px;
          color: #94a3b8;
          font-family: ui-monospace, monospace;
          padding-left: 33px;
          font-weight: 500;
        }

        /* ── Enquirer Cell ── */
        .ae-enquirer-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ae-enquirer-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ae-enquirer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        /* enquirer name: font-semibold text-gray-800 text-[13px] — Dashboard pattern */
        .ae-enquirer-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          display: block;
        }
        /* phone: text-[10px] — Dashboard secondary micro-text */
        .ae-enquirer-phone {
          font-size: 10px;
          color: #2563eb;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Message Cell ── */
        .ae-message-cell {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 200px;
          line-height: 1.5;
          cursor: default;
        }

        /* ── Type Tag ── */
        .ae-type-tag {
          display: inline-flex !important;
          align-items: center !important;
          border-radius: 20px !important;
          border: none !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 3px 10px !important;
          white-space: nowrap;
        }

        /* ── Status Select ── */
        .ae-status-select .ant-select-selector {
          border-radius: 20px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ae-status-new .ant-select-selector {
          background: #e0f2fe !important;
          color: #0284c7 !important;
          border-color: #bae6fd !important;
        }
        .ae-status-contacted .ant-select-selector {
          background: #dcfce7 !important;
          color: #16a34a !important;
          border-color: #bbf7d0 !important;
        }
        .ae-status-closed .ant-select-selector {
          background: #fef3c7 !important;
          color: #d97706 !important;
          border-color: #fde68a !important;
        }
        .ae-status-select:hover .ant-select-selector {
          filter: brightness(0.96) !important;
        }
        .ae-status-select .ant-select-selection-item {
          font-weight: 700 !important;
          font-size: 10px !important;
          line-height: 26px !important;
        }

        /* ── Updated By ── */
        .ae-updated-tag {
          background: #ecfeff !important;
          color: #0891b2 !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          margin: 0 !important;
        }
        .ae-no-update {
          font-size: 11px;
          color: #cbd5e1;
          font-style: italic;
        }

        /* ── Actions Cell ── */
        .ae-actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ae-delete-btn {
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          transition: background 0.2s ease !important;
          padding: 0 !important;
        }
        .ae-delete-btn:hover {
          background: #fef2f2 !important;
        }
        .ae-view-only-tag {
          background: #f1f5f9 !important;
          color: #94a3b8 !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          letter-spacing: 0.04em !important;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ae-page { padding: 16px; }
          .ae-page-header { flex-direction: column; align-items: flex-start; }
          .ae-export-btn { width: 100% !important; justify-content: center !important; }
          .ae-toolbar { flex-direction: column; align-items: flex-start; }
          .ae-toolbar-right { width: 100%; justify-content: flex-start; }
          .ae-search-input { max-width: 100% !important; }
          .ae-stat-card .ant-card-body { padding: 14px 16px !important; }
          .ae-stat-value { font-size: 22px; }
        }
        @media (max-width: 480px) {
          .ae-stat-value { font-size: 20px; }
          .ae-stat-label { font-size: 10px; }
          .ae-stat-icon { width: 40px; height: 40px; }
        }
      `}</style>
    </div>
  );
};

export default AdminEnquiries;
