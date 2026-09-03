import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, message, InputNumber, Divider, Select } from "antd";
import { Save } from "lucide-react";
import axios from "axios";

const GeneralSettings = () => {
    const [loading, setLoading] = useState(false);
    const [settingsId, setSettingsId] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/website-settings`);
            if (res.data && res.data.length > 0) {
                const settings = res.data[0];
                setSettingsId(settings._id);
                form.setFieldsValue(settings);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            message.error("Failed to load settings");
        }
    };

    const handleSave = async (values) => {
        setLoading(true);
        try {
            if (settingsId) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/website-settings/${settingsId}`,
                    values,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/website-settings`,
                    values,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                fetchSettings(); // Refresh to get ID
            }
            message.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            message.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">General Settings</h1>
            <Card className="max-w-3xl shadow-sm">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                >
                    <Divider orientation="left">Brokerage & Limits</Divider>
                    <Form.Item
                        name="sellerPropertyLimit"
                        label="Max Properties per Seller"
                        help="Sets the maximum number of properties a seller can list on the default plan."
                        initialValue={5}
                    >
                        <InputNumber min={1} className="w-full md:w-1/2" />
                    </Form.Item>

                    <Form.Item
                        name="defaultPlanName"
                        label="Default Subscription Plan Name"
                        help="Choose the default plan to show for sellers without an active subscription."
                        initialValue="Standard"
                    >
                        <Select className="w-full md:w-1/2" placeholder="Select Plan">
                            <Select.Option value="Standard">Standard</Select.Option>
                            <Select.Option value="Premium">Premium</Select.Option>
                            <Select.Option value="Pro">Pro</Select.Option>
                        </Select>
                    </Form.Item>

                    {/* Hidden fields to preserve structure if backend requires them, or just omit if backend handles partial updates (which it should with findByIdAndUpdate) */}
                    <Form.Item name="site_name" hidden><Input /></Form.Item>

                    <div className="flex justify-end mt-4">
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<Save size={18} />}
                            loading={loading}
                            size="large"
                        >
                            Save Settings
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default GeneralSettings;
