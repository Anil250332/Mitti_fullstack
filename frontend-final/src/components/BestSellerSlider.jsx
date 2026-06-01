import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchBestSellers } from '../store/slices/productSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { resolveUploadUrl } from '../api/axios';
import { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, FreeMode } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

export default function BestSellerSlider() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items: allProducts, bestSellers, loading } = useSelector((state) => state.product);
    const { items: wishlistItems } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);

    // Prefer bestSellers from API, otherwise fallback to filtering allProducts (if legacy), otherwise first 8
    const displayProducts = bestSellers.length > 0
        ? bestSellers
        : (allProducts.filter(p => p.isBestseller).length > 0 ? allProducts.filter(p => p.isBestseller) : allProducts.slice(0, 8));

    useEffect(() => {
        dispatch(fetchBestSellers());
    }, [dispatch]);

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

    return (
        <section className="py-10 bg-luxury-light relative overflow-hidden group/bestseller">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header Section - Compact & Elegant */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-peacock font-black uppercase tracking-[0.4em] text-[10px] mb-3">Customer Choice</p>
                        <h2 className="text-4xl md:text-5xl font-black text-brown tracking-tighter">
                            Featured <span className="text-peacock italic font-serif opacity-90">Bestsellers.</span>
                        </h2>
                    </motion.div>

                    {/* Compact Navigation Controls */}
                    <div className="hidden md:flex items-center gap-3">
                        <button className="bestseller-prev-btn w-12 h-12 rounded-full border border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white transition-all duration-300">
                            <FiChevronLeft size={20} />
                        </button>
                        <button className="bestseller-next-btn w-12 h-12 rounded-full border border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white transition-all duration-300">
                            <FiChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Swiper
                        modules={[FreeMode, Autoplay, Navigation, Pagination]}
                        spaceBetween={24}
                        slidesPerView={1.2}
                        freeMode={true}
                        grabCursor={true}
                        navigation={{
                            prevEl: ".bestseller-prev-btn",
                            nextEl: ".bestseller-next-btn",
                        }}
                        pagination={false}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                            1280: { slidesPerView: 4 },
                        }}
                        className="pb-4 h-[500px] "
                    >
                        {displayProducts.map((item) => (
                            <SwiperSlide key={item.id}>
                                <motion.div
                                    onClick={() => handleProductClick(item.id)}
                                    className="group/card h-[400px] w-full relative bg-luxury-light border-brown border-6 rounded-3xl p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(92,64,51,0.15)] cursor-pointer flex flex-col shadow-lg"
                                >
                                    {/* Product Image Container - Compact & Robust */}
                                    <div className="relative aspect-3/2 rounded-2xl overflow-hidden mb-6 bg-luxury-light shadow-inner shrink-0">
                                        <motion.img
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ duration: 0.8 }}
                                            src={resolveUploadUrl(item.image) || "https://via.placeholder.com/400"}
                                            alt={item.name}
                                            className="absolute inset-0 w-full object-cover"
                                        />

                                        {/* Badge Overlay */}
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-luxury-light/90 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-black tracking-widest text-gold uppercase shadow-sm">
                                                Featured
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist(item.id);
                                            }}
                                            className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-md border border-brown/5 transition-all duration-300 z-20 group/heart ${wishlistItems.some(wItem => wItem.productId === item.id)
                                                ? "bg-luxury-light/90 text-red-500 hover:bg-red-500 hover:text-white"
                                                : "bg-luxury-light/70 text-brown hover:bg-brown hover:text-white"
                                                }`}
                                        >
                                            {wishlistItems.some(wItem => wItem.productId === item.id) ? (
                                                <AiFillHeart size={14} className="transition-transform duration-300" />
                                            ) : (
                                                <AiOutlineHeart size={14} className="transition-transform duration-300" />
                                            )}
                                        </button>

                                        {/* Quick Add Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(item.id);
                                            }}
                                            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-brown text-white flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 hover:bg-gold hover:scale-110"
                                        >
                                            <FiShoppingBag size={18} />
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <div className="space-y-3 grow flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-brown/40">
                                                Premium
                                            </span>
                                            <div className="flex items-center gap-0.5 text-peacock">
                                                {[...Array(5)].map((_, i) => (
                                                    <FiStar key={i} size={10} className="fill-current" />
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-black text-brown leading-tight tracking-tight line-clamp-2">
                                            {item.name}
                                        </h4>

                                        <div className="pt-3 border-t border-[#5C3A2E]/5 flex items-center justify-between mt-auto">
                                            {(() => {
                                                const price = Number(item.price || item.Price || 0);
                                                const discountPrice = Number(item.discountedPrice || item.DiscountPrice || 0);
                                                const hasDiscount = discountPrice > 0 && discountPrice < price;
                                                const finalPrice = hasDiscount ? discountPrice : price;

                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-xl font-black text-brown">
                                                            ₹{finalPrice}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-[10px] line-through text-brown/40 font-bold">
                                                                ₹{price}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            {item.weight && Number(item.weight) > 0 && (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter self-start mt-1">
                                                    {item.weight} Kg
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>


        </section>
    );
}
