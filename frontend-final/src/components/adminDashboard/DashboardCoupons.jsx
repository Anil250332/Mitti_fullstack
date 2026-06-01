import React, { useEffect, useId, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiTag, FiCheck, FiX } from "react-icons/fi";
import api from "../../api/axios";

function TextInput({ id, value, onChange, placeholder, type = "text", min }) {
    const handleChange = (e) => {
        if (type === "number") {
            const val = e.target.value;
            if (val === "" || Number(val) >= 0) {
                onChange(e);
            }
        } else {
            onChange(e);
        }
    };

    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            min={min}
            onKeyDown={(e) => {
                if (type === "number" && (e.key === "-" || e.key === "e" || e.key === "E")) {
                    e.preventDefault();
                }
            }}
            className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
        />
    );
}

function SelectInput({ id, value, onChange, options }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export default function DashboardCoupons() {
    const formId = useId();

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [query, setQuery] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        code: "",
        type: "percentage",
        value: "",
        minOrderAmount: "0",
        maxDiscountAmount: "",
        expiryDate: "",
        usageLimit: "",
        isActive: true,
        isCodAllowed: true,
        isOnlineAllowed: true
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/coupons");
            if (response.data.success) {
                setCoupons(response.data.data);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const openAdd = () => {
        setModalMode("add");
        setEditingId(null);
        setFormData({
            code: "",
            type: "percentage",
            value: "",
            minOrderAmount: "0",
            maxDiscountAmount: "",
            expiryDate: "",
            usageLimit: "",
            isActive: true,
            isCodAllowed: true,
            isOnlineAllowed: true
        });
        setModalOpen(true);
    };

    const openEdit = (coupon) => {
        setModalMode("edit");
        setEditingId(coupon.id);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscountAmount: coupon.maxDiscountAmount || "",
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : "",
            usageLimit: coupon.usageLimit || "",
            isActive: coupon.isActive,
            isCodAllowed: coupon.isCodAllowed ?? true,
            isOnlineAllowed: coupon.isOnlineAllowed ?? true
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const saveCoupon = async () => {
        if (!formData.code || !formData.value || !formData.expiryDate) {
            window.alert("Please fill in required fields (Code, Value, Expiry Date).");
            return;
        }

        setIsSaving(true);
        try {
            if (modalMode === "add") {
                await api.post("/admin/coupons/add", formData);
            } else {
                await api.put(`/admin/coupons/update/${editingId}`, formData);
            }
            closeModal();
            fetchCoupons();
        } catch (error) {
            window.alert(error.response?.data?.message || "Failed to save coupon.");
        } finally {
            setIsSaving(false);
        }
    };

    const onDelete = async (id, code) => {
        if (!window.confirm(`Delete coupon "${code}"?`)) return;
        setIsDeleting(id);
        try {
            await api.delete(`/admin/coupons/delete/${id}`);
            fetchCoupons();
        } catch (error) {
            window.alert("Failed to delete coupon.");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="w-full">
            <section className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#ececec] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-[#3b2a23]">Coupon Management</h3>
                        <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
                            {coupons.length}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="w-full sm:w-[320px]">
                            <div className="flex items-stretch border border-[#ececec] rounded-md overflow-hidden bg-white focus-within:border-[#5C3A2E]">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search coupons..."
                                    className="flex-1 px-4 py-2 text-sm outline-none text-[#3b2a23]"
                                />
                                <div className="w-11 border-l border-[#ececec] flex items-center justify-center text-[#3b2a23]">
                                    <FiSearch />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={openAdd}
                            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
                        >
                            <FiPlus /> Add Coupon
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#fffaf9] text-[#3b2a23]">
                            <tr>
                                <th className="text-left font-bold px-6 py-4">SL</th>
                                <th className="text-left font-bold px-6 py-4">Code</th>
                                <th className="text-left font-bold px-6 py-4">Type</th>
                                <th className="text-left font-bold px-6 py-4">Value</th>
                                <th className="text-left font-bold px-6 py-4">Min Order</th>
                                <th className="text-left font-bold px-6 py-4">Usage (Used/Total)</th>
                                <th className="text-left font-bold px-6 py-4">Expiry</th>
                                <th className="text-left font-bold px-6 py-4">Status</th>
                                <th className="text-left font-bold px-6 py-4">Payment Type</th>
                                <th className="text-left font-bold px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center">Loading...</td></tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center">No coupons found.</td></tr>
                            ) : (
                                filteredCoupons.map((c, idx) => (
                                    <tr key={c.id} className="border-t border-[#ececec] hover:bg-gray-50">
                                        <td className="px-6 py-4">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-[#5C3A2E] uppercase tracking-wider">{c.code}</td>
                                        <td className="px-6 py-4 uppercase text-xs font-semibold">{c.type}</td>
                                        <td className="px-6 py-4 font-semibold">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                                        <td className="px-6 py-4">₹{c.minOrderAmount}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-[#3b2a23]">
                                                    {c.usageCount} / {c.usageLimit || "∞"}
                                                </span>
                                                {c.usageLimit && (
                                                    <span className="text-[10px] text-[#7c6a5a]">
                                                        {Math.max(0, c.usageLimit - c.usageCount)} remaining
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{new Date(c.expiryDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {c.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                                                    <FiCheck /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                                                    <FiX /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {c.isOnlineAllowed && (
                                                    <span className="text-[9px] font-black bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/20 uppercase tracking-tighter">
                                                        Online
                                                    </span>
                                                )}
                                                {c.isCodAllowed && (
                                                    <span className="text-[9px] font-black bg-brown/5 text-brown px-2 py-0.5 rounded border border-brown/10 uppercase tracking-tighter">
                                                        COD
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(c)} className="cursor-pointer text-[#5C3A2E] hover:bg-[#5C3A2E]/10 p-2 rounded-md border border-[#5C3A2E]">
                                                    <FiEdit2 />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(c.id, c.code)} 
                                                    disabled={isDeleting === c.id}
                                                    className="cursor-pointer text-red-600 hover:bg-red-50 p-2 rounded-md border border-red-200 disabled:opacity-50"
                                                >
                                                    {isDeleting === c.id ? (
                                                        <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin block"></span>
                                                    ) : (
                                                        <FiTrash2 />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#3b2a23]/40 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-bold text-[#3b2a23]">
                                {modalMode === "add" ? "Create New Coupon" : "Edit Coupon"}
                            </h4>
                            <button onClick={closeModal} className="text-[#7c6a5a] hover:text-[#3b2a23] cursor-pointer">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Coupon Code*</label>
                                <TextInput
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                    placeholder="e.g. CHOCO50"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Discount Type*</label>
                                <SelectInput
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    options={[
                                        { label: "Percentage (%)", value: "percentage" },
                                        { label: "Flat Amount (₹)", value: "flat" }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">
                                    Discount Value ({formData.type === 'percentage' ? '%' : '₹'})*
                                </label>
                                <TextInput
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Min Order Amount (₹)</label>
                                <TextInput
                                    type="number"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Max Discount Amount (₹)</label>
                                <TextInput
                                    type="number"
                                    value={formData.maxDiscountAmount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                    placeholder="Leave empty for no limit"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Expiry Date*</label>
                                <TextInput
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#3b2a23] mb-1 block">Usage Limit</label>
                                <TextInput
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                    placeholder="Total times usable"
                                    min="0"
                                />
                            </div>

                            <div className="flex items-center gap-3 h-full mt-6">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 accent-[#5C3A2E]"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-[#3b2a23] cursor-pointer">
                                    Coupon Active
                                </label>
                            </div>

                            <div className="flex items-center gap-3 h-full mt-6">
                                <input
                                    type="checkbox"
                                    id="isCodAllowed"
                                    checked={formData.isCodAllowed}
                                    onChange={(e) => {
                                        const newVal = e.target.checked;
                                        if (!newVal && !formData.isOnlineAllowed) {
                                            return;
                                        }
                                        setFormData({ ...formData, isCodAllowed: newVal });
                                    }}
                                    className="w-5 h-5 accent-[#5C3A2E]"
                                />
                                <label htmlFor="isCodAllowed" className="text-sm font-bold text-[#3b2a23] cursor-pointer">
                                    Allow for COD
                                </label>
                            </div>

                            <div className="flex items-center gap-3 h-full mt-6">
                                <input
                                    type="checkbox"
                                    id="isOnlineAllowed"
                                    checked={formData.isOnlineAllowed}
                                    onChange={(e) => {
                                        const newVal = e.target.checked;
                                        if (!newVal && !formData.isCodAllowed) {
                                            return;
                                        }
                                        setFormData({ ...formData, isOnlineAllowed: newVal });
                                    }}
                                    className="w-5 h-5 accent-[#5C3A2E]"
                                />
                                <label htmlFor="isOnlineAllowed" className="text-sm font-bold text-[#3b2a23] cursor-pointer">
                                    Allow for Online Payment
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 rounded-lg border border-[#ececec] text-[#7c6a5a] font-bold hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCoupon}
                                disabled={isSaving}
                                className="px-8 py-2.5 rounded-lg bg-[#5C3A2E] text-white font-bold hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        {modalMode === "add" ? "Creating..." : "Updating..."}
                                    </>
                                ) : (
                                    modalMode === "add" ? "Create Coupon" : "Update Coupon"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
