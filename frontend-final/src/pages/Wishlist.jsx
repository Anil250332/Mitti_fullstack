import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiArrowLeft, FiTrash2, FiLoader } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { resolveUploadUrl } from '../api/axios';

export default function Wishlist() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items: wishlist, loading, error } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchWishlist());
        }
    }, [dispatch, isAuthenticated]);

    const handleRemoveFromWishlist = (productId) => {
        dispatch(removeFromWishlist(productId));
    };

    const handleAddToCart = (productId) => {
        dispatch(addToCart({ productId, quantity: 1 }));
        // Remove from wishlist silently after adding to cart
        dispatch(removeFromWishlist({ productId, silent: true }));
    };


    const displayImage = (path) => {
        return resolveUploadUrl(path) || "https://via.placeholder.com/150";
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center pt-20">
                <h2 className="text-2xl font-black text-brown mb-4">Please Login</h2>
                <p className="text-brown/60 mb-6">You need to be logged in to view your wishlist.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="bg-brown text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl"
                >
                    Login
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center pt-20 px-4">
                <div className="bg-luxury-light/60 backdrop-blur-2xl p-8 rounded-3xl border border-red-100 shadow-2xl text-center max-w-md">
                    <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                    <h2 className="text-2xl font-black text-brown mb-2">Wishlist Error</h2>
                    <p className="text-red-500/80 font-bold mb-6">{error}</p>
                    <button
                        onClick={() => dispatch(fetchWishlist())}
                        className="bg-brown text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-gold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (loading && wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-luxury-light flex items-center justify-center pt-20">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-luxury-light pt-24 sm:pt-32 md:pt-32 pb-16 md:pb-24 ">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-0 md:px-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-4 md:mb-6 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase text-[10px] tracking-widest">Continue Shopping</span>
                        </button>
                        <h1 className="text-4xl md:text-7xl font-black text-brown tracking-tighter leading-none mb-4">
                            My <span className="text-gold italic font-serif">Wishlist.</span>
                        </h1>
                        <p className="text-base md:text-xl text-brown/60 font-bold max-w-lg leading-relaxed">
                            A curated selection of your favorite premium organic soil blends and garden essentials.
                        </p>
                    </motion.div>

                    {wishlist.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-brown text-white px-6 md:px-8 py-5 md:py-6 rounded-3xl md:rounded-4xl shadow-xl shadow-brown/20"
                        >
                            <p className="text-white/40 uppercase tracking-widest text-[9px] font-black mb-1">Total Saved</p>
                            <p className="text-2xl md:text-3xl font-black">{wishlist.length} Items</p>
                        </motion.div>
                    )}
                </div>

                <div className="mt-8">
                    {wishlist.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-luxury-light/60 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-brown/5 shadow-2xl p-10 md:p-16 text-center"
                        >
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-brown/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                                <FiHeart className="text-brown/20" size={32} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-brown mb-3 tracking-tight">Your wishlist is empty</h2>
                            <p className="text-brown/60 font-bold mb-6 md:mb-8 text-base md:text-lg">Save the organic products you love for later!</p>
                            <button
                                onClick={() => navigate("/products")}
                                className="bg-brown text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all duration-300 active:scale-95"
                            >
                                Start Browsing
                            </button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {wishlist.map((item, index) => (
                                    <motion.div
                                        key={item.productId}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group border-brown border-8 bg-luxury-light/60 backdrop-blur-2xl rounded-[2.5rem] shadow-xl hover:shadow-2xl p-6 transition-all duration-500 relative flex flex-col"
                                    >
                                        {/* Image Container */}
                                        <div className="relative overflow-hidden rounded-3xl mb-6 aspect-square bg-luxury-light shadow-inner">
                                            <img
                                                src={displayImage(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Heart Toggle (Filled since it's in wishlist) */}
                                            <button
                                                onClick={() => handleRemoveFromWishlist(item.productId)}
                                                className="absolute top-3 right-3 md:top-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-luxury-light/90 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 shadow-xl border border-brown/5 transition-all duration-500 hover:scale-110 active:scale-90 z-20"
                                                title="Remove from Wishlist"
                                            >
                                                <AiFillHeart size={20} className="transition-transform duration-500" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 ">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-black text-brown text-xl leading-tight group-hover:text-gold transition-colors duration-300">{item.name}</h3>
                                            </div>
                                            {(item.mrpPerJarLabel || (item.weight && parseFloat(item.weight) > 0)) && (
                                                <p className="text-xs font-black uppercase tracking-widest text-brown/40 mb-4">{item.mrpPerJarLabel || item.weight}</p>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-brown/5">
                                                <div className="flex flex-col">
                                                    <span className="text-xl md:text-2xl font-black text-brown leading-none">₹{item.price}</span>
                                                    {item.oldPrice && (
                                                        <span className="text-[10px] line-through text-brown/40 mt-1">₹{item.oldPrice}</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleAddToCart(item.productId)}
                                                    className="bg-brown text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-gold transition-all duration-300 flex items-center gap-2 active:scale-95"
                                                >
                                                    <span className="hidden sm:inline">Add to Cart</span> <FiShoppingCart />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer Message */}
                {wishlist.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-16 text-center"
                    >
                        <p className="text-brown/40 font-bold text-sm">
                            🌱 Liked something? Add it to your cart and make it yours!
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
