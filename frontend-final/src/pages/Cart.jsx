import React, { useEffect } from "react";
import { AiFillDelete } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingCart, FiArrowLeft, FiLoader, FiTag, FiCheck, FiX, FiGift, FiChevronRight } from "react-icons/fi";
import { fetchCart, removeFromCart, addToCart } from "../store/slices/cartSlice";
import { fetchAvailableCoupons, applyCoupon, resetCoupon } from "../store/slices/couponSlice";
import toast from "react-hot-toast";
import { resolveUploadUrl } from "../api/axios";

export default function Cart() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items: cart, loading, error } = useSelector((state) => state.cart);
    const { availableCoupons, appliedCoupon, loading: couponLoading, error: couponError } = useSelector((state) => state.coupon);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [couponInput, setCouponInput] = React.useState("");
    const [showCoupons, setShowCoupons] = React.useState(false);

    // Calculate totals based on cart items (moved up for use in effects)
    const mrpTotal = cart.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    const sellingTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = mrpTotal - sellingTotal;

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchCart());
            const hasOnlineOnly = cart.some(item => item.isOnlinePaymentOnly);
            dispatch(fetchAvailableCoupons(hasOnlineOnly));
        }
    }, [dispatch, isAuthenticated, cart.length]);

    // Reset coupon if cart changes significantly or becomes empty
    useEffect(() => {
        if (cart.length === 0 && appliedCoupon) {
            dispatch(resetCoupon());
        }
    }, [cart.length, appliedCoupon, dispatch]);

    // Re-validate/Refresh coupon if cart total changes
    useEffect(() => {
        if (appliedCoupon && !couponLoading) {
            const hasOnlineOnly = cart.some(item => item.isOnlinePaymentOnly);
            dispatch(applyCoupon({ 
                code: appliedCoupon.code, 
                orderAmount: sellingTotal, 
                isOnlineOnly: hasOnlineOnly 
            }))
            .unwrap()
            .catch((err) => {
                // If it fails (e.g. min amount not met), toast the error
                // The slice will handle clearing appliedCoupon on rejection
                toast.error(`Coupon removed: ${err}`);
            });
        }
    }, [sellingTotal, dispatch]);

    const updateQty = (productId, newQty) => {
        if (newQty < 1) return;
        dispatch(addToCart({ productId, quantity: newQty }));
    };

    const removeItem = (productId) => {
        dispatch(removeFromCart(productId));
    };

    const applyCouponCode = (code) => {
        if (couponLoading) return;
        const hasOnlineOnly = cart.some(item => item.isOnlinePaymentOnly);
        dispatch(applyCoupon({ code, orderAmount: sellingTotal, isOnlineOnly: hasOnlineOnly }))
            .unwrap()
            .then(() => {
                toast.success("Coupon applied successfully!");
            })
            .catch((err) => {
                toast.error(err || "Failed to apply coupon");
            });
    };

    const handleApplyInput = () => {
        if (!couponInput) return;
        applyCouponCode(couponInput);
    };

    const handleRemoveCoupon = () => {
        dispatch(resetCoupon());
        setCouponInput("");
        toast.success("Coupon removed");
    };

    const displayImage = (path) => {
        return resolveUploadUrl(path) || "https://via.placeholder.com/150";
    };

    const subtotal = sellingTotal;

    const tax = 0;
    // Coupon Discount
    const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount) : 0;

    const delivery = 0;
    const total = sellingTotal + tax - couponDiscount + delivery;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center pt-20 px-4">
                <h2 className="text-2xl font-black text-brown mb-4 text-center">Please Login</h2>
                <p className="text-brown/60 mb-6 text-center">You need to be logged in to view your cart.</p>
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
                    <h2 className="text-2xl font-black text-brown mb-2">Cart Error</h2>
                    <p className="text-red-500/80 font-bold mb-6">{error}</p>
                    <button
                        onClick={() => dispatch(fetchCart())}
                        className="bg-brown text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-gold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (loading && cart.length === 0) {
        return (
            <div className="min-h-screen bg-luxury-light flex items-center justify-center pt-20">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-luxury-light pt-24 sm:pt-32 md:pt-32  pb-16 md:pb-24 ">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-0 md:px-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 md:mb-10 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black uppercase text-xs tracking-widest">Continue Shopping</span>
                </button>

                {/* Header */}
                <div className="mb-6 md:mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 md:gap-4"
                    >
                        <div className="bg-brown/10 p-3 md:p-4 rounded-xl md:rounded-2xl border border-brown/20">
                            <FiShoppingCart className="text-brown" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-5xl font-black text-brown tracking-tighter">Shopping Cart</h1>
                            <p className="text-[10px] md:text-sm text-brown/60 font-bold mt-0.5 md:mt-1">{cart.length} items in your cart</p>
                        </div>
                    </motion.div>
                </div>

                {cart.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-luxury-light/60 backdrop-blur-2xl rounded-3xl border border-brown/5 shadow-2xl p-12 md:p-16 text-center"
                    >
                        <div className="text-6xl md:text-8xl mb-6 opacity-20">🛒</div>
                        <h2 className="text-2xl md:text-3xl font-black text-brown mb-3 tracking-tight">Your cart is empty</h2>
                        <p className="text-brown/60 font-bold mb-6 md:mb-8 text-base md:text-lg">Add some organic soil products to get started!</p>
                        <button
                            onClick={() => navigate("/products")}
                            className="bg-linear-to-r from-brown to-brown/80 hover:from-gold hover:to-gold/80 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl transition-all duration-300"
                        >
                            Explore Products
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items - 2/3 width on desktop */}
                        <div className="lg:col-span-2 space-y-3 md:space-y-4">
                            <AnimatePresence>
                                {cart.map((item, index) => (
                                    <motion.div
                                        key={item.productId}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-luxury-light/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-brown/5 shadow-xl hover:shadow-2xl p-4 md:p-6 transition-all duration-300"
                                    >
                                        {/* Mobile: Stacked Layout, Desktop: Horizontal */}
                                        <div className="flex flex-row items-center sm:items-center gap-4">
                                            {/* Image */}
                                            <img
                                                src={displayImage(item.image)}
                                                alt={item.productName}
                                                className="w-20 h-20 sm:w-20 sm:h-20 md:w-28 md:h-28 object-cover rounded-xl md:rounded-2xl border-2 border-brown/10 shadow-lg shrink-0"
                                            />

                                            {/* Content */}
                                            <div className="flex-1 w-full min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-black text-brown text-base md:text-lg leading-tight mb-1">{item.productName}</h3>
                                                        {item.isOnlinePaymentOnly && (
                                                            <div className="mb-1 inline-flex items-center gap-1 bg-gold/10 text-gold px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-gold/20">
                                                                Online Payment Only
                                                            </div>
                                                        )}
                                                        <p className="text-xs md:text-sm text-gold font-bold">Packets: {item.packetsPerJar}</p>
                                                    </div>
                                                    {/* Remove Button - Top Right */}
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 shrink-0"
                                                        title="Remove"
                                                    >
                                                        <AiFillDelete size={20} />
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-1.5 bg-luxury-light rounded-xl p-0.5 md:p-1 border border-brown/10">
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="bg-luxury-light hover:bg-brown hover:text-white w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl text-brown font-bold text-sm md:text-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:hover:bg-luxury-light disabled:hover:text-brown"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="px-1.5 md:px-4 py-1 font-black text-brown min-w-6 md:min-w-10 text-center text-xs md:text-lg">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                                                            className="bg-brown hover:bg-gold w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl text-white font-bold text-sm md:text-lg transition-all duration-200 shadow-md"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right">
                                                        <p className="text-lg md:text-2xl font-black text-brown">₹{(item.price * item.quantity).toFixed(1)}</p>
                                                        <p className="text-[9px] md:text-sm text-brown/40 font-bold">
                                                            {item.originalPrice > item.price ? (
                                                                <>
                                                                    <span className="line-through mr-1">₹{item.originalPrice}</span>
                                                                    <span>₹{item.price} rs</span>
                                                                </>
                                                            ) : (
                                                                <span>₹{item.price} rs</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary - 1/3 width on desktop, sticky */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-luxury-light/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-brown/5 shadow-2xl p-5 md:p-8 lg:sticky lg:top-32"
                            >
                                <h2 className="text-xl md:text-2xl font-black text-brown mb-5 md:mb-6 tracking-tight">Order Summary</h2>

                                <div className="space-y-3 md:space-y-4 mb-5 md:mb-6">
                                    <div className="flex justify-between text-brown/60 text-sm md:text-base">
                                        <span className="font-bold">MRP Total</span>
                                        <span className="font-black text-brown">₹{mrpTotal.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between text-brown/60 text-sm md:text-base">
                                        <span className="font-bold">Discount</span>
                                        <span className="font-black text-gold">₹{discount.toFixed(1)}</span>
                                    </div>


                                    {appliedCoupon && (
                                        <div className="flex justify-between text-green-600 text-sm md:text-base bg-green-50 p-2 rounded-lg border border-green-100">
                                            <span className="font-bold flex items-center gap-1">
                                                <FiGift size={14} /> Coupon ({appliedCoupon.code})
                                            </span>
                                            <span className="font-black">₹{couponDiscount.toFixed(1)}</span>
                                        </div>
                                    )}

                                    <div className="border-t-2 border-dashed border-brown/10 pt-3 md:pt-4 mt-3 md:mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base md:text-lg font-black text-brown">Total</span>
                                            <span className="text-2xl md:text-xl font-black text-gold">₹{total.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Coupon Section */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiTag className="text-gold" />
                                        <span className="text-brown font-black uppercase tracking-widest text-[10px]">Promo Code</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Enter code"
                                                value={couponInput}
                                                onChange={(e) => {
                                                    setCouponInput(e.target.value.toUpperCase());
                                                    if (couponError) dispatch(resetCoupon()); // Clear error on typing
                                                }}
                                                className={`w-full bg-luxury-light border rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none transition-all ${couponError ? 'border-red-300 focus:border-red-500' : 'border-brown/10 focus:border-gold'}`}
                                            />
                                            {appliedCoupon && (
                                                <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                                            )}
                                        </div>
                                        {appliedCoupon ? (
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleApplyInput}
                                                disabled={!couponInput || couponLoading}
                                                className="bg-brown text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                            >
                                                {couponLoading ? <FiLoader className="animate-spin" /> : "Apply"}
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Errors (e.g. Invalid Coupon, Min Order Amount) */}
                                    <AnimatePresence>
                                        {couponError && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"
                                            >
                                                <FiX className="shrink-0" /> {couponError}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Available Coupons Button */}
                                    <button
                                        onClick={() => setShowCoupons(!showCoupons)}
                                        className="mt-3 text-[10px] font-black uppercase tracking-widest text-gold hover:text-brown transition-colors flex items-center gap-1"
                                    >
                                        {showCoupons ? "Hide Offers" : "View Available Offers"}
                                    </button>

                                    <AnimatePresence>
                                        {showCoupons && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mt-3 space-y-2"
                                            >
                                                {availableCoupons.length === 0 ? (
                                                    <p className="text-[10px] text-brown/40 font-bold italic">No offers available at the moment.</p>
                                                ) : (
                                                    availableCoupons.map((coupon) => (
                                                        <div
                                                            key={coupon.id}
                                                            className="bg-gold/5 border border-gold/10 p-3 rounded-xl flex items-center justify-between group hover:bg-gold/10 transition-all cursor-pointer"
                                                            onClick={() => {
                                                                setCouponInput(coupon.code);
                                                                applyCouponCode(coupon.code);
                                                            }}
                                                        >
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <span className="bg-luxury-light px-2 py-0.5 rounded border border-gold/30 text-[9px] font-black text-brown tracking-tighter">
                                                                        {coupon.code}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-gold">
                                                                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                                                    </span>
                                                                    {!coupon.isCodAllowed && (
                                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-blue-100">
                                                                            Online Payment Only
                                                                        </span>
                                                                    )}
                                                                    {!coupon.isOnlineAllowed && (
                                                                        <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-orange-100">
                                                                            COD Only
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[9px] text-brown/50 font-bold">
                                                                    Max discount: ₹{coupon.maxDiscountAmount || 'Unlimited'} • Min order: ₹{coupon.minOrderAmount}
                                                                </p>
                                                            </div>
                                                            <FiChevronRight className="text-gold group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={() => navigate("/checkout", { state: { appliedCoupon } })}
                                    className="w-full bg-linear-to-r from-brown to-brown/80 hover:from-gold hover:to-gold/80 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 mb-3 md:mb-4"
                                >
                                    Proceed to Checkout
                                </button>

                                <button
                                    onClick={() => navigate("/products")}
                                    className="w-full border-2 border-brown/20 hover:border-brown text-brown py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest transition-all duration-300"
                                >
                                    Continue Shopping
                                </button>

                                <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-brown/10">
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
