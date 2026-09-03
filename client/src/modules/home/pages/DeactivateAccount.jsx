import { useState } from "react";
import { Typography, Breadcrumb, Divider, Button, Card } from "antd";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, AlertTriangle, Info, UserMinus, PhoneCall } from "lucide-react";
import RequestCallBackModal from "@/components/Common/RequestCallBackModal";

const { Title, Paragraph, Text } = Typography;

const DeactivateAccount = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mt-26 max-w-4xl mx-auto p-8 bg-white">
      <Helmet>
        <title>Deactivate Account | The Plot One</title>
        <meta
          name="description"
          content="Learn how to deactivate your account on The Plot One and understand our data retention policies."
        />
      </Helmet>
      
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Deactivate Account</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} className="text-gray-900 mb-2 font-sans flex items-center gap-3">
        <UserMinus className="text-red-500" /> Account Deactivation
      </Title>
      <Text type="secondary" className="block mb-10">Last Updated: May 11, 2026</Text>

      <div className="space-y-12">
        {/* 1. Steps to Deactivate */}
        <section>
          <Title level={3} className="text-blue-900 mb-6 flex items-center gap-2">
            <Info size={24} /> Steps to Deactivate Your Account
          </Title>
          <Paragraph className="text-gray-600 mb-6">
            To deactivate your account, please follow these steps:
          </Paragraph>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <ol className="list-decimal pl-6 space-y-4 text-gray-700">
              <li>
                <strong>Profile Settings:</strong> Log in to your account and navigate to your Profile Settings page.
              </li>
              <li>
                <strong>Request via Support:</strong> If you are unable to find the deactivation option in settings, you can send an email request to our support team.
              </li>
              <li>
                <strong>Verification:</strong> Our team may contact you to verify the request before proceeding with deactivation.
              </li>
              <li>
                <strong>Final Confirmation:</strong> Once verified, your account will be moved to a deactivated state.
              </li>
            </ol>
          </div>
        </section>

        {/* 2. What Happens After Deactivation */}
        <section>
          <Title level={3} className="text-blue-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-orange-500" /> What Happens After Deactivation?
          </Title>
          <Card className="border-orange-100 bg-orange-50/30">
            <ul className="list-disc pl-6 space-y-3 text-gray-600">
              <li>Your active property listings will be hidden from the public search results.</li>
              <li>You will no longer receive lead notifications via WhatsApp or Email.</li>
              <li>Your profile information will not be visible to other users.</li>
              <li>You can reactivate your account in the future by contacting our support team.</li>
            </ul>
          </Card>
        </section>

        {/* 3. Data Retention Policy */}
        <section>
          <Title level={3} className="text-blue-900 mb-6">Data Retention & Removal Policy</Title>
          <Paragraph className="text-gray-600">
            The Plot One complies with data protection regulations. When you deactivate your account:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-3 text-gray-600">
            <li>We retain basic transaction records and lead history for legal and compliance purposes for a period of up to 5 years.</li>
            <li>Sensitive personal data like secondary contact numbers or social links can be requested for permanent deletion.</li>
            <li>Backup logs may contain traces of your data for a limited period until they are automatically overwritten.</li>
          </ul>
        </section>

        {/* 4. Support Contact Information */}
        <section className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
          <Title level={4} className="text-blue-900 mb-4">Need Help Deactivating?</Title>
          <Paragraph className="text-gray-700 mb-6">
            If you're having trouble or would like to request immediate account deletion, please reach out to our support team:
          </Paragraph>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="primary" 
              icon={<Mail size={16} />} 
              href="mailto:help@nammapondyproperties.com"
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 h-12 px-6 rounded-xl"
            >
              Email Support
            </Button>
            <Button 
              icon={<Phone size={16} />} 
              href="tel:+919403892971"
              className="flex items-center gap-2 h-12 px-6 rounded-xl"
            >
              Call Us: +91 94038 92971
            </Button>
          </div>
        </section>

        <Divider />

        <div className="text-center pb-10">
          <Paragraph className="text-gray-500 italic">
            "We value your privacy and trust. If there is anything we can do to improve your experience before you leave, please let us know."
          </Paragraph>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 font-bold hover:text-blue-800 transition-colors inline-flex items-center gap-2"
          >
            <PhoneCall size={18} /> Request a call back
          </button>
        </div>
      </div>

      <RequestCallBackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default DeactivateAccount;
