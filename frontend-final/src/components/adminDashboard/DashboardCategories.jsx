import React, { useEffect, useId, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import { fetchAdminData } from "../../store/slices/adminSlice";


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

export default function DashboardCategories() {
  const formId = useId();
  const dispatch = useDispatch();

  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // stores id of deleting item
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const isSearch = query.trim().length > 0;
      const endpoint = isSearch
        ? `/admin/categories?page=1&limit=1000`
        : `/admin/categories?page=${page}&limit=${pageSize}`;

      const response = await api.get(endpoint);
      const resData = response.data;

      let fetchedCategories = [];
      let total = 0;

      if (resData.success && resData.data && Array.isArray(resData.data)) {
        fetchedCategories = resData.data;
        if (resData.pagination) {
          total = resData.pagination.totalRecords;
        } else {
          total = resData.total || resData.count || 0;
        }
      } else if (resData.data && Array.isArray(resData.data)) {
        fetchedCategories = resData.data;
        total = resData.total || resData.count || 0;
      } else if (Array.isArray(resData)) {
        fetchedCategories = resData;
        total = resData.length;
      }

      // Map 'category' field to 'name' if necessary, to match UI expectations
      let mappedCategories = fetchedCategories.map(c => ({
        ...c,
        name: c.name || c.category || ""
      }));

      if (isSearch) {
        const lowerQuery = query.toLowerCase();
        const allFiltered = mappedCategories.filter(c => c.name.toLowerCase().includes(lowerQuery));
        total = allFiltered.length;

        const startIndex = (page - 1) * pageSize;
        mappedCategories = allFiltered.slice(startIndex, startIndex + pageSize);
      }

      setCategories(mappedCategories);
      setTotalItems(total);

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages) || 1;

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setDraftName("");
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setModalMode("edit");
    setEditingId(id);
    setModalOpen(true);

    try {
      const response = await api.get(`/admin/categories/${id}`);
      if (response.data) {
        setDraftName(response.data.name || response.data.category || "");
      }
    } catch (error) {
      const current = categories.find((c) => c.id === id);
      if (current) setDraftName(current.name);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setDraftName("");
    setEditingId(null);
    setModalMode("add");
  };

  const upsert = async () => {
    const name = String(draftName ?? "").trim().replace(/\s+/g, " ");
    if (!name) {
      window.alert("Please enter category name.");
      return;
    }

    const payload = {
      id: modalMode === "add" ? 0 : editingId,
      category: name
    };

    setIsSaving(true);
    try {
      await api.post('/admin/categories/save', payload);
      closeModal();
      fetchCategories();
      dispatch(fetchAdminData());
    } catch (error) {
      window.alert("Failed to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id) => {
    const current = categories.find((c) => c.id === id);
    const ok = window.confirm(`Delete category “${current?.name ?? ""}”?`);
    if (!ok) return;

    setIsDeleting(id);
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
      dispatch(fetchAdminData());
    } catch (error) {
      window.alert("Failed to delete category.");
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
            <h3 className="text-base font-bold text-[#3b2a23]">Category List</h3>
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
                  placeholder="Search category..."
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
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
            >
              <FiPlus /> Add Category
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Category Name</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#7c6a5a]">
                    Loading...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#7c6a5a]">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">
                      <div className="font-semibold">{c.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c.id)}
                          className="cursor-pointer w-10 h-10 rounded-md border border-[#5C3A2E] text-[#5C3A2E] hover:bg-gray-50 flex items-center justify-center transition-colors duration-150"
                          aria-label="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          disabled={isDeleting === c.id}
                          className="cursor-pointer w-10 h-10 rounded-md border border-red-500 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {isDeleting === c.id ? (
                            <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
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

        {/* Simplified Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-[#ececec] flex items-center justify-end gap-6 bg-[#fffaf9]/30">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-10 h-10 rounded-xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
            >
              <span className="text-xl">‹</span>
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brown/30 mb-1">Category Page</span>
              <div className="bg-brown text-white w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-brown/20 tracking-tighter">
                {safePage}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#7c6a5a] mt-1 opacity-60">of {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-10 h-10 rounded-xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
            >
              <span className="text-xl">›</span>
            </button>
          </div>
        )}
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#3b2a23]/40"
            aria-label="Close"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-md rounded-lg border border-[#ececec] bg-white shadow p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-[#3b2a23]">
                  {modalMode === "add" ? "Add Category" : "Edit Category"}
                </h4>
                <div className="text-xs text-[#7c6a5a] mt-1">Enter category name and save.</div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#ececec] bg-gray-50 px-3 py-2 text-sm font-bold text-[#3b2a23] hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <label htmlFor={`${formId}-name`} className="text-sm font-semibold text-[#3b2a23]">
                Category name <span className="text-[#5C3A2E]">*</span>
              </label>
              <div className="mt-2">
                <TextInput
                  id={`${formId}-name`}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#ececec] bg-gray-50 px-4 py-2 text-sm font-bold text-[#3b2a23] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={upsert}
                disabled={isSaving}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#5C3A2E] px-5 py-2 text-sm font-bold text-white hover:opacity-95 disabled:opacity-70"
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
      ) : null}
    </div>
  );
}
