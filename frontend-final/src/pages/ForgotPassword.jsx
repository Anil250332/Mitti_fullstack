import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiArrowRight, FiLoader, FiMail, FiCheck, FiArrowLeft, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword, clearAuthError } from '../store/slices/authSlice';
import api from '../api/axios';

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [resetStep, setResetStep] = useState(0); // 0: Email, 1: OTP, 2: New Password

    useEffect(() => {
        dispatch(clearAuthError());
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async () => {
        const email = String(formData.email).trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address");
            return;
        }

        setSendingOtp(true);
        try {
            await api.post("/auth/user/forgot-password", { email: email });
            setOtpSent(true);
            setResetStep(1);
            alert("OTP sent successfully to your email");
        } catch (error) {
            alert(error.response?.data?.message || "Send OTP failed");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtpFake = () => {
        if (!otp) {
            alert("Please enter OTP");
            return;
        }
        // In the aligned flow, verification happens in the final call
        setResetStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const password = formData.password.trim();
        const confirmPassword = formData.confirmPassword.trim();

        if (!password || !confirmPassword) {
            alert("Password fields cannot be empty or just spaces");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        try {
            const resultAction = await dispatch(resetPassword({
                email: formData.email,
                otp: otp,
                newPassword: formData.password
            }));

            if (resetPassword.fulfilled.match(resultAction)) {
                alert("Password reset successful! Please login.");
                navigate('/login');
            }
        } catch (err) {
            // Error is handled by authSlice
        }
    };

    return (
        <div className="min-h-screen bg-luxury-light flex items-center justify-center p-4 pt-32 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-luxury-light rounded-[3rem] shadow-2xl border border-brown/5 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-luxury-light p-8 text-center border-b border-brown/5 relative">
                    <button onClick={() => resetStep > 0 ? setResetStep(resetStep - 1) : navigate('/login')} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-brown hover:text-gold transition-colors">
                        <FiArrowLeft size={20} />
                    </button>
                    <div className="w-16 h-16 bg-luxury-light rounded-2xl shadow-xl flex items-center justify-center border border-brown/5 mx-auto mb-4 text-gold">
                        <FiShield size={32} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wider text-brown">
                        Recover <span className="text-gold italic font-serif lowercase">Password.</span>
                    </h2>
                    <p className="text-brown/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {resetStep === 0 && 'Enter email to receive OTP'}
                        {resetStep === 1 && 'Verify your email address'}
                        {resetStep === 2 && 'Set your new secure password'}
                    </p>
                </div>

                {/* Form */}
                <div className="p-10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl text-center font-bold uppercase tracking-widest">
                            {typeof error === 'string' ? error : 'Reset Failed'}
                        </div>
                    )}

                    {resetStep === 0 && (
                        <div className="space-y-6">
                            <div className="relative group">
                                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={sendingOtp || !formData.email}
                                className="w-full bg-brown text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-brown/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                {sendingOtp ? (
                                    <>
                                        <FiLoader className="animate-spin" /> SENDING...
                                    </>
                                ) : (
                                    <>Send Reset OTP <FiArrowRight /></>
                                )}
                            </button>
                        </div>
                    )}

                    {resetStep === 1 && (
                        <div className="space-y-6 text-center">
                            <input
                                type="text"
                                placeholder="ENTER 6-DIGIT OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-brown/5 px-6 py-5 rounded-2xl border border-transparent focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30  transition-all text-xs font-bold text-center tracking-[0.5em]"
                            />
                            <button
                                onClick={handleVerifyOtpFake}
                                disabled={!otp}
                                className="w-full bg-brown text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-brown/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                Continue <FiArrowRight />
                            </button>
                            <button
                                onClick={handleSendOtp}
                                className="text-[10px] font-black text-gold uppercase tracking-widest hover:text-brown transition-all"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}

                    {resetStep === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative group">
                                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="New Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                />
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm New Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gold text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-gold/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FiLoader className="animate-spin" /> RESETTING...
                                    </div>
                                ) : (
                                    <>Reset Password <FiCheck size={18} /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-luxury-light p-8 text-center border-t border-brown/5">
                    <Link
                        to="/login"
                        className="text-brown/60 text-[11px] font-black uppercase tracking-widest hover:text-gold transition-all"
                    >
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
