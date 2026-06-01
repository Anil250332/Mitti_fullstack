import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAddresses, saveAddress, downloadInvoice, fetchGeneralSettings } from "../store/slices/userSlice";
import { fetchCart, placeOrder, addToCart, removeFromCart } from "../store/slices/cartSlice";
import { fetchMe } from "../store/slices/authSlice";
import { resetCoupon } from "../store/slices/couponSlice";
import toast from "react-hot-toast";
import api, { resolveUploadUrl } from "../api/axios";
import { FiMapPin, FiUser, FiMail, FiHome, FiPhone, FiArrowLeft, FiShoppingBag, FiPlus, FiCheckCircle, FiDownload, FiX, FiUpload, FiMinus, FiTrash2 } from "react-icons/fi";

export default function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items: cartItems, loading: cartLoading, error: cartError } = useSelector((state) => state.cart);
    const { addresses, loading: userLoading, error: userError } = useSelector((state) => state.user);
    const { isAuthenticated, user, error: authError } = useSelector((state) => state.auth);
    const { appliedCoupon } = useSelector((state) => state.coupon);

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("Online");
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);
    const [settings, setSettings] = useState(null);
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [calculatingShipping, setCalculatingShipping] = useState(false);


    // Address Modal State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressFormData, setAddressFormData] = useState({
        title: 'Home',
        address: '',
        city: '',
        pincode: '',
        state: '',
        country: 'India',
    });
    const [addressProcessing, setAddressProcessing] = useState(false);
    const [orderProcessing, setOrderProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        dispatch(fetchCart());
        dispatch(fetchAddresses());
        dispatch(fetchMe());

        // Fetch settings for QR
        dispatch(fetchGeneralSettings())
            .unwrap()
            .then(data => setSettings(data))
            .catch(() => {});
    }, [dispatch, isAuthenticated, navigate]);

    useEffect(() => {
        if (addresses?.length > 0 && !selectedAddress) {
            setSelectedAddress(addresses[0].id);
        }
    }, [addresses, selectedAddress]);

    const requiresOnlinePayment = cartItems.some(item => item.isOnlinePaymentOnly);
    const couponRequiresOnline = appliedCoupon && !appliedCoupon.isCodAllowed;

    useEffect(() => {
        if (requiresOnlinePayment || couponRequiresOnline) {
            setPaymentMethod("Online");
        } else {
            setPaymentMethod("COD");
        }
    }, [requiresOnlinePayment, couponRequiresOnline]);

    const changePaymentMethod = (method) => {
        if (method === "COD" && couponRequiresOnline) {
            toast.error("This coupon is only for Online Payment. Switching to COD will remove the coupon.");
            dispatch(resetCoupon());
        }
        setPaymentMethod(method);
    };

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const tax = 0;
    const delivery = Number(deliveryCharge);

    // Coupon Discount
    const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount) : 0;

    const total = subtotal + tax + delivery - couponDiscount;

    // Calculate real-time delivery charges based on destination and cart data
    useEffect(() => {
        const address = addresses?.find(a => a.id === selectedAddress);
        if (address?.pincode && cartItems.length > 0) {
            const controller = new AbortController();
            setCalculatingShipping(true);
            
            // Backend-First approach: send only cart structure, let backend fetch real weights
            api.post("/admin/orders/shipping-charges", {
                pincode: address.pincode,
                items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
                paymentMethod: paymentMethod.toLowerCase(),
                amount: subtotal
            }, { signal: controller.signal })
            .then(res => {
                if (res.data.success) {
                    setDeliveryCharge(res.data.charge);
                    setOrderProcessing(false);
                } else {
                    setDeliveryCharge(0);
                    toast.error(res.data.message)
                    setOrderProcessing(true);
                }
            })
            .catch(err => {
                if (err.name !== 'CanceledError') {
                    setDeliveryCharge(0); 
                }
            })
            .finally(() => setCalculatingShipping(false));

            return () => controller.abort();
        } else {
            setDeliveryCharge(0);
        }
    }, [selectedAddress, cartItems, paymentMethod, addresses, subtotal]);


    const handlePlaceOrder = () => {
        if (orderProcessing) return;
        if (!selectedAddress) {
            toast.error("Please select a delivery address");
            return;
        }

        if (paymentMethod === "Online" && !paymentSlip) {
            toast.error("Please upload payment screenshot");
            return;
        }

        const formData = new FormData();
        formData.append("items", JSON.stringify(cartItems.map(item => ({
            productId: item.productId,
            qty: item.quantity
        }))));
        formData.append("addressId", selectedAddress);
        formData.append("paymentMethod", paymentMethod);
        if (appliedCoupon?.code) {
            formData.append("couponCode", appliedCoupon.code);
        }
        if (paymentSlip) {
            formData.append("paymentSlip", paymentSlip);
        }

        setOrderProcessing(true);
        dispatch(placeOrder(formData))
            .unwrap()
            .then((data) => {
                dispatch(resetCoupon());
                setLastOrder(data);
                setShowSuccessModal(true);
            })
            .catch((err) => {
                toast.error(err || "Failed to place order");
            })
            .finally(() => {
                setOrderProcessing(false);
            });
    };

    const handleSlipChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPaymentSlip(file);
            setSlipPreview(URL.createObjectURL(file));
        }
    };

    const handleDownloadInvoice = () => {
        if (!lastOrder?.orderId) return;
        toast.promise(
            dispatch(downloadInvoice(lastOrder.orderId)).unwrap(),
            {
                loading: 'Generating invoice...',
                success: 'Invoice downloaded!',
                error: 'Failed to download invoice',
            }
        );
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        navigate('/');
    };

    const updateQty = (productId, newQty) => {
        if (newQty < 1) return;
        dispatch(addToCart({ productId, quantity: newQty }));
    };

    const removeItem = (productId) => {
        dispatch(removeFromCart(productId));
    };

    const handleAddressInputChange = (e) => {
        const { name, value } = e.target;
        setAddressFormData({ ...addressFormData, [name]: value });
    };

    const openAddressModal = () => {
        setAddressFormData({
            title: 'Home',
            address: '',
            city: '',
            pincode: '',
            state: '',
            country: 'India',
        });
        setIsAddressModalOpen(true);
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        const address = addressFormData.address.trim();
        const city = addressFormData.city.trim();
        const state = addressFormData.state.trim();
        const pincode = addressFormData.pincode.trim();

        if (!address || !city || !state || !pincode) {
            toast.error("Please fill in all address details");
            return;
        }

        if (!/^\d{6}$/.test(pincode)) {
            toast.error("Please enter a valid 6-digit pincode");
            return;
        }

        setAddressProcessing(true);
        try {
            const payload = {
                ...addressFormData,
                address,
                city,
                state,
                pincode,
                id: 0
            };
            const result = await dispatch(saveAddress(payload)).unwrap();
            setIsAddressModalOpen(false);
            // Auto select the new address
            if (result && result.id) {
                setSelectedAddress(result.id);
            } else if (addresses.length > 0) {
                // Re-fetch handled by slice usually, but let's be safe
                dispatch(fetchAddresses());
            }
            toast.success("Address added successfully");
        } catch (err) {
            toast.error(err || "Failed to save address");
        } finally {
            setAddressProcessing(false);
        }
    };

    const displayImage = (path) => {
        return resolveUploadUrl(path) || "https://via.placeholder.com/150";
    };

    if (cartError || userError || authError) {
        return (
            <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center pt-20 px-4">
                <div className="bg-luxury-light/60 backdrop-blur-2xl p-8 rounded-3xl border border-red-100 shadow-2xl text-center max-w-md">
                    <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                    <h2 className="text-2xl font-black text-brown mb-2">Checkout Error</h2>
                    <p className="text-red-500/80 font-bold mb-6">
                        {cartError || userError || authError}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                dispatch(fetchCart());
                                dispatch(fetchAddresses());
                                dispatch(fetchMe());
                            }}
                            className="bg-brown text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-gold transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/cart')}
                            className="text-brown/60 font-bold hover:text-brown transition-colors"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if ((cartLoading && cartItems.length === 0) || userLoading) {
        return (
            <div className="min-h-screen bg-luxury-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brown"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-luxury-light pt-24 sm:pt-32 md:pt-32  pb-16 md :pb-24 ">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-0 md:px-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 md:mb-10 flex items-center gap-2 text-brown hover:text-gold transition-colors duration-300 group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black uppercase text-xs tracking-widest">Back to Cart</span>
                </button>

                {/* Header */}
                <div className="mb-8 md:mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 md:gap-4"
                    >
                        <div className="bg-brown/10 p-3 md:p-4 rounded-xl md:rounded-2xl border border-brown/20">
                            <FiShoppingBag className="text-brown" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-5xl font-black text-brown tracking-tighter">Checkout</h1>
                            <p className="text-[10px] md:text-sm text-brown/60 font-bold mt-0.5 md:mt-1">Complete your order securely</p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Billing Details & Address - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items Review */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-3xl border border-brown/5 shadow-xl p-6 md:p-8"
                        >
                            <h2 className="text-xl md:text-2xl font-black text-brown mb-6 flex items-center gap-2 md:gap-3">
                                <FiShoppingBag className="text-gold" size={20} />
                                Order Items
                            </h2>
                            <div className="space-y-4">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-8 text-brown/40 font-bold">Your cart is empty</div>
                                ) : (
                                    cartItems.map((item, idx) => (
                                        <div key={item.productId || idx} className="flex items-center gap-4 p-3 md:p-4 bg-white/50 rounded-2xl border border-brown/5 hover:border-brown/10 transition-colors">
                                            <img
                                                src={displayImage(item.image)}
                                                alt={item.productName}
                                                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-brown/10"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-brown text-sm md:text-base truncate">{item.productName}</h4>
                                                <p className="text-[10px] md:text-xs text-brown/60 font-bold mt-1">Price: ₹{item.price}</p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center bg-brown/5 rounded-lg border border-brown/10 p-0.5">
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-brown hover:bg-brown/10 rounded transition-colors"
                                                        >
                                                            <FiMinus size={12} />
                                                        </button>
                                                        <span className="w-8 text-center font-black text-brown text-xs">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-brown hover:bg-brown/10 rounded transition-colors"
                                                        >
                                                            <FiPlus size={12} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-brown text-sm md:text-base">₹{(Number(item.price) * item.quantity).toFixed(1)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* Address Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-3xl border border-brown/5 shadow-xl p-6 md:p-8"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl md:text-2xl font-black text-brown flex items-center gap-2 md:gap-3">
                                    <FiMapPin className="text-gold" size={20} />
                                    Delivery Address
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={openAddressModal}
                                        className="flex items-center gap-2 text-brown font-black uppercase text-[9px] md:text-[10px] tracking-widest group hover:text-gold transition-colors"
                                    >
                                        <FiPlus size={14} className="text-brown group-hover:text-gold" /> Add New Address
                                    </button>

                                </div>
                            </div>

                            {addresses?.length === 0 ? (
                                <div className="text-center py-8 md:py-10 border-2 border-dashed border-brown/10 rounded-2xl">
                                    <p className="text-brown/40 font-bold mb-4 text-sm">No addresses found</p>
                                    <button
                                        onClick={openAddressModal}
                                        className="bg-brown text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gold transition-colors"
                                    >
                                        Add New Address
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    {addresses?.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddress(addr.id)}
                                            className={`cursor-pointer border-2 rounded-2xl p-4 md:p-5 transition-all duration-300 ${selectedAddress === addr.id
                                                ? "border-brown bg-luxury-light shadow-lg scale-[1.01]"
                                                : "border-brown/10 hover:border-brown/30 hover:bg-luxury-light"
                                                }`}
                                        >
                                            <div className="flex items-start gap-2 md:gap-3">
                                                <div className={`mt-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddress === addr.id ? "border-brown bg-brown" : "border-brown/30"
                                                    }`}>
                                                    {selectedAddress === addr.id && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-luxury-light" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-black text-brown text-sm md:text-base flex items-center gap-2 mb-1.5 md:mb-2 leading-none">
                                                        {addr.title || "Address"}
                                                        {addr.title === "Home" && <FiHome className="text-gold text-xs md:text-sm" />}
                                                    </div>
                                                    <p className="text-[11px] md:text-sm text-brown/60 font-bold leading-relaxed">
                                                        {addr.address}, {addr.city}, {addr.state}
                                                    </p>
                                                    <p className="text-[10px] md:text-xs text-gold font-black mt-2 tracking-widest">{addr.pincode}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Payment Method Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-3xl border border-brown/5 shadow-xl p-6 md:p-8"
                        >
                            <h2 className="text-xl md:text-2xl font-black text-brown mb-6 flex items-center gap-2 md:gap-3">
                                <FiShoppingBag className="text-gold" size={20} />
                                Payment Method
                            </h2>
                            <div className="flex flex-col gap-4">
                                {!requiresOnlinePayment && (
                                    <div
                                        onClick={() => changePaymentMethod("COD")}
                                        className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 ${paymentMethod === "COD"
                                            ? "border-brown bg-brown/5 shadow-lg scale-[1.01]"
                                            : "border-brown/10 hover:border-brown/30 hover:bg-brown/5"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "COD" ? "border-brown bg-brown" : "border-brown/30"
                                                }`}>
                                                {paymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-luxury-light" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-brown">Offline Payment / COD</p>
                                                <p className="text-xs text-brown/60 font-bold">Pay when you receive</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    onClick={() => changePaymentMethod("Online")}
                                    className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 ${paymentMethod === "Online"
                                        ? "border-brown bg-brown/5 shadow-lg scale-[1.01]"
                                        : "border-brown/10 hover:border-brown/30 hover:bg-brown/5"
                                        }`}
                                >
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "Online" ? "border-brown bg-brown" : "border-brown/30"
                                                }`}>
                                                {paymentMethod === "Online" && <div className="w-2 h-2 rounded-full bg-luxury-light" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-brown">Online Payment (QR Scan)</p>
                                                <p className="text-xs text-brown/60 font-bold">Scan QR & upload screenshot</p>
                                            </div>
                                        </div>

                                        {paymentMethod === "Online" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="border-t border-brown/10 pt-6 space-y-6"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-brown/40 mb-4 text-center">Scan this QR Code</p>
                                                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-brown/5">
                                                        <img
                                                            src={settings?.qrCode ? resolveUploadUrl(settings.qrCode) : "/OR.jpeg"}
                                                            alt="Payment QR"
                                                            className="w-48 h-48 object-contain rounded-lg"
                                                        />
                                                    </div>
                                                    <p className="text-brown font-bold text-center mt-4">Total: ₹{total.toFixed(1)}</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-brown/40">Upload Payment Slip</p>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleSlipChange}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${paymentSlip ? "border-gold bg-gold/5" : "border-brown/20 hover:border-brown/40 bg-white"}`}>
                                                            {slipPreview ? (
                                                                <img src={slipPreview} alt="Slip" className="w-24 h-24 object-cover rounded-xl mb-2" />
                                                            ) : (
                                                                <FiUpload className="text-brown/40 mb-2" size={24} />
                                                            )}
                                                            <span className="text-xs font-bold text-brown">
                                                                {paymentSlip ? paymentSlip.name : "Choose File or Drop Here"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Order Summary - 1/3 width, sticky */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-luxury-light/60 backdrop-blur-2xl rounded-4xl md:rounded-3xl border border-brown/5 shadow-2xl p-6 md:p-8 lg:sticky lg:top-32"
                        >
                            <h2 className="text-xl md:text-2xl font-black text-brown mb-5 md:mb-6 tracking-tight">Order Summary</h2>

                            {cartItems.length === 0 ? (
                                <div className="text-brown/40 text-center py-8 font-bold">No items in cart</div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {cartItems.map(item => (
                                            <div key={item.productId} className="flex items-center gap-3 pb-3 md:pb-4 border-b border-brown/5 last:border-0">
                                                <img
                                                    src={displayImage(item.image)}
                                                    alt={item.productName}
                                                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border-2 border-brown/10 shadow-sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-brown text-xs md:text-sm leading-tight truncate">{item.productName}</div>
                                                    <div className="text-[10px] md:text-xs text-gold font-bold mt-1">Qty: {item.quantity}</div>
                                                </div>
                                                <div className="font-black text-brown text-xs md:text-base">₹{(Number(item.price) * item.quantity).toFixed(1)}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 mb-6 pt-4 border-t-2 border-dashed border-brown/10">
                                        <div className="flex justify-between text-brown/60">
                                            <span className="font-bold">Subtotal</span>
                                            <span className="font-black text-brown">₹{subtotal.toFixed(1)}</span>
                                        </div>

                                        <div className="flex justify-between text-brown/60">
                                            <span className="font-bold">Shipping Charges</span>
                                            <span className="font-black text-brown">
                                                {calculatingShipping ? (
                                                    <span className="text-[10px] animate-pulse">Calculating...</span>
                                                ) : (
                                                    `₹${delivery.toFixed(1)}`
                                                )}
                                            </span>
                                        </div>


                                        {appliedCoupon && (
                                            <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                                <span className="font-bold">Coupon ({appliedCoupon.code})</span>
                                                <span className="font-black">₹{couponDiscount.toFixed(1)}</span>
                                            </div>
                                        )}

                                        <div className="border-t-2 border-brown/10 pt-4 mt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-black text-brown">Total</span>
                                                <span className="text-xl font-black text-gold">₹{total.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-linear-to-r from-brown to-brown/80 hover:from-gold hover:to-gold/80 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                                onClick={handlePlaceOrder}
                                disabled={cartItems.length === 0 || !selectedAddress || orderProcessing}
                            >
                                {orderProcessing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                        <span>Placing Order...</span>
                                    </div>
                                ) : (
                                    `Place Order · ₹${total.toFixed(1)}`
                                )}
                            </motion.button>

                            <div className="text-center pt-4 border-t border-brown/10">
                                <p className="text-xs text-brown/40 font-bold">
                                    🔒 Secure & encrypted checkout
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 pt-20 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0  backdrop-blur-md"
                            onClick={handleCloseModal}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-luxury-light rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Decorative Top */}
                            <div className="bg-brown py-8 md:py-12 flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                                    className="w-16 h-16 md:w-20 md:h-20 bg-luxury-light rounded-full flex items-center justify-center text-brown shadow-lg mb-4"
                                >
                                    <FiCheckCircle size={40} />
                                </motion.div>
                                <h3 className="text-white text-xl md:text-2xl font-black tracking-tight">Order Placed!</h3>
                                <p className="text-white/70 font-bold text-xs md:text-sm mt-1">Order ID: {lastOrder?.orderNo || lastOrder?.orderId}</p>
                            </div>

                            <div className="p-6 md:p-8 space-y-4 md:space-y-6 text-center">
                                <div className="space-y-2">
                                    <h4 className="text-brown font-black text-base md:text-lg">Thank you for your purchase!</h4>
                                    <p className="text-brown/60 font-bold text-[11px] md:text-sm leading-relaxed px-4">
                                        Your order has been received and is being processed. You can download your invoice below.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDownloadInvoice}
                                        className="w-full bg-brown hover:bg-gold text-white py-4 rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl group"
                                    >
                                        <FiDownload className="group-hover:translate-y-0.5 transition-transform" />
                                        Download Invoice
                                    </button>
                                    <button
                                        onClick={handleCloseModal}
                                        className="w-full bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 text-brown/60 py-4 rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-gray-200 group"
                                    >
                                        <FiX /> Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Address Modal */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute inset-0 bg-brown/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-luxury-light rounded-[2.5rem] shadow-3xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="bg-brown text-white px-8 md:px-10 py-6 md:py-8 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black tracking-tighter">Add New Address</h3>
                                    <p className="text-white/40 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-1">Delivery Destination</p>
                                </div>
                                <button
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="w-10 h-10 md:w-12 md:h-12 bg-luxury-light/10 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-luxury-light/20 transition-all"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveAddress} className="p-6 md:p-10 space-y-4 md:space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Address Type</label>
                                        <select name="title" value={addressFormData.title} onChange={handleAddressInputChange} className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light transition-all duration-500 appearance-none">
                                            <option value="Home">Home</option>
                                            <option value="Office">Office</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Pincode</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            value={addressFormData.pincode}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (val.length <= 6) setAddressFormData({ ...addressFormData, pincode: val });
                                            }}
                                            required
                                            className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light transition-all duration-500"
                                            placeholder="Pincode"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Full Address</label>
                                    <textarea name="address" value={addressFormData.address} onChange={handleAddressInputChange} required rows="3" className="w-full bg-luxury-light border-2 border-brown/5 rounded-4xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light transition-all duration-500 resize-none" placeholder="House No, Building, Street..."></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">City</label>
                                        <input type="text" name="city" value={addressFormData.city} onChange={handleAddressInputChange} required className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light transition-all duration-500" placeholder="City" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">State</label>
                                        <input type="text" name="state" value={addressFormData.state} onChange={handleAddressInputChange} required className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light transition-all duration-500" placeholder="State" />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        disabled={addressProcessing}
                                        onClick={() => setIsAddressModalOpen(false)}
                                        className="flex-1 bg-luxury-light text-brown/60 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-luxury-light transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addressProcessing}
                                        className="flex-3 bg-brown text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brown/20 hover:bg-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {addressProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                                                SAVING...
                                            </>
                                        ) : <>Save Address <FiCheckCircle /></>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
