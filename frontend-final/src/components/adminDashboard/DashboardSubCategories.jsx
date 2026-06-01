import React, { useEffect, useId, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import api from "../../api/axios";

function TextInput({ id, value, onChange, placeholder }) {
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
    />
  );
}

export default function DashboardSubCategories() {
  const formId = useId();

  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [subCategories, setSubCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [query, setQuery] = useState("");

  const [allCategories, setAllCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [draftName, setDraftName] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Load parent categories for the dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/categories?page=1&limit=1000");
        const data = res.data?.data || [];
        setAllCategories(data.map(c => ({ id: c.id, name: c.name || c.category || "" })));
      } catch (err) {
        // Failed to load categories
      }
    };
    load();
  }, []);

  const fetchSubCategories = async () => {
    setLoading(true);
    try {
      const isSearch = query.trim().length > 0;
      const endpoint = isSearch
        ? `/admin/subcategories?page=1&limit=1000`
        : `/admin/subcategories?page=${page}&limit=${pageSize}`;

      const response = await api.get(endpoint);
      const resData = response.data;

      let fetched = [];
      let total = 0;

      if (resData.success && Array.isArray(resData.data)) {
        fetched = resData.data;
        total = resData.pagination?.totalRecords ?? resData.data.length;
      } else if (Array.isArray(resData)) {
        fetched = resData;
        total = resData.length;
      }

      const mapped = fetched.map(s => ({
        ...s,
        categoryName: s.Category?.category || s.Category?.name || ""
      }));

      if (isSearch) {
        const lowerQuery = query.toLowerCase();
        const filtered = mapped.filter(s =>
          s.name?.toLowerCase().includes(lowerQuery) ||
          s.categoryName?.toLowerCase().includes(lowerQuery)
        );
        total = filtered.length;
        const startIndex = (page - 1) * pageSize;
        setSubCategories(filtered.slice(startIndex, startIndex + pageSize));
        setTotalItems(total);
      } else {
        setSubCategories(mapped);
        setTotalItems(total);
      }
    } catch (error) {
      // Failed to fetch sub categories
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setDraftName("");
    setDraftCategoryId("");
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setModalMode("edit");
    setEditingId(id);
    setModalOpen(true);

    try {
      const response = await api.get(`/admin/subcategories/${id}`);
      if (response.data?.data) {
        const sub = response.data.data;
        setDraftName(sub.name || "");
        setDraftCategoryId(String(sub.CategoryId || ""));
      }
    } catch (error) {
      // Failed to fetch sub category details
      const current = subCategories.find(s => s.id === id);
      if (current) {
        setDraftName(current.name);
        setDraftCategoryId(String(current.CategoryId || ""));
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setDraftName("");
    setDraftCategoryId("");
    setEditingId(null);
    setModalMode("add");
  };

  const upsert = async () => {
    const name = String(draftName ?? "").trim().replace(/\s+/g, " ");
    if (!name) {
      window.alert("Please enter sub category name.");
      return;
    }
    if (!draftCategoryId) {
      window.alert("Please select a parent category.");
      return;
    }

    const payload = {
      id: modalMode === "add" ? 0 : editingId,
      name,
      categoryId: Number(draftCategoryId)
    };

    setIsSaving(true);
    try {
      await api.post("/admin/subcategories/save", payload);
      closeModal();
      fetchSubCategories();
    } catch (error) {
      // Failed to save sub category
      const msg = error?.response?.data?.message || "Failed to save sub category.";
      window.alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id) => {
    const current = subCategories.find(s => s.id === id);
    const ok = window.confirm(`Delete sub category "${current?.name ?? ""}"?`);
    if (!ok) return;

    setIsDeleting(id);
    try {
      await api.delete(`/admin/subcategories/${id}`);
      fetchSubCategories();
    } catch (error) {
      // Failed to delete sub category
      window.alert("Failed to delete sub category.");
    } finally {
      setIsDeleting(null);
    }
  };

  const onKeyDown = (e) => {
    if (!modalOpen) return;
    if (e.key === "Escape") closeModal();
  };

  return (
    <div className="w-full" onKeyDown={onKeyDown}>
      <section className="bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">Sub Category List</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {totalItems}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-[320px]">
              <div className="flex items-stretch border border-[#ececec] rounded-md overflow-hidden bg-white focus-within:border-[#5C3A2E]">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search sub category..."
                  className="flex-1 px-4 py-2 text-sm outline-none text-[#3b2a23]"
                />
                <div className="w-11 border-l border-[#ececec] flex items-center justify-center text-[#3b2a23]">
                  <FiSearch />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#5C3A2E] px-5 py-2 text-sm font-bold text-white hover:opacity-90 whitespace-nowrap"
            >
              <FiPlus /> Add Sub Category
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12 text-[#3b2a23]">Loading...</div>
          ) : subCategories.length === 0 ? (
            <div className="flex justify-center py-12 text-[#7c6a5a] text-sm">No sub categories found.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#ececec] bg-gray-50">
                  <th className="px-6 py-3 font-bold text-[#3b2a23] w-16">SL</th>
                  <th className="px-6 py-3 font-bold text-[#3b2a23]">Sub Category Name</th>
                  <th className="px-6 py-3 font-bold text-[#3b2a23]">Parent Category</th>
                  <th className="px-6 py-3 font-bold text-[#3b2a23] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subCategories.map((sub, index) => (
                  <tr key={sub.id} className="border-b border-[#ececec] hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-[#7c6a5a]">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-[#3b2a23]">{sub.name}</td>
                    <td className="px-6 py-4 text-[#7c6a5a]">{sub.categoryName || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(sub.id)}
                          className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#ececec] bg-gray-50 text-[#3b2a23] hover:bg-gray-100"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(sub.id)}
                          disabled={isDeleting === sub.id}
                          className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                        >
                          {isDeleting === sub.id ? (
                            <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <FiTrash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#ececec] flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-[#7c6a5a] font-semibold">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="cursor-pointer px-3 py-1.5 text-xs font-bold rounded border border-[#ececec] bg-gray-50 text-[#3b2a23] disabled:opacity-40 hover:bg-gray-100"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded border transition-colors ${p === page
                      ? "bg-[#5C3A2E] text-white border-[#5C3A2E]"
                      : "bg-gray-50 text-[#3b2a23] border-[#ececec] hover:bg-gray-100"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="cursor-pointer px-3 py-1.5 text-xs font-bold rounded border border-[#ececec] bg-gray-50 text-[#3b2a23] disabled:opacity-40 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
            <h4 className="text-base font-bold text-[#3b2a23]">
              {modalMode === "add" ? "Add Sub Category" : "Edit Sub Category"}
            </h4>

            <div className="flex flex-col gap-4">
              {/* Parent Category Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${formId}-cat`} className="text-sm font-semibold text-[#3b2a23]">
                  Parent Category <span className="text-[#5C3A2E]">*</span>
                </label>
                <select
                  id={`${formId}-cat`}
                  value={draftCategoryId}
                  onChange={e => setDraftCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                >
                  <option value="">-- Select parent category --</option>
                  {allCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub Category Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${formId}-name`} className="text-sm font-semibold text-[#3b2a23]">
                  Sub Category Name <span className="text-[#5C3A2E]">*</span>
                </label>
                <TextInput
                  id={`${formId}-name`}
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder="Enter sub category name"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#ececec] bg-gray-50 px-4 py-2 text-sm font-bold text-[#3b2a23] hover:bg-gray-100"
              >
                Cancel
              </button>
               <button
                type="button"
                onClick={upsert}
                disabled={isSaving}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#5C3A2E] px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {modalMode === "add" ? "Adding..." : "Saving..."}
                  </>
                ) : (
                  modalMode === "add" ? "Add" : "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
