import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiSearch, FiChevronRight, FiFilter, FiX, FiCheck, FiLoader, FiStar } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, fetchSubCategories, fetchWeights, fetchTags, fetchMinMaxPrice } from '../store/slices/productSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { resolveUploadUrl } from '../api/axios';

export default function Product() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const scrollRef = useRef(null);


    // Redux State
    const { isAuthenticated } = useSelector((state) => state.auth);
    const {
        items: products,
        categories,
        subcategories,
        weights: weightOptions,
        tags: tagOptions,
        minPrice: storeMinPrice,
        maxPrice: storeMaxPrice,
        loading,
        pagination
    } = useSelector((state) => state.product);
    const { items: wishlistItems } = useSelector((state) => state.wishlist);

    // Filter States
    const [page, setPage] = useState(1);
    const limit = 12;
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedSubCategory, setSelectedSubCategory] = useState("all");
    const [priceRange, setPriceRange] = useState(3000);
    const [selectedWeights, setSelectedWeights] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fixed Weight Ranges to prevent UI breaking from too many specific weight options
    const weightRanges = [
        { label: "0-2 KG", min: 0, max: 2 },
        { label: "2-5 KG", min: 2, max: 5 },
        { label: "5-10 KG", min: 5, max: 10 },
        { label: "10-25 KG", min: 10, max: 25 },
    ];

    // Initial Fetch
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchWeights());
        dispatch(fetchTags());
        dispatch(fetchMinMaxPrice());
        if (isAuthenticated) {
            dispatch(fetchWishlist());
        }
    }, [dispatch, isAuthenticated]);

    // Update local price range when store max price is fetched
    useEffect(() => {
        if (storeMaxPrice) {
            setPriceRange(storeMaxPrice);
        }
    }, [storeMaxPrice]);

    useEffect(() => {
        const categoryId = searchParams.get('categoryId');
        const subCategoryId = searchParams.get('subCategoryId');

        if (subCategoryId) {
            setSelectedCategory(categoryId || 'all');
            setSelectedSubCategory(subCategoryId);
            return;
        }

        if (categoryId) {
            setSelectedCategory(categoryId);
            setSelectedSubCategory('all');
            return;
        }

        setSelectedCategory('all');
        setSelectedSubCategory('all');
    }, [searchParams]);

    // Fetch Products based on filters
    useEffect(() => {
        const params = {};

        if (selectedSubCategory !== "all") {
            params.subCategoryId = selectedSubCategory;
        } else if (selectedCategory !== "all") {
            params.categoryId = selectedCategory;
        }

        if (selectedWeights.length > 0) {
            // Map selected range labels to actual weight IDs from API
            const weightIds = weightOptions
                .filter(apiWeight => {
                    const weightVal = parseFloat(apiWeight.weight);
                    return selectedWeights.some(rangeLabel => {
                        const range = weightRanges.find(r => r.label === rangeLabel);
                        if (!range) return false;
                        return weightVal >= range.min && weightVal < range.max;
                    });
                })
                .map(w => w.id);

            if (weightIds.length > 0) params.weightIds = weightIds.join(',');
            else params.weightIds = 'none'; // Ensure no products are shown if no weights match the range
        }

        if (selectedTags.length > 0) {
            const tagIds = tagOptions
                .filter(t => selectedTags.includes(t.tag))
                .map(t => t.id);
            if (tagIds.length > 0) params.tagIds = tagIds.join(',');
        }

        if (searchQuery) params.search = searchQuery;

        params.minPrice = 0;
        params.maxPrice = priceRange;
        params.page = page;
        params.limit = limit;

        // Use a timeout to debounce API calls for search and price slider
        const timer = setTimeout(() => {
            dispatch(fetchProducts(params));
        }, 300);

        return () => clearTimeout(timer);
    }, [dispatch, selectedCategory, selectedSubCategory, selectedWeights, selectedTags, searchQuery, priceRange, page, categories, weightOptions, tagOptions]);


    useEffect(() => {
        if (selectedCategory === "all") {
            setSelectedSubCategory("all");
            return;
        }
        dispatch(fetchSubCategories(selectedCategory));
    }, [dispatch, selectedCategory]);

    const scrollToUp = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'auto' });
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    };

    // Scroll to products area when filters or page change
    useEffect(() => {
        // Only scroll if it's not the initial mount or if page > 1
        if (page > 1 || selectedCategory !== "all" || selectedSubCategory !== "all") {
            scrollToUp();
        }
    }, [page, selectedCategory, selectedSubCategory]);




    const toggleWishlist = (id) => {
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }

        const isInWishlist = wishlistItems.some(item => item.productId === id);
        if (isInWishlist) {
            dispatch(removeFromWishlist(id));
        } else {
            dispatch(addToWishlist(id));
        }
    };

    const handleAddToCart = (productId) => {
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }
        dispatch(addToCart({ productId, quantity: 1 }))
            .unwrap()
            .then(() => {
                navigate('/cart');
            });
    };

    const toggleWeight = (weight) => {
        setPage(1);
        setSelectedWeights(prev =>
            prev.includes(weight) ? [] : [weight]
        );
    };

    const toggleTag = (tag) => {
        setPage(1);
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const activeCategory = categories.find((c) => String(c.id) === String(selectedCategory));
    const activeSubCategory = subcategories.find((s) => String(s.id) === String(selectedSubCategory));

    // Filtered products are now coming directly from Redux 'products'
    // We don't need useMemo for local filtering anymore since we fetch from API
    const displayProducts = products;

    return (
        <div className="pt-32 pb-24 bg-luxury-light min-h-screen">
            <div className="max-w-7xl mx-auto px-6">

                {/* --- Header Section --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
                    <div className="max-w-xl">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
                            <span className="w-12 h-px bg-gold/30" />
                            <p className="text-gold font-black uppercase tracking-[0.4em] text-[10px]">Purely Organic Collections</p>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-6xl md:text-8xl font-black text-brown leading-[0.9] tracking-tighter"
                        >
                            Curated <br />
                            <span className="text-gold italic font-serif">Excellence.</span>
                        </motion.h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative group min-w-[300px]">
                            <input
                                type="text"
                                placeholder="Search our catalog..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-luxury-light/70 backdrop-blur-xl border border-brown/10 rounded-3xl px-8 py-5 w-full text-sm font-bold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-all shadow-xl shadow-brown/5"
                            />
                            <FiSearch className="absolute right-8 top-1/2 -translate-y-1/2 text-brown/40 group-focus-within:text-gold transition-colors" size={20} />
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden h-[60px] px-8 bg-brown text-white rounded-3xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all text-sm font-black uppercase tracking-widest"
                        >
                            <FiFilter size={18} /> Filters
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-16">

                    {/* --- Workspace Side Filters (Desktop) --- */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-32 bg-luxury-light/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-brown/5 shadow-2xl shadow-brown-20 space-y-12 transition-all hover:bg-luxury-light/60">

                            {/* Categories */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                    <h3 className="text-brown font-black uppercase tracking-[0.3em] text-[11px]">Parent Categories</h3>
                                </div>
                                <div className="space-y-1.5">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory("all");
                                            setSelectedSubCategory("all");
                                        }}
                                        className={`w-full group flex items-center justify-between px-6 py-4 rounded-2xl text-[13px] font-black transition-all duration-300 ${selectedCategory === "all"
                                            ? "bg-brown text-white shadow-2xl shadow-brown/20"
                                            : "text-brown/40 hover:bg-brown/5 hover:text-brown"
                                            }`}
                                    >
                                        <span className="tracking-tight">All Products</span>
                                        {selectedCategory === "all" ? (
                                            <motion.div layoutId="cat-active" className="w-2 h-2 rounded-full bg-gold" />
                                        ) : (
                                            <FiChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        )}
                                    </button>

                                    {categories.map((cat) => {
                                        const catName = cat.category || cat.name;
                                        const isActiveCategory = String(selectedCategory) === String(cat.id);
                                        return (
                                            <div key={cat.id} className="space-y-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCategory(cat.id);
                                                        setSelectedSubCategory("all");
                                                        setPage(1);
                                                    }}
                                                    className={`w-full group flex items-center justify-between px-6 py-4 rounded-2xl text-[13px] font-black transition-all duration-300 ${isActiveCategory
                                                        ? "bg-brown text-white shadow-2xl shadow-brown/20"
                                                        : "text-brown/40 hover:bg-brown/5 hover:text-brown"
                                                        }`}
                                                >
                                                    <span className="tracking-tight">{catName}</span>
                                                    <FiChevronRight
                                                        className={`transition-all duration-200 ${isActiveCategory
                                                            ? 'opacity-100 rotate-90'
                                                            : 'opacity-90 group-hover:opacity-70 group-hover:translate-x-0.5'
                                                        }`}
                                                    />
                                                </button>

                                                {isActiveCategory && subcategories.length > 0 && (
                                                    <div className="ml-4 space-y-1 border-l border-brown/10 pl-3">
                                                        
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubCategory("all");
                                                                setPage(1);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${selectedSubCategory === "all"
                                                                ? "bg-gold text-white"
                                                                : "text-brown/50 hover:bg-brown/5"
                                                                }`}
                                                        >
                                                            All in Category
                                                        </button>
                                                        {subcategories.map((sub) => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => {
                                                                    setSelectedSubCategory(sub.id);
                                                                    setPage(1);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${String(selectedSubCategory) === String(sub.id)
                                                                    ? "bg-brown text-white"
                                                                    : "text-brown/50 hover:bg-brown/5"
                                                                    }`}
                                                            >
                                                                {sub.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                               
                            </section>

                            {/* Weight Multi-Select (Using Fixed Ranges) */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                    <h3 className="text-brown font-black uppercase tracking-[0.3em] text-[11px]">Select Weight</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {weightRanges.map(range => (
                                        <button
                                            key={range.label}
                                            onClick={() => toggleWeight(range.label)}
                                            className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${selectedWeights.includes(range.label)
                                                ? "bg-brown border-brown text-white shadow-lg"
                                                : "border-brown/5 text-brown/30 hover:border-brown/20"
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Tags Multi-Select */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                    <h3 className="text-brown font-black uppercase tracking-[0.3em] text-[11px]">Select Tags</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tagOptions.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => toggleTag(t.tag)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wide border transition-all ${selectedTags.includes(t.tag)
                                                ? "bg-gold border-gold text-white shadow-md"
                                                : "bg-luxury-light border-brown/10 text-brown/40 hover:border-brown/30"
                                                }`}
                                        >
                                            {t.tag}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Price Filter */}
                            <section>
                                <style>{`
                                    .premium-slider::-webkit-slider-thumb {
                                        -webkit-appearance: none;
                                        appearance: none;
                                        width: 24px;
                                        height: 24px;
                                        background: #C97863;
                                        border: 4px solid #ffffff;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
                                        transition: all 0.3s ease;
                                    }
                                    .premium-slider::-webkit-slider-thumb:hover {
                                        transform: scale(1.2);
                                        background: #044843;
                                    }
                                    .premium-slider::-moz-range-thumb {
                                        width: 24px;
                                        height: 24px;
                                        background: #C97863;
                                        border: 4px solid #ffffff;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
                                    }
                                `}</style>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                        <h3 className="text-brown font-black uppercase tracking-[0.3em] text-[11px]">Price Limit</h3>
                                    </div>
                                    <div className="bg-gold/10 px-4 py-1.5 rounded-full border border-gold/20 shadow-inner">
                                        <span className="text-gold font-black text-sm tracking-tighter">₹{priceRange}</span>
                                    </div>
                                </div>
                                <div className="relative px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={storeMaxPrice || 3000}
                                        step="10"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                        className="premium-slider w-full h-3 bg-linear-to-r from-brown/5 via-gold/20 to-brown/5 rounded-full appearance-none cursor-pointer outline-none shadow-inner border border-brown/5"
                                    />
                                    <div className="flex justify-between mt-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em] px-1">
                                        <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-brown/20" /> ₹0</span>
                                        <span className="flex items-center gap-1.5">₹{storeMaxPrice || 3000} <div className="w-1 h-1 rounded-full bg-brown/20" /></span>
                                    </div>
                                </div>
                            </section>


                        </div>
                    </aside>

                    {/* --- Product Grid --- */}
                    <main ref={scrollRef} className="flex-1 min-h-[600px] scroll-mt-40">

                        {loading ? (
                            <div className="flex justify-center items-center py-60">
                                <FiLoader className="animate-spin text-brown" size={40} />
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-10"
                                >
                                    {displayProducts.map((product) => {
                                        const price = Number(product.price || product.Price || 0);
                                        const discountPrice = Number(product.discountedPrice || product.DiscountPrice || 0);
                                        const hasDiscount = discountPrice > 0 && discountPrice < price;
                                        const finalPrice = hasDiscount ? discountPrice : price;

                                        return (
                                            <motion.div
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.5 }}
                                                className="group relative border-brown border-8 bg-luxury-light rounded-4xl  p-6 shadow-2xl hover:shadow-gold/10 transition-all duration-700 cursor-pointer"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                            >
                                                {/* Image Container */}
                                                <div className="relative w-full h-60  rounded-3xl overflow-hidden mb-8 bg-luxury-light shadow-inner">
                                                    <motion.img
                                                        whileHover={{ scale: 1.1 }}
                                                        transition={{ duration: 0.8 }}
                                                        src={resolveUploadUrl(product.image) || "https://via.placeholder.com/400"}
                                                        alt={product.name}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute top-4 left-4 z-20">
                                                        {product.subTitle && (
                                                            <span className="bg-luxury-light/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest text-brown uppercase shadow-sm border border-brown/5">
                                                                {product.subTitle}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleWishlist(product.id);
                                                        }}
                                                        className={`absolute top-4 right-4 w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center shadow-xl border border-brown/5 transition-all duration-500 z-20 group/heart ${wishlistItems.some(item => item.productId === product.id)
                                                            ? "bg-luxury-light/90 text-red-500 hover:bg-red-500 hover:text-white"
                                                            : "bg-luxury-light/70 text-brown hover:bg-brown hover:text-white"
                                                            }`}
                                                    >
                                                        {wishlistItems.some(item => item.productId === product.id) ? (
                                                            <AiFillHeart size={24} className="transition-transform duration-500" />
                                                        ) : (
                                                            <AiOutlineHeart size={24} className="transition-transform duration-500" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToCart(product.id);
                                                        }}
                                                        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-brown text-white flex items-center justify-center shadow-lg transform translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-gold hover:scale-110 z-20"
                                                    >
                                                        <FiShoppingCart size={20} />
                                                    </button>
                                                </div>

                                                {/* Content */}
                                                <div className="space-y-4 ">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-full">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gold">{product.subTitle || 'Premium'}</p>
                                                                <div className="flex items-center gap-0.5 text-gold">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <FiStar key={i} size={10} className="fill-current" />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <h3 className="text-2xl font-black text-brown leading-tight tracking-tighter">
                                                                {product.name}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-brown/5">
                                                        <div className="flex flex-col">
                                                            {hasDiscount && (
                                                                <span className="text-[9px] font-black uppercase text-gold line-through tracking-wider">₹{price}</span>
                                                            )}
                                                            <p className="text-2xl font-black text-brown">
                                                                ₹{finalPrice}
                                                            </p>
                                                        </div>
                                                        {parseFloat(product.weight) > 0 && (
                                                            <span className="text-[13px] font-black text-gold uppercase tracking-widest bg-gold/5 px-3 py-1 rounded-lg border border-gold/10">
                                                                {(() => {
                                                                    const w = parseFloat(product.weight);
                                                                    if (isNaN(w)) return product.weight || 'N/A';
                                                                    const range = weightRanges.find(r => w >= r.min && w < r.max);
                                                                    return range ? range.label : `${w} KG`;
                                                                })()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/product/${product.id}`);
                                                        }}
                                                        className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-brown text-white transition-all duration-500 flex items-center justify-center gap-2"
                                                    >
                                                        Product Details
                                                        <FiChevronRight />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        )}

                        {/* Pagination Controls */}
                        {!loading && displayProducts.length > 0 && pagination?.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 mt-20 mb-12 pt-10 border-t border-brown/5">
                                <button
                                    onClick={() => {
                                        setPage(p => Math.max(1, p - 1));
                                        scrollToUp();
                                    }}
                                    disabled={page === 1}
                                    className="w-14 h-14 rounded-3xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-500 shadow-xl shadow-brown/5 group bg-white"
                                >


                                    <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                                </button>

                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brown/30 mb-2">Discovery Page</span>
                                    <div className="bg-brown text-white w-14 h-14 rounded-3xl flex items-center justify-center text-xl font-black shadow-2xl shadow-brown/30 tracking-tighter">
                                        {String(page).padStart(2, '0')}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold mt-2 opacity-60">of {pagination.totalPages}</span>
                                </div>

                                <button
                                    onClick={() => {
                                        setPage(p => Math.min(pagination.totalPages, p + 1));
                                        scrollToUp();
                                    }}
                                    disabled={page === pagination.totalPages}
                                    className="w-14 h-14 rounded-3xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-500 shadow-xl shadow-brown/5 group bg-white"
                                >


                                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
                                </button>
                            </div>
                        )}

                        {/* Empty results */}
                        {!loading && displayProducts.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-40 text-center bg-luxury-light/30 rounded-[4rem] border-2 border-dashed border-brown/5"
                            >
                                <div className="w-24 h-24 bg-brown/5 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <FiSearch className="text-brown/20" size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-brown/50 tracking-tighter mb-4">No treasures found</h3>
                                <p className="text-brown/30 font-bold mb-8 italic">Adjust your filters to discover our premium range.</p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory("all");
                                        setSelectedSubCategory("all");
                                        setPriceRange(storeMaxPrice || 3000);
                                        setSearchQuery("");
                                        setSelectedWeights([]);
                                        setSelectedTags([]);
                                    }}
                                    className="px-10 py-5 bg-brown text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-gold transition-all"
                                >
                                    Reset Discovery
                                </button>
                            </motion.div>
                        )}
                    </main>
                </div>

            </div>

            {/* --- Mobile Sidebar (Enhanced Drawer) --- */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-brown/80 backdrop-blur-xl z-5000 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 right-0 w-[90%] max-w-[400px] bg-luxury-light z-5100 lg:hidden shadow-3xl flex flex-col p-10"
                        >
                            <div className="flex items-center justify-between mb-16">
                                <h3 className="text-2xl font-black text-brown tracking-tighter">Refine Results</h3>
                                <button onClick={() => setIsSidebarOpen(false)} className="w-12 h-12 rounded-2xl bg-luxury-light flex items-center justify-center text-brown active:scale-90">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar">
                                {/* Categories Mobile */}
                                <section>
                                    <h4 className="text-brown font-black uppercase tracking-[0.3em] text-[10px] mb-6 opacity-40">Parent Category</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory("all");
                                                setSelectedSubCategory("all");
                                            }}
                                            className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${selectedCategory === "all"
                                                ? "bg-brown text-white shadow-xl shadow-brown/20"
                                                : "bg-brown/5 text-brown/50"
                                                }`}
                                        >
                                            All Products
                                        </button>
                                        {categories.map((cat) => {
                                            const catName = cat.category || cat.name;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setSelectedCategory(cat.id);
                                                        setSelectedSubCategory("all");
                                                    }}
                                                    className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${String(selectedCategory) === String(cat.id)
                                                        ? "bg-brown text-white shadow-xl shadow-brown/20"
                                                        : "bg-brown/5 text-brown/50"
                                                        }`}
                                                >
                                                    {catName}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedCategory !== "all" && subcategories.length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 mb-2">
                                                Sub Category ({activeCategory?.category || activeCategory?.name})
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setSelectedSubCategory("all")}
                                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSubCategory === "all"
                                                    ? "bg-gold text-white"
                                                    : "bg-brown/5 text-brown/50"
                                                    }`}
                                            >
                                                All in Category
                                            </button>
                                            {subcategories.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubCategory(sub.id)}
                                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${String(selectedSubCategory) === String(sub.id)
                                                        ? "bg-brown text-white"
                                                        : "bg-brown/5 text-brown/50"
                                                        }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    )}
                                  
                                </section>

                                {/* Weight Mobile (Using Fixed Ranges) */}
                                <section>
                                    <h4 className="text-brown font-black uppercase tracking-[0.3em] text-[10px] mb-6 opacity-40">Filter by Weight</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {weightRanges.map(range => (
                                            <button
                                                key={range.label}
                                                onClick={() => toggleWeight(range.label)}
                                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedWeights.includes(range.label)
                                                    ? "bg-brown border-brown text-white"
                                                    : "border-brown/5 text-brown/30"
                                                    }`}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Tags Mobile */}
                                <section>
                                    <h4 className="text-brown font-black uppercase tracking-[0.3em] text-[10px] mb-6 opacity-40">Filter by Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {tagOptions.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => toggleTag(t.tag)}
                                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wide border transition-all ${selectedTags.includes(t.tag)
                                                    ? "bg-gold border-gold text-white"
                                                    : "bg-luxury-light border-brown/10 text-brown/40"
                                                    }`}
                                            >
                                                {t.tag}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Price Mobile */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-brown font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Max Budget</h4>
                                        <span className="text-gold font-black text-sm">₹{priceRange}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={storeMaxPrice || 3000}
                                        step="10"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-brown/10 rounded-lg appearance-none cursor-pointer accent-gold"
                                    />
                                </section>
                            </div>

                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="w-full bg-brown text-white py-6 rounded-4xl font-black uppercase text-xs tracking-[0.3em] shadow-3xl mt-10 active:scale-95"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
