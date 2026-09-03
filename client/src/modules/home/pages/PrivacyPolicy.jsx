import React from "react";
import { Typography, Breadcrumb, Divider } from "antd";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy = () => {
  return (
    <div className="mt-26 max-w-4xl mx-auto p-8 bg-white">
      <Helmet>
        <title>Legal Policies | The Plot One</title>
        <meta
          name="description"
          content="Privacy Policy, Refund Policy, and Lead Agreement for The Plot One."
        />
      </Helmet>
      
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Legal Policies</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} className="text-gray-900 mb-2 font-sans">Legal Policies & Agreements</Title>
      <Text type="secondary" className="block mb-10">Last Updated: April 7, 2026</Text>

      <div className="space-y-16">
        {/* 1. PRIVACY POLICY */}
        <section id="privacy-policy">
          <Title level={3} className="text-blue-900 mb-6">1. PRIVACY POLICY</Title>
          <Paragraph className="text-lg font-medium text-gray-800 italic mb-6">
            Privacy Policy – The Plot One
          </Paragraph>
          <Paragraph className="text-gray-600 mb-8">
            The Plot One (“we”, “our”, “platform”) operates as a real estate listing and lead generation platform based in Pondicherry.
          </Paragraph>

          <Divider />

          {[
            {
              title: "1. Information We Collect",
              content: ["Name", "Phone number", "Email address (if provided)", "Property preferences (budget, location, type)", "Property details (for agents/builders/owners)"]
            },
            {
              title: "2. How We Use Your Information",
              content: ["Connect buyers with relevant agents/builders", "Share property details and updates", "Provide customer support", "Improve our platform and services"]
            }
          ].map((item, idx) => (
            <div key={idx} className="mb-8">
              <Title level={4} className="text-gray-800 mb-3">{item.title}</Title>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {item.content.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
          ))}

          <div className="mb-8">
            <Title level={4} className="text-gray-800 mb-3">3. Lead Sharing</Title>
            <Paragraph className="text-gray-600">
              By submitting your details, you agree that your information may be shared with verified agents, builders, or property owners. This is done to help you receive relevant property options.
            </Paragraph>
          </div>

          <div className="mb-8">
            <Title level={4} className="text-gray-800 mb-3">4. WhatsApp & Communication Consent</Title>
            <Paragraph className="text-gray-600">
              By submitting your contact details, you consent to:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Receiving calls, SMS, and WhatsApp messages from our team</li>
                <li>Receiving property updates, offers, and follow-ups</li>
              </ul>
            </Paragraph>
          </div>

          {[
            {
              title: "5. Data Protection",
              text: "We take reasonable measures to protect your data. However, we do not guarantee complete security due to internet-based risks."
            },
            {
              title: "6. Third-Party Services",
              text: "We may use third-party tools such as WhatsApp API, CRM tools, and Advertising platforms. Your data may be processed through these systems."
            },
            {
              title: "7. User Responsibility",
              text: "Users must ensure information provided is accurate and no misuse of platform or data occurs."
            },
            {
              title: "8. Changes to Policy",
              text: "We may update this policy at any time. Users are advised to review periodically."
            }
          ].map((item, idx) => (
            <div key={idx} className="mb-8">
              <Title level={4} className="text-gray-800 mb-3">{item.title}</Title>
              <Paragraph className="text-gray-600">{item.text}</Paragraph>
            </div>
          ))}

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-10">
            <Title level={4} className="text-gray-800 mb-3">9. Contact Us</Title>
            <Paragraph className="mb-0 text-gray-700">
              For any queries:<br />
              Phone: <a href="tel:+919403892971" className="text-blue-600 hover:underline"><strong>+91 94038 92971</strong></a><br />
              Email: <a href="mailto:help@nammapondyproperties.com" className="text-blue-600 hover:underline"><strong>help@nammapondyproperties.com</strong></a>
            </Paragraph>
          </div>
          <Paragraph className="mt-8 font-semibold text-center text-gray-900 border-t border-gray-100 pt-6">
            By using our platform, you agree to this Privacy Policy.
          </Paragraph>
        </section>

        <Divider className="border-gray-200" />

        {/* 2. REFUND POLICY */}
        <section id="refund-policy">
          <Title level={3} className="text-blue-900 mb-6">2. REFUND POLICY</Title>
          <Paragraph className="text-lg font-medium text-gray-800 italic mb-8">
            Refund Policy – The Plot One
          </Paragraph>

          <div className="space-y-8">
            {[
              { title: "1. General Policy", text: "All payments made to The Plot One are non-refundable, unless explicitly stated." },
              { title: "2. Listing Plans", text: "Payments for listing plans (Free, Standard, Premium, Pro) are non-refundable. Once a listing is activated, no refund will be issued." },
              { title: "3. Lead Generation Services", text: "Lead generation services are non-refundable once the campaign is started. No guarantee on the number of leads or conversions." },
              { 
                title: "4. Marketing Services", 
                text: "Services such as Photo/video shoots, Ad campaigns, and Promotions are non-refundable once executed." 
              },
              { 
                title: "5. Exceptions", 
                text: "Refunds may be considered only if the service was not delivered at all or a duplicate payment was made." 
              },
              { title: "6. Processing Time", text: "If approved, refunds will be processed within 7–10 working days." }
            ].map((item, idx) => (
              <div key={idx}>
                <Title level={4} className="text-gray-800 mb-3">{item.title}</Title>
                <Paragraph className="text-gray-600">{item.text}</Paragraph>
              </div>
            ))}

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Title level={4} className="text-gray-800 mb-3">7. Contact</Title>
              <Paragraph className="mb-0 text-gray-700">
                For refund-related queries:<br />
                Phone: <a href="tel:+919403892971" className="text-blue-600 hover:underline"><strong>+91 94038 92971</strong></a><br />
                Email: <a href="mailto:help@nammapondyproperties.com" className="text-blue-600 hover:underline"><strong>help@nammapondyproperties.com</strong></a>
              </Paragraph>
            </div>
          </div>
          <Paragraph className="mt-8 font-semibold text-center text-gray-900 border-t border-gray-100 pt-6">
            By purchasing any service, you agree to this refund policy.
          </Paragraph>
        </section>

        <Divider className="border-gray-200" />

        {/* 3. WHATSAPP CONSENT */}
        <section id="whatsapp-consent">
          <Title level={3} className="text-blue-900 mb-6 font-sans flex items-center gap-3">
            3. WHATSAPP CONSENT MESSAGE
          </Title>
          <div className="bg-blue-50/50 p-8 rounded-3xl border-2 border-dashed border-blue-100">
            <Paragraph className="text-lg font-medium text-blue-900 leading-relaxed mb-0">
              “By submitting your details, you agree to receive calls, SMS, and WhatsApp messages from The Plot One regarding property listings, offers, and services. Your information may be shared with relevant agents or builders to help you find suitable properties.”
            </Paragraph>
          </div>
        </section>

        <Divider className="border-gray-200" />

        {/* 4. LEAD AGREEMENT */}
        <section id="lead-agreement">
          <Title level={3} className="text-blue-900 mb-6">4. LEAD AGREEMENT FOR AGENTS / BUILDERS</Title>
          <Paragraph className="text-lg font-medium text-gray-800 italic mb-8">
            Lead Usage Agreement – The Plot One
          </Paragraph>

          <div className="space-y-8">
            {[
              { title: "1. Lead Ownership", text: "All leads are generated by The Plot One and are shared for business purposes only." },
              { 
                title: "2. Usage Terms", 
                content: ["To use leads only for property-related communication", "Not to misuse, spam, or harass customers", "Not to resell or redistribute leads"]
              },
              { title: "3. No Guarantee", text: "We do not guarantee lead conversion, buyer intent, or sale closure." },
              { title: "4. Payment Terms", text: "Leads provided under paid plans or packages are non-refundable. Payments must be made in advance." },
              { title: "5. Misuse Policy", text: "If any misuse is found, access to leads will be terminated and no refund will be issued." },
              { title: "6. Platform Rights", text: "We reserve the right to modify lead pricing, change distribution methods, or suspend accounts." },
              { title: "7. Liability", text: "We are not responsible for any transaction between buyer and agent, or any disputes arising from communication." }
            ].map((item, idx) => (
              <div key={idx}>
                <Title level={4} className="text-gray-800 mb-3">{item.title}</Title>
                {item.content ? (
                  <ul className="list-disc pl-6 space-y-2 text-gray-600">
                    {item.content.map((point, i) => <li key={i}>{point}</li>)}
                  </ul>
                ) : (
                  <Paragraph className="text-gray-600">{item.text}</Paragraph>
                )}
              </div>
            ))}

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Title level={4} className="text-gray-800 mb-3">8. Acceptance & Contact</Title>
              <Paragraph className="text-gray-600 mb-4">
                By using our platform and receiving leads, you agree to this agreement.
              </Paragraph>
              <Paragraph className="mb-0 text-gray-700">
                Phone: <a href="tel:+919403892971" className="text-blue-600 hover:underline"><strong>+91 94038 92971</strong></a><br />
                Email: <a href="mailto:help@nammapondyproperties.com" className="text-blue-600 hover:underline"><strong>help@nammapondyproperties.com</strong></a>
              </Paragraph>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;


