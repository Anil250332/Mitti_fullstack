import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddresses, saveAddress, deleteAddress as deleteAddressThunk } from '../../store/slices/userSlice';

const AccountAddress = () => {
    const dispatch = useDispatch();
    const { addresses, loading } = useSelector((state) => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: 'Home',
        address: '',
        city: '',
        pincode: '',
        state: '',
        country: 'India',
    });

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchAddresses());
    }, [dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openModal = (addr = null) => {
        if (addr) {
            setEditingId(addr.id);
            setFormData({
                title: addr.title || 'Home',
                address: addr.address || '',
                city: addr.city || '',
                pincode: addr.pincode || '',
                state: addr.state || '',
                country: addr.country || 'India',
            });
        } else {
            setEditingId(null);
            setFormData({
                title: 'Home',
                address: '',
                city: '',
                pincode: '',
                state: '',
                country: 'India',
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (processing) return;

        const address = formData.address.trim();
        const city = formData.city.trim();
        const state = formData.state.trim();
        const pincode = formData.pincode.trim();

        if (!address || !city || !state || !pincode) {
            alert("Please fill in all address details");
            return;
        }

        if (!/^\d{6}$/.test(pincode)) {
            alert("Please enter a valid 6-digit pincode");
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                ...formData,
                address,
                city,
                state,
                pincode,
                id: editingId || 0
            };
            await dispatch(saveAddress(payload)).unwrap();
            setIsModalOpen(false);
        } catch (err) {
            alert(err || "Failed to save address");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        if (processing) return;
        setProcessing(true);
        try {
            await dispatch(deleteAddressThunk(id)).unwrap();
        } catch (err) {
            alert(err || "Failed to delete address");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-brown tracking-tighter mb-1 md:mb-2">Stored Addresses</h2>
                    <p className="text-brown/60 font-bold text-xs md:text-sm">Manage your delivery and billing locations.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto bg-brown text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brown/20 hover:bg-gold transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <FiPlus /> Add New
                </button>
            </div>

            {loading && addresses.length === 0 ? (
                <div className="flex justify-center py-20">
                    <FiLoader className="animate-spin text-brown" size={40} />
                </div>
            ) : addresses.length === 0 ? (
                <div className="bg-luxury-light rounded-[2.5rem] border-2 border-dashed border-brown/5 p-16 text-center">
                    <FiMapPin className="text-brown/20 mx-auto mb-6" size={48} />
                    <h3 className="text-xl font-black text-brown mb-2">No addresses found</h3>
                    <p className="text-brown/40 font-bold">You haven't saved any addresses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {addresses.map((addr) => (
                            <motion.div
                                key={addr.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-luxury-light rounded-4xl md:rounded-3xl border border-brown/5 shadow-xl shadow-brown/5 p-6 md:p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FiMapPin size={60} className="text-brown -rotate-12" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-4 py-1.5 rounded-full bg-luxury-light text-brown font-black text-[9px] uppercase tracking-widest border border-brown/5 shadow-sm">
                                            {addr.title}
                                        </span>
                                    </div>
                                    <p className="text-brown/60 font-bold text-sm leading-relaxed mb-4 max-w-[240px]">
                                        {addr.address}<br />
                                        {addr.city}, {addr.state} - {addr.pincode}
                                    </p>
                                    <p className="text-xs font-black text-brown/30 uppercase tracking-widest">{addr.country}</p>
                                </div>

                                <div className="flex gap-4 mt-8 relative z-10 pt-6 border-t border-brown/5">
                                    <button
                                        onClick={() => openModal(addr)}
                                        className="flex-1 bg-luxury-light text-brown hover:bg-brown hover:text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 border border-brown/5 shadow-sm"
                                    >
                                        <FiEdit2 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr.id)}
                                        className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiTrash2 size={12} /> Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal - Portaled to body for true centering */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="absolute inset-0 bg-brown/20 backdrop-blur-2xl pointer-events-auto"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative bg-[#FCFAF8] rounded-[2.5rem] shadow-[0_50px_150px_-20px_rgba(45,26,20,0.6)] w-full max-w-lg overflow-hidden border border-white/40 pointer-events-auto"
                            >
                                {/* Header */}
                                <div className="bg-brown text-white px-8 md:px-10 py-8 md:py-10 flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                    <div className="relative z-10">
                                        <h3 className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-2">Add New Address</h3>
                                        <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.3em] ml-1">Delivery Destination</p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all group relative z-10 shadow-lg"
                                    >
                                        <FiX size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="p-4 md:p-6 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/60 ml-2">Address Type</label>
                                            <div className="relative group">
                                                <select 
                                                    name="title" 
                                                    value={formData.title} 
                                                    onChange={handleInputChange} 
                                                    className="w-full bg-[#F5F1EE]/50 border border-brown/5 rounded-xl px-5 py-2 sm:py-3 text-brown font-bold focus:outline-none focus:border-brown/20 focus:bg-white transition-all duration-500 appearance-none cursor-pointer shadow-sm text-sm"
                                                >
                                                    <option value="Home">Home</option>
                                                    <option value="Office">Office</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brown/20">
                                                    <FiPlus size={14} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/60 ml-2">Pincode</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    if (val.length <= 6) setFormData({ ...formData, pincode: val });
                                                }}
                                                required
                                                className="w-full bg-[#F5F1EE]/50 border border-brown/5 rounded-xl px-5 py-2 sm:py-3 text-brown font-bold focus:outline-none focus:border-brown/20 focus:bg-white transition-all duration-500 placeholder:text-brown/10 shadow-sm text-sm"
                                                placeholder="Pincode"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/60 ml-2">Full Address</label>
                                        <textarea 
                                            name="address" 
                                            value={formData.address} 
                                            onChange={handleInputChange} 
                                            required 
                                            rows="3" 
                                            className="w-full bg-[#F5F1EE]/50 border border-brown/5 rounded-[1.5rem] py-2 px-5 sm:py-3 text-brown font-bold focus:outline-none focus:border-brown/20 focus:bg-white transition-all duration-500 resize-none placeholder:text-brown/10 shadow-sm text-sm" 
                                            placeholder="House No, Building, Street..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/60 ml-2">City</label>
                                            <input 
                                                type="text" 
                                                name="city" 
                                                value={formData.city} 
                                                onChange={handleInputChange} 
                                                required 
                                                className="w-full bg-[#F5F1EE]/50 border border-brown/5 rounded-xl py-2 px-5 sm:py-3 text-brown font-bold focus:outline-none focus:border-brown/20 focus:bg-white transition-all duration-500 placeholder:text-brown/10 shadow-sm text-sm" 
                                                placeholder="City" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/60 ml-2">State</label>
                                            <input 
                                                type="text" 
                                                name="state" 
                                                value={formData.state} 
                                                onChange={handleInputChange} 
                                                required 
                                                className="w-full bg-[#F5F1EE]/50 border border-brown/5 rounded-xl py-2 px-5 sm:py-3 text-brown font-bold focus:outline-none focus:border-brown/20 focus:bg-white transition-all duration-500 placeholder:text-brown/10 shadow-sm text-sm" 
                                                placeholder="State" 
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between gap-6">
                                        <button
                                            type="button"
                                            disabled={processing}
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-6 py-4 text-brown/40 hover:text-brown font-black uppercase text-[10px] tracking-[0.2em] transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 max-w-[240px] bg-brown text-white py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-[#4A2F25] transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative group overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                                            {processing ? (
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <FiLoader className="animate-spin" />
                                                    <span>SAVING...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <span>SAVE ADDRESS</span>
                                                    {/* <FiCheck className="text-gold" /> */}
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            , document.body)}
        </motion.div>
    );
};

export default AccountAddress;
