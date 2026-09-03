import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

export default function OurVision() {
  const navigate = useNavigate();

  return (
    /* Section background matches What We Do and Why Choose Us */
    <section className="bg-gray-50 py-24 relative overflow-hidden font-sans border-t border-gray-100">

      {/* Background Decor: Matches the subtle texture used in Why Choose Us */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#050B14 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <Row gutter={[80, 48]} align="middle">

          {/* LEFT SIDE: ARCHITECTURAL ILLUSTRATION */}
          <Col xs={24} lg={12}>
            <div className="relative group">
              {/* Image Container with visible edges */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white p-2">
                <img
                  src="/about/vission.webp"
                  alt="The Plot One Vision"
                  className="w-full h-auto rounded-xl"
                />
              </div>

              {/* Gold Vector Decor */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l-2 border-b-2 border-[#D4AF37]/30 -z-10 rounded-bl-3xl"></div>
            </div>
          </Col>

          {/* RIGHT SIDE: CONTENT */}
          <Col xs={24} lg={12}>
            <div className="max-w-xl">

              {/* Heading */}
              <div className="mb-6">
                <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs border border-[#D4AF37]/30 px-4 py-2 rounded-full bg-white">
                  Our Future
                </span>
              </div>

              {/* UPDATED: Changed font-bold to font-light */}
              <h2 className="text-4xl md:text-5xl font-light text-[#050B14] mb-8">
                Our Vision
              </h2>

              {/* Provided Content */}
              <div className="space-y-6 text-gray-500 text-lg leading-relaxed mb-10">
                <p>
                  To become one of the most trusted and reliable real estate brands in Pondicherry by delivering honest services and helping clients make confident property decisions.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/contact')}
                className="flex items-center gap-3 bg-[#D4AF37] text-[#050B14] font-bold py-4 px-8 rounded-lg hover:bg-[#050B14] hover:text-white transition-all duration-300 shadow-lg group cursor-pointer"
              >
                <span>Contact Us</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </button>

            </div>
          </Col>

        </Row>
      </div>
    </section>
  );
}