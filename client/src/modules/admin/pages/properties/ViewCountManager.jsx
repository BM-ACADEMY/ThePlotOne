import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    Input,
    Button,
    message,
    Space,
    Modal,
    InputNumber,
    Typography,
    Tag,
    Avatar,
    Breadcrumb,
    Dropdown,
} from "antd";
import { Search, Eye, Edit2, TrendingUp, Building, MoreHorizontal } from "lucide-react";
import Loader from "@/components/Common/Loader";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { formatNumber } from "@/utils/formatNumber";

const { Title, Text } = Typography;

const ViewCountManager = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [newViewCount, setNewViewCount] = useState(0);
    const [updating, setUpdating] = useState(false);

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/properties/fetch-all-property?limit=1000");
            if (response.data && response.data.properties) {
                setProperties(response.data.properties);
            }
        } catch (error) {
            console.error("Failed to fetch properties:", error);
            message.error("Failed to load properties");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const handleEditClick = (property) => {
        setSelectedProperty(property);
        setNewViewCount(property.view_count || 0);
        setEditModalVisible(true);
    };

    const handleUpdateViewCount = async () => {
        if (!selectedProperty) return;

        setUpdating(true);
        try {
            await api.put(`/properties/update-view-count/${selectedProperty._id}`, {
                view_count: newViewCount
            });
            message.success("View count updated successfully");
            setEditModalVisible(false);
            fetchProperties();
        } catch (error) {
            console.error("Update error:", error);
            message.error("Failed to update view count");
        } finally {
            setUpdating(false);
        }
    };

    const columns = [
        {
            title: "Property Name",
            key: "property",
            render: (_, record) => (
                <Space>
                    <Avatar
                        shape="square"
                        size={48}
                        src={getImageUrl(record.media?.featuredImage || record.media?.images?.[0])}
                        icon={<Building size={20} />}
                        className="flex-shrink-0"
                    />
                    <div style={{ maxWidth: 250 }} className="flex flex-col">
                        <Text strong ellipsis={{ tooltip: record.basicInfo?.title }}>
                            {record.basicInfo?.title || "Untitled"}
                        </Text>
                        <Text type="secondary" size="small" className="text-xs">
                            {record.location?.city || "N/A"}
                        </Text>
                    </div>
                </Space>
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
            title: "User",
            dataIndex: ["seller", "name"],
            key: "seller",
            render: (name) => name || "Admin",
            ellipsis: true,
        },
        {
            title: "Current Views",
            dataIndex: "view_count",
            key: "view_count",
            width: 150,
            sorter: (a, b) => (a.view_count || 0) - (b.view_count || 0),
            render: (count) => (
                <Space>
                    <TrendingUp size={16} className="text-green-500" />
                    <Text strong>{formatNumber(count || 0)}</Text>
                </Space>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: "manage",
                                label: "Manage Views",
                                icon: <TrendingUp size={14} />,
                                onClick: () => handleEditClick(record),
                            },
                        ],
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                >
                    <Button
                        type="text"
                        icon={<MoreHorizontal size={20} />}
                        className="flex items-center justify-center hover:bg-gray-100 rounded-full"
                    />
                </Dropdown>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <Breadcrumb items={[
                    { title: 'Admin' },
                    { title: 'Properties' },
                    { title: 'View Count Manager' }
                ]} className="mb-4" />
                <Title level={2}>Property View Count Manager</Title>
                <Text type="secondary">Manage and update the view counts for all properties.</Text>
            </div>

            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Input
                    prefix={<Search size={18} className="text-gray-400" />}
                    placeholder="Search properties by title or location..."
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full md:max-w-md"
                    size="large"
                />
                <Button onClick={fetchProperties} loading={loading} className="w-full md:w-auto">Refresh Data</Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden relative min-h-[400px]">
                <Table
                    columns={columns}
                    dataSource={properties}
                    rowKey="_id"
                    scroll={{ x: 800 }}
                    loading={{
                        spinning: loading,
                        indicator: <Loader variant="panel" />
                    }}
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        className: "px-6 py-4 pagination-minimal",
                        position: ['bottomRight']
                    }}
                />
            </div>

            <Modal
                title="Update View Count"
                open={editModalVisible}
                onOk={handleUpdateViewCount}
                onCancel={() => setEditModalVisible(false)}
                confirmLoading={updating}
                okText="Update Views"
                centered
            >
                {selectedProperty && (
                    <div className="py-4">
                        <div className="mb-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <Avatar
                                shape="square"
                                size={64}
                                src={getImageUrl(selectedProperty.media?.featuredImage || selectedProperty.media?.images?.[0])}
                            />
                            <div>
                                <Title level={5} className="m-0">{selectedProperty.basicInfo?.title}</Title>
                                <Text type="secondary">Current views: {formatNumber(selectedProperty.view_count || 0)}</Text>
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New View Count
                        </label>
                        <InputNumber
                            min={0}
                            className="w-full"
                            size="large"
                            value={newViewCount}
                            onChange={setNewViewCount}
                            placeholder="Enter new view count"
                            onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                        <Text type="secondary" className="text-xs mt-2 block">
                            Set the total number of views displayed for this property.
                        </Text>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ViewCountManager;
