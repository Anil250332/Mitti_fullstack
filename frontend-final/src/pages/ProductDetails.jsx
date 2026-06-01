import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar, FiCheck, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart, AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { FcBusinessman } from 'react-icons/fc';
import { fetchProductDetails, clearCurrentProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import toast from 'react-hot-toast';
import api, { resolveUploadUrl } from '../api/axios';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { currentProduct: product, loading: productLoading, error: productError } = useSelector((state) => state.product);
    const { items: wishlistItems } = useSelector((state) => state.wishlist);

    const [selectedImg, setSelectedImg] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [tab, setTab] = useState("description");
    const [addingToCart, setAddingToCart] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsPagination, setReviewsPagination] = useState({});

    useEffect(() => {
        if (id) {
            dispatch(fetchProductDetails(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (id) {
            fetchReviews(id, reviewsPage);
        }
    }, [id, reviewsPage]);

    const fetchReviews = async (productId, p = 1) => {
        setReviewsLoading(true);
        try {
            const res = await api.get(`/products/reviews/${productId}?page=${p}`);
            if (res.data.success) {
                setReviews(res.data.data);
                setReviewsPagination(res.data.pagination);
            }
        } catch (error) {
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchWishlist());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (product?.images?.length > 0) {
            setSelectedImg(product.images[0]);
        }
    }, [product]);

    const isWishlisted = wishlistItems.some(item => item.productId === parseInt(id));

    const handleAddToCart = () => {
        if (addingToCart) return;
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }
        setAddingToCart(true);
        dispatch(addToCart({ productId: product.id, quantity }))
            .unwrap()
            .then(() => {
                navigate('/cart');
            })
            .finally(() => {
                setAddingToCart(false);
            });
    };

    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }
        if (isWishlisted) {
            dispatch(removeFromWishlist(product.id));
        } else {
            dispatch(addToWishlist(product.id));
        }
    };

    if (productLoading) {
        return (
            <div className="min-h-screen bg-luxury-light flex items-center justify-center pt-20">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    if (productError || !product) {
        return (
            <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center pt-20">
                <h2 className="text-2xl font-black text-brown mb-4">Product Not Found</h2>
                <button
                    onClick={() => navigate('/products')}
                    className="text-gold font-bold hover:underline"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    const displayImage = (path) => {
        return resolveUploadUrl(path) || "https://via.placeholder.com/600";
    };

    return (
        <div className="min-h-screen bg-luxury-light pt-24 md:pt-32 pb-16 md:pb-24 ">
            <div className="max-w-7xl mx-auto px-4 md:px-6 mt-10">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 md:mb-10 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black uppercase text-xs tracking-widest">Back to Products</span>
                </button>

                {/* Main Product Section */}
                <div className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-[4rem] border border-brown/5 shadow-2xl p-6 md:p-10 lg:p-16 mb-10 md:mb-16">
                    <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-16">

                        {/* Left: Image Gallery */}
                        <div className="flex-1 flex flex-col items-center">
                            <motion.div
                                className="w-full h-56 md:h-96 rounded-2xl md:rounded-[3rem] overflow-hidden bg-luxury-light shadow-inner mb-6 md:mb-8 relative"
                                layout
                            >
                                <img
                                    src={displayImage(selectedImg)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* removed isBestSeller check for now as it maps to a different field if needed, or we can check product.isBestSeller if API provides it */}
                            </motion.div>

                            {/* Thumbnails */}
                            {product.images?.length > 1 && (
                                <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all shadow-lg ${selectedImg === img
                                                ? "border-gold scale-105 shadow-gold/20"
                                                : "border-brown/10 hover:border-brown/30"
                                                }`}
                                            onClick={() => setSelectedImg(img)}
                                        >
                                            <img src={displayImage(img)} alt="thumbnail" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Product Details */}
                        <div className="flex-1 flex flex-col gap-4 md:gap-2">

                            {/* Category - assuming brand or category logic */}
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="w-6 md:w-8 h-px bg-gold/40" />
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-gold">Premium Collection</p>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-brown leading-tight tracking-tighter">
                                {product.name}
                            </h1>

                            {/* Description */}
                            <p className="text-sm md:text-base text-brown/60 font-bold leading-relaxed line-clamp-3">
                                {product.description}
                            </p>

                            {product.isOnlinePaymentOnly && (
                                <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gold/20 w-fit">
                                    <FiCheck className="animate-pulse" /> Online Payment Required
                                </div>
                            )}

                            {/* Rating */}
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="flex items-center gap-1 text-gold">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const rating = product.rating || product.Rating || 4.5;
                                        return (
                                            <span key={star}>
                                                <AiFillStar className="fill-current" size={18} />
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 py-2 md:py- border-y border-brown/5">

                                {product.weight && Number(product.weight) > 0 && (
                                    <div className="text-xs md:text-sm">
                                        <span className="font-black text-brown/40 uppercase tracking-wider text-[9px] md:text-[10px]">Weight</span>
                                        <p className="font-black text-brown mt-0.5 md:mt-1 text-sm md:text-base">{product.weight} Kg</p>
                                    </div>
                                )}
                                <div className="col-span-2 text-xs md:text-sm">
                                    <span className="font-black text-brown/40 uppercase tracking-wider text-[9px] md:text-[10px]">Tags</span>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                                        {product.tags?.map((tag, idx) => (
                                            <span key={idx} className="bg-brown/5 text-brown px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wide md:tracking-widest border border-brown/10">
                                                <FiCheck size={9} className="inline mr-0.5 md:mr-1" />
                                                {tag.tag || tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            {(() => {
                                const price = Number(product.price || product.Price || 0);
                                const discountPrice = Number(product.discountAmount || product.discountedPrice || product.DiscountPrice || 0);
                                const hasDiscount = discountPrice > 0 && discountPrice < price;
                                const finalPrice = hasDiscount ? discountPrice : price;

                                return (
                                    <div className="flex items-end gap-2 md:gap-4">
                                        <span className="text-3xl md:text-4xl lg:text-5xl font-black text-brown tracking-tighter">
                                            ₹{finalPrice}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-sm md:text-base lg:text-lg line-through text-gold mb-1 md:mb-2">
                                                ₹{price}
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Actions */}
                            <div className="flex gap-2 md:gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 md:w-24 border-2 border-brown/10 rounded-xl md:rounded-2xl px-2 md:px-4 py-2 md:py-3 text-center font-black text-brown text-sm md:text-base focus:outline-none focus:border-gold transition-colors"
                                />
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                    className="flex-1 bg-brown text-white py-3 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-gold transition-all duration-500 shadow-2xl shadow-brown/20 hover:shadow-gold/30 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50"
                                >
                                    {addingToCart ? (
                                        <>
                                            <FiLoader className="animate-spin" size={18} />
                                            ADDING TO CART...
                                        </>
                                    ) : (
                                        <>
                                            <FiShoppingCart size={18} />
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleWishlistToggle}
                                    className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 border border-brown/10 ${isWishlisted ? "bg-brown text-white" : "bg-brown/5 text-brown hover:bg-gold hover:text-white"}`}
                                >
                                    {isWishlisted ? <AiFillHeart size={18} /> : <AiOutlineHeart size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-[4rem] border border-brown/5 shadow-2xl p-6 md:p-10 lg:p-16">
                    <div className="flex border-b-2 border-brown/5 mb-6 md:mb-8">
                        <button
                            className={`px-4 md:px-8 py-3 md:py-4 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest border-b-2 transition-all ${tab === "description"
                                ? "border-gold text-gold"
                                : "border-transparent text-brown/40 hover:text-brown"
                                }`}
                            onClick={() => setTab("description")}
                        >
                            Description
                        </button>
                        <button
                            className={`px-4 md:px-8 py-3 md:py-4 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest border-b-2 transition-all ${tab === "information"
                                ? "border-gold text-gold"
                                : "border-transparent text-brown/40 hover:text-brown"
                                }`}
                            onClick={() => setTab("information")}
                        >
                            Information
                        </button>
                        <button
                            className={`px-4 md:px-8 py-3 md:py-4 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest border-b-2 transition-all ${tab === "reviews"
                                ? "border-gold text-gold"
                                : "border-transparent text-brown/40 hover:text-brown"
                                }`}
                            onClick={() => setTab("reviews")}
                        >
                            Reviews ({reviewsPagination.totalRecords || 0})
                        </button>
                    </div>

                    {tab === "description" && (
                        <div className="space-y-4 md:space-y-6">
                            <p className="text-sm md:text-base text-brown/70 font-bold leading-relaxed">
                                {product.description || "No description available."}
                            </p>
                        </div>
                    )}

                    {tab === "information" && (
                        <div className="space-y-3 md:space-y-4">
                            <div className="bg-brown/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-brown/10">
                                <h5 className="font-black text-brown text-xs md:text-sm uppercase tracking-wide md:tracking-widest mb-2 md:mb-3">Product Information</h5>
                                <p className="text-brown/60 font-bold text-xs md:text-sm leading-relaxed">
                                    {product.information || "No additional information available."}
                                </p>
                            </div>
                        </div>
                    )}

                    {tab === "reviews" && (
                        <div id="reviews-section" className="space-y-6 md:space-y-8">
                            {reviewsLoading ? (
                                <div className="flex justify-center py-10">
                                    <FiLoader className="animate-spin text-brown" size={30} />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-12 md:py-20 bg-brown/5 rounded-4xl border-2 border-dashed border-brown/10">
                                    <h4 className="text-xl md:text-2xl font-black text-brown/30 tracking-tighter uppercase">No Reviews Yet</h4>
                                    <p className="text-brown/20 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-2">Special treasures await their first explorer.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1  gap-4 md:gap-8">
                                        {reviews.map((rev) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={rev.id}
                                                className="bg-white/40 backdrop-blur-xl border border-brown/5 rounded-4xl p-6 md:p-8 shadow-xl shadow-brown/5 group hover:bg-white/60 transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6">
                                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-3xl overflow-hidden border-2 border-brown/5 shadow-inner shrink-0 flex items-center justify-center bg-white">
                                                        {rev.customerImage ? (
                                                            <img
                                                                src={resolveUploadUrl(rev.customerImage)}
                                                                alt={rev.customerName}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <FcBusinessman className="w-2/3 h-2/3" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-brown text-base md:text-lg tracking-tight uppercase">{rev.customerName}</h4>
                                                        <div className="flex items-center gap-1 text-gold mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <AiFillStar key={i} size={14} className={i < rev.rating ? "fill-current" : "text-gray-200"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-brown/60 font-bold text-xs md:text-sm leading-relaxed italic">
                                                    "{rev.description}"
                                                </p>

                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Reviews Pagination */}
                                    {reviewsPagination.totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 mt-10 md:mt-12">
                                            <button
                                                onClick={() => {
                                                    setReviewsPage(p => Math.max(1, p - 1));
                                                    window.scrollTo({ top: document.querySelector('#reviews-section')?.offsetTop - 100, behavior: 'smooth' });
                                                }}
                                                disabled={reviewsPage === 1}
                                                className="w-10 h-10 md:w-12 md:h-12 border-2 border-brown/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brown disabled:opacity-30 hover:bg-brown hover:text-white transition-all duration-300"
                                            >
                                                <FiArrowLeft />
                                            </button>
                                            
                                            <div className="bg-brown text-white w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg shadow-brown/20 uppercase tracking-widest">
                                                {reviewsPage}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setReviewsPage(p => Math.min(reviewsPagination.totalPages, p + 1));
                                                    window.scrollTo({ top: document.querySelector('#reviews-section')?.offsetTop - 100, behavior: 'smooth' });
                                                }}
                                                disabled={reviewsPage === reviewsPagination.totalPages}
                                                className="w-10 h-10 md:w-12 md:h-12 border-2 border-brown/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brown disabled:opacity-30 hover:bg-brown hover:text-white transition-all duration-300 rotate-180"
                                            >
                                                <FiArrowLeft />
                                            </button>

                                            <div className="text-[9px] md:text-[10px] font-black text-brown/40 uppercase tracking-[0.2em] ml-2">
                                                Page {reviewsPage} of {reviewsPagination.totalPages}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
