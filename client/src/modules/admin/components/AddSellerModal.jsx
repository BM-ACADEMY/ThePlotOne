import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Switch, Button, Row, Col, message } from "antd";
import { Users } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const AddSellerModal = ({
  open,
  onClose,
  onSuccess,
  businessTypes = [],
  admins = [],
  defaultBusinessType,
}) => {
  const { user: currentUser } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Only pre-select a type that is actually in the (active) list
  const initialBusinessType = businessTypes.some((t) => t._id === defaultBusinessType)
    ? defaultBusinessType
    : undefined;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ businessType: initialBusinessType });
    }
  }, [open, initialBusinessType, form]);

  const handleAddSeller = async (values) => {
    setSubmitting(true);
    try {
      const response = await api.post("/users/create-seller-by-admin", values);
      if (response.data?.status === "promoted") {
        message.success("This number already had a user account — it has been promoted to seller");
      } else {
        message.success("New seller created successfully");
      }
      form.resetFields();
      onSuccess?.(response.data?.user);
      onClose();
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to create seller");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add New Seller"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAddSeller}
        className="mt-4"
        initialValues={{ badgeVerified: false, businessType: initialBusinessType }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, whitespace: true, message: "Please enter seller name" }]}
            >
              <Input placeholder="Enter name" prefix={<Users size={16} className="text-gray-400" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter phone number" },
                { pattern: /^[0-9]{10}$/, message: "Please enter a valid 10-digit number" }
              ]}
            >
              <Input
                placeholder="10-digit phone number"
                maxLength={10}
                prefix={<span className="text-gray-400">+91</span>}
              />
            </Form.Item>
          </Col>
        </Row>

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

        <Form.Item name="badgeVerified" label="Mark as verified" valuePropName="checked">
          <Switch />
        </Form.Item>

        {currentUser?.isSuperAdmin && (
          <Form.Item name="assignedAdmin" label="Assigned Admin">
            <Select placeholder="Select admin (optional)" allowClear>
              {admins.map((admin) => (
                <Select.Option key={admin._id} value={admin._id}>
                  {admin.name || admin.phone}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
            Create Seller
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSellerModal;
