import { useState, useRef, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const LoginModal = ({ open, onCancel }) => {
    const [authStep, setAuthStep] = useState("phone"); // "phone" or "otp"
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    
    // Refs for individual OTP inputs
    const inputRefs = useRef([]);

    useEffect(() => {
        if (authStep === "otp" && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [authStep]);

    if (!open) return null;

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (phone.length !== 10) {
            toast.error("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API}/users/send-otp`, { phone });
            if (res.data.success) {
                toast.success("OTP sent successfully!");
                setAuthStep("otp");
                setOtp(["", "", "", "", "", ""]); // Reset OTP fields
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join("");
        if (fullOtp.length !== 6) {
            toast.error("Please enter a 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API}/users/verify-otp`, { phone, otp: fullOtp });
            if (res.data.success) {
                login(res.data.user, res.data.token);
                toast.success("Login successful!");
                resetModal();
                onCancel();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const newOtp = [...otp];
        // Only allow one digit
        newOtp[index] = value.slice(-1).replace(/\D/g, "");
        setOtp(newOtp);

        // Move to next input if filled
        if (newOtp[index] !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const resetModal = () => {
        setAuthStep("phone");
        setPhone("");
        setOtp(["", "", "", "", "", ""]);
    };

    const primaryColor = "#166aa8"; // Updated color

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/40 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white text-gray-800 w-full max-w-[400px] p-8 text-left rounded-xl shadow-2xl relative">
                    
                    <button
                        onClick={() => {
                            resetModal();
                            onCancel();
                        }}
                        className="absolute top-5 right-5 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>

                    {authStep === "phone" ? (
                        <>
                            <h2 className="text-[26px] font-bold text-[#11254a] mb-1">
                                Login / Register
                            </h2>
                            <p className="text-gray-500 text-[15px] mb-8 font-normal">
                                Please enter your Phone Number
                            </p>

                            <form onSubmit={handleSendOtp}>
                                <div className="mb-8">
                                    <label className="block text-[14px] font-semibold text-[#11254a] mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full border border-gray-200 outline-none rounded-md py-4 px-5 text-[16px] text-gray-700 placeholder-gray-300 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all"
                                        type="tel"
                                        placeholder="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || phone.length !== 10}
                                    style={{ backgroundColor: primaryColor }}
                                    className="w-full h-14 rounded-md text-white text-xl font-bold hover:brightness-95 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                                >
                                    {loading ? "Sending..." : "Continue"}
                                </button>
                            </form>



                            <p className="text-left text-[14px] text-gray-500 mt-8">
                                By clicking you agree to{" "}
                                <Link 
                                    to="/terms-and-condition" 
                                    onClick={() => {
                                        resetModal();
                                        onCancel();
                                    }}
                                    className="text-blue-500 font-medium"
                                >
                                    Terms and Conditions
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-[26px] font-bold text-[#11254a] mb-2">
                                Verify your number
                            </h2>
                            <div className="flex items-center gap-2 mb-8">
                                <span className="text-[22px] font-bold text-[#11254a]">
                                    +91-{phone}
                                </span>
                                <button 
                                    onClick={() => setAuthStep("phone")}
                                    className="p-1 hover:bg-gray-100 rounded-full text-blue-500 cursor-pointer"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-[15px] font-semibold text-[#11254a] mb-4">
                                Enter your 6 digit OTP
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
                                        onClick={() => handleSendOtp()}
                                        className="text-blue-500 hover:underline font-bold cursor-pointer"
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
                                    {loading ? "Verifying..." : "Verify & Continue"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
