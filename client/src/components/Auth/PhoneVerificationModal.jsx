import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

const PhoneVerificationModal = ({ open, onCancel, newPhone, onSuccess }) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    
    // Refs for individual OTP inputs
    const inputRefs = useRef([]);

    useEffect(() => {
        if (open && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [open]);

    if (!open) return null;

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join("");
        if (fullOtp.length !== 6) {
            toast.error("Please enter a 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/users/verify-phone-update`, { otp: fullOtp });
            if (res.data.success) {
                toast.success("Phone number updated successfully!");
                onSuccess();
                onCancel();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/users/request-phone-update`, { newPhone });
            if (res.data.success) {
                toast.success("OTP resent successfully!");
                setOtp(["", "", "", "", "", ""]);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1).replace(/\D/g, "");
        setOtp(newOtp);

        if (newOtp[index] !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const primaryColor = "#166aa8";

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/40 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white text-gray-800 w-full max-w-[400px] p-8 text-left rounded-xl shadow-2xl relative">
                    <button
                        onClick={onCancel}
                        className="absolute top-5 right-5 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>

                    <h2 className="text-[26px] font-bold text-[#11254a] mb-2">
                        Verify New Number
                    </h2>
                    <div className="mb-8">
                        <span className="text-[22px] font-bold text-[#11254a]">
                            +91-{newPhone}
                        </span>
                    </div>

                    <p className="text-[15px] font-semibold text-[#11254a] mb-4">
                        Enter the 6-digit OTP sent to your new number
                    </p>

                    <form onSubmit={handleVerifyOtp}>
                        <div className="flex gap-2 mb-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-[45px] h-[55px] border border-gray-200 outline-none rounded-md text-center text-xl font-semibold text-gray-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                                    maxLength={1}
                                />
                            ))}
                        </div>

                        <p className="text-[14px] text-gray-500 mb-8 font-medium">
                            Haven't received yet?{" "}
                            <button 
                                type="button"
                                onClick={handleResendOtp}
                                className="text-blue-500 hover:underline font-bold cursor-pointer"
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                        </p>

                        <button
                            type="submit"
                            disabled={loading || otp.join("").length !== 6}
                            style={{ backgroundColor: primaryColor }}
                            className="w-full h-14 rounded-md text-white text-xl font-bold hover:brightness-95 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:grayscale-[0.5] cursor-pointer"
                        >
                            {loading ? "Verifying..." : "Verify & Update"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PhoneVerificationModal;
