import { useState, useEffect } from "react";
import { Steps, Button, Card, message, Spin, Input } from "antd";
import { Building, IndianRupee, Lock, CheckCircle2, Tag as TagIcon, X, ShieldAlert } from "lucide-react";
import api from "@/services/api";
import { useNavigate, useParams } from "react-router-dom";
import { getImageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/context/AuthContext";

// Task 4.1 — real Razorpay checkout, wired to the existing Task 4.2/4.3 APIs
// (POST /campaigns/create-order, POST /campaigns/verify-payment). No payment
// logic is duplicated here — this page only calls those endpoints and reacts
// to their responses.

const POSITION_LABEL = { 2: "2nd", 3: "3rd", 4: "4th" };

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SelectPlan = () => {
  const { projectId: projectIdFromRoute } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // T-102 fix — this page's entire flow depends on promoter-only APIs
  // (/campaigns/my-campaign-status, /campaigns/create-order, etc.). Without
  // this check, a non-promoter's fetch 403s, and the resulting empty
  // `projects` array was rendering the "no projects yet, Add a Project"
  // empty state — misleading, since that state means something specific for
  // an actual promoter and nothing for a Seller/Agent/Owner.
  const isPromoter = /Builder|Promoter/i.test(user?.businessType?.name || "");

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [plans, setPlans] = useState([]);
  // Backend-derived — mirrors exactly what create-order will enforce, instead
  // of approximating it from Property.isCampaignActive on the client.
  const [campaignStatus, setCampaignStatus] = useState({
    activeCampaignCount: 0,
    nextCampaignPosition: 1,
    isBlocked: false,
    discountPercent: 0,
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Coupon — validated via the existing /coupons/validate endpoint (not
  // touched). This is a preview only; the authoritative check/calculation
  // always happens server-side in create-order / activate-free.
  const [couponInput, setCouponInput] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountType, discountValue }

  useEffect(() => {
    if (!isPromoter) {
      // Never call the promoter-only endpoints for a non-promoter — avoids
      // the 403 (and the misleading fallback UI it caused) entirely, rather
      // than reacting to it after the fact.
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [projectsRes, plansRes, statusRes] = await Promise.all([
          api.get("/properties/my-listings?limit=100"),
          api.get("/subscriptions/plans"),
          api.get("/campaigns/my-campaign-status"),
        ]);
        const fetchedProjects = projectsRes.data?.properties || [];
        setProjects(fetchedProjects);
        setPlans((plansRes.data || []).filter((p) => p.name.toLowerCase() !== "free"));
        setCampaignStatus({
          activeCampaignCount: statusRes.data?.activeCampaignCount ?? 0,
          nextCampaignPosition: statusRes.data?.nextCampaignPosition ?? 1,
          isBlocked: !!statusRes.data?.isBlocked,
          discountPercent: statusRes.data?.discountPercent ?? 0,
        });

        if (projectIdFromRoute) {
          const match = fetchedProjects.find((p) => p._id === projectIdFromRoute);
          if (match) {
            setSelectedProject(match);
            setStep(1);
          }
        }
      } catch (error) {
        console.error("Failed to load plan selection data:", error);
        message.error("Failed to load your projects and plans");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectIdFromRoute, isPromoter]);

  const { nextCampaignPosition, isBlocked, discountPercent, activeCampaignCount } = campaignStatus;

  const discountedPrice = (price) =>
    discountPercent ? Math.round(price * (1 - discountPercent / 100)) : price;

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setStep(1);
  };

  const handleSelectPlan = (plan, disabled) => {
    if (isBlocked || disabled) return;
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleValidateCoupon = async () => {
    const code = couponInput.trim();
    if (!code || !selectedPlan) return;
    setCouponValidating(true);
    try {
      const { data } = await api.post("/coupons/validate", { code, planPrice: selectedPlan.price });
      setAppliedCoupon({ code: data.code, discountType: data.discountType, discountValue: data.discountValue });
      message.success("Coupon applied");
    } catch (error) {
      setAppliedCoupon(null);
      message.error(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  // Preview only — mirrors the backend's documented order (volume discount
  // first, then the coupon on top of that amount) so what's displayed here
  // matches what create-order will actually charge. The server recomputes
  // this independently and never trusts these numbers.
  const volumeDiscountedPrice = selectedPlan ? discountedPrice(selectedPlan.price) : 0;
  const couponPreviewDiscount = appliedCoupon
    ? Math.min(
        Math.round(
          appliedCoupon.discountType === "percentage"
            ? (volumeDiscountedPrice * appliedCoupon.discountValue) / 100
            : appliedCoupon.discountValue,
        ),
        volumeDiscountedPrice,
      )
    : 0;
  const previewFinalAmount = Math.max(0, volumeDiscountedPrice - couponPreviewDiscount);

  const handleContinue = async () => {
    setPaying(true);
    try {
      const { data: order } = await api.post("/campaigns/create-order", {
        projectId: selectedProject._id,
        planId: selectedPlan._id,
        couponCode: appliedCoupon?.code || undefined,
      });

      if (order.free) {
        try {
          const { data: activateRes } = await api.post("/campaigns/activate-free", {
            campaignId: order.campaignId,
            couponCode: order.couponCode || undefined,
          });
          setPaymentResult(activateRes);
          setStep(3);
        } catch (activateError) {
          message.error(
            activateError.response?.data?.message || "Could not activate the campaign for free",
          );
        } finally {
          setPaying(false);
        }
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        message.error("Payment SDK failed to load. Please check your connection and try again.");
        setPaying(false);
        return;
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        message.error("Razorpay key is not configured. Please contact support.");
        setPaying(false);
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "The Plot One",
        description: `${selectedPlan.displayName || selectedPlan.name} — ${selectedProject.basicInfo?.title}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || "",
          contact: user?.phone || "",
          email: user?.builderProfile?.email || user?.email || "",
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            message.info("Payment cancelled");
          },
        },
        handler: async (response) => {
          try {
            const { data: verifyRes } = await api.post("/campaigns/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId: order.campaignId,
            });
            setPaymentResult(verifyRes);
            setStep(3);
          } catch (verifyError) {
            message.error(
              verifyError.response?.data?.message ||
                "Payment succeeded but verification failed. Please contact support with your payment ID.",
            );
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        message.error(resp.error?.description || "Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();
    } catch (orderError) {
      message.error(orderError.response?.data?.message || "Failed to create payment order");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!isPromoter) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShieldAlert size={48} className="mx-auto mb-3 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Not available for your account</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Campaign plans are only available for Builder/Promoter accounts.
          </p>
          <Button type="primary" className="mt-4" onClick={() => navigate("/seller/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Steps
        current={step}
        items={[{ title: "Select Project" }, { title: "Select Plan" }, { title: "Review & Pay" }, { title: "Done" }]}
        className="mb-8"
      />

      {step === 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Which project do you want to run leads for?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Choose one of your listed projects to start a campaign.
          </p>

          {projects.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Building size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500">You haven't listed any projects yet.</p>
              <Button
                type="primary"
                className="mt-4"
                onClick={() => navigate("/seller/add-property")}
              >
                Add a Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Card
                  key={project._id}
                  hoverable
                  onClick={() => handleSelectProject(project)}
                  className="rounded-xl overflow-hidden"
                  cover={
                    <img
                      src={getImageUrl(project.media?.featuredImage)}
                      alt={project.basicInfo?.title}
                      className="h-32 w-full object-cover"
                    />
                  }
                >
                  <h3 className="font-semibold text-gray-900 truncate">
                    {project.basicInfo?.title}
                  </h3>
                  <p className="text-sm text-gray-500">{project.location?.city}</p>
                  {project.isCampaignActive && (
                    <span className="inline-block mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Already has an active campaign
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && selectedProject && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-800">
              Choose a plan for {selectedProject.basicInfo?.title}
            </h2>
            <Button type="link" onClick={() => setStep(0)}>
              Change project
            </Button>
          </div>

          {isBlocked ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-6">
              <Lock size={40} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Campaign limit reached
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                You already have {activeCampaignCount} active campaigns — the maximum on a
                standard plan. Contact admin for an Enterprise plan.
              </p>
            </div>
          ) : (
            <>
              {discountPercent > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2 mb-4 mt-4">
                  This will be your {POSITION_LABEL[nextCampaignPosition] || `${nextCampaignPosition}th`} active campaign —{" "}
                  {discountPercent}% volume discount applies below.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-3 mt-4">
                {plans.map((plan) => {
                  const key = plan.name.toLowerCase();
                  const isStarter = key.includes("starter");
                  const disabled = isStarter && nextCampaignPosition >= 2;
                  const leads = plan.committedMinimum;
                  const price = discountedPrice(plan.price);

                  return (
                    <Card
                      key={plan._id}
                      hoverable={!disabled}
                      onClick={() => handleSelectPlan(plan, disabled)}
                      className={`rounded-xl text-center ${disabled ? "opacity-40 grayscale cursor-not-allowed" : ""} ${plan.isPopular && !disabled ? "border-2 border-indigo-500" : ""}`}
                    >
                      <h3 className="font-bold text-gray-900 uppercase tracking-wide">
                        {plan.displayName || plan.name}
                      </h3>
                      <div className="my-3">
                        {discountPercent > 0 && price !== plan.price && (
                          <div className="text-xs text-gray-400 line-through">
                            ₹{plan.price.toLocaleString()}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-0.5">
                          <IndianRupee size={18} />
                          {price.toLocaleString()}
                        </div>
                      </div>
                      {!!leads && <p className="text-sm text-gray-500 mb-2">{leads} leads committed</p>}
                      {disabled && (
                        <p className="text-xs text-rose-500 font-medium">
                          Not available from your 2nd campaign
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && selectedProject && selectedPlan && (
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Review & Pay</h2>
          <Card className="rounded-xl mb-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Project</span>
              <span className="font-semibold text-gray-900">
                {selectedProject.basicInfo?.title}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold text-gray-900">
                {selectedPlan.displayName || selectedPlan.name}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Plan Price</span>
              <span className="text-gray-900">₹{selectedPlan.price.toLocaleString()}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100 text-emerald-600 text-sm">
                <span>Volume discount ({discountPercent}%)</span>
                <span>- ₹{(selectedPlan.price - volumeDiscountedPrice).toLocaleString()}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between py-2 border-b border-gray-100 text-emerald-600 text-sm">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>- ₹{couponPreviewDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Final Amount</span>
              <span className="font-bold text-gray-900 text-lg">
                ₹{previewFinalAmount.toLocaleString()}
              </span>
            </div>
          </Card>

          <Card className="rounded-xl mb-6">
            {appliedCoupon ? (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <TagIcon size={14} /> {appliedCoupon.code} applied
                </span>
                <Button type="text" size="small" icon={<X size={14} />} onClick={handleRemoveCoupon} disabled={paying} />
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code (optional)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onPressEnter={handleValidateCoupon}
                  disabled={paying}
                />
                <Button loading={couponValidating} disabled={!couponInput.trim() || paying} onClick={handleValidateCoupon}>
                  Apply
                </Button>
              </div>
            )}
          </Card>

          <Button
            type="primary"
            block
            size="large"
            loading={paying}
            onClick={handleContinue}
            className="h-12 rounded-lg font-bold"
          >
            {previewFinalAmount <= 0 ? "Activate Campaign (Free)" : `Pay Now — ₹${previewFinalAmount.toLocaleString()}`}
          </Button>
          <Button type="link" block disabled={paying} onClick={() => setStep(1)} className="mt-2">
            Change plan
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md mx-auto text-center py-8">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Payment received!</h2>
          <p className="text-sm text-gray-500 mb-2">
            Admin will activate your leads within 24 hours.
          </p>
          {paymentResult?.campaignId && (
            <p className="text-xs text-gray-400 mb-6">Reference: {paymentResult.campaignId}</p>
          )}
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/seller/plans/billing")}>View Billing</Button>
            <Button type="primary" onClick={() => navigate("/seller/my-properties")}>
              Back to My Projects
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPlan;
