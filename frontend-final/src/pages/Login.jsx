import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiLoader } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearAuthError, setAuthError } from '../store/slices/authSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { resolveUploadUrl } from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
    const { data: settings } = useSelector((state) => state.settings);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        dispatch(fetchSettings());
        if (isAuthenticated) {
            window.location.href = '/account';
        }
        // Clear error only on unmount
        return () => dispatch(clearAuthError());
    }, [dispatch, isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            toast.error(typeof error === 'string' ? error : 'Login Failed');
        }
    }, [error]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;

        const email = formData.email.trim();
        const password = formData.password.trim();

        if (!email || !password) {
            const msg = 'Email and Password are required';
            toast.error(msg);
            dispatch(setAuthError(msg));
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            const msg = 'Please enter a valid email address';
            toast.error(msg);
            dispatch(setAuthError(msg));
            return;
        }

        dispatch(loginUser({
            email,
            password: formData.password
        })).unwrap().then(() => {
            window.location.href = '/account';
        }).catch(() => { });
    };

    return (
        <div className="min-h-screen bg-luxury-light flex items-center justify-center p-4 pt-32 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-luxury-light rounded-[2.5rem] shadow-2xl border border-brown/5 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-luxury-light p-8 text-center border-b border-brown/5">
                    <img src={resolveUploadUrl(settings?.logo) || "/images/logo.png"} alt="Shri Radhe" className="h-16 mx-auto mb-4 object-contain" />
                    <h2 className="text-3xl font-black uppercase tracking-wider text-brown">
                        Welcome <span className="text-gold italic font-serif lowercase">Back.</span>
                    </h2>
                    <p className="text-brown/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        Purely Organic Luxury
                    </p>
                </div>

                {/* Form */}
                <div className="p-10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl text-center font-bold uppercase tracking-widest">
                            {typeof error === 'string' ? error : 'Login Failed'}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                            />
                        </div>

                        <div className="relative group">
                            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-brown transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-luxury-light pl-14 pr-6 py-4 rounded-2xl border border-brown/10 focus:border-brown/20 focus:bg-luxury-light outline-none text-brown placeholder:text-brown/30 font-bold transition-all text-sm"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-[10px] font-black text-gold hover:text-brown transition-colors uppercase tracking-widest"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-brown active:scale-[0.98] transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin" size={20} />
                                    SIGNING IN...
                                </>
                            ) : (
                                <>
                                    Sign In <FiArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-luxury-light p-8 text-center border-t border-brown/5">
                    <p className="text-brown/60 text-[11px] font-bold uppercase tracking-widest">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-gold hover:text-brown transition-colors font-black ml-1"
                        >
                            Register Now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
