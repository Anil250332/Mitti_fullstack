import React, { useEffect, useId, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiImage, FiVideo, FiCheck, FiX } from "react-icons/fi";
import api, { resolveUploadUrl } from "../../api/axios";
import { useDispatch } from "react-redux";


export default function DashboardSliders() {
    const formId = useId();
    const dispatch = useDispatch();

    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [editingId, setEditingId] = useState(null);

    const [formValues, setFormValues] = useState({
        type: "image",
        order: "0",
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const fetchSliders = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/sliders");
            if (response.data.success) {
                setSliders(response.data.data);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const openAdd = () => {
        setModalMode("add");
        setEditingId(null);
        setFormValues({ type: "image", order: "0", isActive: true });
        setSelectedFile(null);
        setPreviewUrl("");
        setModalOpen(true);
    };

    const openEdit = (slider) => {
        setModalMode("edit");
        setEditingId(slider.id);
        setFormValues({
            type: slider.type,
            order: String(slider.order || 0),
            isActive: slider.isActive,
        });
        setSelectedFile(null);
        setPreviewUrl(resolveUploadUrl(slider.url));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        if (previewUrl && selectedFile) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl("");
        setSelectedFile(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (previewUrl && modalMode === "add") {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
            // Auto-set type based on file
            if (file.type.startsWith("video/")) {
                setFormValues(prev => ({ ...prev, type: "video" }));
            } else {
                setFormValues(prev => ({ ...prev, type: "image" }));
            }
        }
    };

    const saveSlider = async () => {
        if (modalMode === "add" && !selectedFile) {
            window.alert("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("id", modalMode === "add" ? "0" : String(editingId));
        formData.append("type", formValues.type);
        formData.append("order", formValues.order);
        formData.append("isActive", String(formValues.isActive));

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        setIsSaving(true);
        try {
            await api.post("/admin/sliders/save", formData);
            closeModal();
            fetchSliders();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Failed to save slider.";
            window.alert("Error: " + msg);
        } finally {
            setIsSaving(false);
        }
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this slider?")) return;
        setIsDeleting(id);
        try {
            await api.delete(`/admin/sliders/${id}`);
            fetchSliders();
        } catch (error) {
            window.alert("Failed to delete slider.");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#3b2a23]">Hero Sliders</h2>
                    <p className="text-sm text-[#7c6a5a]">Manage website and mobile hero images/videos.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-[#5C3A2E] text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                    <FiPlus /> Add Slider
                </button>
            </div>

            <div className="bg-white rounded-lg border border-[#ececec] overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#fffaf9] text-[#3b2a23] font-bold">
                        <tr>
                            <th className="px-6 py-4">SL</th>
                            <th className="px-6 py-4">Preview</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Order</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-10 text-center">Loading...</td></tr>
                        ) : sliders.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-10 text-center">No sliders found.</td></tr>
                        ) : (
                            sliders.map((s, idx) => (
                                <tr key={s.id} className="border-t border-[#ececec] hover:bg-gray-50">
                                    <td className="px-6 py-4 text-[#3b2a23]">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        {s.type === "video" ? (
                                            <div className="w-24 h-14 bg-black rounded flex items-center justify-center text-white">
                                                <FiVideo size={20} />
                                            </div>
                                        ) : (
                                            <img src={resolveUploadUrl(s.url)} alt="Slider" className="w-24 h-14 object-cover rounded shadow-sm" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 capitalize">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${s.type === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {s.type === 'video' ? <FiVideo /> : <FiImage />} {s.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{s.order}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {s.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(s)} className="p-2 text-[#5C3A2E] border border-[#5C3A2E] rounded hover:bg-[#5C3A2E] hover:text-white transition-all"><FiEdit2 /></button>
                                            <button 
                                                onClick={() => onDelete(s.id)} 
                                                disabled={isDeleting === s.id}
                                                className="p-2 text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {isDeleting === s.id ? (
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

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3b2a23]/40">
                    <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden p-6 border border-[#ececec]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#3b2a23]">{modalMode === "add" ? "Add New Slider" : "Edit Slider"}</h3>
                            <button onClick={closeModal} className="text-[#7c6a5a] hover:text-[#3b2a23] p-1"><FiX size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-bold text-[#3b2a23] mb-2">Slider File (Image or Video)</label>
                                <div className="relative group">
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-2">
                                            {formValues.type === "video" ? (
                                                <video src={previewUrl} className="w-full h-full" autoPlay muted loop />
                                            ) : (
                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                            )}
                                            <label htmlFor="file-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                                                <FiPlus size={32} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-[#ececec] rounded-lg bg-[#fffaf9] cursor-pointer hover:bg-gray-100 transition-colors">
                                            <FiPlus className="text-[#5C3A2E] mb-2" size={32} />
                                            <span className="text-sm font-semibold text-[#3b2a23]">Click to upload</span>
                                        </label>
                                    )}
                                    <input id="file-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#3b2a23] mb-2">Type</label>
                                    <select
                                        value={formValues.type}
                                        onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-4 py-2 border border-[#ececec] rounded-lg focus:border-[#5C3A2E] outline-none"
                                    >
                                        <option value="image">Image</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        value={formValues.order}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setFormValues(prev => ({ ...prev, order: val }));
                                            }
                                        }}
                                        min="0"
                                        onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e" || e.key === "E") {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-[#ececec] rounded-lg focus:border-[#5C3A2E] outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormValues(prev => ({ ...prev, isActive: !prev.isActive }))}>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${formValues.isActive ? 'bg-[#5C3A2E]' : 'bg-[#ececec]'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formValues.isActive ? 'left-7' : 'left-1'}`} />
                                </div>
                                <span className="text-sm font-bold text-[#3b2a23]">Active Status</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={closeModal} className="flex-1 px-4 py-3 border border-[#ececec] rounded-lg font-bold text-[#7c6a5a] hover:bg-gray-50">Cancel</button>
                            <button 
                                onClick={saveSlider} 
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 bg-[#5C3A2E] text-white rounded-lg font-bold hover:opacity-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
