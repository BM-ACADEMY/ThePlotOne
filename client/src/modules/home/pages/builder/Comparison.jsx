import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { message } from 'antd';
import { XCircle, CheckCircle2, ShieldCheck, MousePointerClick } from 'lucide-react';
import { checkPropertyListingLimit } from '@/utils/propertyLimits';

const Comparison = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const handlePostProperty = () => {
        if (isAuthenticated && user) {
            const { canPost, reason, message: limitMessage, redirectPath } = checkPropertyListingLimit(user);

            if (!canPost) {
                message.warning({
                    content: limitMessage,
                    key: "verification-restricted"
                });

                if (reason === "unverified") {
                    const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
                    if (role === "SELLER") {
                        navigate("/seller/profile");
                    } else {
                        navigate("/user/profile");
                    }
                } else if (reason === "limit_reached") {
                    navigate(redirectPath || "/seller/upgrade-plan");
                }
                return;
            }

            const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
            if (role === "ADMIN") {
                navigate("/admin/properties/add");
            } else if (role === "SELLER") {
                navigate("/seller/add-property");
            } else {
                navigate("/add-property");
            }
        } else {
            navigate("/post-property");
        }
    };

    const issues = [
    "No consistent leads",
    "Depend on brokers",
    "Slow-moving inventory"
  ];

  const solutions = [
    "Dedicated project promotion",
    "Lead generation campaigns",
    "Direct buyer inquiries",
    "Local + Chennai audience targeting"
  ];

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Header Label - Matching Hero Badge Style */}
        <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 px-4 py-1.5 rounded-full shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
                <span className="text-[#0e182b] text-[11px] font-bold tracking-wider uppercase">
                    Trusted by Developers
                </span>
            </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Problem Card (Red) */}
          <div className="bg-[#fbe0da] rounded-2xl p-8 lg:p-12 relative shadow-lg shadow-red-100/50 flex flex-col justify-between">
            <div>
                <h3 className="text-3xl lg:text-3xl font-bold text-[#0e182b] mb-8 leading-[1.2] tracking-tight">
                Are you facing these <br className="hidden sm:block" /> project challenges?
                </h3>
                <ul className="space-y-5">
                {issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-[#ef4444] mt-0.5" />
                        <span className="text-base text-[#38526e] font-semibold leading-relaxed">{issue}</span>
                    </li>
                ))}
                </ul>
            </div>
          </div>

          {/* Right Column: Solution Card (Green) */}
          <div className="bg-[#d9f2d0] rounded-2xl p-8 lg:p-12 relative shadow-lg shadow-green-100/50 flex flex-col justify-between">
            <div>
                <h3 className="text-3xl lg:text-3xl font-bold text-[#0e182b] mb-8 leading-[1.2] tracking-tight">
                Sell Projects Faster with <br className="hidden sm:block" /> The Plot One:
                </h3>
                <ul className="space-y-5">
                {solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[#22c55e] mt-0.5" />
                        <span className="text-base text-[#38526e] font-semibold leading-relaxed">{solution}</span>
                    </li>
                ))}
                </ul>
            </div>
          </div>

        </div>

        {/* Footer CTA - Exact Hero Button Style */}
        <div className="mt-16 flex flex-col items-center gap-4">
            <button 
                onClick={handlePostProperty}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1aa554] hover:bg-[#168a44] cursor-pointer text-white text-xl font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:scale-95 leading-none flex items-center gap-2"
            >
                <MousePointerClick className="w-6 h-6" />
                Get Verified Leads Now
            </button>
            <div className="text-[#38526e] font-bold text-base flex items-center gap-2">
                Start Selling Your Project Faster Today!
            </div>
        </div>

      </div>
    </section>
  );
};

export default Comparison;
