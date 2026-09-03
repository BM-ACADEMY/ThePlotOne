import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  message,
  Popconfirm,
  Input,
  Tabs,
  Badge,
  Avatar,
  Divider,
  Image,
  Modal,
  Carousel,
  Dropdown,
  Menu,
  Switch,
  Card,
  Row,
  Col,
  Statistic,
  Segmented,
} from "antd";
import {
  Search,
  Eye,
  X,
  Home,
  Ruler,
  Building,
  FileCheck,
  Calendar,
  BedDouble,
  MapPin,
  User,
  Square,
  Layers,
  Zap,
  Layout,
  Compass,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  Droplet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bath,
  ShieldCheck,
} from "lucide-react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { formatIndianPrice, formatPriceRange } from "@/utils/formatPrice";
import { formatNumber } from "@/utils/formatNumber";

import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from "@/utils/imageUrl";
import { useSocket } from "@/context/SocketContext";
import Loader from "@/components/Common/Loader";

const AdminProperties = ({ mode }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [propertyToSell, setPropertyToSell] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all" or "my"
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const isUserAdmin = user?.role_id?.role_name?.toLowerCase() === 'admin' || user?.isSuperAdmin;

  const handleViewDetail = (property) => {
    setSelectedProperty(property);
    setMainImage(property.media?.images?.[0] || "");
    setViewModalVisible(true);
    setIsDescriptionExpanded(false);
  };

  const getStats = () => {
    const total = properties.length;
    const verified = properties.filter((p) => p.isVerified).length;
    const pending = properties.filter((p) => p.status === "Pending").length;
    const sold = properties.filter((p) => p.isSold).length;
    return { total, verified, pending, sold };
  };

  const stats = getStats();

  const handleCloseModal = () => {
    setViewModalVisible(false);
    setSelectedProperty(null);
    setMainImage("");
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return "**********";
    const phoneStr = phone.toString();
    if (phoneStr.length < 10) return phoneStr;
    return phoneStr.substring(0, 5) + "*****";
  };

  const fetchProperties = React.useCallback(async () => {
    setLoading(true);
    try {
      let url = "/properties/fetch-all-property?limit=100";
      if (mode === "admin") {
        // Fetch ALL Admin properties
        url += "&role=admin";
      } else if (mode === "seller") {
        // Fetch ALL Sellers' properties
        url += "&role=seller";
      }

      const response = await api.get(url);
      if (response.data && response.data.properties) {
        setProperties(response.data.properties);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      message.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [mode, user]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (socket) {
      socket.on("new-property-listed", () => {
        fetchProperties();
        // Optional: show a small info message or toast
      });

      return () => {
        socket.off("new-property-listed");
      };
    }
  }, [socket, fetchProperties]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/properties/delete-property-by-id/${id}`);
      message.success("Property deleted successfully");
      fetchProperties(); // Refresh list
    } catch {
      message.error("Failed to delete property");
    }
  };

  const handleVerify = async (id, currentStatus) => {
    try {
      await api.put(`/properties/verify-property/${id}`);
      message.success(
        `Property ${currentStatus ? "unverified" : "verified"} successfully`,
      );
      fetchProperties();
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response && error.response.status === 400) {
        message.error(error.response.data.error || "Failed to update verification status");
      } else {
        message.error("Failed to update verification status");
      }
    }
  };

  const handleRejectEdit = async (id) => {
    try {
      await api.put(`/properties/reject-edit/${id}`);
      message.success("Property edit discarded successfully");
      fetchProperties();
    } catch (error) {
      console.error("Reject error:", error);
      message.error("Failed to reject property edit");
    }
  };

  const handleApproveEdit = async (id) => {
    try {
      await api.put(`/properties/approve-edit/${id}`);
      message.success("Property edit approved successfully");
      fetchProperties();
    } catch (error) {
      console.error("Approve error:", error);
      if (error.response && error.response.status === 400) {
        message.error(error.response.data.error || "Failed to approve property edit");
      } else {
        message.error("Failed to approve property edit");
      }
    }
  };

  const handleMarkAsSoldClick = (property) => {
    setPropertyToSell(property);
    setSoldPrice(property.soldPrice || "");
    setSoldModalVisible(true);
  };

  const handleConfirmSold = async () => {
    try {
      const isSold = !propertyToSell.isSold;
      const payload = {
        isSold: isSold,
      };

      if (isSold && soldPrice) {
        payload.soldPrice = soldPrice;
      }

      // Use the generic update endpoint
      await api.put(
        `/properties/update-property-by-id/${propertyToSell._id}`,
        payload,
      );

      message.success(
        `Property marked as ${isSold ? "Sold Out" : "Available"}`,
      );
      setSoldModalVisible(false);
      fetchProperties();
    } catch (error) {
      console.error("Error updating sold status:", error);
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: ["media", "images"],
      key: "images",
      render: (images) =>
        images && images.length > 0 ? (
          <img
            src={getImageUrl(images[0])}
            alt="Property"
            className="w-16 h-12 object-cover rounded"
          />
        ) : (
          <img
            src={getImageUrl(null)}
            alt="No Image"
            className="w-16 h-12 object-cover rounded border border-gray-100"
          />
        ),
    },
    {
      title: "Title",
      key: "title",
      width: 200,
      render: (_, record) => (
        <a
          href={`/properties/${record.slug || record._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[250px] block"
          title={record.basicInfo?.title}
        >
          {record.basicInfo?.title || "Untitled"}
        </a>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.basicInfo?.title || "").toLowerCase().includes(value.toLowerCase()) ||
          String(record.location?.city || "").toLowerCase().includes(value.toLowerCase())
        );
      },
    },
    {
      title: "Type",
      key: "property_type",
      render: (_, record) => {
        const type = record.basicInfo?.propertyType || "Unknown";
        return (
          <Tag color={type === "realestate_with_kamar" ? "gold" : "blue"}>
            {type === "realestate_with_kamar" ? "Premium (Kamar)" : type}
          </Tag>
        );
      },
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => {
        const priceDisplay = formatPriceRange(
          record.pricing?.sell?.minPrice || record.pricing?.rent?.minRent,
          record.pricing?.sell?.maxPrice || record.pricing?.rent?.maxRent,
          record.pricing?.sell?.price || record.pricing?.rent?.monthlyRent || 0
        );
        return <span className="font-semibold text-blue-600">{priceDisplay}</span>;
      },
      sorter: (a, b) => {
        const pa = a.pricing?.sell?.minPrice || a.pricing?.sell?.price || a.pricing?.rent?.minRent || a.pricing?.rent?.monthlyRent || 0;
        const pb = b.pricing?.sell?.minPrice || b.pricing?.sell?.price || b.pricing?.rent?.minRent || b.pricing?.rent?.monthlyRent || 0;
        return pa - pb;
      },
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (loc) => loc?.city || "N/A",
    },
    {
      title: "Owner / Manager",
      key: "addedBy",
      render: (_, record) => {
        const isSellerMe = user && record.seller?._id === user._id;
        const isCreatorMe = user && String(record.createdBy?._id || record.createdBy) === String(user?._id);
        const isSellerAdmin = record.seller?.role_id?.role_name === 'admin';
        
        // Determine primary name and secondary attribution
        let primaryName = record.seller?.name || "Owner";
        let isPrimaryMe = isSellerMe;
        let showAddedBy = record.createdBy && String(record.createdBy._id || record.createdBy) !== String(record.seller?._id);

        // If it's an admin property, prioritize showing who actually added it
        if (isSellerAdmin && record.createdBy) {
          if (isCreatorMe) {
            primaryName = "Me";
            isPrimaryMe = true;
            showAddedBy = false; // Already showing Me as primary
          } else {
            primaryName = record.createdBy.name || "Admin";
            isPrimaryMe = false;
            // Optionally show the legal owner (Super Admin) if needed, 
            // but usually just showing the creator is enough for admin panel
            showAddedBy = false; 
          }
        } else if (isSellerMe) {
          primaryName = "Me";
          isPrimaryMe = true;
        }

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Avatar size="small" icon={<User size={12} />} src={getImageUrl(record.seller?.profile_image)} className="shrink-0" />
              <span className={isPrimaryMe ? "font-bold text-blue-600 truncate max-w-30" : "text-gray-600 truncate max-w-30"}>
                {primaryName}
              </span>
            </div>
            {showAddedBy && (
              <div className="flex items-center gap-1 ml-6">
                <span className="text-[10px] text-gray-400">Added by:</span>
                <span className={isCreatorMe ? "text-[10px] font-bold text-blue-500 uppercase" : "text-[10px] font-medium text-indigo-500 uppercase"}>
                  {isCreatorMe ? "Me" : (record.createdBy?.name || "Admin")}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const getStatusColor = (s) => {
          switch (s?.toLowerCase()) {
            case "active":
            case "available":
              return "green";
            case "pending":
            case "edit pending approval":
              return "gold";
            case "sold":
            case "rented":
              return "red";
            default:
              return "blue";
          }
        };
        const isSoldOut = record.isSold || status?.toLowerCase() === "sold";
        return (
          <div className="flex flex-col gap-1">
            <Tag color={getStatusColor(status)}>
              {status?.toUpperCase() || "UNKNOWN"}
            </Tag>
            {isSoldOut && <Tag color="red">SOLD</Tag>}
          </div>
        );
      },
    },
    {
      title: "Views",
      dataIndex: "view_count",
      key: "view_count",
      sorter: (a, b) => a.view_count - b.view_count,
      render: (count) => formatNumber(count || 0),
    },
    {
      title: "Verified",
      dataIndex: "isVerified",
      key: "isVerified",
      render: (isVerified, record) => (
        <Switch
          checked={isVerified}
          onChange={() => handleVerify(record._id, isVerified)}
          size="small"
          className={isVerified ? "bg-green-500" : "bg-gray-300"}
        />
      ),
      filters: [
        { text: "Verified", value: true },
        { text: "Pending", value: false },
      ],
      onFilter: (value, record) => record.isVerified === value,
    },
    {
      title: "Expires In",
      key: "expiry",
      hidden: mode === "admin", // Hide for admin properties as they don't expire
      render: (_, record) => {
        const sellerRole =
          record.seller_id?.role_id?.role_name?.toUpperCase() ||
          record.seller_id?.role?.name?.toUpperCase();

        if (sellerRole === "ADMIN") {
          return <Tag color="blue">No Expiry</Tag>;
        }

        if (record.status === "Pending") {
          return <Tag color="gold">Awaiting Approval</Tag>;
        }

        const baseDate = record.approvedAt ? new Date(record.approvedAt) : new Date(record.createdAt);
        const expiryDate = new Date(
          baseDate.getTime() + 21 * 24 * 60 * 60 * 1000,
        );
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return <Tag color="red">Expired</Tag>;
        return (
          <Tag color={diffDays < 5 ? "orange" : "green"}>
            {diffDays} days left
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "View Detail",
            icon: <Eye size={14} />,
            onClick: () => handleViewDetail(record),
          },
          {
            key: "edit",
            label: "Edit Property",
            icon: <FileText size={14} />,
            disabled: mode === "seller",
            onClick: () => navigate(`/admin/properties/add?edit=${record._id}`),
          },
          {
            key: "sold",
            label: record.isSold ? "Mark Available" : "Mark as Sold",
            icon: <Zap size={14} />,
            onClick: () => handleMarkAsSoldClick(record),
            danger: !record.isSold,
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            label: (
              <Popconfirm
                title="Delete the property"
                description="Are you sure to delete this property?"
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <span>Delete Property</span>
              </Popconfirm>
            ),
            icon: <X size={14} />,
            danger: true,
          },
        ];

        if (record.status === "Edit Pending Approval") {
          // Insert Approve and Reject Edit before delete
          items.splice(items.length - 2, 0, 
            {
              key: "approve_edit",
              label: "Approve Edit",
              icon: <CheckCircle size={14} className="text-green-600" />,
              onClick: () => handleApproveEdit(record._id),
            },
            {
              key: "reject_edit",
              label: "Reject Edit",
              icon: <AlertCircle size={14} />,
              onClick: () => handleRejectEdit(record._id),
              danger: true,
            }
          );
        }

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreHorizontal size={20} />}
              className="flex items-center justify-center hover:bg-gray-100 rounded-full"
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="p-0 bg-transparent min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {mode === "seller" ? "Seller Listings" : "Properties Management"}
          </h1>
          <p className="text-gray-500 mt-1">Manage and monitor all property listings in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/admin/properties/add")}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 h-auto py-2 px-6 shadow-md rounded-xl font-semibold transition-all hover:scale-[1.02]"
          >
            <Zap size={18} fill="currentColor" /> Add New Property
          </Button>
        </div>
      </div>

      {/* Stats Cards - Updated for perfect alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: "Total Listings", 
            value: stats.total, 
            icon: <Home size={22} />, 
            bgColor: 'bg-blue-50', 
            textColor: 'text-blue-600',
            valueColor: '#1f2937'
          },
          { 
            label: "Verified", 
            value: stats.verified, 
            icon: <CheckCircle size={22} />, 
            bgColor: 'bg-green-50', 
            textColor: 'text-green-600',
            valueColor: '#10b981'
          },
          { 
            label: "Pending", 
            value: stats.pending, 
            icon: <Clock size={22} />, 
            bgColor: 'bg-amber-50', 
            textColor: 'text-amber-600',
            valueColor: '#f59e0b'
          },
          { 
            label: "Sold Out", 
            value: stats.sold, 
            icon: <AlertCircle size={22} />, 
            bgColor: 'bg-red-50', 
            textColor: 'text-red-600',
            valueColor: '#ef4444'
          },
        ].map((stat, index) => (
          <Card key={index} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 font-medium text-sm tracking-tight">{stat.label}</span>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 ${stat.bgColor} ${stat.textColor} rounded-xl flex items-center justify-center shadow-inner`}>
                  {stat.icon}
                </div>
                <span 
                  className="text-3xl font-semibold tracking-tight leading-none"
                  style={{ color: stat.valueColor }}
                >
                  {stat.value}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
        <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <Input
            prefix={<Search size={18} className="text-gray-400" />}
            placeholder="Search by title, location or city..."
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md bg-gray-50 border-gray-200 rounded-xl"
            size="large"
            allowClear
          />
          <div className="text-gray-400 text-sm font-medium">
            Showing {properties.length} properties
          </div>
        </div>
        <Table
          columns={columns.filter(col => !col.hidden)}
          dataSource={properties}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Loader variant="panel" />
          }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false, // Cleaner pagination
            className: "px-6 py-4 pagination-minimal",
            position: ['bottomRight']
          }}
          scroll={{ x: true }}
          className="admin-properties-table"
        />
      </div>

      {/* Sold Modal */}
      <Modal
        title={
          propertyToSell?.isSold ? "Mark as Available" : "Mark as Sold Out"
        }
        open={soldModalVisible}
        onOk={handleConfirmSold}
        onCancel={() => setSoldModalVisible(false)}
        okText="Update Status"
        cancelText="Cancel"
        centered
      >
        <p className="mb-4">
          Are you sure you want to mark <b>{propertyToSell?.title}</b> as{" "}
          {propertyToSell?.isSold ? "Available" : "Sold Out"}?
        </p>
        {!propertyToSell?.isSold && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sold Price (Optional)
            </label>
            <Input
              prefix="₹"
              placeholder="Enter sold amount"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              type="number"
            />
          </div>
        )}
      </Modal>

      {/* Property Detail Modal - Updated Design */}
         <Modal
        title={null}
        open={viewModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width="100%"
        style={{
          maxWidth: "900px",
          top: 20,
          paddingBottom: 20,
        }}
        closeIcon={
          <div className="bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-600" />
          </div>
        }
        className="property-detail-modal rounded-2xl overflow-hidden p-0"
        styles={{
          body: {
            padding: 0,
            maxHeight: "85vh",
            overflowY: "auto",
          }
        }}
      >
        {selectedProperty && (
          <div className="bg-white">
            {/* Image Header */}
            <div className="relative bg-gray-100">
              {selectedProperty.media?.images && selectedProperty.media.images.length > 0 ? (
                <Carousel autoplay className="property-carousel">
                  {selectedProperty.media.images.map((img, index) => (
                    <div key={index} className="h-[300px] md:h-[400px] w-full">
                      <img
                        src={getImageUrl(img)}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </Carousel>
              ) : (
                <img
                  src={getImageUrl(null)}
                  alt="No Property Images"
                  className="w-full h-[300px] md:h-[400px] object-cover"
                />
              )}

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white z-10 pointer-events-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Tag
                        color={
                          selectedProperty.status === "available"
                            ? "success"
                            : "error"
                        }
                        className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-white/20 text-white"
                      >
                        {selectedProperty.status?.toUpperCase()}
                      </Tag>
                      {selectedProperty.isVerified && (
                        <Tag
                          color="blue"
                          className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-blue-500/80 text-white"
                        >
                          Verified
                        </Tag>
                      )}
                      <Tag className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-black/40 text-white">
                        {selectedProperty.basicInfo?.propertyType || "Unknown"}
                      </Tag>
                      {(selectedProperty.isSold || selectedProperty.status?.toLowerCase() === "sold") && (
                        <Tag className="border-none px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur-md bg-red-600/80 text-white">
                          SOLD OUT
                        </Tag>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 shadow-sm break-words">
                      {selectedProperty.basicInfo?.title || "Untitled Property"}
                    </h1>
                    <p className="flex items-center gap-2 text-gray-200 text-sm md:text-base font-medium">
                      <MapPin size={16} />
                      {selectedProperty.location?.city || "Unknown City"},{" "}
                      {selectedProperty.location?.state || ""} (
                      {selectedProperty.location?.pincode})
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-300 mb-1 font-medium">
                      Price
                    </p>
                    <div className="flex flex-col items-start md:items-end">
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white shadow-sm">
                          {formatPriceRange(
                            selectedProperty.pricing?.sell?.minPrice || selectedProperty.pricing?.rent?.minRent,
                            selectedProperty.pricing?.sell?.maxPrice || selectedProperty.pricing?.rent?.maxRent,
                            selectedProperty.pricing?.sell?.price || selectedProperty.pricing?.rent?.monthlyRent || 0
                          )}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="p-6 md:p-8">
              <Tabs
                defaultActiveKey="1"
                type="card"
                size="large"
                className="custom-tabs"
                items={[
                  {
                    key: "1",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <Home size={18} /> Overview
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-8 animate-fadeIn">
                        {/* Key Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                            <span className="text-blue-400 mb-2">
                              <Ruler size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              {(selectedProperty.specifications?.area?.minArea || selectedProperty.specifications?.area?.maxArea) ? "Area Range" : "Area Size"}
                            </span>
                            <span className="text-base font-bold text-gray-800">
                              {(() => {
                                const minA = selectedProperty.specifications?.area?.minArea;
                                const maxA = selectedProperty.specifications?.area?.maxArea;
                                const total = selectedProperty.specifications?.area?.totalArea;
                                if (minA && maxA) return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sqft`;
                                if (minA) return `${Number(minA).toLocaleString()}+ sqft`;
                                return total ? `${total} sqft` : "N/A";
                              })()}
                            </span>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
                            <span className="text-purple-400 mb-2">
                              <Building size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              Type
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                              {selectedProperty.basicInfo?.propertyType || "N/A"}
                            </span>
                          </div>
                          {selectedProperty.basicInfo?.approvalType && (Array.isArray(selectedProperty.basicInfo.approvalType) ? selectedProperty.basicInfo.approvalType.length > 0 : selectedProperty.basicInfo.approvalType) && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                              <span className="text-green-400 mb-2">
                                <FileCheck size={24} />
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                Approval
                              </span>
                              <span className="text-lg font-bold text-gray-800">
                                {(() => {
                                  const types = Array.isArray(selectedProperty.basicInfo.approvalType) 
                                    ? selectedProperty.basicInfo.approvalType 
                                    : [selectedProperty.basicInfo.approvalType];
                                  return types.map(t => t.toLowerCase().includes("approved") ? t : `${t} Approved`).join(", ");
                                })()}
                              </span>
                            </div>
                          )}
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
                            <span className="text-orange-400 mb-2">
                              <Calendar size={24} />
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              Posted
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                              {new Date(
                                selectedProperty.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-3">
                            Description
                          </h3>
                          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                              {isDescriptionExpanded
                                ? selectedProperty.basicInfo?.description || "No Description"
                                : (() => {
                                    const desc =
                                      selectedProperty.basicInfo?.description ||
                                      "No Description";
                                    if (desc === "No Description") return desc;
                                    const words = desc.trim().split(/\s+/);
                                    if (words.length <= 200) return desc;
                                    return (
                                      words.slice(0, 200).join(" ") + "..."
                                    );
                                  })()}
                            </p>
                            {selectedProperty.basicInfo?.description
                              ?.trim()
                              .split(/\s+/)
                              .filter((w) => w.length > 0).length > 200 && (
                              <Button
                                type="link"
                                onClick={() =>
                                  setIsDescriptionExpanded(
                                    !isDescriptionExpanded,
                                  )
                                }
                                className="p-0 h-auto mt-2 text-blue-600 font-semibold flex items-center gap-1"
                              >
                                {isDescriptionExpanded ? (
                                  <>
                                    Show Less{" "}
                                    <ChevronLeft
                                      size={14}
                                      className="rotate-90"
                                    />
                                  </>
                                ) : (
                                  <>
                                    Show More{" "}
                                    <ChevronRight
                                      size={14}
                                      className="rotate-90"
                                    />
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "2",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <BedDouble size={18} /> Features
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-8 animate-fadeIn">
                        {selectedProperty.amenities &&
                          selectedProperty.amenities.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {selectedProperty.amenities.map(
                              (amenity, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                                >
                                  <span className="text-gray-700 font-medium text-center">
                                    {amenity}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">
                              No amenities listed.
                            </p>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "3",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <Layout size={18} /> Specifications
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Area Specs */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Square className="text-orange-500" /> Area Info
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">
                                  {(selectedProperty.specifications?.area?.minArea || selectedProperty.specifications?.area?.maxArea) ? "Area Range" : "Total Area"}
                                </span>
                                <span className="font-bold text-gray-800">
                                  {(() => {
                                    const minA = selectedProperty.specifications?.area?.minArea;
                                    const maxA = selectedProperty.specifications?.area?.maxArea;
                                    const total = selectedProperty.specifications?.area?.totalArea;
                                    if (minA && maxA) return `${Number(minA).toLocaleString()} - ${Number(maxA).toLocaleString()} sqft`;
                                    if (minA) return `${Number(minA).toLocaleString()}+ sqft`;
                                    return total ? `${total} sqft` : "N/A";
                                  })()}
                                </span>
                              </div>
                              {selectedProperty.specifications?.area?.builtupArea && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">Built-up Area</span>
                                  <span className="font-bold text-gray-800">{selectedProperty.specifications.area.builtupArea} sqft</span>
                                </div>
                              )}
                              {selectedProperty.specifications?.area?.carpetArea && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">Carpet Area</span>
                                  <span className="font-bold text-gray-800">{selectedProperty.specifications.area.carpetArea} sqft</span>
                                </div>
                              )}
                              {(selectedProperty.specifications?.facing || selectedProperty.specifications?.residential?.facing) && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">Facing</span>
                                  <span className="font-bold text-blue-600">{selectedProperty.specifications.facing || selectedProperty.specifications.residential.facing}</span>
                                </div>
                              )}
                              {selectedProperty.legal?.propertyStatus && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="text-gray-500">Property Status</span>
                                  <span className="font-bold text-blue-600">{selectedProperty.legal.propertyStatus}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedProperty.specifications?.floor && (selectedProperty.specifications.floor.totalFloor || selectedProperty.specifications.floor.propertyOnFloor) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Layers className="text-purple-500" /> Floor Info
                              </h3>
                              <div className="space-y-3">
                                {selectedProperty.specifications.floor.totalFloor && (
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Total Floors</span>
                                    <span className="font-bold text-gray-800">{selectedProperty.specifications.floor.totalFloor}</span>
                                  </div>
                                )}
                                {selectedProperty.specifications.floor.propertyOnFloor && (
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Property on Floor</span>
                                    <span className="font-bold text-gray-800">{selectedProperty.specifications.floor.propertyOnFloor}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedProperty.specifications?.residential && (selectedProperty.specifications.residential.bedrooms > 0 || selectedProperty.specifications.residential.bathrooms > 0 || selectedProperty.specifications.residential.balconies > 0 || selectedProperty.specifications.residential.facing || selectedProperty.specifications.residential.furnishing) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Home className="text-blue-500" /> Residential details
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedProperty.specifications.residential.bedrooms > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">BHK</p>
                                    <p className="font-bold">{selectedProperty.specifications.residential.bedrooms} BHK</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.residential.bathrooms > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Bathrooms</p>
                                    <p className="font-bold">{selectedProperty.specifications.residential.bathrooms}</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.residential.balconies > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Balconies</p>
                                    <p className="font-bold">{selectedProperty.specifications.residential.balconies || 0}</p>
                                  </div>
                                )}
                                {(selectedProperty.specifications.residential.hall !== undefined || selectedProperty.specifications.residential.kitchens !== undefined) && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Hall/Kitchen</p>
                                    <p className="font-bold">{(selectedProperty.specifications.residential.hall ?? 0)}H / {(selectedProperty.specifications.residential.kitchens ?? 0)}K</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.residential.furnishing && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Furnishing</p>
                                    <p className="font-bold">{selectedProperty.specifications.residential.furnishing}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedProperty.specifications?.utilities && (selectedProperty.specifications.utilities.waterSupply || selectedProperty.specifications.utilities.powerBackup) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Zap className="text-yellow-500" /> Utilities
                              </h3>
                              <div className="space-y-3">
                                {selectedProperty.specifications.utilities.waterSupply && (
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Water Supply</span>
                                    <span className="font-bold text-gray-800">{selectedProperty.specifications.utilities.waterSupply}</span>
                                  </div>
                                )}
                                {selectedProperty.specifications.utilities.powerBackup && (
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Power Backup</span>
                                    <span className="font-bold text-gray-800">Yes</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Plot Specs */}
                          {selectedProperty.specifications?.plot && (selectedProperty.specifications.plot.plotLength || selectedProperty.specifications.plot.plotWidth || selectedProperty.specifications.plot.roadWidth || selectedProperty.specifications.plot.cornerPlot || selectedProperty.specifications.plot.gatedCommunity) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Compass className="text-green-500" /> Plot details
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedProperty.specifications.plot.plotLength && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Length</p>
                                    <p className="font-bold">{selectedProperty.specifications.plot.plotLength} ft</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.plot.plotWidth && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Width</p>
                                    <p className="font-bold">{selectedProperty.specifications.plot.plotWidth} ft</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.plot.roadWidth && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Road Width</p>
                                    <p className="font-bold">{selectedProperty.specifications.plot.roadWidth} ft</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.plot.cornerPlot && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Corner Plot</p>
                                    <p className="font-bold">Yes</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.plot.gatedCommunity && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Gated Community</p>
                                    <p className="font-bold">Yes</p>
                                  </div>
                                )}
                                {(selectedProperty.specifications?.facing || selectedProperty.specifications?.residential?.facing) && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Facing</p>
                                    <p className="font-bold">{selectedProperty.specifications.facing || selectedProperty.specifications.residential.facing}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedProperty.specifications?.commercial && (selectedProperty.specifications.commercial.cabins || selectedProperty.specifications.commercial.meetingRooms || selectedProperty.specifications.commercial.workstations || selectedProperty.specifications.commercial.washrooms || selectedProperty.specifications.commercial.pantry || selectedProperty.specifications.commercial.receptionArea || selectedProperty.specifications.commercial.suitableFor) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Building className="text-orange-500" /> Commercial details
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedProperty.specifications.commercial.cabins && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Cabins</p>
                                    <p className="font-bold">{selectedProperty.specifications.commercial.cabins}</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.meetingRooms && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Meeting Rooms</p>
                                    <p className="font-bold">{selectedProperty.specifications.commercial.meetingRooms}</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.workstations && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Workstations</p>
                                    <p className="font-bold">{selectedProperty.specifications.commercial.workstations}</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.washrooms && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Washrooms</p>
                                    <p className="font-bold">{selectedProperty.specifications.commercial.washrooms}</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.pantry && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Pantry</p>
                                    <p className="font-bold">Yes</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.receptionArea && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Reception</p>
                                    <p className="font-bold">Yes</p>
                                  </div>
                                )}
                                {selectedProperty.specifications.commercial.suitableFor && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-400 uppercase">Suitable For</p>
                                    <p className="font-bold">{selectedProperty.specifications.commercial.suitableFor}</p>
                                  </div>
                                )}
                                {(selectedProperty.specifications?.facing || selectedProperty.specifications?.residential?.facing) && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase">Facing</p>
                                    <p className="font-bold">{selectedProperty.specifications.facing || selectedProperty.specifications.residential.facing}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "4",
                    label: (
                      <span className="flex items-center gap-2 px-2">
                        <MapPin size={18} /> Location
                      </span>
                    ),
                    children: (
                      <div className="pt-4 space-y-6 animate-fadeIn">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1">
                            <MapPin className="text-blue-500" /> Address Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Street / Building
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.addressLine1 ||
                                  "N/A"}
                              </p>
                              {selectedProperty.location?.addressLine2 && (
                                <p className="text-gray-600 mt-1">
                                  {selectedProperty.location.addressLine2}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                City & State
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.city
                                  ? `${selectedProperty.location.city}, `
                                  : ""}
                                {selectedProperty.location?.state || ""}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Country
                              </label>
                              <p className="text-gray-800 font-medium text-lg">
                                {selectedProperty.location?.country || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                                Pincode
                              </label>
                              <Tag className="text-base px-3 py-1 bg-gray-100 text-gray-700 border-gray-200 rounded-md mt-1 font-mono">
                                {selectedProperty.location?.pincode || "N/A"}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                  size="large"
                  onClick={handleCloseModal}
                  className="hover:bg-gray-100"
                >
                  Close
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    navigate(
                      `/admin/properties/add?edit=${selectedProperty?._id}`,
                    );
                    handleCloseModal();
                  }}
                  disabled={mode === "seller"} // Respect the mode logic from original
                  className="bg-blue-600 hover:bg-blue-700 px-8 w-full sm:w-auto"
                >
                  Edit Property
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .custom-segmented {
          background: #f3f4f6 !important;
          padding: 2px !important;
          border-radius: 10px !important;
        }
        .custom-segmented .ant-segmented-item {
          border-radius: 8px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .custom-segmented .ant-segmented-item-selected {
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          color: #2563eb !important;
          font-weight: 600 !important;
        }
        .admin-properties-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          color: #6b7280 !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f3f4f6 !important;
        }
        .admin-properties-table .ant-table-tbody > tr > td {
          padding: 16px 20px !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .admin-properties-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fafb !important;
        }
        .pagination-minimal .ant-pagination-item {
          border-radius: 8px !important;
          border-color: #e5e7eb !important;
        }
        .pagination-minimal .ant-pagination-item-active {
          background: #2563eb !important;
          border-color: #2563eb !important;
        }
        .pagination-minimal .ant-pagination-item-active a {
          color: #fff !important;
        }
        .property-detail-modal-premium .ant-modal-content {
          border-radius: 32px !important;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminProperties;
