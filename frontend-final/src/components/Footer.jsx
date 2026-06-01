import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiArrowRight, FiMail, FiLinkedin, FiMapPin, FiPhone } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../store/slices/settingsSlice';
import { resolveUploadUrl } from '../api/axios';

export default function Footer() {
    const dispatch = useDispatch();
    const { data: settings } = useSelector((state) => state.settings);

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        { name: "About Us", path: "/about-us" },
        { name: "Contact", path: "/contact" },
    ];

    const socialLinks = [];
    if (settings?.instagram) socialLinks.push({ Icon: FiInstagram, path: settings.instagram });
    if (settings?.facebook) socialLinks.push({ Icon: FiFacebook, path: settings.facebook });
    if (settings?.youtube) socialLinks.push({ Icon: FiYoutube, path: settings.youtube });


    // fallback if no social links
    if (socialLinks.length === 0) {
        socialLinks.push({ Icon: FiFacebook, path: "#" });
        socialLinks.push({ Icon: FiInstagram, path: "#" });
    }

    return (
        <footer className="bg-luxury-light pt-16 md:pt-24 pb-12 relative overflow-hidden">
            {/* Subtle Top Divider */}
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-brown/10 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 md:gap-16 mb-16 md:mb-20">

                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-5 space-y-6 md:space-y-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/" className="inline-block transition-transform hover:scale-105">
                                <img
                                    src={resolveUploadUrl(settings?.logo) || "/images/logo.png"}
                                    alt="Logo"
                                    className="h-14 w-auto object-contain"
                                />
                            </Link>
                            <div className="flex flex-col items-center sm:items-start">
                                <h3 className="text-xl sm:text-2xl font-black text-brown tracking-tighter uppercase whitespace-normal sm:whitespace-nowrap">Shri Radhe Collection</h3>
                            </div>
                        </div>

                        <p className="text-brown/60 text-sm leading-relaxed font-medium max-w-sm">
                            Cultivating the foundation of your green sanctuary. We provide 100% organic, ethically sourced growing media for the modern urban gardener.
                        </p>

                        <div className="flex space-x-4">
                            {socialLinks.map(({ Icon, path }, idx) => (
                                <a
                                    key={idx}
                                    href={path}
                                    target={path.startsWith('http') ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 bg-luxury-light border border-brown/5 text-brown rounded-xl flex items-center justify-center hover:bg-brown hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm"
                                >
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h4 className="text-gold font-black text-[10px] uppercase tracking-[0.4em] mb-6 md:mb-8">Navigation</h4>
                        <ul className="space-y-4">
                            {navLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-brown/80 font-bold text-base hover:text-gold transition-colors block"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Detail Section */}
                    <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h4 className="text-gold font-black text-[10px] uppercase tracking-[0.4em] mb-6 md:mb-8">Get In Touch</h4>
                        <div className="space-y-6 w-full flex flex-col items-center sm:items-start">
                            {settings?.address && (
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-brown/80 font-bold max-w-xs">
                                    <div className="w-10 h-10 rounded-lg bg-luxury-light flex items-center justify-center text-brown shrink-0">
                                        <FiMapPin />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest opacity-40">Our Location</span>
                                        <span className="text-sm leading-tight">{settings.address}</span>
                                    </div>
                                </div>
                            )}
                            {settings?.email && (
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-brown/80 font-bold">
                                    <div className="w-10 h-10 rounded-lg bg-luxury-light flex items-center justify-center text-brown shrink-0">
                                        <FiMail />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest opacity-40">Email Us</span>
                                        <span className="text-sm">{settings.email}</span>
                                    </div>
                                </div>
                            )}
                            {settings?.contactNo && (
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-brown/80 font-bold">
                                    <div className="w-10 h-10 rounded-lg bg-brown/5 flex items-center justify-center text-brown shrink-0">
                                        <FiPhone />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest opacity-40">Call Us</span>
                                        <span className="text-sm">{settings.contactNo}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t grid grid-cols-1 md:grid-cols-2 border-brown/10  gap-8 items-center">
                    {/* Column 1: Copyright */}
                    <div className="flex justify-center md:justify-start">
                        <p className="text-[10px] tracking-[0.2em] font-bold uppercase text-brown/70 text-center md:text-left">
                            © {new Date().getFullYear()} Shri Radhe Collection.
                            Design & Developed by <a className="text-gold text-[11px] font-black underline hover:text-brown transition-colors">Adryter Advertising</a>
                        </p>
                    </div>

                    {/* Column 3: Links */}
                    <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap text-[12px] tracking-[0.1em] font-bold uppercase text-brown/70">
                        <Link to="/privacy-policy" className="hover:text-gold transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-gold transition-colors">Terms</Link>
                        <Link to="/shipping" className="hover:text-gold transition-colors">Shipping</Link>
                        <Link to="/return-policy" className="hover:text-gold transition-colors">Returns</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
