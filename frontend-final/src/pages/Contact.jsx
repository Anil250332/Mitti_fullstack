import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiClock, FiMapPin, FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiSend, FiArrowLeft, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../store/slices/settingsSlice';

export default function Contact() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: settings } = useSelector((state) => state.settings);

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        const name = formData.name.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const message = formData.message.trim();

        if (!name || !email || !message) {
            setError('Please fill in all required fields (Name, Email, Message)');
            return;
        }

        if (!/^[A-Za-z\s]+$/.test(name)) {
            setError('Name should only contain letters');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (phone && !/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/contact', {
                name,
                email,
                phone,
                message
            });
            if (res.data.success) {
                setSuccess(true);
                setFormData({ name: '', email: '', phone: '', message: '' });
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: <FiPhone size={24} />,
            title: "Phone Number",
            details: settings?.contactNo ? [settings.contactNo] : ["+91 98765 43210"],
            color: "text-brown"
        },
        {
            icon: <FiMail size={24} />,
            title: "Email Address",
            details: settings?.email ? [settings.email] : ["info@shriradhesoil.com"],
            color: "text-gold"
        },
        {
            icon: <FiClock size={24} />,
            title: "Support Hours",
            details: (settings?.TimeDetail1 || settings?.openingTime) 
                ? [settings.TimeDetail1 || "Mon - Sat", settings.openingTime && settings.closingTime ? `${settings.openingTime} - ${settings.closingTime}` : "9:00 AM - 7:00 PM"]
                : ["Mon - Sat: 9:00 AM - 7:00 PM", "Sunday: Closed"],
            color: "text-brown"
        }
    ];

    const socialLinks = [];
    if (settings?.instagram) socialLinks.push({ icon: <FiInstagram />, link: settings.instagram });
    if (settings?.facebook) socialLinks.push({ icon: <FiFacebook />, link: settings.facebook });
    if (settings?.youtube) socialLinks.push({ icon: <FiYoutube />, link: settings.youtube });
    
    // Fallback if no social links
    if (socialLinks.length === 0) {
        socialLinks.push({ icon: <FiInstagram />, link: "#" });
        socialLinks.push({ icon: <FiFacebook />, link: "#" });
    }

    return (
        <div className="min-h-screen bg-luxury-light pt-24 md:pt-32 pb-16 md:pb-24  overflow-hidden">
            <div className="max-w-7xl mx-auto py-6 sm:py-0 px-4 md:px-6">

                {/* Navigation / Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-left"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-4 md:mb-6 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase text-[10px] tracking-widest">Return</span>
                        </button>
                        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-brown tracking-tighter leading-none mb-4">
                            Let's <span className="text-gold italic font-serif">Connect.</span>
                        </h1>
                        <p className="text-base md:text-xl text-brown/60 font-bold max-w-lg leading-relaxed">
                            Questions about our premium organic blends? Our soil specialists are here to help you grow.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-brown text-white px-6 md:px-8 py-8 md:py-10 rounded-4xl md:rounded-[3rem] shadow-2xl shadow-brown/20 flex items-center md:flex-col text-left md:text-center gap-4 md:gap-4 border border-white/10 relative overflow-hidden group/hq max-w-fit md:max-w-none"
                    >
                        <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover/hq:translate-y-0 transition-transform duration-700" />
                        <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 bg-luxury-light/10 rounded-2xl md:rounded-full flex items-center justify-center backdrop-blur-md shrink-0">
                            <FiMapPin size={24} className="text-gold animate-bounce" />
                        </div>
                        <div className="relative z-10">
                            <p className="font-black uppercase tracking-widest text-[8px] md:text-[9px] opacity-60 mb-1 md:mb-2">Shri Radhe Collection</p>
                            <p className="font-black text-xs md:text-base leading-tight max-w-[180px] md:max-w-[200px]">
                                {settings?.address || "M33 Kadambari Nagar sirol highway road near Jyoti dhaba"}
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16">

                    {/* Left Side: Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="lg:col-span-7 bg-luxury-light/60 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3rem] border border-white/40 shadow-2xl p-6 md:p-12 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FiSend size={120} className="text-brown -rotate-12" />
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-brown mb-8 md:mb-10 tracking-tight flex items-center gap-3 relative z-10">
                            <span className="w-8 h-8 md:w-10 md:h-10 bg-brown/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brown shadow-inner">
                                <FiMail size={16} />
                            </span>
                            Send Us a Message
                        </h2>

                        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your Name"
                                        className="w-full bg-luxury-light/80 border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="you@email.com"
                                        className="w-full bg-luxury-light/80 border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (val.length <= 10) setFormData({ ...formData, phone: val });
                                    }}
                                    placeholder="Your Phone Number"
                                    className="w-full bg-luxury-light/80 border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Message Details</label>
                                <textarea
                                    name="message"
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    placeholder="Write your message here..."
                                    className="w-full bg-luxury-light/80 border-2 border-brown/5 rounded-4xl px-6 py-5 text-brown font-bold focus:outline-none focus:border-brown/10 focus:shadow-xl focus:shadow-brown/5 transition-all duration-500 resize-none"
                                ></textarea>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-xs font-bold flex items-center gap-2"
                                >
                                    <FiCheckCircle size={16} />
                                    Your message has been sent successfully. We will get back to you soon.
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 ${loading
                                    ? "bg-brown/50 cursor-not-allowed text-white"
                                    : "bg-brown text-white hover:bg-gold shadow-brown/30"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className="animate-spin" /> SENDING...
                                    </>
                                ) : (
                                    <>
                                        Send Message <FiSend size={16} />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Right Side: Info & Socials */}
                    <div className="lg:col-span-5 space-y-6 md:space-y-8">

                        {/* Info Cards */}
                        <div className="space-y-4 md:space-y-6">
                            {contactInfo.map((info, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: 0.4 + (idx * 0.1) }}
                                    className="bg-luxury-light/30 backdrop-blur-md p-6 md:p-8 rounded-4xl border border-white/40 hover:border-brown/20 transition-all duration-500 group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-luxury-light shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${info.color}`}>
                                            {React.cloneElement(info.icon, { size: window.innerWidth < 768 ? 20 : 24 })}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-brown text-[10px] md:text-sm uppercase tracking-widest mb-0.5 md:mb-1 opacity-40">{info.title}</h3>
                                            <div className="space-y-0">
                                                {info.details.map((text, i) => (
                                                    <p key={i} className="text-brown font-black text-sm md:text-base leading-tight">{text}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Social Connect */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="bg-gold/10 p-8 rounded-4xl border border-gold/20 backdrop-blur-xl"
                        >
                            <h3 className="font-black text-brown text-xs uppercase tracking-[0.3em] mb-8 text-center opacity-40">Join the Community</h3>
                            <div className="flex justify-center gap-6">
                                {socialLinks.map((social, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={social.link}
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-16 h-16 bg-luxury-light rounded-3xl shadow-xl flex items-center justify-center text-brown hover:text-gold transition-all duration-300 text-2xl border border-white/50"
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Map Section */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-20 md:mt-32 relative"
                >
                    <div className="absolute inset-0 bg-brown/5 rounded-[4rem] blur-3xl -z-10" />
                    <div className="rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-4 md:border-8 border-white p-1 md:p-2 bg-luxury-light/40 backdrop-blur-xl">
                        <iframe
                            title="Shri Radhe Collection Map"
                            src="https://maps.google.com/maps?q=M33%20Kadambari%20Nagar%20sirol%20highway%20road%20near%20Jyoti%20dhaba&t=&z=13&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="500"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-[2.5rem] md:rounded-[3.5rem] transition-all duration-1000"
                        ></iframe>
                    </div>

                    {/* Floating Info Overlay for Map */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[400px]">
                        <div className="bg-luxury-light px-8 py-6 rounded-3xl shadow-2xl border border-brown/5 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-12 h-12 bg-brown rounded-2xl flex items-center justify-center text-white shrink-0">
                                <FiMapPin size={24} />
                            </div>
                            <div className="text-center md:text-left">
                                <p className="font-black text-brown tracking-tight">Main Distribution Center</p>
                                <p className="text-sm font-bold text-brown/60 uppercase tracking-widest mt-1">Visit us for free samples</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
