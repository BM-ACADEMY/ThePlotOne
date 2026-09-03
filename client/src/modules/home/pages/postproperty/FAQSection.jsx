import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const FAQSection = () => {
    const faqs = [
        {
            question: "How to post a property on The Plot One?",
            answer: "Simply click the 'Post Property' button on our homepage. You'll need to provide basic details like property type, location in Pondicherry, price, and clear photos to help your listing stand out."
        },
        {
            question: "Is it free to list my house or land?",
            answer: "Yes, we offer a free listing tier for individual property owners in Pondicherry. You can reach local buyers and tenants without any upfront cost."
        },
        {
            question: "What types of properties can I list?",
            answer: "You can list any real estate within the Pondicherry region, including residential apartments, French-style villas, independent houses, commercial spaces, and DTCP approved plots."
        },
        {
            question: "How long does it take for my property to go live?",
            answer: "Once submitted, our team verifies the details to ensure quality. Your property usually goes live on the The Plot One portal within 2 to 4 hours."
        },
        {
            question: "How do I receive enquiries from interested buyers?",
            answer: "Enquiries are sent directly to your registered mobile number via WhatsApp or SMS, and you can also track all leads through your personal dashboard."
        }
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-white py-12 px-4 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Heading aligned left to match your reference image */}
                <h2 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-8">
                    Frequently asked questions
                </h2>

                <div className="flex flex-col border-t border-slate-200">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <div 
                                key={index} 
                                className="border-b border-slate-200 py-4 md:py-6"
                            >
                                {/* Question Button */}
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
                                >
                                    <h3 className={`text-[16px] md:text-[18px] font-medium transition-colors duration-200 pr-4 ${
                                        isOpen ? "text-[#1a2b4b]" : "text-[#475569] group-hover:text-[#1E293B]"
                                    }`}>
                                        {faq.question}
                                    </h3>
                                    
                                    <div className={`flex-shrink-0 transition-transform duration-300 ${
                                        isOpen ? "rotate-45 text-[#1a2b4b]" : "text-slate-400"
                                    }`}>
                                        <Plus className="w-5 h-5 md:w-6 h-6" />
                                    </div>
                                </button>

                                {/* Answer Content */}
                                <div 
                                    className={`grid transition-all duration-300 ease-in-out ${
                                        isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="text-[15px] md:text-[16px] text-[#64748B] leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;