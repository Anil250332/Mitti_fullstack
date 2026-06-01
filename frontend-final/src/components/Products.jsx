import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiShoppingBag, FiStar, FiLoader } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { fetchProducts, fetchCategories, fetchSubCategories } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { resolveUploadUrl } from '../api/axios';

const Products = () => {
    const scrollRef = React.useRef(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [selectedSubCategory, setSelectedSubCategory] = useState('all');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { items: products, categories, subcategories, loading, pagination } = useSelector((state) => state.product);
    const { items: wishlistItems } = useSelector((state) => state.wishlist);
    const [page, setPage] = useState(1);
    const limit = 12;

    const scrollToUp = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'auto' });
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    };



    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        const params = { page, limit };
        if (selectedSubCategory !== 'all') {
            params.subCategoryId = selectedSubCategory;
        } else if (selectedCategory !== 'all') {
            params.categoryId = selectedCategory;
        }
        dispatch(fetchProducts(params));
    }, [dispatch, selectedCategory, selectedSubCategory, page]);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setSelectedSubCategory('all');
            return;
        }
        dispatch(fetchSubCategories(selectedCategory));
    }, [dispatch, selectedCategory]);

    // Fetch wishlist on mount or when auth changes
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchWishlist());
        }
    }, [dispatch, isAuthenticated]);

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


    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const displayCategories = [{ id: 'all', name: "All Categories" }, ...categories];

    return (
        <section ref={scrollRef} className="py-24 bg-luxury-light min-h-screen scroll-mt-32">

            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-4"
                    >
                        Our Collection
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-black text-brown tracking-tighter"
                    >
                        Discover Pure <span className="text-gold italic font-serif">Clay.</span>                    </motion.h2>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {displayCategories.map((cat) => (
                        <button
                            key={cat.id || (cat.name || cat.category)}
                            onClick={() => {
                                const newCat = cat.id === 'all' ? 'all' : cat.id;
                                setSelectedCategory(newCat);
                                setSelectedSubCategory('all');
                                setPage(1);
                            }}
                            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 border-2 ${(selectedCategory === 'all' && cat.id === 'all') || selectedCategory == cat.id
                                ? "bg-brown border-brown text-white shadow-xl shadow-brown/20 scale-105"
                                : "bg-luxury-light border-brown/5 text-brown/60 hover:border-brown/20 hover:text-brown"
                                }`}
                        >
                            {cat.name || cat.category}
                        </button>
                    ))}
                </div>

                {selectedCategory !== 'all' && subcategories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        <button
                            onClick={() => {
                                setSelectedSubCategory('all');
                                setPage(1);
                            }}
                            className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 border ${(selectedSubCategory === 'all')
                                ? 'bg-gold border-gold text-white'
                                : 'bg-luxury-light border-brown/10 text-brown/60 hover:border-brown/30 hover:text-brown'
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
                                className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 border ${(selectedSubCategory == sub.id)
                                    ? 'bg-brown border-brown text-white'
                                    : 'bg-luxury-light border-brown/10 text-brown/60 hover:border-brown/30 hover:text-brown'
                                    }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                {loading && products.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <FiLoader className="animate-spin text-brown" size={40} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-brown/5 rounded-full flex items-center justify-center mb-6">
                            <FiShoppingBag className="text-brown/20" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-brown mb-2 tracking-tighter">No Products Found</h3>
                        <p className="text-brown/40 font-bold max-w-xs uppercase text-[10px] tracking-widest">
                            We couldn't find any products in this category at the moment.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        <AnimatePresence mode='popLayout'>
                            {products.map((product) => {
                                const price = Number(product.price || product.Price || 0);
                                const discountPrice = Number(product.discountedPrice || product.DiscountPrice || 0);
                                const hasDiscount = discountPrice > 0 && discountPrice < price;
                                const finalPrice = hasDiscount ? discountPrice : price;

                                return (
                                    <motion.div
                                        layout
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5 }}
                                        onClick={() => handleProductClick(product.id)}
                                        className="group relative  bg-luxury-light rounded-4xl  border-brown border-8 p-6 shadow-2xl hover:shadow-gold/10 transition-all duration-700 cursor-pointer"
                                    >
                                        {/* Image Container */}
                                        <div className="relative w-full h-64 rounded-3xl overflow-hidden mb-8 bg-luxury-light shadow-inner">
                                            <motion.img
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.8 }}
                                                src={resolveUploadUrl(product.image) || "https://via.placeholder.com/400"}
                                                alt={product.name}
                                                className="absolute inset-0 w-full h-full  object-cover"
                                                loading="lazy"
                                            />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product.id);
                                                }}
                                                className={`absolute top-4 right-4 w-11 h-11 rounded-xl backdrop-blur-md flex items-center justify-center shadow-xl border border-brown/5 transition-all duration-500 z-20 group/heart ${wishlistItems.some(item => item.productId === product.id)
                                                    ? "bg-luxury-light/90 text-red-500 hover:bg-red-500 hover:text-white"
                                                    : "bg-luxury-light/70 text-brown hover:bg-brown hover:text-white"
                                                    }`}
                                            >
                                                {wishlistItems.some(item => item.productId === product.id) ? (
                                                    <AiFillHeart size={20} className="transition-transform duration-500" />
                                                ) : (
                                                    <AiOutlineHeart size={20} className="transition-transform duration-500" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(product.id);
                                                }}
                                                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-brown text-white flex items-center justify-center shadow-lg transform translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-gold hover:scale-110 z-20"
                                            >
                                                <FiShoppingBag size={20} />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-4 ">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-1">Premium</p>
                                                    <h3 className="text-2xl font-black text-brown leading-tight tracking-tighter">
                                                        {product.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-brown/5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-0.5 text-gold">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FiStar key={i} size={12} className="fill-current" />
                                                        ))}
                                                    </div>
                                                    {product.weight && Number(product.weight) > 0 && (
                                                        <span className="text-[10px] font-black text-brown/40 uppercase tracking-widest mt-1">
                                                            weight   {product.weight} Kg
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl md:text-2xl font-black text-brown">
                                                        ₹{finalPrice}
                                                    </p>
                                                    {hasDiscount && (
                                                        <p className="text-xs line-through text-brown/40 font-bold">
                                                            ₹{price}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProductClick(product.id);
                                                }}
                                                className="w-full py-4 rounded-2xl  text-brown font-black text-xs uppercase tracking-widest bg-brown text-white transition-all duration-500 flex items-center justify-center gap-2"
                                            >
                                                Product Details <FiChevronRight />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {!loading && products.length > 0 && pagination?.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-6 mt-20 pb-12">
                        <button
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                scrollToUp();
                            }}
                            disabled={page === 1}
                            className="w-14 h-14 rounded-3xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-500 shadow-xl shadow-brown/5 group"
                        >

                            <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brown/30 mb-2">Displaying Page</span>
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
                            className="w-14 h-14 rounded-3xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-500 shadow-xl shadow-brown/5 group"
                        >

                            <FiChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Products;
