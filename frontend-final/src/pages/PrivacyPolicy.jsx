import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
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
                            Privacy <span className="text-gold italic font-serif lowercase">Policy</span>
                        </h1>
                        <p className="text-brown/60 text-xs font-bold uppercase tracking-[0.2em]">
                            Last Updated: February 2026
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 space-y-8 text-brown/80 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Introduction
                            </h2>
                            <p className="text-sm">
                                At Shri Radhe Collection, we are dedicated to protecting your privacy. This policy outlines how we handle your data when you use our platform to source premium organic growing media and cultivation tools.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Information We Collect
                            </h2>
                            <p className="text-sm mb-4">
                                To provide the best cultivation experience, we collect:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-2 ml-4">
                                <li>Shipping and billing details for your organic media orders.</li>
                                <li>Account preferences tailored to your urban gardening needs.</li>
                                <li>Communications regarding our purity protocols and product queries.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                How We Use Data
                            </h2>
                            <p className="text-sm mb-4">
                                Your data helps us improve our organic lifeblood formulations and services:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-2 ml-4">
                                <li>Optimizing logistics for heavy growing media delivery.</li>
                                <li>Sharing seasonal planting guides and organic cultivation tips.</li>
                                <li>Ensuring secure payment processing for your sanctuary essentials.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Security Protocol
                            </h2>
                            <p className="text-sm font-medium italic mb-2 text-gold">
                                Pure Integrity, Digital & Physical.
                            </p>
                            <p className="text-sm">
                                Just as we test our soil for purity, we protect our servers with industry-standard encryption. Your sensitive financial information is never stored on our internal databases.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-brown uppercase tracking-widest mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-gold"></span>
                                Your Rights
                            </h2>
                            <p className="text-sm">
                                You have the right to access, correct, or delete your personal data at any time. You can manage your preferences through your account settings or by contacting us directly.
                            </p>
                        </section>
                    </div>

                    <div className="bg-brown p-8 sm:p-12 text-center">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
                            Have questions about our privacy practices?
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-4 bg-gold text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-luxury-light hover:text-brown transition-all shadow-xl shadow-gold/20"
                        >
                            Contact Privacy Team
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
