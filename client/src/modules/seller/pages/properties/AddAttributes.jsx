import React, { useState } from "react";
import { Card, Form, Input, Button, message, Space, Typography } from "antd";
import { PlusCircle, Trash2 } from "lucide-react";

const { Title } = Typography;

const AddAttributes = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = (values) => {
        console.log("Form values:", values);
        message.success("Attributes saved successfully!");
        form.resetFields();
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <Title level={2} className="!mb-0">
                    Add Property Attributes
                </Title>
                <p className="text-gray-500">
                    Define key-value attributes for your properties (e.g., "Bedrooms: 3", "Parking: Yes")
                </p>
            </div>

            <Card className="shadow-sm border-none max-w-4xl">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        attributes: [{ key: "", value: "" }],
                    }}
                >
                    <Form.List name="attributes">
                        {(fields, { add, remove }) => (
                            <>
                                <div className="space-y-4">
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space
                                            key={key}
                                            className="flex items-start w-full"
                                            align="baseline"
                                        >
                                            <Form.Item
                                                {...restField}
                                                name={[name, "key"]}
                                                label={name === 0 ? "Attribute Name" : ""}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Please enter attribute name",
                                                    },
                                                ]}
                                                className="flex-1 mb-0"
                                            >
                                                <Input
                                                    placeholder="e.g., Bedrooms, Bathrooms, Parking"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, "value"]}
                                                label={name === 0 ? "Attribute Value" : ""}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Please enter attribute value",
                                                    },
                                                ]}
                                                className="flex-1 mb-0"
                                            >
                                                <Input
                                                    placeholder="e.g., 3, 2, Yes"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            {fields.length > 1 && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<Trash2 size={16} />}
                                                    onClick={() => remove(name)}
                                                    className={name === 0 ? "mt-6" : ""}
                                                />
                                            )}
                                        </Space>
                                    ))}
                                </div>

                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusCircle size={18} />}
                                    size="large"
                                    className="mt-4"
                                >
                                    Add Another Attribute
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <div className="mt-6 flex gap-3">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            className="bg-blue-600"
                        >
                            Save Attributes
                        </Button>
                        <Button
                            size="large"
                            onClick={() => form.resetFields()}
                        >
                            Clear All
                        </Button>
                    </div>
                </Form>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                        📝 How to use:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1 ml-4">
                        <li>• Add key-value pairs for property specifications</li>
                        <li>• These will be available when adding new properties</li>
                        <li>• Examples: Bedrooms, Bathrooms, Square Feet, Year Built, etc.</li>
                        <li>• Click "Add Another Attribute" to add more fields</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default AddAttributes;
