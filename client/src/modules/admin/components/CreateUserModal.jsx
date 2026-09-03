import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Select, Switch } from "antd";
import { User, Mail, Phone, Lock } from "lucide-react";
import api from "@/services/api";

const CreateUserModal = ({
  visible,
  onClose,
  initialRole,
  refreshData,
  editingUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();


  // Use effect to populate form when editingUser changes or modal opens
  useEffect(() => {
    if (visible) {
      if (editingUser) {
        form.setFieldsValue({
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          badgeVerified: editingUser.badgeVerified,
          status: editingUser.status || "active",
          // Password is usually not pre-filled for security
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingUser, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/users/update-user-by-id/${editingUser._id}`, {
          name: values.name,
          phone: values.phone,
          badgeVerified: values.badgeVerified,
          status: values.status,
          // Only send password if it's provided (optional for edit)
          ...(values.password ? { password: values.password } : {}),
        });
        message.success(
          `${initialRole === "seller" ? "Seller" : "User"} updated successfully!`,
        );
      } else {
        // Create new user
        await api.post("/users/create-user-by-admin", {
          ...values,
          role: initialRole,
        });
        message.success(
          `${initialRole === "seller" ? "Seller" : "User"} created successfully!`,
        );
      }

      form.resetFields();
      refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.error ||
        `Failed to ${editingUser ? "update" : "create"} ${initialRole}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editingUser;

  return (
    <Modal
      title={`${isEdit ? "Edit" : "Create New"} ${initialRole === "seller" ? "Seller" : "User"}`}
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: initialRole }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter name" }]}
        >
          <Input prefix={<User size={16} />} placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            placeholder="Email"
            disabled={isEdit}
            prefix={<Mail size={16} />}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: "Please enter phone number" }]}
        >
          <Input
            prefix={<Phone size={16} />}
            placeholder="Enter phone number"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={isEdit ? "New Password (Optional)" : "Password"}
          rules={
            isEdit ? [] : [{ required: true, message: "Please enter password" }]
          }
        >
          <Input.Password
            prefix={<Lock size={16} />}
            placeholder={isEdit ? "Enter to change password" : "Enter password"}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Account Status"
          initialValue="active"
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="badgeVerified"
          label="Verified Badge"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>


        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full sm:w-auto"
          >
            {isEdit ? "Update" : "Create"}{" "}
            {initialRole === "seller" ? "Seller" : "User"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
