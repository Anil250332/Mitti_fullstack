import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../store/slices/authSlice";
import { fetchSettings } from "../store/slices/settingsSlice";
import { resolveUploadUrl } from "../api/axios";
import { FiMail, FiLock, FiLoader, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";

const AdminLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
    const { data: settings } = useSelector((state) => state.settings);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    // Check if already logged in and is admin
    useEffect(() => {
        dispatch(fetchSettings());
        if (isAuthenticated && user?.role === 'admin') {
            navigate("/admin");
        }
    }, [isAuthenticated, user, navigate, dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const resultAction = await dispatch(loginAdmin(formData));
        if (loginAdmin.fulfilled.match(resultAction)) {
            navigate("/admin");
        }
    };

    return (
        <div className="min-h-screen bg-[#fffaf9] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5C3A2E]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C97863]/5 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-luxury-light rounded-3xl shadow-2xl border border-[#5C3A2E]/10 overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="bg-[#5C3A2E]/5 p-8 text-center border-b border-[#5C3A2E]/5">
                    <img src={resolveUploadUrl(settings?.logo) || "/images/logo.png"} alt="Shri Radhe" className="h-16 mx-auto mb-4 object-contain" />
                    <h2 className="text-2xl font-black uppercase tracking-wider text-[#3b2a23]">
                        Admin Portal
                    </h2>
                    <p className="text-[#3b2a23]/60 text-xs font-bold uppercase tracking-widest mt-2">
                        Secure Access Only
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-3"
                        >
                            <FiAlertCircle size={18} className="shrink-0" />
                            <span className="font-medium">{typeof error === 'string' ? error : 'Login failed'}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C3A2E]/40 group-focus-within:text-[#5C3A2E] transition-colors" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Admin Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#f8f8f8] pl-11 pr-4 py-4 rounded-xl border border-transparent focus:bg-luxury-light focus:border-[#5C3A2E] outline-none text-[#3b2a23] placeholder:text-[#3b2a23]/30 font-medium transition-all shadow-inner"
                            />
                        </div>

                        <div className="relative group">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C3A2E]/40 group-focus-within:text-[#5C3A2E] transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#f8f8f8] pl-11 pr-4 py-4 rounded-xl border border-transparent focus:bg-luxury-light focus:border-[#5C3A2E] outline-none text-[#3b2a23] placeholder:text-[#3b2a23]/30 font-medium transition-all shadow-inner"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#C97863] text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-[#5C3A2E] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FiLoader className="animate-spin" /> AUTHENTICATING...
                                </div>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#f8f8f8] text-center text-xs text-[#3b2a23]/40 font-medium border-t border-[#f0f0f0]">
                    &copy; {new Date().getFullYear()} Shri Radhe Collection. All rights reserved.
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
