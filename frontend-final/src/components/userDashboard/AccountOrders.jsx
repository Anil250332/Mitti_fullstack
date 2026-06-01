import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiCheckCircle, FiTruck, FiChevronRight, FiLoader } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders, downloadInvoice } from '../../store/slices/userSlice';
import { reorderItems } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const AccountOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders, ordersPagination, loading, error } = useSelector((state) => state.user);
    const [trackingInfo, setTrackingInfo] = React.useState(null);
    const [trackingLoading, setTrackingLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const limit = 5;

    useEffect(() => {
        dispatch(fetchMyOrders({ page, limit }));
    }, [dispatch, page]);

    const handleReorder = (order) => {
        if (!order.OrderItems || order.OrderItems.length === 0) return;

        const itemsToReorder = order.OrderItems
            .filter(item => item.Product)
            .map(item => ({
                productId: item.Product.id,
                quantity: item.Qty
            }));

        if (itemsToReorder.length === 0) {
            toast.error("No valid products to reorder");
            return;
        }

        dispatch(reorderItems(itemsToReorder))
            .unwrap()
            .then(() => {
                navigate('/cart');
            });
    };

    const handleDownloadInvoice = (orderId) => {
        toast.promise(
            dispatch(downloadInvoice(orderId)).unwrap(),
            {
                loading: 'Generating invoice...',
                success: 'Invoice downloaded!',
                error: (err) => err || 'Failed to download invoice',
            }
        );
    };

    const handleTrackOrder = async (orderId) => {
        setTrackingLoading(true);
        try {
            const res = await api.get(`/admin/orders/tracking/${orderId}`);
            if (res.data.success) {
                setTrackingInfo(res.data.data);
            } else {
                toast.error(res.data.message || "Tracking info not available");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch tracking data");
        } finally {
            setTrackingLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 6:
                return 'bg-green-50 border-green-100 text-green-600';
            case 1:
            case 2:
            case 3:
            case 5:
                return 'bg-gold/10 border-gold/20 text-gold';
            default:
                return 'bg-gray-50 border-gray-100 text-gray-600';
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            1: 'Pending',
            2: 'Confirmed',
            3: 'Packaging',
            4: 'Out for Delivery',
            5: 'Partially Delivered',
            6: 'Delivered'
        };
        return statuses[status] || 'Unknown';
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex justify-center py-20">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-brown tracking-tighter mb-1 md:mb-2">Order History</h2>
                <p className="text-brown/60 font-bold text-xs md:text-sm">Track your shipments and view past purchases.</p>
            </div>

            {error ? (
                <div className="bg-red-50 rounded-[2.5rem] border-2 border-dashed border-red-200 p-16 text-center">
                    <FiPackage className="text-red-200 mx-auto mb-6" size={48} />
                    <h3 className="text-xl font-black text-red-500 mb-2">Error loading orders</h3>
                    <p className="text-red-400 font-bold">{error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-luxury-light rounded-[2.5rem] border-2 border-dashed border-brown/5 p-16 text-center">
                    <FiPackage className="text-brown/20 mx-auto mb-6" size={48} />
                    <h3 className="text-xl font-black text-brown mb-2">No orders found</h3>
                    <p className="text-brown/40 font-bold">You haven't placed any orders with us yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order, idx) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-luxury-light rounded-3xl border border-brown/5 shadow-xl shadow-brown/5 overflow-hidden group hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="bg-luxury-light px-6 md:px-8 py-4 md:py-5 border-b border-brown/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-luxury-light rounded-lg md:rounded-xl flex items-center justify-center text-brown shadow-sm">
                                        <FiPackage size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brown/40 leading-none mb-1">Order ID</p>
                                        <p className="font-black text-brown text-xs md:text-sm tracking-tight">{order.OrderNo || order.id}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brown/40 leading-none mb-1">Order Date</p>
                                        <p className="font-bold text-brown text-xs md:text-sm">{new Date(order.OrderDate || order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.eOrderStatus)}`}>
                                        {order.eOrderStatus === 6 ? <FiCheckCircle size={12} /> : <FiTruck size={12} className="animate-pulse" />}
                                        {getStatusText(order.eOrderStatus)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8">
                                <ul className="space-y-4">
                                    {order.OrderItems?.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h4 className="font-black text-brown text-xs md:text-sm leading-tight">{item.Product?.name || 'Unknown Product'}</h4>
                                                    <p className="text-[10px] font-bold text-brown/40 mt-0.5">Quantity: {item.Qty}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-brown text-xs md:text-sm whitespace-nowrap">₹{item.Price}</p>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 md:mt-8 pt-6 border-t border-brown/5 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-6">
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleDownloadInvoice(order.id)}
                                            className="flex-1 sm:flex-none text-white bg-brown hover:bg-brown/80 px-4 md:px-5 py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Invoice <FiChevronRight size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleReorder(order)}
                                            className="flex-1 sm:flex-none text-white bg-gold hover:bg-gold/80 px-4 md:px-5 py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Reorder <FiChevronRight size={14} />
                                        </button>
                                        {order.ShipmentId && (
                                            <button
                                                onClick={() => handleTrackOrder(order.id)}
                                                disabled={trackingLoading}
                                                className="flex-1 sm:flex-none text-brown border-2 border-brown/20 hover:bg-brown hover:text-white px-4 md:px-5 py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                            >
                                                {trackingLoading ? 'Loading...' : 'Track Order'} <FiTruck size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-right flex sm:flex-col justify-between items-center sm:items-end border sm:border-0 rounded-2xl px-4 py-3 sm:p-0 border-brown/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brown/40">Total Amount</p>
                                        <p className="text-xl md:text-2xl font-black text-brown tracking-tighter">₹{order.Amount}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && orders.length > 0 && ordersPagination?.totalPages > 1 && (
                <div className="flex justify-end items-center gap-6 mt-12 pb-8 pt-8 border-t border-brown/5">
                    <button
                        onClick={() => {
                            setPage(p => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page === 1}
                        className="w-12 h-12 rounded-2xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-xl shadow-brown/5 group"
                    >
                        <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brown/30 mb-1">Orders Page</span>
                        <div className="bg-brown text-white w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shadow-2xl shadow-brown/30 tracking-tighter">
                            {page}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gold mt-1 opacity-60">of {ordersPagination.totalPages}</span>
                    </div>

                    <button
                        onClick={() => {
                            setPage(p => Math.min(ordersPagination.totalPages, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page === ordersPagination.totalPages}
                        className="w-12 h-12 rounded-2xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-xl shadow-brown/5 group"
                    >
                        <FiChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {trackingInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown/80 backdrop-blur-sm"
                        onClick={() => setTrackingInfo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-black text-brown mb-6">Tracking Status</h3>

                            {trackingInfo.data?.tracking_data?.shipment_track?.[0] ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gold/10 rounded-2xl border border-gold/20">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-brown/50">Current Status</p>
                                            <p className="text-lg font-black text-brown">{trackingInfo.data.tracking_data.shipment_track[0].current_status}</p>
                                        </div>
                                        <FiTruck className="text-gold" size={24} />
                                    </div>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {trackingInfo.data.tracking_data.shipment_track_activities?.map((activity, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                {i !== trackingInfo.data.tracking_data.shipment_track_activities.length - 1 && (
                                                    <div className="absolute left-2 top-4 bottom-0 w-0.5 bg-brown/10" />
                                                )}
                                                <div className={`w-4 h-4 rounded-full border-2 bg-white mt-1 z-10 ${i === 0 ? 'border-gold shadow-[0_0_10px_rgba(184,134,11,0.5)]' : 'border-brown/20'}`} />
                                                <div>
                                                    <p className="text-xs font-black text-brown">{activity.activity}</p>
                                                    <p className="text-[10px] font-bold text-brown/40">{activity.date} | {activity.location}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-brown/60 font-bold">No tracking data available yet. Please check back later.</p>
                            )}

                            <button
                                onClick={() => setTrackingInfo(null)}
                                className="mt-8 w-full bg-brown text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brown/90 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AccountOrders;
