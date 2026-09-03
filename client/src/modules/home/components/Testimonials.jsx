import { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

const STAR_LABELS = ["Poor", "Fair", "Average", "Good", "Excellent"];
const ROLE_OPTIONS = ["Owner", "Tenant", "Former Resident", "Real Estate Agent"];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Step 1: hover/selected rating
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  // Step 2: form expansion
  const [showForm, setShowForm] = useState(false);
  const [city, setCity] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [reviewerName, setReviewerName] = useState(
    user?.user?.name || user?.name || ""
  );
  const [reviewText, setReviewText] = useState("");

  // Brand Colors
  const brandBlue = "#1a65a4";
  const brandYellow = "#eeb920";

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/testimonials/approved`
        );
        setTestimonials(res.data);
      } catch (error) {
        console.error("Error fetching testimonials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Pre-fill name when user loads
  useEffect(() => {
    setReviewerName(user?.user?.name || user?.name || "");
  }, [user]);

  const handleStarClick = (rating) => {
    if (!isAuthenticated) {
      toast.error("Please login to write a review");
      return;
    }
    setSelectedRating(rating);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!city.trim()) return toast.error("Please enter your city");
    // if (!selectedRole) return toast.error("Please select how you're described");
    if (!reviewerName.trim()) return toast.error("Please enter your name");
    if (!reviewText.trim()) return toast.error("Please write your review");

    setSubmitLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/testimonials`, {
        rating: selectedRating,
        content: reviewText,
        city,
        role: selectedRole,
        name: reviewerName,
        user_id: user?.user?._id || user?._id,
      });
      toast.success("Review submitted for approval!");
      // Reset
      setSelectedRating(0);
      setHoverRating(0);
      setShowForm(false);
      setCity("");
      setSelectedRole("");
      setReviewText("");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Scrolling card renderer
  const halfLength = Math.ceil(testimonials.length / 2);
  const row1Data = testimonials.length < 4 ? testimonials : testimonials.slice(0, halfLength);
  const row2Data = testimonials.length < 4 ? testimonials : testimonials.slice(halfLength);

  const renderCard = (item, index) => (
    <div
      key={`${item._id}-${index}`}
      className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-6 shrink-0 w-[350px] transition-colors duration-300"
    >
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < item.rating ? "fill-[#eeb920] text-[#eeb920]" : "text-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-slate-700 text-sm mb-6 whitespace-normal line-clamp-4 leading-relaxed">
        &ldquo;{item.content}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold shadow-sm bg-[#1a65a4]/10 text-[#1a65a4]">
          {item.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <p className="font-medium text-slate-800 text-sm">{item.name}</p>
          {/* <p className="text-slate-500 text-xs">{item.role || "User"}</p> */}
        </div>
      </div>
    </div>
  );

  const displayRating = hoverRating || selectedRating;

  return (
    <>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollReverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll { animation: scroll 25s linear infinite; }
        .animate-scroll-reverse { animation: scrollReverse 25s linear infinite; }
        .review-form-enter {
          animation: reviewFormSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes reviewFormSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="py-20 px-4 overflow-hidden relative">
        <div className="max-w-[1350px] mx-auto relative z-10">



          {/* ── Section Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="text-left">
              <h2 className="text-[28px] font-bold text-[#1E293">
                What people are saying
              </h2>
              <p className="text-[15px] text-[#64748B] mt-1">
                Real feedback from happy homeowners and property buyers.
              </p>
            </div>
          </div>

          {/* ── Scrolling Cards ── */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse">
              Loading amazing reviews...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <p className="text-slate-500 mb-4">No reviews yet. Be the first to share your experience!</p>
              {!isAuthenticated && (
                <p className="text-sm text-slate-400">Please login to write a review.</p>
              )}
            </div>
          ) : (
            <div
              className="space-y-8 relative"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              }}
            >
              {row1Data.length > 0 && (
                <div className="flex w-fit animate-scroll gap-6 hover:[animation-play-state:paused] pt-1 pb-1">
                  {[...row1Data, ...row1Data, ...row1Data].map((t, i) => renderCard(t, `row1-${i}`))}
                </div>
              )}
              {row2Data.length > 0 && (
                <div className="flex w-fit animate-scroll-reverse gap-6 hover:[animation-play-state:paused] pb-1">
                  {[...row2Data, ...row2Data, ...row2Data].map((t, i) => renderCard(t, `row2-${i}`))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Testimonials;