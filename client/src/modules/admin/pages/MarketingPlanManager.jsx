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
  Switch,
} from "antd";
import { Plus, Edit, Trash2, Megaphone, CheckCircle, MoreVertical, IndianRupee } from "lucide-react";
import axios from "axios";
import { Dropdown } from "antd";
import Loader from "@/components/Common/Loader";

const API = import.meta.env.VITE_API_URL;

const MarketingPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/marketing/plans/admin`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setPlans(res.data.data);
    } catch {
      message.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
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
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/marketing/plans/${id}`, {
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
      };

      if (editingPlan) {
        await axios.put(
          `${API}/marketing/plans/${editingPlan._id}`,
          payload,
          config
        );
        message.success("Plan updated");
      } else {
        await axios.post(`${API}/marketing/plans`, payload, config);
        message.success("Plan created");
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      message.error(error.response?.data?.error || "Operation failed");
    }
  };

  const PlanCard = ({ plan }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden h-full group">
      {/* Plan Header */}
      <div className="p-6 pb-4 border-b border-gray-50 relative">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {plan.serviceName}
          </h3>
          <Tag color={plan.status === "active" ? "green" : "red"} className="rounded-lg px-3 py-1 border-none shadow-sm capitalize">
            {plan.status}
          </Tag>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 h-10">
          {plan.description}
        </p>

        {/* Dropdown Menu for Actions */}
        <div className="absolute top-4 right-4 opacity-100 transition-opacity">
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
                      <span>Delete Plan</span>
                    </Popconfirm>
                  ),
                  icon: <Trash2 size={14} />,
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreVertical size={18} />} className="hover:bg-gray-100 rounded-full flex items-center justify-center p-0 w-8 h-8" />
          </Dropdown>
        </div>
      </div>

      {/* Plan Price */}
      <div className="px-6 py-4 bg-gray-50/50">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">₹{plan.priceRange}</span>
        </div>
      </div>



      {/* Footer / Mobile Actions */}
      <div className="p-6 pt-0 mt-auto md:hidden">
        <Button 
          block 
          type="dashed" 
          icon={<Edit size={16} />}
          onClick={() => handleEdit(plan)}
          className="mb-2"
        >
          Manage Plan
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 relative min-h-[400px]">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
              <Megaphone size={24} />
            </div>
            Marketing Plans
          </h1>

          <p className="text-gray-500 text-sm">
            Manage promotional packages for sellers
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 h-auto py-2.5 px-6 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          Add New Plan
        </Button>

      </div>

      {/* Grid Layout */}
      {loading ? (
        <Loader variant="panel" />
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-200 text-center">
          <p className="text-gray-400 font-medium">No marketing plans found. Create your first one!</p>
        </div>
      )}

      {/* Modal */}
      <Modal
        title={editingPlan ? "Edit Marketing Plan" : "Create Marketing Plan"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
      >

        <Form layout="vertical" form={form} onFinish={onFinish}>

          <Form.Item
            name="serviceName"
            label="Service Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Basic Package" />
          </Form.Item>

          <Form.Item
            name="priceRange"
            label="Price Range"
            rules={[{ required: true }]}
          >
            <Input placeholder="₹4,999 / Custom" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} placeholder="Short summary of the plan" />
          </Form.Item>

          <Form.Item name="isPopular" label="Mark as Popular" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 pt-6">
            <Button 
                onClick={() => setIsModalOpen(false)} 
                size="large"
                className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="bg-blue-600 rounded-xl px-8 font-semibold shadow-md"
            >
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>

        </Form>
      </Modal>

    </div>
  );
};

export default MarketingPlanManager;