import React, { useState, useEffect } from "react";
import api from "@/services/api";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Dropdown,
  Checkbox,
  Upload,
} from "antd";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Home, 
  Building2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Upload as UploadIcon,
  Search
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getImageUrl } from "@/utils/imageUrl";
import Loader from "@/components/Common/Loader";

const { Title, Text } = Typography;

const PropertyTypeManager = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/property-types");
      setTypes(response.data);
    } catch (error) {
      toast.error("Failed to fetch property types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingType(record);
    form.setFieldsValue({
      name: record.name,
      usageType: record.usageType,
      hasRooms: record.hasRooms,
      hasFloor: record.hasFloor,
      hasPlot: record.hasPlot,
      hasCommercial: record.hasCommercial,
      status: record.status,
    });
    if (record.imageUrl) {
      setFileList([
        {
          uid: "-1",
          name: "Current Image",
          status: "done",
          url: getImageUrl(record.imageUrl),
        },
      ]);
    } else {
      setFileList([]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this property type?",
      icon: <AlertCircle className="text-red-500" />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/property-types/${id}`);
          toast.success("Property type deleted successfully");
          fetchTypes();
        } catch (error) {
          toast.error("Failed to delete property type");
        }
      },
    });
  };

  const onFinish = async (values) => {
    const data = new FormData();
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined) {
        data.append(key, values[key]);
      }
    });

    if (fileList[0]?.originFileObj) {
      data.append("image", fileList[0].originFileObj);
    }

    try {
      if (editingType) {
        await api.put(`/property-types/${editingType._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Property type updated successfully");
      } else {
        await api.post("/property-types", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Property type created successfully");
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    }
  };

  const columns = [
    {
      title: "Property Type",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${record.usageType === "Residential" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
            {record.imageUrl ? (
              <img 
                src={getImageUrl(record.imageUrl)} 
                alt={text} 
                className="w-8 h-8 object-cover rounded"
              />
            ) : (
              record.usageType === "Residential" ? <Home size={18} /> : <Building2 size={18} />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{text}</div>
            <div className="text-xs text-gray-500">{record.usageType}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Enabled Sections",
      key: "sections",
      render: (_, record) => (
        <div className="flex flex-wrap gap-1.5">
          {record.hasRooms && <Tag className="m-0 text-[10px]">ROOMS</Tag>}
          {record.hasFloor && <Tag className="m-0 text-[10px]">FLOORS</Tag>}
          {record.hasPlot && <Tag className="m-0 text-[10px]">PLOTS</Tag>}
          {record.hasCommercial && <Tag className="m-0 text-[10px]">COMMERCIAL</Tag>}
          {!record.hasRooms && !record.hasFloor && !record.hasPlot && !record.hasCommercial && (
             <span className="text-xs text-gray-400 italic">None</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag 
          color={status === "active" ? "green" : "red"} 
          className="rounded-full px-3 py-0.5 border-none font-medium"
        >
          {status.toUpperCase()}
        </Tag>
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
                <span>Edit Config</span>
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
                <span>Delete Type</span>
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
      title: "Total Types",
      value: types.length,
      icon: <Building2 size={22} />,
      bgColor: "bg-blue-50/50 hover:bg-blue-50",
      iconContainerColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Residential",
      value: types.filter(t => t.usageType === "Residential").length,
      icon: <Home size={22} />,
      bgColor: "bg-emerald-50/50 hover:bg-emerald-50",
      iconContainerColor: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Commercial",
      value: types.filter(t => t.usageType === "Commercial").length,
      icon: <Building2 size={22} />,
      bgColor: "bg-purple-50/50 hover:bg-purple-50",
      iconContainerColor: "bg-purple-100 text-purple-600",
    },
  ];

  const filteredTypes = types.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Title level={3} className="mb-1!">Property Types</Title>
          <Text type="secondary">Configure form sections and icons for different property categories</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          className="bg-blue-600 h-10 px-6 rounded-lg font-medium flex items-center gap-2"
        >
          Add New Type
        </Button>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card className={`shadow-sm border-none transition-all duration-300 ${stat.bgColor} py-2`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.iconContainerColor}`}>
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
        <div className="p-4 border-b border-gray-300">
           <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder="Search property types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-lg"
              />
           </div>
        </div>
        <Table
          columns={columns}
          dataSource={filteredTypes}
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
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-300">
            {editingType ? <Edit size={20} /> : <Plus size={20} />}
            <span>{editingType ? "Edit Property Type" : "Add Property Type"}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="pt-6">
          <Form.Item
            name="name"
            label={<span className="font-medium">Type Name</span>}
            rules={[{ required: true, message: "Please enter type name" }]}
          >
            <Input placeholder="e.g. Flat / Apartment" className="h-11 rounded-lg" />
          </Form.Item>

          <Form.Item
            name="usageType"
            label={<span className="font-medium">Usage Category</span>}
            initialValue="Residential"
          >
            <Select className="h-11" classNames={{ popup: { root: "rounded-lg" } }}>
              <Select.Option value="Residential">Residential</Select.Option>
              <Select.Option value="Commercial">Commercial</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={<span className="font-medium">Icon / Image</span>}>
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
            <Text type="secondary" className="text-[10px]">SVG or small PNG, max 1MB</Text>
          </Form.Item>

          <div className="space-y-4 mb-8">
            <Text strong className="text-sm block">Form Configuration</Text>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="hasRooms" valuePropName="checked" noStyle initialValue={false}>
                <Checkbox className="text-sm">Rooms / BHK</Checkbox>
              </Form.Item>
              <Form.Item name="hasFloor" valuePropName="checked" noStyle initialValue={false}>
                <Checkbox className="text-sm">Floor Details</Checkbox>
              </Form.Item>
              <Form.Item name="hasPlot" valuePropName="checked" noStyle initialValue={false}>
                <Checkbox className="text-sm">Plot / Area</Checkbox>
              </Form.Item>
              <Form.Item name="hasCommercial" valuePropName="checked" noStyle initialValue={false}>
                <Checkbox className="text-sm">Commercial</Checkbox>
              </Form.Item>
            </div>
          </div>

          <Form.Item name="status" label={<span className="font-medium">Status</span>} initialValue="active">
            <Select className="h-11" classNames={{ popup: { root: "rounded-lg" } }}>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-lg font-medium">Cancel</Button>
            <Button type="primary" htmlType="submit" className="h-11 px-8 rounded-lg font-medium bg-blue-600">
              {editingType ? "Update Config" : "Create Type"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyTypeManager;
