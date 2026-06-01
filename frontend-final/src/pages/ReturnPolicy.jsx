import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCcw, FiShieldOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function ReturnPolicy() {
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
                            Returns <span className="text-gold italic font-serif lowercase">& Refunds</span>
                        </h1>
                        <p className="text-brown/60 text-xs font-bold uppercase tracking-[0.2em]">
                            Our Commitment to Satisfaction
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 space-y-12">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center">
                                    <FiCheckCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-brown text-xs uppercase tracking-widest mb-1">Eligible</h4>
                                    <p className="text-[10px] text-brown/60 font-bold uppercase leading-relaxed">Damaged on arrival, incorrect product, or sealed/unopened bags within 7 days.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
                                    <FiShieldOff size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-brown text-xs uppercase tracking-widest mb-1">Non-Returnable</h4>
                                    <p className="text-[10px] text-brown/60 font-bold uppercase leading-relaxed">Used growing media, opened bags, customized soil blends, or items after 7 days.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 text-brown/80 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Return Window
                                </h2>
                                <p className="text-sm">
                                    Since our products are organic lifeforms and media, we accept return requests within <span className="text-gold font-black">7 days</span> of delivery. This ensures the integrity and purity of the media are maintained.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    The Refund Process
                                </h2>
                                <p className="text-sm mb-4">
                                    Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex gap-4 text-sm bg-luxury-light p-4 rounded-2xl">
                                        <span className="w-6 h-6 rounded-full bg-brown text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                                        <p>Refunds are processed to the original payment method within 5-7 business days.</p>
                                    </li>
                                    <li className="flex gap-4 text-sm bg-luxury-light p-4 rounded-2xl">
                                        <span className="w-6 h-6 rounded-full bg-brown text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                                        <p>Shipping costs for returns are the responsibility of the customer unless the error was ours.</p>
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gold"></span>
                                    Damaged Goods
                                </h2>
                                <p className="text-sm">
                                    If your package arrives damaged or leaking, please take a photograph immediately and contact us at <span className="font-bold underline">support@shriradhe.com</span>. We will dispatch a replacement at no extra cost.
                                </p>
                            </section>
                        </div>
                    </div>

                    <div className="bg-brown p-8 sm:p-12 text-center">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
                            Ready to start a return request?
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-4 bg-gold text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-luxury-light hover:text-brown transition-all shadow-xl shadow-gold/20"
                        >
                            Contact Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
