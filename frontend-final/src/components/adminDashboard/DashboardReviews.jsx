import React, { useState, useEffect } from 'react';
import api, { resolveUploadUrl } from '../../api/axios';
import { FiPlus, FiList, FiTrash2, FiStar, FiChevronLeft, FiChevronRight, FiUploadCloud } from 'react-icons/fi';
import { FcBusinessman } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function DashboardReviews() {
    const [mode, setMode] = useState('list'); // 'list' or 'add'
    const [reviews, setReviews] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const limit = 10;

    // Form State
    const [formData, setFormData] = useState({
        productId: '',
        customerName: '',
        rating: 5,
        description: ''
    });
    const [customerImage, setCustomerImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'list') {
            fetchReviews(page);
        } else {
            fetchProducts();
        }
    }, [mode, page]);

    const fetchReviews = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/reviews?page=${p}&limit=${limit}`);
            if (res.data.success) {
                setReviews(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            toast.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products?limit=100'); // Get many products for selection
            if (res.data.success) {
                // If it's paginated, use data.data
                const productList = res.data.data || res.data;
                setProducts(Array.isArray(productList) ? productList : []);
            }
        } catch (error) {
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCustomerImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productId || !formData.customerName || !formData.description) {
            return toast.error("Please fill all required fields");
        }

        const data = new FormData();
        data.append('productId', formData.productId);
        data.append('customerName', formData.customerName);
        data.append('rating', formData.rating);
        data.append('description', formData.description);
        if (customerImage) {
            data.append('customerImage', customerImage);
        }

        setSubmitting(true);
        try {
            const res = await api.post('/admin/reviews/add', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                toast.success("Review added successfully");
                setMode('list');
                setFormData({ productId: '', customerName: '', rating: 5, description: '' });
                setCustomerImage(null);
                setPreviewImage(null);
                setPage(1);
                fetchReviews(1);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add review");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            const res = await api.delete(`/admin/reviews/delete/${id}`);
            if (res.data.success) {
                toast.success("Review deleted");
                fetchReviews(page);
            }
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-brown uppercase tracking-tighter">Reviews Management</h2>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Manage customer testimonials</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                    <button
                        onClick={() => setMode('list')}
                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'list' ? 'bg-brown text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                        <FiList size={16} /> <span className="hidden sm:inline">All Reviews</span><span className="sm:hidden text-[9px]">All</span>
                    </button>
                    <button
                        onClick={() => setMode('add')}
                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'add' ? 'bg-brown text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                        <FiPlus size={16} /> <span className="hidden sm:inline">Add New Review</span><span className="sm:hidden text-[9px]">Add</span>
                    </button>
                </div>
            </div>

            {mode === 'list' ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden flex flex-col flex-1">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fffaf9]/80 backdrop-blur-sm border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em]">Customer</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em]">Product</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em]">Rating</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em]">Description</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-brown/40 tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-gold/10 border-t-gold rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-black uppercase text-brown/20 tracking-widest">Loading Testimonials...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <FiList size={40} className="text-brown" />
                                                    <span className="text-[10px] font-black uppercase text-brown tracking-widest">No reviews found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center">
                                                            {row.customerImage ? (
                                                                <img src={resolveUploadUrl(row.customerImage)} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FcBusinessman size={32} />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-brown text-sm uppercase tracking-tight">{row.customerName}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(row.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-tight inline-block px-3 py-1 bg-gray-50 rounded-lg group-hover:bg-gold/5 group-hover:text-gold transition-colors">{row.Product?.name || 'Unknown'}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex text-gold gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FiStar key={i} size={10} className={i < row.rating ? "fill-current" : "text-gray-200"} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-brown/60 text-xs font-medium italic leading-relaxed max-w-[250px] line-clamp-2">"{row.description}"</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button onClick={() => handleDelete(row.id)} className="w-10 h-10 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Simplified Pagination */}
                    {pagination?.totalPages > 1 && (
                        <div className="mt-8 flex flex-wrap justify-center sm:justify-end items-center gap-4 sm:gap-6 bg-[#fffaf9]/30 p-4 sm:p-6 border-t border-gray-100 rounded-2xl">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-10 h-10 border-2 border-brown/10 rounded-xl flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
                            >
                                <FiChevronLeft size={18} />
                            </button>

                            <div className="flex flex-col items-center min-w-[80px] sm:min-w-[100px]">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-brown/30 mb-1">Reviews Page</span>
                                <div className="bg-brown text-white w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shadow-lg shadow-brown/20 tracking-tighter">
                                    {page}
                                </div>
                                <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] text-[#7c6a5a] mt-1 opacity-60">
                                    of {pagination.totalPages}
                                </span>
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="w-10 h-10 border-2 border-brown/10 rounded-xl flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex justify-center py-2 sm:py-4">
                    <div className="w-full max-w-4xl bg-white rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-2xl p-6 sm:p-10 md:p-12">
                        <div className="mb-8 sm:mb-10 text-center">
                            <div className="inline-block px-4 py-1.5 bg-gold/10 rounded-full mb-3">
                                <span className="text-[8px] sm:text-[10px] font-black uppercase text-gold tracking-[0.2em]">New Testimonial</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-brown uppercase tracking-tighter">Add Customer Review</h3>
                            <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 max-w-md mx-auto leading-relaxed">Fill in the details below to showcase a new customer experience on your store.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Product & Customer Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group space-y-3">
                                    <label className="text-[10px] font-black uppercase text-brown/40 tracking-[0.2em] pl-1 group-focus-within:text-gold transition-colors">Select Product *</label>
                                    <div className="relative">
                                        <select
                                            value={formData.productId}
                                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                            className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm font-bold text-brown focus:outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select the product reviewed</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-brown/30">
                                            <FiChevronRight className="rotate-90" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-3">
                                    <label className="text-[10px] font-black uppercase text-brown/40 tracking-[0.2em] pl-1 group-focus-within:text-gold transition-colors">Customer Name *</label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm font-bold text-brown placeholder:text-brown/20 focus:outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold transition-all"
                                    />
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="p-8 bg-[#fffaf9]/50 rounded-4xl border border-brown/5">
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-3xl bg-white border-2 border-dashed border-brown/10 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-gold shadow-sm group-hover:shadow-gold/10">
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <FcBusinessman className="mx-auto mb-2 opacity-50 transition-opacity group-hover:opacity-100" size={48} />
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-brown/20 italic">No User Image</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-gold text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-gold/30 border-4 border-white z-20 transition-transform group-hover:scale-110">
                                            <FiPlus size={20} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left">
                                        <h5 className="text-xs font-black uppercase text-brown tracking-widest mb-2">Customer Profile Picture</h5>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed mb-6 max-w-xs">Upload a clear photo to build trust and authenticity for the testimonial.</p>
                                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-brown/10 shadow-sm rounded-xl text-[10px] font-black uppercase text-brown cursor-pointer hover:bg-brown hover:text-white hover:border-brown transition-all duration-300">
                                            <FiUploadCloud size={14} />
                                            Choose File
                                            <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Rating Section */}
                            <div className="space-y-4 text-center md:text-left bg-gray-50/50 p-6 sm:p-8 rounded-4xl border border-gray-100">
                                <label className="text-[10px] font-black uppercase text-brown/40 tracking-[0.2em] pl-1">Satisfaction Score</label>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 mt-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 ${formData.rating >= star ? 'bg-white text-gold shadow-xl shadow-gold/10 -translate-y-1' : 'bg-white border-gray-100 text-gray-200 hover:text-gold/30 hover:-translate-y-1'}`}
                                        >
                                            <FiStar size={20} className={formData.rating >= star ? 'fill-current' : ''} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="group space-y-3">
                                <label className="text-[10px] font-black uppercase text-brown/40 tracking-[0.2em] pl-1 group-focus-within:text-gold transition-colors">Testimonial Content *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Share the customer's detailed feedback and experience here..."
                                    rows="6"
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-4xl px-8 py-6 text-sm font-bold text-brown placeholder:text-brown/20 focus:outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold transition-all resize-none leading-relaxed"
                                ></textarea>
                                <div className="flex justify-end pr-4">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brown/20">{formData.description.length} characters written</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 sm:pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 sm:py-6 bg-brown text-white rounded-3xl sm:rounded-4xl font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px] shadow-2xl shadow-brown/30 active:scale-[0.98] transition-all hover:bg-[#5C3A2E] disabled:opacity-50 overflow-hidden relative group"
                                >
                                    <span className="relative z-10 tracking-[0.4em] flex items-center justify-center gap-3">
                                        {submitting ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Encoding Testimonial...
                                            </>
                                        ) : (
                                            <>
                                                <FiPlus size={16} />
                                                Publish Review
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
                                </button>
                                <p className="text-center text-[8px] font-black uppercase tracking-[0.2em] text-brown/20 mt-6">* Required fields to ensure data integrity</p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
