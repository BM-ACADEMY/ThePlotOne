import React from 'react';
import { MapPin, ShieldCheck, BadgeDollarSign, Users, Handshake } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../../../../public/Logo/logo.webp'; 

const WhyChooseUs = () => {
    const brandBlue = "#1a65a4";
    const brandYellow = "#eeb920";

    // Reusable Card Component 
    const FeatureCard = ({ title, description, icon }) => (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 flex items-start gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-shadow duration-300 border border-white relative z-10 w-full h-full">
            <div 
                className="flex-shrink-0 drop-shadow-sm mt-1"
                style={{ color: brandYellow }} 
            >
                {icon}
            </div>
            <div>
                <h3 className="font-medium text-lg text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );

    // --- Faster Animation Variants ---
    // Change this number to quickly make ALL slide/fade animations faster or slower
    const baseSpeed = 0.4; 

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: baseSpeed, ease: "easeOut" } }
    };

    const slideRight = {
        hidden: { opacity: 0, x: -40 },
        visible: { opacity: 1, x: 0, transition: { duration: baseSpeed, ease: "easeOut" } }
    };

    const slideLeft = {
        hidden: { opacity: 0, x: 40 },
        visible: { opacity: 1, x: 0, transition: { duration: baseSpeed, ease: "easeOut" } }
    };

    // Snappier spring animation for the logo
    const popIn = {
        hidden: { opacity: 0, scale: 0.85 },
        visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 12 } }
    };

    return (
        <section className="relative py-20 overflow-hidden bg-slate-50">
            {/* Subtle background decoration */}
            {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>
            </div> */}

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                
                {/* Header Section */}
                <motion.div 
                    className="text-center mb-16 max-w-3xl mx-auto"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUp}
                >
                   
                    
                    <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
                        The ThePlotOne Difference
                    </h2>
                    
                    <p className="text-slate-600 text-lg leading-relaxed font-light">
                        We make property buying <span className="font-medium text-slate-800">simple, secure,</span> and <span className="font-medium text-slate-800">transparent.</span><br className="hidden sm:block" />
                        Partner with us for a seamless real estate experience.
                    </p>
                </motion.div>

                {/* Main Layout Grid */}
                <div className="relative">
                    
                    {/* Dashed Connecting Circle (Desktop Only) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.6 }}
                        transition={{ duration: 1, delay: 0.2 }} // Sped up the background fade-in
                        viewport={{ once: true }}
                        className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] border-2 border-dashed border-blue-300 rounded-full z-0 hidden lg:block pointer-events-none"
                    ></motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
                        
                        {/* Left Column (Slides in from the left) */}
                        <div className="flex flex-col gap-8 lg:gap-16 justify-center lg:translate-y-[-2rem]">
                            <motion.div 
                                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideRight}
                            >
                                <FeatureCard 
                                    title="Local Market Expertise"
                                    description="Strong local market knowledge to guide you to the best opportunities in Pondicherry."
                                    icon={<MapPin className="w-10 h-10" />}
                                />
                            </motion.div>
                            <motion.div 
                                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideRight} transition={{ delay: 0.15 }} // Reduced delay
                            >
                                <FeatureCard 
                                    title="Transparent Process"
                                    description="Clear pricing and honest processes. No hidden charges, no surprises."
                                    icon={<BadgeDollarSign className="w-10 h-10" />}
                                />
                            </motion.div>
                        </div>

                        {/* Center Column (Logo pops in, 5th card fades up) */}
                        <div className="flex flex-col items-center justify-center gap-12 relative z-10">
                            {/* Logo */}
                            <motion.div 
                                className="relative w-72 md:w-80 transition-transform duration-500 hover:scale-105"
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={popIn}
                            >
                                <img 
                                    src={logo} 
                                    alt="The Plot One Logo" 
                                    className="w-full h-auto drop-shadow-2xl relative z-10"
                                />
                            </motion.div>

                            {/* 5th Card perfectly centered below the logo */}
                            <motion.div 
                                className="w-full lg:w-[120%] lg:absolute lg:top-[110%] mt-8 lg:mt-0"
                                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} transition={{ delay: 0.3 }} // Reduced delay
                            >
                                <FeatureCard 
                                    title="End-to-End Support"
                                    description="From the first site visit to the final registration, we are with you every step of the way."
                                    icon={<Handshake className="w-10 h-10" />}
                                />
                            </motion.div>
                        </div>

                        {/* Right Column (Slides in from the right) */}
                        <div className="flex flex-col gap-8 lg:gap-16 justify-center lg:translate-y-[-2rem]">
                            <motion.div 
                                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideLeft}
                            >
                                <FeatureCard 
                                    title="Verified Titles"
                                    description="100% verified and clear title properties. We do the due diligence so you don't have to."
                                    icon={<ShieldCheck className="w-10 h-10" />}
                                />
                            </motion.div>
                            <motion.div 
                                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideLeft} transition={{ delay: 0.15 }} // Reduced delay
                            >
                                <FeatureCard 
                                    title="Personalized Guidance"
                                    description="We listen to your specific needs and tailor our search to find your perfect match."
                                    icon={<Users className="w-10 h-10" />}
                                />
                            </motion.div>
                        </div>

                    </div>
                    
                    {/* Spacer to handle absolute positioning of the 5th card on Desktop */}
                    <div className="hidden lg:block h-32"></div>

                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;