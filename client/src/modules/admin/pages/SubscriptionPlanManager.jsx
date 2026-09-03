import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  InputNumber,
  Dropdown,
  Switch,
  Checkbox,
  Card,
  Tabs
} from "antd";
import { Plus, Edit, Trash2, CreditCard, CheckCircle, MoreVertical, IndianRupee, ShieldCheck, XCircle, Star, Check, X, Filter } from "lucide-react";
import axios from "axios";
import Loader from "@/components/Common/Loader";

const { TabPane } = Tabs;

const API = import.meta.env.VITE_API_URL;

const SubscriptionPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [form] = Form.useForm();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/subscriptions/admin/plans`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const allPlans = res.data;
      setPlans(allPlans.filter(p => p.name !== "Free"));
    } catch {
      message.error("Failed to fetch subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessTypes = async () => {
    try {
      const res = await axios.get(`${API}/business-types?status=active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBusinessTypes(res.data);
    } catch {
      console.error("Failed to fetch business types");
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchBusinessTypes();
  }, []);

  const handleAdd = () => {
    setEditingPlan(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingPlan(record);
    form.setFieldsValue({
      ...record,
      businessType: record.businessType?._id || record.businessType,
      propertyLimit: record.propertyLimit,
      leadsLimit: record.leadsLimit,
      features: record.features?.join("\n"),
      notIncluded: record.notIncluded?.join("\n"),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/subscriptions/admin/plans/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      message.success("Plan deleted");
      fetchPlans();
    } catch {
      message.error("Failed to delete plan");
    }
  };

  const onFinish = async (values) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };

      const payload = {
        ...values,
        id: editingPlan ? editingPlan._id : undefined,
        features: values.features
          ? values.features.split("\n").filter((f) => f.trim())
          : [],
        notIncluded: values.notIncluded
          ? values.notIncluded.split("\n").filter((f) => f.trim())
          : [],
        isPopular: !!values.isPopular,
      };

      await axios.post(`${API}/subscriptions/admin/plans`, payload, config);
      message.success(editingPlan ? "Plan updated" : "Plan created");

      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      message.error(error.response?.data?.error || "Operation failed");
    }
  };

  // Group plans by business type
  const groupedPlans = plans.reduce((acc, plan) => {
    const typeName = plan.businessType?.name || "Global / Other";
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(plan);
    return acc;
  }, {});

  const PlanCard = ({ plan }) => {
    const isPopular = plan.isPopular;

    return (
      <Card
        className={`relative w-full h-full rounded-2xl border-none shadow-xl transition-all duration-300 flex flex-col overflow-hidden bg-white hover:shadow-2xl`}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        {/* Ribbon for Popular */}
        {isPopular && (
          <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden z-20 pointer-events-none">
            <div className="absolute top-6 -left-12 w-44 bg-[#e00d0d] text-white text-[10px] font-black uppercase py-1 text-center -rotate-45 shadow-xl border-b border-white/20">
              Popular
            </div>
          </div>
        )}

        {/* Dropdown for Edit/Delete (Admin Action) */}
        <div className="absolute top-4 right-4 z-30">
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: "Edit Plan",
                  icon: <Edit size={14} />,
                  onClick: () => handleEdit(plan),
                },
                {
                  key: "delete",
                  label: (
                    <Popconfirm
                      title="Delete this plan?"
                      onConfirm={() => handleDelete(plan._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <span className="text-red-500">Delete Plan</span>
                    </Popconfirm>
                  ),
                  icon: <Trash2 size={14} className="text-red-500" />,
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button
              type="text"
              icon={<MoreVertical size={18} className="text-gray-400" />}
              className="hover:bg-gray-100 rounded-full flex items-center justify-center p-0 w-8 h-8 bg-white/50 backdrop-blur-sm shadow-sm"
            />
          </Dropdown>
        </div>

        {/* Status Tag */}
        <div className={`absolute top-4 ${isPopular ? 'left-16' : 'left-4'} z-30`}>
          <Tag color={plan.status === "active" ? "green" : "red"} className="rounded-lg px-2 py-0.5 border-none shadow-sm capitalize text-[10px] font-bold">
            {plan.status}
          </Tag>
        </div>

        {/* Header */}
        <div className={`py-4 text-center border-b border-gray-50 bg-white pt-10 px-4`}>
          <h2 className="text-2xl font-black text-[#002B49] tracking-widest uppercase">{plan.displayName || plan.name}</h2>
          <div className="mt-1">
            <Tag color="blue" className="rounded-md border-none bg-blue-50 text-blue-600 font-bold text-[10px] uppercase">
              {plan.businessType?.name || "Global"}
            </Tag>
          </div>
        </div>

        {/* Price Banner */}
        <div className={`py-3 text-center ${
          isPopular ? "bg-[#f97316]" : "bg-[#002B49]"
        }`}>
          <div className="flex items-center justify-center text-white gap-1">
            {plan.price === 0 ? (
              <span className="text-xl font-bold uppercase tracking-wider">Free</span>
            ) : (
              <>
                <IndianRupee size={18} strokeWidth={3} />
                <span className="text-2xl font-black">{plan.price}</span>
                <span className="text-xs font-bold opacity-70">/ {plan.duration ? `${plan.duration} Days` : "Lifetime"}</span>
              </>
            )}
          </div>
        </div>

        {/* Feature List */}
        <div className="p-6 flex-1">
          <div className="mb-4 text-xs font-bold text-gray-500 flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-500" />
            <span>Limit: {plan.propertyLimit === -1 ? "Unlimited" : `${plan.propertyLimit} Properties`}</span>
          </div>

          <div className="mb-4 text-xs font-bold text-gray-500 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>Leads: {plan.leadsLimit === -1 ? "Unlimited" : `${plan.leadsLimit} Credits`}</span>
          </div>

          <div className="space-y-3">
            {/* Checkmarks */}
            {plan.features?.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <Check size={18} className="text-green-500 shrink-0" strokeWidth={3} />
                <span className="text-gray-700 font-semibold text-sm leading-tight">{feature}</span>
              </div>
            ))}
            
            {/* Dynamic notIncluded crossmarks */}
            {plan.notIncluded?.map((feature, idx) => (
              <div key={`not-${idx}`} className="flex items-center gap-4 opacity-30">
                <X size={18} className="text-red-500 shrink-0" strokeWidth={3} />
                <span className="text-gray-500 font-medium text-sm line-through">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-auto">
          <ShieldCheck size={14} className="text-green-500" />
          SECURE PLAN
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                <CreditCard size={24} />
              </div>
              Subscription Plans
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Manage pricing tiers and listing quotas for your real estate business.
            </p>
          </div>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 h-auto py-3 px-8 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            Create New Plan
          </Button>
        </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-2xl">
            <Loader variant="panel" />
          </div>
        )}

        {plans.length > 0 ? (
          <Tabs 
            defaultActiveKey="0" 
            className="premium-tabs"
            type="card"
            tabBarGutter={12}
          >
            {Object.keys(groupedPlans).map((typeName, index) => (
              <TabPane 
                tab={
                  <span className="flex items-center gap-2 px-2">
                    <Filter size={14} />
                    {typeName}
                    <Tag className="ml-1 border-none bg-gray-100 text-gray-600 rounded-full text-[10px]">{groupedPlans[typeName].length}</Tag>
                  </span>
                } 
                key={index}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
                  {groupedPlans[typeName].map((plan) => (
                    <PlanCard key={plan._id} plan={plan} />
                  ))}
                </div>
              </TabPane>
            ))}
          </Tabs>
        ) : !loading && (
          <div className="bg-white p-16 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Plans Found</h3>
            <p className="text-gray-400 font-medium max-w-sm mx-auto mb-8">You haven't created any subscription plans yet. Start by adding your first plan!</p>
            <Button onClick={handleAdd} type="primary" size="large" className="rounded-xl px-8 font-bold">Add First Plan</Button>
          </div>
        )}
      </div>

      <Modal
        title={editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              name="name"
              label="Plan Type (Internal)"
              rules={[{ required: true }]}
              tooltip="The internal name used for business logic (Lead priority, etc.)"
            >
                <Select placeholder="Select plan type">
                  <Select.Option value="Standard">Standard</Select.Option>
                  <Select.Option value="Premium">Premium</Select.Option>
                  <Select.Option value="Pro">Pro</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
              name="displayName"
              label="Display Name (UI)"
              rules={[{ required: true, message: "Please enter a display name" }]}
              tooltip="This is the name users will see on the website (e.g. Starter, Growth, Elite)"
            >
                <Input placeholder="Enter plan name to display to users" />
            </Form.Item>

            <Form.Item
              name="businessType"
              label="Business Type"
              rules={[{ required: true, message: "Please select a business type" }]}
            >
              <Select placeholder="Select business type">
                {businessTypes.map((type) => (
                  <Select.Option key={type._id} value={type._id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Price (₹)"
              rules={[{ required: true }]}
            >
              <InputNumber 
                className="w-full" 
                placeholder="0" 
                min={0}
                precision={0}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="propertyLimit"
              label="Property Limit (Use 0 or positive integers)"
              rules={[{ required: true }]}
            >
              <InputNumber 
                className="w-full" 
                placeholder="3" 
                min={0}
                precision={0}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="leadsLimit"
              label="Lead Share Count"
              rules={[{ required: true, message: "Please enter lead share count" }]}
            >
              <InputNumber 
                className="w-full" 
                placeholder="2" 
                min={1}
                precision={0}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (Days) - Leave empty for lifetime"
              rules={[{ required: false }]}
            >
              <InputNumber 
                className="w-full" 
                placeholder="30" 
                min={1}
                precision={0}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="features"
              label="Features (one per line)"
            >
              <Input.TextArea rows={3} placeholder="3 Property Uploads&#10;Basic Support" />
            </Form.Item>

            <Form.Item
              name="notIncluded"
              label="Not Included Features (one per line)"
            >
              <Input.TextArea rows={3} placeholder="Advanced Analytics&#10;Dedicated Support" />
            </Form.Item>

            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Star size={18} className="text-amber-500" /> Mark as Popular
              </span>
              <Form.Item name="isPopular" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>

            <Form.Item name="status" label="Status" initialValue="active">
              <Select>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>

            <div className="flex justify-end gap-3 pt-6">
              <Button onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-600 rounded-xl px-8 font-semibold shadow-md"
              >
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      </div> {/* End max-w-7xl */}

      <style>{`
        .ant-card {
            border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlanManager;
