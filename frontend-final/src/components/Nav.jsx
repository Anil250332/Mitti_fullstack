import React, { useState, useEffect } from "react";
import { FiMenu, FiX, FiUser, FiHeart, FiShoppingCart, FiSearch, FiChevronRight, FiLock } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toggleMenu, closeMenu } from "../store/slices/uiSlice";
import { fetchSettings } from "../store/slices/settingsSlice";
import { fetchCategories, fetchSubCategories } from "../store/slices/productSlice";
import { resolveUploadUrl } from "../api/axios";


export default function Nav() {
    const dispatch = useDispatch();
    const { isMenuOpen, cartCount } = useSelector((state) => state.ui);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { data: settings } = useSelector((state) => state.settings);
    const { categories, subcategories } = useSelector((state) => state.product);
    const [scrolled, setScrolled] = useState(false);
    const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
    const [mobileActiveCategoryId, setMobileActiveCategoryId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchSettings());
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        if (!activeCategoryId) return;
        dispatch(fetchSubCategories(activeCategoryId));
    }, [dispatch, activeCategoryId]);

    useEffect(() => {
        if (!mobileActiveCategoryId) return;
        dispatch(fetchSubCategories(mobileActiveCategoryId));
    }, [dispatch, mobileActiveCategoryId]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isMenuOpen]);

    const handleAuthNavigation = (path) => {
        if (!isAuthenticated) {
            navigate('/login'); // Redirect to login page if not authenticated
            return;
        }
        navigate(path);
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        { name: "About Us", path: "/about-us" },
        { name: "Contact", path: "/contact", isCTA: true },
    ];

    const categoryNameById = (id) => {
        const found = categories?.find((c) => String(c?.id) === String(id));
        return found?.category || found?.name || "";
    };

    const openProductsMenu = () => {
        setIsProductsMenuOpen(true);
        setActiveCategoryId(null);
    };

    const closeProductsMenu = () => {
        setIsProductsMenuOpen(false);
        setActiveCategoryId(null);
    };

    const buildProductsUrl = ({ categoryId, subCategoryId } = {}) => {
        const params = new URLSearchParams();
        if (categoryId) params.set("categoryId", String(categoryId));
        if (subCategoryId) params.set("subCategoryId", String(subCategoryId));
        const query = params.toString();
        return query ? `/products?${query}` : "/products";
    };

    return (
        <header
            className={`w-full fixed top-0 z-100 transition-all duration-500 pt-4 md:pt-6 px-4 md:px-8 ${scrolled ? "-translate-y-2.5" : "translate-y-0"
                }`}
        >
            <div
                className={`max-w-7xl mx-auto transition-all duration-500 rounded-4xl border ${scrolled
                    ? "bg-luxury-light/95 backdrop-blur-2xl border-brown/10 shadow-[0_20px_50px_rgba(92,64,51,0.1)] py-2 px-6"
                    : "bg-brown/10 backdrop-blur-xl border-white/20 py-4 px-4 md:px-6 shadow-xl"
                    }`}
            >
                <div className="flex justify-between items-center py-1">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center group relative">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -3 }}
                            className="transition-all"
                        >
                            <img
                                src={resolveUploadUrl(settings?.logo) || "/images/logo.png"}
                                alt="Logo"
                                className={`transition-all duration-500 object-contain bg-luxury-light rounded-full  ${scrolled ? "h-12" : "h-12"
                                    }`}
                            />
                        </motion.div>
                        {!scrolled && (
                            <div className="ml-4 hidden lg:block">
                                <h1 className="text-black  font-black text-sm uppercase tracking-widest leading-none mb-1">Shri Radhe Collection</h1>
                            </div>
                        )}
                    </Link>

                    {/* Desktop Center Menu */}
                    <nav className="hidden md:flex items-center gap-1.5 bg-black/5 p-1 rounded-2xl border border-white/5">
                        {navLinks.map((link) => {
                            if (link.name === "Products") {
                                return (
                                    <div
                                        key={link.name}
                                        className="relative"
                                        onMouseEnter={openProductsMenu}
                                        onMouseLeave={closeProductsMenu}
                                    >
                                        <button
                                            onClick={() => navigate('/products')}
                                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${location.pathname === '/products' || location.pathname.startsWith('/product/')
                                                ? "bg-brown text-white shadow-md"
                                                : `${scrolled ? "text-brown/70 hover:text-brown hover:bg-luxury-light" : "text-white/70 hover:text-white hover:bg-luxury-light/10"}`
                                                }`}
                                        >
                                            {link.name}
                                        </button>

                                        <AnimatePresence>
                                            {isProductsMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full left-0 mt-3 rounded-3xl border border-brown/10 bg-luxury-light/95 backdrop-blur-xl shadow-2xl  z-200"
                                                >
                                                    <div className={`flex rounded-3xl overflow-hidden border border-brown/10 bg-luxury-light shadow-2xl transition-all duration-300 ${activeCategoryId && subcategories?.length > 0 ? 'w-[512px]' : 'w-64'}`}>
                                                        {/* Categories List */}
                                                        <div className="w-64 border-r border-brown/5 p-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brown/50 px-3 pb-2 border-b-2 mb-2">Category</p>
                                                            <div 
                                                                className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar overscroll-contain"
                                                                onWheel={(e) => e.stopPropagation()}
                                                            >
                                                                {categories?.map((cat) => {
                                                                    const isActive = String(activeCategoryId) === String(cat.id);
                                                                    return (
                                                                        <button
                                                                            key={cat.id}
                                                                            onMouseEnter={() => setActiveCategoryId(cat.id)}
                                                                            onClick={() => {
                                                                                setActiveCategoryId(cat.id);
                                                                                navigate(buildProductsUrl({ categoryId: cat.id }));
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${isActive
                                                                                ? 'bg-brown text-white'
                                                                                : 'text-brown/80 hover:bg-brown/10'
                                                                                }`}
                                                                        >
                                                                            <span>{cat.category || cat.name}</span>
                                                                            <FiChevronRight className={isActive ? 'opacity-100' : 'opacity-40'} />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Subcategories List */}
                                                        {activeCategoryId && subcategories?.length > 0 && (
                                                            <div className="w-64 p-3 bg-luxury-light border-l border-brown/10 animate-in fade-in slide-in-from-left-2 duration-300">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brown/50 px-3 pb-2 border-b-2 mb-2">Sub Category</p>
                                                                <div 
                                                                    className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar overscroll-contain"
                                                                    onWheel={(e) => e.stopPropagation()}
                                                                >
                                                                    {subcategories?.map((sub) => (
                                                                        <button
                                                                            key={sub.id}
                                                                            onClick={() => {
                                                                                closeProductsMenu();
                                                                                navigate(buildProductsUrl({ categoryId: activeCategoryId, subCategoryId: sub.id }));
                                                                            }}
                                                                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-brown/80 hover:bg-brown/10 transition-all font-outfit"
                                                                        >
                                                                            {sub.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${link.isCTA
                                        ? "bg-brown text-white shadow-lg hover:text-white hover:shadow-gold/30 ml-2"
                                        : location.pathname === link.path
                                            ? "bg-brown text-white shadow-md"
                                            : `${scrolled ? "text-brown/70 hover:text-brown hover:bg-luxury-light" : "text-white/70 hover:text-white hover:bg-luxury-light/10"}`
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Action Icons */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            {isAuthenticated ? (
                                <div className="hidden  sm:flex">
                                    <button onClick={() => navigate('/account')}>
                                        <motion.div
                                            whileHover={{ scale: 1.1, backgroundColor: scrolled ? "#A6856410" : "#ffffff15" }}
                                            className={`p-3  rounded-xl transition-colors ${scrolled ? "text-brown" : "text-white"}`}
                                        >
                                            <FiUser size={20} />
                                        </motion.div>
                                    </button>
                                    <button onClick={() => navigate('/wishlist')}>
                                        <motion.div
                                            whileHover={{ scale: 1.1, backgroundColor: scrolled ? "#A6856410" : "#ffffff15" }}
                                            className={`p-3 rounded-xl transition-colors ${scrolled ? "text-brown" : "text-white"}`}
                                        >
                                            <FiHeart size={20} />
                                        </motion.div>
                                    </button>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (window.innerWidth >= 1024) {
                                            navigate('/login');
                                        } else {
                                            navigate('/register');
                                        }
                                    }}
                                    className="bg-gold p-3 px-5 text-white rounded-2xl shadow-lg shadow-gold/40 flex items-center gap-3 border border-white/20"
                                >
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] hidden lg:inline">login</span>
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] lg:hidden">register</span>
                                </motion.button>
                            )}
                        </div>

                        {isAuthenticated && (
                            <Link to="/cart" className="relative group">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gold p-2 px-4 text-white rounded-2xl shadow-lg shadow-gold/40 flex items-center gap-3 border border-white/20"
                                >
                                    <FiShoppingCart size={18} />
                                    <span className="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Cart</span>
                                    <AnimatePresence>
                                        {cartCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0, y: 10 }}
                                                animate={{ scale: 1, y: 0 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-brown text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg"
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Link>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => dispatch(toggleMenu())}
                            className={`p-3 md:hidden rounded-2xl transition-colors ${scrolled ? "text-brown hover:bg-brown/10" : "text-white hover:bg-luxury-light/10"
                                }`}
                        >
                            {isMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Sidebar */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => dispatch(closeMenu())}
                            className="fixed inset-0 bg-brown/60 backdrop-blur-md z-1100 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 right-0 w-[85%] max-w-85 bg-luxury-light z-1200 md:hidden shadow-3xl flex flex-col border-l border-brown/5 h-dvh overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-brown/10 bg-luxury-light">
                                <div className="flex items-center gap-3">
                                    <Link to="/" className="inline-block transition-transform hover:scale-105">
                                        <img src={resolveUploadUrl(settings?.logo) || "/images/logo.png"} alt="Logo" className="h-12 object-contain" />
                                    </Link>
                                </div>
                                <button
                                    onClick={() => dispatch(closeMenu())}
                                    className="w-12 h-12 rounded-2xl bg-luxury-light text-brown flex items-center justify-center border border-brown/5 active:scale-90 transition-all shadow-sm"
                                >
                                    <FiX size={22} />
                                </button>
                            </div>

                            {/* Links List */}
                            <div className="flex-1 overflow-y-scroll overscroll-y-contain p-4 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {navLinks.map((link) => {
                                    if (link.name === "Products") {
                                        return (
                                            <div key="products-mobile-wrapper">
                                                <button
                                                    onClick={() => {
                                                        setIsMobileProductsOpen((prev) => !prev);
                                                        if (!mobileActiveCategoryId && Array.isArray(categories) && categories.length > 0) {
                                                            setMobileActiveCategoryId(categories[0].id);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${location.pathname === '/products' || location.pathname.startsWith('/product/')
                                                        ? "bg-brown text-white shadow-xl shadow-brown/20"
                                                        : "text-brown/70 hover:bg-luxury-light"
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-4">Products</span>
                                                    <FiChevronRight size={18} className={`transition-transform ${isMobileProductsOpen ? 'rotate-90' : 'rotate-0'} ${location.pathname === '/products' || location.pathname.startsWith('/product/') ? 'opacity-100' : 'opacity-30'}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {isMobileProductsOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden rounded-2xl border border-brown/10 bg-white/50 p-3 mt-2"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    dispatch(closeMenu());
                                                                    navigate(buildProductsUrl());
                                                                }}
                                                                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-gold hover:bg-gold/10 transition-all"
                                                            >
                                                                All Products
                                                            </button>

                                                            <div className="grid grid-cols-1 gap-2 mt-2">
                                                                <div className="space-y-1">
                                                                    <p className="px-3 pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-brown/50">Category</p>
                                                                    {categories?.map((cat) => {
                                                                        const isActive = String(mobileActiveCategoryId) === String(cat.id);
                                                                        return (
                                                                            <button
                                                                                key={cat.id}
                                                                                onClick={() => {
                                                                                    setMobileActiveCategoryId(cat.id);
                                                                                    dispatch(closeMenu());
                                                                                    navigate(buildProductsUrl({ categoryId: cat.id }));
                                                                                }}
                                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-brown text-white' : 'text-brown/80 hover:bg-brown/10'}`}
                                                                            >
                                                                                <span>{cat.category || cat.name}</span>
                                                                                <FiChevronRight size={14} className={isActive ? 'opacity-100' : 'opacity-40'} />
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {mobileActiveCategoryId && (
                                                                    <div className="space-y-1 border-t border-brown/10 pt-2">

                                                                        {subcategories?.map((sub) => (
                                                                            <button
                                                                                key={sub.id}
                                                                                onClick={() => {
                                                                                    dispatch(closeMenu());
                                                                                    navigate(buildProductsUrl({ categoryId: mobileActiveCategoryId, subCategoryId: sub.id }));
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-brown/80 hover:bg-brown/10 transition-all"
                                                                            >
                                                                                {sub.name}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            onClick={() => dispatch(closeMenu())}
                                            className={`flex items-center justify-between px-6 py-5 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${location.pathname === link.path
                                                ? "bg-brown text-white shadow-xl shadow-brown/20"
                                                : link.isCTA
                                                    ? "bg-gold text-white shadow-lg shadow-gold/20 mt-8"
                                                    : "text-brown/70 hover:bg-luxury-light"
                                                }`}
                                        >
                                            <span className="flex items-center gap-4">
                                                {location.pathname === link.path && (
                                                    <motion.div layoutId="activeDot" className="w-2 h-2 rounded-full bg-luxury-light" />
                                                )}
                                                {link.name}
                                            </span>
                                            <FiChevronRight size={18} className={location.pathname === link.path ? "opacity-100" : "opacity-30"} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-8 bg-luxury-light/50 border-t border-brown/10">
                                <div className="flex justify-center gap-8 mb-8">
                                    {!isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                dispatch(closeMenu());
                                                navigate('/login');
                                            }}
                                            className="w-full mx-4 py-3 px-2 rounded-3xl bg-brown text-white text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brown/20 border border-brown/10 active:scale-[0.98] transition-all"
                                        >
                                            Login
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    dispatch(closeMenu());
                                                    navigate('/wishlist');
                                                }}
                                                className="flex flex-col items-center gap-3 group text-brown"
                                            >
                                                <div className="w-16 h-16 rounded-4xl bg-luxury-light shadow-xl flex items-center justify-center border border-brown/5 transition-all active:scale-95 group-hover:text-gold">
                                                    <FiHeart size={28} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Wishlist</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    dispatch(closeMenu());
                                                    navigate('/account');
                                                }}
                                                className="flex flex-col items-center gap-3 group text-brown"
                                            >
                                                <div className="w-16 h-16 rounded-4xl bg-luxury-light shadow-xl flex items-center justify-center border border-brown/5 transition-all active:scale-95 group-hover:text-gold">
                                                    <FiUser size={28} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Account</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brown">Shri Radhe Premium</p>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-gold mt-1">Organic Collection</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header >
    );
}
