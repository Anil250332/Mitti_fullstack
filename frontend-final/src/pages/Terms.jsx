import React from 'react';
import { motion } from 'framer-motion';

export default function Terms() {
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
                            Terms <span className="text-gold italic font-serif lowercase">& Conditions</span>
                        </h1>
                        <p className="text-brown/60 text-xs font-bold uppercase tracking-[0.2em]">
                            Our Agreement with You
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 space-y-8 text-brown/80 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Overview
                            </h2>
                            <p className="text-sm">
                                This website is operated by Shri Radhe. Throughout the site, the terms “we”, “us” and “our” refer to Shri Radhe. By visiting our site and/or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Online Store Terms
                            </h2>
                            <p className="text-sm">
                                By agreeing to these Terms of Service, you represent that you are at least the age of majority. You agree not to use our premium growing media, tools, or organic formulations for any unauthorized or illegal cultivation purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Product Variations
                            </h2>
                            <p className="text-sm">
                                Please note that as our products are 100% organic and derived from natural sources, slight variations in color, texture, and moisture content may occur between batches. These natural variations do not affect the potency or integrity of the "organic lifeblood" we provide.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Intellectual Property
                            </h2>
                            <p className="text-sm">
                                All content included on this site, such as unique organic soil formulations, potting media blends, text, graphics, and logos, is the property of Shri Radhe Collection and protected by copyright and other intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Limitation of Liability
                            </h2>
                            <p className="text-sm">
                                In no case shall Shri Radhe, our directors, officers, or employees be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind arising from your use of any of the service or any products procured using the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Govering Law
                            </h2>
                            <p className="text-sm">
                                These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
                            </p>
                        </section>
                    </div>

                    <div className="bg-luxury-light p-8 sm:p-12 text-center border-t border-brown/5">
                        <p className="text-brown/40 text-[10px] font-bold uppercase tracking-widest">
                            © 2026 Shri Radhe. All Rights Reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
