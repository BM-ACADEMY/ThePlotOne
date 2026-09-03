import React from "react";
import { Typography, Breadcrumb, Divider } from "antd";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const { Title, Paragraph, Text } = Typography;

const TermsAndConditions = () => {
  return (
    <div className="mt-28 max-w-4xl mx-auto p-4">
      <Helmet>
        <title>Terms & Conditions | The Plot One</title>
        <meta
          name="description"
          content="Read the terms and conditions governing the use of The Plot One website and services."
        />
      </Helmet>
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link to="/">Home</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Terms & Conditions</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2}>Terms & Conditions</Title>
      <Text type="secondary">Effective Date: February 26, 2026</Text>

      <div className="mt-8">
        <Paragraph>
          Welcome to <strong>The Plot One</strong> (“Company”, “We”,
          “Our”, or “Us”). These Terms & Conditions govern your use of our
          website and real estate advisory services. By accessing or using our
          website, submitting inquiries, or engaging with our services, you
          agree to comply with these Terms. If you do not agree, please do not
          use our website or services.
        </Paragraph>

        <Divider />

        <section className="mb-8">
          <Title level={4}>1. About Our Services</Title>
          <Paragraph>
            The Plot One operates as a real estate advisory and
            property listing service in Kottakuppam, Puducherry, Tamil Nadu,
            India. Our services include:
          </Paragraph>
          <ul>
            <li>
              Property listings (plots, villas, apartments, commercial spaces)
            </li>
            <li>Real estate consultation</li>
            <li>Investment guidance</li>
            <li>Site visit coordination</li>
            <li>Buyer–seller connection facilitation</li>
          </ul>
          <Paragraph>
            We act as an intermediary between buyers and sellers unless
            explicitly stated otherwise.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>2. No Guarantee Clause</Title>
          <Paragraph>
            While we strive to provide accurate and updated information:
          </Paragraph>
          <ul>
            <li>
              We do not guarantee property appreciation or return on investment.
            </li>
            <li>
              We do not guarantee loan approvals from financial institutions.
            </li>
            <li>
              We do not guarantee completion timelines provided by third-party
              developers.
            </li>
            <li>
              Property decisions are made at the buyer’s sole discretion and
              risk.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <Title level={4}>3. Property Information Disclaimer</Title>
          <Paragraph>
            Property details including Pricing, Availability, Specifications,
            Measurements, and Amenities are subject to change without prior
            notice.
          </Paragraph>
          <Paragraph>
            We rely on information provided by property owners, developers, and
            partners. The Plot One is not responsible for inaccuracies
            beyond our control. Buyers are advised to independently verify all
            legal documents before purchase.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>4. User Responsibilities</Title>
          <Paragraph>By using our website or services, you agree:</Paragraph>
          <ul>
            <li>To provide accurate contact information</li>
            <li>Not to misuse the website for unlawful activities</li>
            <li>
              Not to reproduce or copy property listings without permission
            </li>
            <li>
              To conduct independent legal and financial due diligence before
              purchase
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <Title level={4}>5. Fees & Commissions</Title>
          <Paragraph>
            If applicable, brokerage or service fees will be communicated
            clearly before transaction closure. Fees once paid are
            non-refundable unless otherwise agreed in writing. Government
            charges, registration fees, stamp duty, and legal charges are the
            buyer’s responsibility unless stated otherwise.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>6. Communication Consent</Title>
          <Paragraph>
            By submitting your details on our website forms, WhatsApp buttons,
            or inquiry pages, you consent to receive Phone calls, SMS, WhatsApp
            messages, and Emails related to property listings, offers, site
            visits, and updates.
          </Paragraph>
          <Paragraph>
            You may opt out by contacting: <strong>info@nammapondy.com</strong>
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>7. Intellectual Property</Title>
          <Paragraph>
            All content on this website, including text, images, logos, property
            descriptions, and branding elements are the intellectual property of
            The Plot One and may not be copied, modified, or
            distributed without written permission.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>8. Limitation of Liability</Title>
          <Paragraph>
            The Plot One shall not be liable for property disputes
            between buyer and seller, financial losses due to market changes,
            legal issues related to property ownership, delays in project
            completion, or loan rejections.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>9. Third-Party Links</Title>
          <Paragraph>
            Our website may contain links to third-party websites or services.
            We are not responsible for their content, accuracy, or privacy
            practices.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>10. Governing Law & Jurisdiction</Title>
          <Paragraph>
            These Terms & Conditions are governed by the laws of India. Any
            disputes arising from the use of this website shall be subject to
            the exclusive jurisdiction of courts located in Kottakuppam,
            Puducherry, Tamil Nadu, India.
          </Paragraph>
        </section>

        <section className="mb-8">
          <Title level={4}>11. Changes to Terms</Title>
          <Paragraph>
            We reserve the right to modify or update these Terms & Conditions at
            any time without prior notice. Continued use of the website
            constitutes acceptance of updated terms.
          </Paragraph>
        </section>

        <Divider />

        <section>
          <Title level={4}>Contact Information</Title>
          <Paragraph>
            <strong>The Plot One</strong>
            <br />
            Kottakuppam, Puducherry, Tamil Nadu, India
            <br />
            Email: info@nammapondy.com
          </Paragraph>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions;
