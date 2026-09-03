import React from 'react';
import { Row, Col } from 'antd';
import { 
  CompassOutlined,
  FileProtectOutlined, 
  AuditOutlined, 
  TeamOutlined, 
  SolutionOutlined
} from '@ant-design/icons';

export default function WhyChooseUs() {
  const features = [
    {
      title: "Local Market Expertise",
      desc: "Strong local market knowledge to guide you to the best opportunities in Pondicherry.",
      icon: <CompassOutlined />
    },
    {
      title: "Verified Titles",
      desc: "100% verified and clear title properties. We do the due diligence so you don't have to.",
      icon: <FileProtectOutlined />
    },
    {
      title: "Transparent Process",
      desc: "Clear pricing and honest processes. No hidden charges, no surprises.",
      icon: <AuditOutlined />
    },
    {
      title: "Personalized Guidance",
      desc: "We listen to your specific needs and tailor our search to find your perfect match.",
      icon: <TeamOutlined />
    },
    {
      title: "End-to-End Support",
      desc: "From the first site visit to the final registration, we are with you every step of the way.",
      icon: <SolutionOutlined />
    }
  ];

  return (
    /* Background changed to Smoky White/Light Grey */
    <section className="bg-[#F8F9FA] py-24 relative overflow-hidden font-sans">
      
      {/* Subtle Pattern to add depth to the smoky background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#050B14 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            The The Plot One Difference
          </span>
          {/* UPDATED: Changed font-bold to font-light */}
          <h2 className="text-4xl md:text-5xl font-light text-[#050B14] mb-6">
            Why Choose Us?
          </h2>
          <div className="w-16 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
        </div>

        {/* FEATURES GRID */}
        <Row gutter={[32, 32]} justify="center">
          {features.map((item, index) => (
            <Col xs={24} md={12} lg={8} key={index} className="flex">
              {/* Cards now have visible borders (border-gray-200) and white backgrounds */}
              <div className="w-full bg-white border border-gray-200 hover:border-[#D4AF37] p-8 rounded-2xl transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2 flex flex-col items-center text-center">
                
                {/* Icon Container with defined border */}
                <div className="w-16 h-16 bg-[#050B14] border border-[#D4AF37]/40 rounded-full flex items-center justify-center text-3xl text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-[#050B14] transition-all duration-300 shadow-md">
                  {item.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#050B14] mb-4 group-hover:text-[#D4AF37] transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>

              </div>
            </Col>
          ))}
        </Row>

        {/* CLOSING STATEMENT */}
        <div className="mt-20 text-center">
          <p className="text-xl md:text-2xl font-light text-gray-500 italic">
            "We prioritize <span className="text-[#D4AF37] font-semibold">long-term relationships</span> over short-term gains."
          </p>
        </div>

      </div>
    </section>
  );
}