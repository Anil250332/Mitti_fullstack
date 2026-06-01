import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiTarget, FiHeart, FiWind, FiChevronRight, FiGlobe, FiTruck, FiUsers, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const stats = [
    { label: "Happy Customers", value: "Thousands" },
    { label: "Purity Score", value: "100%" },
    { label: "Natural Quality", value: "Pure" },
    { label: "Eco-Friendly", value: "Safe" }
];

export default function AboutUs() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 400]);

    return (
        <div className="bg-luxury-light  min-h-screen overflow-hidden">

            {/* --- Premium Hero Section --- */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <motion.div style={{ y: yHero }} className="absolute inset-0">
                    <img
                        src="/home.png"
                        alt="Natural Clay background"
                        className="w-full h-full object-cover scale-110"
                    />
                    <div className="absolute inset-0 bg-brown/75 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-linear-to-b from-brown/20 via-transparent to-white" />
                </motion.div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center lg:mt-20">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-gold font-black uppercase tracking-[0.4em] text-xs md:text-sm mb-6"
                    >
                        Welcome to Shri Radhe Collection
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-black text-white leading-[0.9] md:leading-[0.85] tracking-tighter mb-4 md:mb-6"
                    >
                        {/* Only ONE Peacock Feather replacing the 🌿 emoji */}
                        <motion.img
                            src="/peacock-feather2.png"
                            alt="Mor Pankh"
                            initial={{ rotate: -20, y: 0 }}
                            animate={{ rotate: [-20, -10, -20], y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="inline-block w-16 h-16 md:w-24 md:h-24 mr-4 mb-2 align-middle object-contain"
                            style={{
                                filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))",
                                mixBlendMode: "multiply" // Ensures any residual white background blends away
                            }}
                        />
                        About <br />
                        <span className="text-gold italic font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[90px]">Shri Radhe Collection.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="max-w-3xl mx-auto text-white font-medium text-lg md:text-xl leading-relaxed opacity-90"
                    >
                        Dedicated to bringing you 100% natural, pure, and high-quality clay products that support your holistic wellness journey.
                    </motion.p>
                </div>
            </section>

            {/* --- Founder Section --- */}
            <section className="py-16 lg:py-32 px-4 sm:px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Left: Bio Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-brown leading-none tracking-tighter mb-8 md:mb-12">
                                Meet Our <br />
                                <span className="text-gold italic font-serif">Founder...</span>
                            </h2>
                            <div className="space-y-6 text-brown/70 text-lg font-medium leading-relaxed">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    My name is <span className="text-brown font-black">Priyanka Kaurav</span>, and I am the proud founder of Shri Radhe Collection. We specialize in providing 100% natural, pure, and high-quality clay products to customers all across India.
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    As a trusted wholesaler and retailer, we serve thousands of happy customers through our strong presence on YouTube, Instagram, and Facebook. Our journey is built on a passion for delivering natural products that support healthy skin, hair, and overall wellness.
                                </motion.p>

                            </div>
                        </motion.div>

                        {/* Right: Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 md:gap-8 relative">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                    className="p-8 md:p-10 bg-luxury-light/40 backdrop-blur-sm rounded-4xl border border-brown/5 flex flex-col justify-center shadow-xl shadow-brown/5 hover:shadow-gold/10 transition-all duration-300"
                                >
                                    <p className="text-3xl md:text-4xl font-black text-brown mb-2 tracking-tighter">{stat.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brown/40 leading-tight">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* --- Mission Section --- */}
            <section className="py-24 bg-brown/5 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 text-gold"
                    >
                        <FiTarget size={40} />
                    </motion.div>
                    <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[11px] mb-4"> Our Mission</h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-brown leading-tight tracking-tighter"
                    >
                        "Our mission is to provide premium quality natural clay products at affordable wholesale and retail prices while maintaining the highest standards of purity and customer satisfaction."
                    </motion.h3>
                </div>
            </section>

            {/* --- Why Choose Us Grid --- */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 relative">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-gold font-black uppercase tracking-[0.4em] text-[11px] mb-4"
                        >
                            ⭐ Why Choose Shri Radhe Collection?
                        </motion.p>
                        <h2 className="text-4xl sm:text-5xl font-black text-brown tracking-tighter">Focused on Quality & Purity.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            { title: "100% Natural", icon: FiWind, desc: "100% Natural and Chemical-Free Clay Products for your wellness.", bg: "bg-brown/5", hov: "hover:bg-brown" },
                            { title: "Trusted Quality", icon: FiStar, desc: "Trusted by thousands of happy customers across India.", bg: "bg-gold/5", hov: "hover:bg-gold" },
                            { title: "Fast Delivery", icon: FiTruck, desc: "Safe and reliable delivery across all states in India.", bg: "bg-luxury-dark/5", hov: "hover:bg-brown" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-10 rounded-4xl ${item.bg} border border-brown/5 flex flex-col items-center text-center group ${item.hov} transition-all duration-500`}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-luxury-light shadow-xl flex items-center justify-center text-brown mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <item.icon size={32} />
                                </div>
                                <h4 className="text-2xl font-black text-brown group-hover:text-white mb-4">{item.title}</h4>
                                <p className="text-brown/60 group-hover:text-white/70 font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Commitment Section --- */}
            <section className="pb-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="p-10 md:p-20 rounded-[4rem] bg-luxury-light border border-brown/5 shadow-2xl relative overflow-hidden"
                    >
                        <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[11px] mb-6">🤝 Our Commitment</h2>
                        <p className="text-2xl md:text-3xl font-black text-brown mb-8 leading-tight">
                            "We are dedicated to building long-term relationships with our customers by providing consistent quality, honest service, and reliable supply."
                        </p>
                        <div className="flex flex-col items-center">
                            <p className="text-gold font-serif italic text-xl mb-4">Your trust is our greatest strength. 💛</p>
                            <p className="text-brown font-black uppercase text-sm tracking-widest">
                                Thank you for choosing and supporting Shri Radhe Collection. 🙏
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative floating icons */}
                <FiHeart size={100} className="absolute -bottom-10 -left-10 text-gold/5 -rotate-12" />
                <FiUsers size={120} className="absolute -top-10 -right-10 text-brown/5 rotate-12" />
            </section>

            {/* --- CTA Section --- */}
            <section className="pb-20 px-4 sm:px-6">
                <motion.div
                    whileHover={{ scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto bg-brown rounded-4xl sm:rounded-[4rem] p-12 lg:p-24 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter mb-4">
                                Experience <br />
                                <span className="text-gold italic font-serif">Original Purity.</span>
                            </h2>
                            <p className="text-white/60 font-medium text-lg">Shop our collection of 100% natural clay products.</p>
                        </div>
                        <button
                            onClick={() => navigate("/products")}
                            className="whitespace-nowrap px-10 py-5 rounded-full bg-luxury-light text-brown font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-gold hover:text-white transition-all duration-500 flex items-center justify-center gap-4">
                            Browse Products <FiChevronRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Footer Tagline
            <div className="py-12 border-t border-brown/5 text-center px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brown/20">
                    Shri Radhe Collection &bull; Since 2026
                </p>
            </div> */}

        </div>
    );
}
