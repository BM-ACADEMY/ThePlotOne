import { useState, useEffect } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    DatePicker,
    Switch,
    Upload,
    message,
    Tag,
    Card,
    Typography,
    Row,
    Col,
    Dropdown,
} from "antd";
import { 
    Plus, 
    Edit, 
    Trash2, 
    Upload as UploadIcon, 
    ExternalLink, 
    MoreVertical, 
    Image as ImageIcon,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import Loader from "@/components/Common/Loader";
import dayjs from "dayjs";


const { Title, Text } = Typography;

const AdminBannerAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isByModalVisible, setIsByModalVisible] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const response = await api.get("/banner-ads");
            if (response.data.success) {
                setAds(response.data.data);
            }
        } catch (error) {
            message.error("Failed to fetch advertisements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleAdd = () => {
        setEditingAd(null);
        form.resetFields();
        setFileList([]);
        setIsByModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingAd(record);
        form.setFieldsValue({
            title: record.title,
            linkUrl: record.linkUrl,
            expiryDate: dayjs(record.expiryDate),
            isActive: record.isActive,
        });
        setFileList([
            {
                uid: "-1",
                name: "Current Image",
                status: "done",
                url: getImageUrl(record.imageUrl),
            },
        ]);
        setIsByModalVisible(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: "Are you sure you want to delete this advertisement?",
            icon: <XCircle className="text-red-500" />,
            content: "This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const response = await api.delete(`/banner-ads/${id}`);
                    if (response.data.success) {
                        message.success("Advertisement deleted successfully");
                        fetchAds();
                    }
                } catch (error) {
                    message.error("Failed to delete advertisement");
                }
            },
        });
    };

    const handleToggleActive = async (checked, record) => {
        try {
            const response = await api.put(`/banner-ads/${record._id}`, {
                isActive: checked,
            });
            if (response.data.success) {
                message.success(`Advertisement ${checked ? "activated" : "deactivated"}`);
                fetchAds();
            }
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("linkUrl", values.linkUrl || "");
            formData.append("expiryDate", values.expiryDate.toISOString());
            formData.append("isActive", values.isActive);

            if (fileList[0]?.originFileObj) {
                formData.append("bannerImage", fileList[0].originFileObj);
            } else if (!editingAd && fileList.length === 0) {
                message.error("Please upload an image");
                return;
            }

            setLoading(true);
            let response;
            if (editingAd) {
                response = await api.put(`/banner-ads/${editingAd._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                response = await api.post("/banner-ads", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (response.data.success) {
                message.success(`Advertisement ${editingAd ? "updated" : "created"} successfully`);
                setIsByModalVisible(false);
                fetchAds();
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to save advertisement");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Banner Preview",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url) => (
                <div className="relative group overflow-hidden rounded-lg w-24 h-10 border shadow-sm">
                    <img
                        src={getImageUrl(url)}
                        alt="Ad"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                </div>
            ),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text) => <span className="font-medium text-gray-900">{text}</span>,
        },
        {
            title: "Validity",
            dataIndex: "expiryDate",
            key: "expiryDate",
            render: (date) => {
                const now = dayjs();
                const expiry = dayjs(date);
                const isExpired = now.isAfter(expiry);
                const daysDiff = expiry.diff(now, 'day');

                return (
                    <div className="flex flex-col">
                        <Tag color={isExpired ? "red" : "green"} className="w-fit m-0 font-medium border-none rounded-full px-2">
                            {expiry.format("DD MMM YYYY")}
                        </Tag>
                        <span className={`text-[10px] mt-1 ${isExpired ? "text-red-500 font-semibold" : "text-gray-500"}`}>
                            {isExpired ? "EXPIRED" : `${daysDiff} days left`}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Created By",
            dataIndex: "createdBy",
            key: "createdBy",
            render: (createdBy) => (
                <span className="text-gray-600 font-medium">
                    {createdBy?.name || createdBy?.phone || "System"}
                </span>
            ),
        },
        {
            title: "Display Status",
            dataIndex: "isActive",
            key: "isActive",
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    size="small"
                    onChange={(checked) => handleToggleActive(checked, record)}
                />
            ),
        },
        {
            title: "Action",
            key: "action",
            align: "right",
            render: (_, record) => {
                const items = [
                    {
                        key: "edit",
                        label: (
                            <div className="flex items-center gap-2 py-1" onClick={() => handleEdit(record)}>
                                <Edit size={14} />
                                <span>Edit Ad</span>
                            </div>
                        ),
                    },
                    {
                        key: "link",
                        disabled: !record.linkUrl,
                        label: record.linkUrl ? (
                            <a href={record.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-1 text-gray-700">
                                <ExternalLink size={14} />
                                <span>View Target</span>
                            </a>
                        ) : (
                            <div className="flex items-center gap-2 py-1 opacity-50">
                                <ExternalLink size={14} />
                                <span>No Link</span>
                            </div>
                        ),
                    },
                    {
                        type: "divider",
                    },
                    {
                        key: "delete",
                        danger: true,
                        label: (
                            <div className="flex items-center gap-2 py-1" onClick={() => handleDelete(record._id)}>
                                <Trash2 size={14} />
                                <span>Delete Ad</span>
                            </div>
                        ),
                    },
                ];

                return (
                    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                        <Button type="text" icon={<MoreVertical size={18} className="text-gray-500" />} />
                    </Dropdown>
                );
            },
        },
    ];

    const stats = [
        {
            title: "Total Ads",
            value: ads.length,
            icon: <ImageIcon size={22} />,
            bgColor: "bg-blue-50/50 hover:bg-blue-50",
            iconColor: "bg-blue-100 text-blue-600",
        },
        {
            title: "Active Now",
            value: ads.filter(a => a.isActive && !dayjs().isAfter(dayjs(a.expiryDate))).length,
            icon: <CheckCircle size={22} />,
            bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
            iconColor: "bg-emerald-100 text-emerald-600",
        },
        {
            title: "Expired",
            value: ads.filter(a => dayjs().isAfter(dayjs(a.expiryDate))).length,
            icon: <Clock size={22} />,
            bgColor: "bg-rose-50/50 hover:bg-rose-50",
            iconColor: "bg-rose-100 text-rose-600",
        },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <Title level={3} className="mb-1!">Banner Ads</Title>
                    <Text type="secondary">Manage horizontal promotional banners for the website homepage</Text>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={18} />}
                    onClick={handleAdd}
                    className="bg-blue-600 h-10 px-6 rounded-lg font-medium flex items-center gap-2"
                >
                    Add Advertisement
                </Button>
            </div>

            <Row gutter={[24, 24]} className="mb-8">
                {stats.map((stat, i) => (
                    <Col xs={24} sm={12} lg={8} key={i}>
                        <Card className={`shadow-sm border-none transition-all duration-300 ${stat.bgColor} py-2`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.iconColor}`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-xs uppercase tracking-wider opacity-80">{stat.title}</div>
                                    <div className="text-2xl font-bold text-gray-800">{loading ? "..." : stat.value}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="shadow-sm border-none overflow-hidden rounded-xl relative min-h-[400px]">
                <Table
                    columns={columns}
                    dataSource={ads}
                    rowKey="_id"
                    loading={{
                        spinning: loading,
                        indicator: <Loader variant="panel" />
                    }}
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        className: "px-6 py-4"
                    }}
                    scroll={{ x: true }}
                    rowClassName={(record) => {
                        return dayjs().isAfter(dayjs(record.expiryDate)) ? 'bg-gray-50/50' : '';
                    }}
                />
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-2 pb-4 border-b">
                        {editingAd ? <Edit size={20} /> : <Plus size={20} />}
                        <span>{editingAd ? "Edit Advertisement" : "New Advertisement"}</span>
                    </div>
                }
                open={isByModalVisible}
                onOk={handleModalSubmit}
                onCancel={() => setIsByModalVisible(false)}
                confirmLoading={loading}
                width={500}
                centered
                footer={null}
            >
                <Form form={form} layout="vertical" initialValues={{ isActive: true }} className="pt-6">
                    <Form.Item
                        name="title"
                        label={<span className="font-medium">Title</span>}
                        rules={[{ required: true, message: "Please input the title!" }]}
                    >
                        <Input placeholder="E.g., Special Summer Offer" className="h-11 rounded-lg" />
                    </Form.Item>

                    <Form.Item name="linkUrl" label={<span className="font-medium">Target URL (Optional)</span>}>
                        <Input placeholder="https://example.com/promo" className="h-11 rounded-lg" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item
                                name="expiryDate"
                                label={<span className="font-medium">Expiry Date</span>}
                                rules={[{ required: true, message: "Please select expiry date!" }]}
                            >
                                <DatePicker className="w-full h-11 rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="isActive" label={<span className="font-medium">Status</span>} valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Hidden" className="mt-1" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label={<span className="font-medium">Banner Image</span>}>
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            {fileList.length < 1 && (
                                <div className="flex flex-col items-center">
                                    <UploadIcon size={20} className="text-gray-400" />
                                    <div className="mt-1 text-xs">Upload</div>
                                </div>
                            )}
                        </Upload>
                        <Text type="secondary" className="text-[11px]">Recommended size: 1920 x 480 pixels (4:1 aspect ratio)</Text>
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsByModalVisible(false)} className="h-11 px-6 rounded-lg font-medium">Cancel</Button>
                        <Button type="primary" onClick={handleModalSubmit} loading={loading} className="h-11 px-8 rounded-lg font-medium bg-blue-600">
                            {editingAd ? "Update Changes" : "Create Advertisement"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminBannerAds;
