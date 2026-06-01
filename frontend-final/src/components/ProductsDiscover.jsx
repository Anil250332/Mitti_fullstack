import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiChevronRight } from 'react-icons/fi';

const features = [
    { title: "100% Organic Certified", desc: "No synthetic chemicals or hidden fillers." },
    { title: "pH Balanced Formula", desc: "Optimized for maximum nutrient uptake." },
    { title: "Sustainably Sourced", desc: "Eco-friendly harvesting from local sources." },
    { title: "Premium Quality", desc: "Handpicked for consistent growth results." }
];

export default function ProductsDiscover() {
    return (
        <section className="py-24 bg-brown relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 -skew-x-12 transform translate-x-20" />
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-gold/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 md:gap-24">

                    {/* Left Column: Content + Checklist */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-4">Shri Radhe Spotlight</p>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                            Pure. Potent. <br />
                            <span className="text-gold italic font-serif">Perfectly Balanced.</span>
                        </h2>

                        <div className="space-y-6 mb-10">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-4 group"
                                >
                                    <div className="mt-1 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-white group-hover:bg-luxury-light group-hover:text-brown transition-all duration-300">
                                        <FiCheckCircle size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white mb-1">{feature.title}</h4>
                                        <p className="text-white/60 text-sm font-medium">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                    </motion.div>

                    {/* Right Column: Visual Spotlight */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Circular Image Frame */}
                        <div className="relative aspect-square max-w-md mx-auto">
                            <div className="absolute inset-0 border-20 border-white/10 rounded-full animate-spin-slow" />
                            <div className="absolute inset-0 border border-gold/30 rounded-full scale-110" />

                            <div className="relative h-full w-full rounded-full overflow-hidden border-8 border-white shadow-2xl">
                                <img
                                    src="/home.png"
                                    alt="Discovery"
                                    className="w-full h-full object-cover grayscale-20 hover:grayscale-0 transition-all duration-1000 scale-110 hover:scale-100"
                                />
                                <div className="absolute inset-0 bg-brown/10 mix-blend-multiply" />
                            </div>

                            {/* Floating Stats or Labels */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -right-4 bg-gold px-6 py-4 rounded-3xl shadow-2xl text-white"
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest">Quality Score</p>
                                <p className="text-3xl font-black leading-none">99.8%</p>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="absolute -bottom-8 -left-8 bg-luxury-light px-6 py-4 rounded-3xl shadow-2xl text-brown"
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest leading-tight mb-1">Naturally <br />Sourced</p>
                                <FiCheckCircle className="text-gold" size={24} />
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>


        </section>
    );
}
