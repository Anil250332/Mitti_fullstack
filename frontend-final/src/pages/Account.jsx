import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPackage, FiMapPin, FiLogOut, FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import AccountOrders from '../components/userDashboard/AccountOrders';
import AccountAddress from '../components/userDashboard/AccountAddress';
import AccountDetails from '../components/userDashboard/AccountDetails';
import { fetchMe } from '../store/slices/authSlice';
import { fetchAddresses, fetchMyOrders } from '../store/slices/userSlice';
import { useEffect } from 'react';

const sections = [
    { key: 'orders', label: 'My Orders', icon: <FiPackage size={20} />, description: 'Track your deliveries' },
    { key: 'address', label: 'Addresses', icon: <FiMapPin size={20} />, description: 'Shipping destinations' },
    { key: 'details', label: 'Profile Settings', icon: <FiUser size={20} />, description: 'Manage your data' },
    { key: 'logout', label: 'Sign Out', icon: <FiLogOut size={20} />, description: 'End your session', isDanger: true },
];

export default function Account() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('orders');

    useEffect(() => {
        if (location.state?.activeSection) {
            setActiveSection(location.state.activeSection);
        }
    }, [location.state]);
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchMe());
        dispatch(fetchAddresses());
        dispatch(fetchMyOrders());
    }, [dispatch]);

    const renderContent = () => {
        switch (activeSection) {
            case 'orders': return <AccountOrders />;
            case 'address': return <AccountAddress />;
            case 'details': return <AccountDetails />;
            default: return <AccountOrders />;
        }
    };

    const handleAction = (key) => {
        if (key === 'logout') {
            dispatch(logout());
            window.location.href = '/';
        } else {
            setActiveSection(key);
        }
    };

    return (
        <div className="min-h-screen bg-luxury-light pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-0 md:px-6">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-left"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-4 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase text-[10px] tracking-widest">Dashboard</span>
                        </button>
                        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-brown tracking-tighter leading-none mb-4">
                            My <span className="text-gold italic font-serif">Account.</span>
                        </h1>
                        <p className="text-base md:text-xl text-brown/60 font-bold max-w-lg leading-relaxed">
                            Welcome back, {user?.name?.split(' ')[0] || 'User'}. Your personal hub for organic excellence.
                        </p>
                    </motion.div>

                    {/* Quick Stats / Info Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brown text-white px-6 md:px-10 py-6 md:py-10 rounded-4xl md:rounded-[3rem] shadow-2xl shadow-brown/20 flex items-center gap-4 md:gap-6 relative overflow-hidden group/card max-w-fit md:max-w-none"
                    >
                        <div className="absolute inset-0 bg-gold/10 -translate-x-full group-hover/card:translate-x-0 transition-transform duration-700" />
                        <div className="relative z-10 w-12 h-12 md:w-15 md:h-15 bg-luxury-light/10 rounded-2xl md:rounded-4xl flex items-center justify-center backdrop-blur-md">
                            <FiUser size={24} className="text-gold" />
                        </div>
                        <div className="relative z-10">
                            <p className="font-black text-lg md:text-2xl tracking-tight leading-none mb-1">{user?.name || 'User'}</p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        {sections.map((sec, idx) => (
                            <motion.button
                                key={sec.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleAction(sec.key)}
                                className={`w-full group flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-3xl md:rounded-4xl transition-all duration-500 relative overflow-hidden ${activeSection === sec.key && !sec.isDanger
                                    ? "bg-brown text-white shadow-2xl shadow-brown/30"
                                    : sec.isDanger
                                        ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                                        : "bg-luxury-light/60 hover:bg-luxury-light text-brown shadow-lg hover:shadow-xl"
                                    }`}
                            >
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 ${activeSection === sec.key && !sec.isDanger
                                    ? "bg-luxury-light/10 shadow-inner"
                                    : "bg-brown/5 group-hover:scale-110"
                                    }`}>
                                    {React.cloneElement(sec.icon, { size: window.innerWidth < 768 ? 16 : 20 })}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black uppercase tracking-widest text-[9px] md:text-[11px] mb-0.5">{sec.label}</p>
                                    <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 transition-opacity ${activeSection === sec.key ? "opacity-60" : ""
                                        }`}>{sec.description}</p>
                                </div>
                                <FiChevronRight size={16} className={`transition-transform duration-500 hidden sm:block ${activeSection === sec.key ? "rotate-90" : "group-hover:translate-x-1"
                                    }`} />

                                {activeSection === sec.key && !sec.isDanger && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-gold"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </aside>

                    {/* Content Area */}
                    <main className="lg:col-span-8 bg-luxury-light/40 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3rem] border border-white/60 shadow-2xl p-6 sm:p-10 md:p-16 relative min-h-[400px] md:min-h-[600px]">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <img src="/images/logo.png" alt="" className="w-40 filter grayscale contrast-0" />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="relative z-10"
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}
