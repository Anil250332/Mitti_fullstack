import React from 'react';
import { motion } from 'framer-motion';
import { FiTruck, FiBox, FiClock, FiGlobe } from 'react-icons/fi';

export default function Shipping() {
    return (
        <div className="min-h-screen bg-luxury-light pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-luxury-light rounded-[3rem] shadow-2xl overflow-hidden border border-brown/5"
                >
                    <div className="bg-luxury-light p-8 sm:p-12 text-center border-b border-brown/5">
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-brown mb-4">
                            Shipping <span className="text-gold italic font-serif lowercase">& Delivery</span>
                        </h1>
                        <p className="text-brown/60 text-xs font-bold uppercase tracking-[0.2em]">
                            Global Delivery & Tracking Information
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 space-y-12">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { icon: FiTruck, title: "Free Shipping", desc: "On all orders above ₹5000" },
                                { icon: FiClock, title: "Fast Delivery", desc: "3-5 business days delivery" },
                                { icon: FiGlobe, title: "Global reach", desc: "Shipping across 50 countries" }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-luxury-light rounded-3xl text-center border border-transparent hover:border-gold/20 transition-all group">
                                    <item.icon className="mx-auto text-gold group-hover:scale-110 transition-transform mb-3" size={24} />
                                    <h3 className="text-sm font-black text-brown uppercase tracking-widest mb-1">{item.title}</h3>
                                    <p className="text-[10px] text-brown/50 font-bold uppercase tracking-widest">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-8 text-brown/80 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Order Processing
                                </h2>
                                <p className="text-sm">
                                    Every batch of organic media at Shri Radhe is checked for purity before dispatch. Orders are typically processed within 1-2 business days. For bulk growing media or custom blends, please allow up to 5 business days for preparation and curing.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Shipping Times
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 rounded-2xl border border-brown/5 text-sm">
                                        <span className="font-bold">Standard Media Delivery</span>
                                        <span className="text-gold font-bold">3 - 7 Business Days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 rounded-2xl border border-brown/5 text-sm">
                                        <span className="font-bold">Express Delivery</span>
                                        <span className="text-gold font-bold">1 - 3 Business Days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 rounded-2xl border border-brown/5 text-sm text-brown/40">
                                        <span className="font-bold">Bulky/Pallet Shipping</span>
                                        <span className="text-gold/50 font-bold italic">Contact for Quote</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Logistics of Heavy Media
                                </h2>
                                <p className="text-sm">
                                    Due to the weight of our premium growing media, our logistics partners may require curbside delivery for large orders. Please ensure someone is available to receive these heavy arrivals.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Eco-Friendly Packaging
                                </h2>
                                <p className="text-sm">
                                    We use biodegradable or high-grade recyclable bags for all our organic formulations, ensuring that the integrity of the soil is maintained without leaving a permanent footprint on the planet.
                                </p>
                            </section>
                        </div>
                    </div>

                    <div className="bg-brown p-8 sm:p-12 text-center">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
                            Need help with your current order?
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-4 bg-gold text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-luxury-light hover:text-brown transition-all shadow-xl shadow-gold/20"
                        >
                            Track Package
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
