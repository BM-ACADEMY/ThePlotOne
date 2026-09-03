import { useState, useEffect } from "react";
import { 
  Check, X, Zap, Award, Star, IndianRupee, ShieldCheck, Ticket, 
  ChevronRight, Tag, Percent, Info, Trash2, ArrowRight
} from "lucide-react";
import { Card, Button, message, Row, Col, Input, Modal, Space, Typography, Divider, Badge, Drawer } from "antd";
import api from "@/services/api";
import Loader from "@/components/Common/Loader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;

const UpgradePlan = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();
  const { user, refetchUser } = useAuth();
  const [settings, setSettings] = useState(null);
  
  // Modal/Drawer States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Coupon States
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get("/subscriptions/plans");
      const dynamicPlans = res.data.filter(p => p.name !== "Free").map(p => ({
        ...p,
        name: (p.displayName || p.name).toUpperCase(), 
        internalName: p.name,
        features: p.features || [],
        notIncluded: p.notIncluded || [],
        isPopular: p.isPopular || false
      }));
      setPlans(dynamicPlans);
    } catch {
      message.error("Failed to load plans");
      setPlans([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubscription = async () => {
    try {
      const res = await api.get("/subscriptions/my-subscription");
      setCurrentSubscription(res.data);
    } catch (error) {
      console.error("No active subscription");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/website-settings");
      if (res.data && res.data.length > 0) {
        setSettings(res.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchAvailableCoupons = async (price) => {
    try {
      const res = await api.get(`/coupons/get-valid?planPrice=${price}`);
      setAvailableCoupons(res.data);
    } catch (err) {
      console.error("Failed to fetch coupons");
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
    fetchSettings();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setAppliedCoupon(null);
    setManualCouponCode("");
    setIsCheckoutOpen(true);
    fetchAvailableCoupons(plan.price);
  };

  const handleApplyCoupon = async (code) => {
    const codeToApply = code || manualCouponCode;
    if (!codeToApply) return message.warning("Please enter or select a coupon code");

    setCouponLoading(true);
    try {
      const res = await api.post("/coupons/validate", { code: codeToApply, planPrice: selectedPlan.price });
      if (res.data.success) {
        setAppliedCoupon(res.data);
        setIsCouponDrawerOpen(false);
        message.success("Coupon applied!");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;
    if (!appliedCoupon) return selectedPlan.price;
    
    let discount = 0;
    if (appliedCoupon.discountType === "percentage") {
      discount = (selectedPlan.price * appliedCoupon.discountValue) / 100;
    } else {
      discount = appliedCoupon.discountValue;
    }
    return Math.max(0, Math.round(selectedPlan.price - discount));
  };

  const handleFinalUpgrade = async () => {
    setProcessingId(selectedPlan._id);
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (calculateFinalPrice() > 0 && !keyId) {
      message.error("Razorpay Key is missing. Please contact support.");
      setProcessingId(null);
      return;
    }

    const resScript = await loadRazorpayScript();
    if (calculateFinalPrice() > 0 && !resScript) {
      message.error("Razorpay SDK failed to load.");
      setProcessingId(null);
      return;
    }

    try {
      const { data: order } = await api.post("/subscriptions/create-order", {
        planId: selectedPlan._id,
        couponCode: appliedCoupon?.code
      });

      if (order.free) {
        const activateRes = await api.post("/subscriptions/activate-free-plan", {
          planId: selectedPlan._id,
          couponCode: order.couponCode
        });
        
        if (activateRes.data.success) {
          message.success("Subscription activated successfully!");
          await refetchUser();
          navigate("/seller/my-properties?success=true");
        }
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "The Plot One",
        description: `Upgrade to ${selectedPlan.name} Plan`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post("/subscriptions/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlan._id,
              couponCode: order.couponCode,
              discountAmount: order.discountAmount
            });

            message.success("Subscribed successfully!");
            await refetchUser();
            navigate("/seller/my-properties?success=true");
          } catch (err) {
            message.error(err.response?.data?.error || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "Customer",
          contact: user?.phone || "",
          email: user?.builderProfile?.email,
        },
        theme: { color: "#002B49" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to initiate payment");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader variant="inline" /></div>;

  return (
    <div className="bg-[#F1F5F9] py-12 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-[#002B49] mb-4 uppercase tracking-tight">Upgrade Your Plan</h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto font-medium">
            Scale your real estate business with our premium subscription plans. More visibility, more leads, more sales.
          </p>
        </div>

        <Row gutter={[32, 32]} justify="center">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan?._id === plan._id;
            const isPopular = plan.isPopular;

            return (
              <Col xs={24} sm={12} lg={8} key={plan._id} style={{ display: 'flex' }}>
                <Card
                  className="relative w-full rounded-none border-none shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col bg-white"
                  bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
                >
                  {/* Ribbon for Popular */}
                  {isPopular && (
                    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
                      <div className="absolute top-6 -left-12 w-44 bg-[#e00d0d] text-white text-[10px] font-black uppercase py-1 text-center -rotate-45 shadow-xl border-b border-white/20">
                        Popular
                      </div>
                    </div>
                  )}

                  <div className="py-6 text-center bg-white">
                    <h2 className="text-2xl font-black text-[#002B49] tracking-widest">{plan.displayName || plan.name}</h2>
                  </div>

                  {/* Price Banner */}
                  <div className={`py-4 text-center ${isPopular ? "bg-[#f97316]" : "bg-[#002B49]"}`}>
                    <div className="flex items-center justify-center text-white gap-1">
                      <IndianRupee size={20} strokeWidth={3} />
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm font-bold opacity-70">/ {plan.duration} Days</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="p-8 flex-1">
                    <div className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <Check size={18} className="text-green-500 shrink-0" strokeWidth={3} />
                          <span className="text-gray-700 font-semibold text-sm leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button Section */}
                  <div className="p-8 pt-0">
                    <Button
                      type={isPopular ? "primary" : "default"}
                      block
                      size="large"
                      disabled={isCurrent || plan.isAlreadyPurchased}
                      onClick={() => openCheckout(plan)}
                      className={`h-12 rounded-md font-black text-sm uppercase tracking-widest transition-all ${
                        isPopular 
                          ? "bg-[#f97316] hover:bg-[#ea580c] border-none shadow-lg text-white" 
                          : "border-2 border-[#002B49] text-[#002B49] hover:bg-[#002B49] hover:text-white"
                      }`}
                    >
                      {isCurrent ? "Active Now" : plan.isAlreadyPurchased ? "Already Purchased" : "Upgrade"}
                    </Button>
                  </div>

                  <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-green-500" />
                    SECURE CHECKOUT
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Checkout Modal */}
      <Modal
        open={isCheckoutOpen}
        onCancel={() => setIsCheckoutOpen(false)}
        footer={null}
        width={380}
        centered
        className="checkout-modal"
        closable={false}
      >
        <div className="p-0">
          <div className="flex justify-between items-center mb-6">
             <Title level={5} className="!mb-0 font-bold text-gray-800">Checkout</Title>
             <Button type="text" icon={<X size={18} />} onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 p-0" />
          </div>

          <div className="bg-gray-50/50 rounded-xl p-4 mb-5 border border-gray-100">
             <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#002B49] rounded-lg flex items-center justify-center text-white shadow-md">
                   <Zap size={22} fill="currentColor" />
                </div>
                <div>
                   <h3 className="font-bold text-gray-900 text-sm leading-tight">{selectedPlan?.displayName || selectedPlan?.name}</h3>
                   <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{selectedPlan?.duration} Days Validity</Text>
                </div>
                <div className="ml-auto text-right">
                   <div className="font-bold text-gray-900 text-base">₹{selectedPlan?.price}</div>
                </div>
             </div>
          </div>

          <div className="space-y-5">
             {!appliedCoupon ? (
               <div 
                 onClick={() => setIsCouponDrawerOpen(true)}
                 className="flex items-center justify-between border border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group bg-white"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-gray-50 rounded border border-gray-100 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-500">
                        <Ticket size={16} />
                     </div>
                     <span className="font-bold text-gray-600 text-xs group-hover:text-blue-700">Apply Coupon</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
               </div>
             ) : (
               <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-green-100 rounded text-green-600">
                        <Tag size={16} fill="currentColor" />
                     </div>
                     <div>
                        <div className="font-bold text-green-800 text-xs leading-none uppercase">{appliedCoupon.code}</div>
                        <Text className="text-green-600 text-[10px] font-bold">SAVED ₹{selectedPlan.price - calculateFinalPrice()}</Text>
                     </div>
                  </div>
                  <Button 
                    type="text" 
                    icon={<Trash2 size={16} className="text-red-500" />} 
                    onClick={() => setAppliedCoupon(null)}
                    className="p-0 h-auto"
                  />
               </div>
             )}

             <div className="space-y-2 px-1">
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-2">Bill Details</Text>
                <div className="flex justify-between items-center text-gray-600 text-xs font-medium">
                   <span>Plan Total</span>
                   <span>₹{selectedPlan?.price}</span>
                </div>
                {appliedCoupon && (
                   <div className="flex justify-between items-center text-green-600 text-xs font-bold">
                      <span>Coupon Discount</span>
                      <span>- ₹{selectedPlan.price - calculateFinalPrice()}</span>
                   </div>
                )}
                <Divider className="my-2 border-gray-100" />
                <div className="flex justify-between items-center">
                   <span className="font-bold text-gray-900 text-sm uppercase">To Pay</span>
                   <span className="font-bold text-gray-900 text-xl">₹{calculateFinalPrice()}</span>
                </div>
             </div>

             <Button 
               type="primary" 
               block 
               size="large" 
               loading={!!processingId}
               onClick={handleFinalUpgrade}
               className="h-12 rounded-lg bg-blue-600 hover:bg-blue-700 border-none font-bold text-base shadow-lg shadow-blue-100 mt-2 flex items-center justify-center gap-2 uppercase tracking-wider"
             >
               PAY NOW <ArrowRight size={18} />
             </Button>
          </div>
        </div>
      </Modal>

      {/* Coupon Selector Drawer */}
      <Drawer
        title={<span className="font-bold text-gray-800 text-sm">Apply Coupon</span>}
        placement="right"
        onClose={() => setIsCouponDrawerOpen(false)}
        open={isCouponDrawerOpen}
        width={360}
        closeIcon={<X size={18} />}
        className="coupon-drawer"
        headerStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px' }}
        bodyStyle={{ padding: '0 0 20px 0', background: '#f8fafc' }}
      >
        <div className="sticky top-0 bg-white p-5 pb-4 z-10 border-b border-gray-50">
           <div className="flex items-center p-1.5 bg-white border border-[#BFDBFE] rounded-xl focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
              <Input 
                placeholder="Enter coupon code" 
                bordered={false}
                className="flex-1 h-9 font-bold uppercase placeholder:font-medium placeholder:normal-case text-xs"
                value={manualCouponCode}
                onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
              />
              <Button 
                type="primary" 
                className="h-9 bg-[#2563EB] hover:bg-[#1D4ED8] border-none font-bold px-6 rounded-lg uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center transition-all"
                onClick={() => handleApplyCoupon()}
                loading={couponLoading}
              >
                APPLY
              </Button>
           </div>
        </div>

        <div className="p-5 pt-4 space-y-6">
           <section>
              <Text className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mb-3 block">Available Coupons</Text>
              
              <div className="space-y-3">
                 {availableCoupons.length > 0 ? availableCoupons.map((coupon) => (
                   <div 
                    key={coupon._id} 
                    className="premium-coupon shadow-sm hover:shadow-xl transition-all duration-300 mb-5 border border-[#BFDBFE]"
                    onClick={() => handleApplyCoupon(coupon.code)}
                   >
                      <div className="flex w-full">
                         {/* Left Section - Code/Value */}
                         <div className="w-[71px] flex flex-col items-center justify-center p-2 bg-[#2563EB] text-white shrink-0 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.1)]">
                            <div className="rotate-[-90deg] whitespace-nowrap font-bold text-[13px] tracking-[0.25em] uppercase">
                               {coupon.code}
                            </div>
                         </div>
                         
                         {/* Right Section - Details */}
                         <div className="flex-1 p-5 pl-7 relative flex flex-col bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
                            <div className="flex justify-between items-start mb-2">
                               <h4 className="font-normal text-[#1D4ED8] text-base leading-tight tracking-tight">
                                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                </h4>

                            </div>
                            
                            <Text className="text-[#334155] text-[10px] font-medium leading-relaxed block mb-5 line-clamp-2">
                               {coupon.termsAndConditions || "Valid on all property subscription plans for a limited time."}
                            </Text>

                            <div className="mt-auto flex justify-start">
                               <div className="flex flex-col items-start gap-1">
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    className="h-10 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] border-none font-bold text-[12px] rounded-lg shadow-md shadow-blue-200/50 uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleApplyCoupon(coupon.code);
                                    }}
                                  >
                                    Apply Coupon
                                  </Button>
                                  <span className="text-[10px] text-[#64748B] font-normal tracking-wide pl-1">
                                     T&C Apply
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Ticket size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-400 font-bold text-xs">No valid coupons found</p>
                      <Text className="text-[9px] text-gray-400">Try entering a code manually</Text>
                   </div>
                 )}
              </div>
           </section>

           {availableCoupons.length > 0 && (
             <section className="opacity-50">
                <Text className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mb-3 block">Other Offers</Text>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 border-l-4 border-l-gray-300">
                   <Tag className="m-0 font-bold px-1.5 py-0 rounded border-none bg-gray-100 text-gray-400 uppercase text-[9px]">FIRSTBUY</Tag>
                   <h4 className="font-bold text-gray-400 text-xs mt-2 mb-1">20% OFF</h4>
                   <Text className="text-gray-400 text-[10px] font-medium block italic">Not applicable for this plan</Text>
                </div>
             </section>
           )}
        </div>
      </Drawer>

      <style>{`
        .checkout-modal .ant-modal-content {
          border-radius: 16px !important;
          padding: 24px !important;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15) !important;
        }
        .ant-modal-mask {
           backdrop-filter: blur(8px);
           background: rgba(0, 43, 73, 0.15) !important;
        }
        .coupon-drawer .ant-drawer-content {
           border-radius: 0 !important;
        }
        .ant-drawer-right .ant-drawer-content-wrapper {
           box-shadow: -8px 0 24px rgba(0,0,0,0.03) !important;
        }
        .premium-coupon {
          position: relative;
          background: transparent;
          min-height: 120px;
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          cursor: pointer;
          -webkit-mask-image: radial-gradient(circle at 71px 10px, transparent 10px, red 10.5px), radial-gradient(closest-side circle at 50%, red 99%, transparent 100%);
          -webkit-mask-size: 100%, 4px 12px;
          -webkit-mask-repeat: repeat, repeat-y;
          -webkit-mask-position: 0 -10px, 69px;
          -webkit-mask-composite: source-out;
          mask-composite: subtract;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }
        .premium-coupon::before {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid transparent;
          border-radius: 14px;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default UpgradePlan;
