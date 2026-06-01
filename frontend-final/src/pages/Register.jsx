import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowRight, FiLoader, FiPhone, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, setUser, setToken, clearAuthError } from '../store/slices/authSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import api, { resolveUploadUrl } from '../api/axios';

export default function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
    const { data: settings } = useSelector((state) => state.settings);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });

    // OTP States
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const [addressData, setAddressData] = useState({
        title: 'Home',
        address: '',
        city: '',
        pincode: '',
        state: '',
        country: 'India',
    });
    const [savingAddress, setSavingAddress] = useState(false);

    // Flag to prevent immediate redirect after successful registration
    const isRegistering = React.useRef(false);

    useEffect(() => {
        dispatch(fetchSettings());
        dispatch(clearAuthError());
        // Only redirect if authenticated AND NOT currently registering
        if (isAuthenticated && !isRegistering.current) {
            window.location.href = '/account';
        }
    }, [dispatch, isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressData({ ...addressData, [name]: value });
    };

    const normalizeMobile = (value) => String(value || "").trim();

    const otpStorageKey = useMemo(() => {
        const normalized = normalizeMobile(formData.mobile);
        return normalized ? `register_otp:${normalized}` : null;
    }, [formData.mobile]);

    const handleSendOtp = async () => {
        const email = formData.email.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address first");
            return;
        }

        setSendingOtp(true);
        setOtpVerified(false);

        try {
            await api.post("/auth/user/mobile-register/send-otp", {
                email: email,
                name: `${formData.firstName} ${formData.lastName}`.trim()
            });
            setOtpSent(true);
            alert("OTP sent successfully to your email address.");
        } catch (error) {
            const status = error?.response?.status;
            if (status === 409) {
                alert("Account already exists with this email. Please login.");
                navigate('/login');
            } else {
                alert(error.response?.data?.message || "Failed to send OTP. Please try again.");
            }
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }

        setVerifyingOtp(true);
        try {
            const response = await api.post("/auth/user/mobile-register/verify-otp-only", {
                email: formData.email,
                otp: otp
            });

            if (response.data.success) {
                setOtpVerified(true);
                alert("OTP Verified Successfully!");
            }
        } catch (error) {
            setOtpVerified(false);
            alert(error.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || savingAddress) return;

        isRegistering.current = true; // Block automatic redirect
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const mobile = formData.mobile.trim();
        const password = formData.password.trim();

        // Basic Registration Validation
        if (!firstName || !lastName || !email || !mobile || !password) {
            alert("Please fill in all registration details");
            return;
        }

        // Basic Address Validation
        if (!addressData.address || !addressData.city || !addressData.pincode || !addressData.state) {
            alert("Please fill in all address details");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (!otp || !otpVerified) {
            alert("Please send and verify the OTP first");
            return;
        }

        try {
            // 1. Register User
            await dispatch(registerUser({
                name: `${firstName} ${lastName}`.trim(),
                email: email,
                password: formData.password,
                mobile: mobile,
                otp: otp
            })).unwrap();

            // 2. Save Address (Token should be in localStorage now)
            setSavingAddress(true);
            try {
                await api.post('/user/address/save', { ...addressData, id: 0 });
            } catch (addrErr) {
                // Not a fatal error for registration, but worth mentioning
                alert("Account created, but failed to save address. You can add it later in Account settings.");
            }
            
            // Redirect to account
            window.location.href = '/account';

        } catch (err) {
            isRegistering.current = false;
            alert(err || "Registration failed");
            setSavingAddress(false);
        }
    };

    return (
        <div className="min-h-screen bg-luxury-light flex items-center justify-center p-4 pt-32 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-luxury-light rounded-[2.5rem] shadow-2xl border border-brown/5 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-luxury-light p-8 text-center border-b border-brown/5 relative">
                    <Link to="/login" className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-brown/40 hover:text-brown transition-colors">
                        <FiArrowLeft size={20} />
                    </Link>
                    <img src={resolveUploadUrl(settings?.logo) || "/images/logo.png"} alt="Shri Radhe" className="h-16 mx-auto mb-4 object-contain" />
                    <h2 className="text-3xl font-black uppercase tracking-wider text-brown">
                        Join the <span className="text-gold italic font-serif lowercase">Family.</span>
                    </h2>
                    <p className="text-brown/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        Purely Organic Luxury & Excellence
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl text-center font-bold uppercase tracking-widest">
                            {typeof error === 'string' ? error : 'Registration Failed'}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Registration Section */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold border-b border-gold/10 pb-2 mb-6">1. Personal Information</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="relative group">
                                    <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={otpSent && !otpVerified}
                                    className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                />
                            </div>

                            <div className="flex gap-3 items-center">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (val.length <= 6) {
                                                setOtp(val);
                                                if (val.length < 6) setOtpVerified(false);
                                            }
                                        }}
                                        disabled={!otpSent || otpVerified}
                                        className="w-full bg-luxury-light px-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm text-center tracking-[0.5em]"
                                    />
                                </div>
                                {!otpSent ? (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || !formData.email}
                                        className="whitespace-nowrap px-8 py-4 bg-gold text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brown disabled:opacity-50 transition-all shadow-xl shadow-gold/20"
                                    >
                                        {sendingOtp ? <FiLoader className="animate-spin" size={16} /> : "Send OTP"}
                                    </button>
                                ) : !otpVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={verifyingOtp || !otp}
                                        className="whitespace-nowrap px-8 py-4 bg-brown text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-all shadow-xl shadow-brown/20"
                                    >
                                        {verifyingOtp ? <FiLoader className="animate-spin" size={16} /> : "Verify"}
                                    </button>
                                ) : (
                                    <div className="whitespace-nowrap px-8 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-green-200">
                                        <FiCheck size={16} /> Verified
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                <input
                                    type="tel"
                                    name="mobile"
                                    placeholder="Mobile Number"
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (val.length <= 10) setFormData({ ...formData, mobile: val });
                                    }}
                                    required
                                    className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="relative group">
                                    <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
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
                                        placeholder="Confirm"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold border-b border-gold/10 pb-2 mb-6">2. Delivery Address</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-2">Type</label>
                                    <select 
                                        name="title" 
                                        value={addressData.title} 
                                        onChange={handleAddressChange} 
                                        className="w-full bg-luxury-light border border-brown/10 rounded-2xl px-6 py-4 text-brown font-bold focus:border-brown/20 outline-none transition-all text-sm appearance-none"
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-2">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={addressData.pincode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (val.length <= 6) setAddressData({ ...addressData, pincode: val });
                                        }}
                                        required
                                        placeholder="6-digit Pincode"
                                        className="w-full bg-luxury-light px-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 outline-none text-brown font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-2">Full Address</label>
                                <textarea 
                                    name="address" 
                                    value={addressData.address} 
                                    onChange={handleAddressChange} 
                                    required 
                                    rows="2" 
                                    className="w-full bg-luxury-light px-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 outline-none text-brown font-bold transition-all text-sm resize-none" 
                                    placeholder="House No, Building, Street..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-2">City</label>
                                    <input 
                                        type="text" 
                                        name="city" 
                                        value={addressData.city} 
                                        onChange={handleAddressChange} 
                                        required 
                                        className="w-full bg-luxury-light px-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 outline-none text-brown font-bold transition-all text-sm" 
                                        placeholder="City" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-2">State</label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={addressData.state} 
                                        onChange={handleAddressChange} 
                                        required 
                                        className="w-full bg-luxury-light px-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 outline-none text-brown font-bold transition-all text-sm" 
                                        placeholder="State" 
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !otpSent || !otpVerified || savingAddress}
                            className="w-full mt-4 bg-gold text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brown active:scale-[0.98] transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loading || savingAddress ? (
                                <>
                                    <FiLoader className="animate-spin" size={20} />
                                    {loading ? "CREATING ACCOUNT..." : "SAVING ADDRESS..."}
                                </>
                            ) : (
                                <>
                                    Create Account <FiArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-luxury-light p-8 text-center border-t border-brown/5">
                    <p className="text-brown/60 text-[11px] font-bold uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-gold hover:text-brown transition-colors font-black ml-1"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
