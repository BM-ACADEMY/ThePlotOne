import React from 'react';
import { Row, Col } from 'antd';
import { ArrowRightOutlined, WhatsAppOutlined } from '@ant-design/icons';

export default function PropertyCTA() {
  return (
    <section className="bg-[#050B14] py-24 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#D4AF37]/5 rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-16 backdrop-blur-sm relative overflow-hidden">
          
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={16}>
              <div className="mb-4">
                <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs">
                  Your Trusted Partner
                </span>
              </div>

              {/* UPDATED: Changed font-bold to font-light */}
              <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
                Let’s Find Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]">
                  Perfect Property
                </span>
              </h2>

              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 font-light max-w-2xl">
                Whether you are a first-time buyer, investor, or property seller, <strong>Real Estate with Kamar</strong> is here to guide you with professionalism and integrity.
              </p>

              <div className="flex items-center gap-4">
                <p className="text-[#D4AF37] font-semibold italic text-sm md:text-base">
                  The Plot One – Your Trusted Real Estate Partner in Pondicherry.
                </p>
              </div>
            </Col>

            <Col xs={24} lg={8} className="flex flex-col gap-10">
              
              {/* Main Contact Button */}
              <button className="w-full flex items-center justify-center gap-3 bg-[#D4AF37] text-[#050B14] font-extrabold py-4 px-8 rounded-xl hover:bg-white transition-all duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.2)] group">
                <span className="uppercase tracking-widest text-sm">Contact Us Today</span>
                <ArrowRightOutlined className="text-xl group-hover:translate-x-2 transition-transform" />
              </button>

              {/* WhatsApp Secondary Option */}
              <button className="w-full mt-2 flex items-center justify-center gap-3 bg-white/10 text-white border border-white/10 font-extrabold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300">
                <WhatsAppOutlined className="text-[#25D366] text-xl" />
                <span className="uppercase tracking-widest text-sm">WhatsApp Chat</span>
              </button>
              
              <div className="text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium">
                  Explore the best property opportunities.
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
}