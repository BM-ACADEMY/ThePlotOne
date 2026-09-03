import React from 'react';
import { Row, Col, ConfigProvider } from 'antd';


export default function AboutHero() {

  const goldColor = '#D4AF37';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: goldColor,
          fontFamily: 'inherit',
        },
      }}
    >
      {/* --- HERO SECTION --- */}
      <section className="relative font-sans min-h-[700px] flex items-center overflow-hidden">

        {/* 1. Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')"
          }}
        ></div>

        {/* 2. Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-[#050B14]/85"></div>

        {/* 3. Main Content Container */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10 py-20">
          <Row gutter={[64, 48]} align="middle">

            {/* --- LEFT SIDE: HEADINGS & INTRO --- */}
            <Col xs={24} lg={12}>
              <div className="text-white">

                {/* Badge */}
                <div className="inline-block px-3 py-1 border border-[#D4AF37]/50 rounded-full mb-6">
                  <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">
                    About Us
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-6xl leading-[1.15] mb-8">
                  <span className="font-light block text-white">Welcome to</span>
                  <span className="text-[#D4AF37] font-normal block">The Plot One</span>
                </h1>

                {/* Introduction Paragraph */}
                <p className="text-gray-300 text-lg font-light leading-relaxed max-w-lg mb-8">
                  The Plot One is a trusted real estate service dedicated to helping individuals and families buy, sell, and invest in properties across Pondicherry.
                </p>



              </div>
            </Col>

            {/* --- RIGHT SIDE: QUOTE (NO CARD) --- */}
            <Col xs={24} lg={12}>
              <div className="relative pl-8 md:pl-12 py-4">

                {/* Gold Vertical Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#D4AF37] to-transparent/10"></div>



                {/* The Quote Content */}
                <h3 className="text-white font-light text-2xl md:text-3xl italic leading-relaxed mb-6">
                  "We believe real estate is more than transactions — it’s about <span className="text-[#D4AF37] font-normal not-italic">building dreams and securing futures.</span>"
                </h3>

                {/* Secondary Paragraph */}
                <p className="text-gray-400 font-light text-sm leading-relaxed max-w-md">
                  With strong local expertise, we guide our clients with clarity and honesty. Whether you are searching for residential plots or commercial properties, we are here to help.
                </p>

              </div>
            </Col>

          </Row>
        </div>
      </section>
    </ConfigProvider>
  );
}