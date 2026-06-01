import React, { useEffect, useId, useState } from "react";
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

export default function DashboardTags() {
  const formId = useId();

  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [tags, setTags] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      // If there is a query, fetch all (limit=1000) and filter client-side to ensure case-insensitivity
      // If no query, use server-side pagination
      const isSearch = query.trim().length > 0;
      const endpoint = isSearch
        ? `/admin/tags?page=1&limit=1000`
        : `/admin/tags?page=${page}&limit=${pageSize}`;

      const response = await api.get(endpoint);
      const resData = response.data;

      let fetchedTags = [];
      let total = 0;

      if (resData.success && resData.data && Array.isArray(resData.data)) {
        fetchedTags = resData.data;
        if (resData.pagination) {
          total = resData.pagination.totalRecords;
        } else {
          total = resData.total || resData.count || 0;
        }
      } else if (resData.data && Array.isArray(resData.data)) {
        fetchedTags = resData.data;
        total = resData.total || resData.count || 0;
      } else if (Array.isArray(resData)) {
        fetchedTags = resData;
        total = resData.length;
      }

      let mappedTags = fetchedTags.map(t => ({
        ...t,
        name: t.name || t.tag || ""
      }));

      if (isSearch) {
        const lowerQuery = query.toLowerCase();
        const allFiltered = mappedTags.filter(t => t.name.toLowerCase().includes(lowerQuery));
        total = allFiltered.length;

        // Client-side pagination for search results
        const startIndex = (page - 1) * pageSize;
        mappedTags = allFiltered.slice(startIndex, startIndex + pageSize);
      }

      setTags(mappedTags);
      setTotalItems(total);

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages) || 1;

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("add");
    setEditingId(null);
    setDraftName("");
  };

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
      const response = await api.get(`/admin/tags/${id}`);
      if (response.data) {
        setDraftName(response.data.name || response.data.tag || "");
      }
    } catch (error) {
      const current = tags.find((t) => t.id === id);
      if (current) setDraftName(current.name);
    }
  };

  const upsert = async () => {
    const name = String(draftName ?? "").trim().replace(/\s+/g, " ");
    if (!name) {
      window.alert("Please enter tag name.");
      return;
    }

    const payload = {
      id: modalMode === "add" ? 0 : editingId,
      tag: name
    };

    setIsSaving(true);
    try {
      await api.post('/admin/tags/save', payload);
      closeModal();
      fetchTags();
    } catch (error) {
      window.alert("Failed to save tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id) => {
    const current = tags.find((t) => t.id === id);
    const ok = window.confirm(`Delete tag “${current?.name ?? ""}”?`);
    if (!ok) return;

    setIsDeleting(id);
    try {
      await api.delete(`/admin/tags/${id}`);
      fetchTags();
    } catch (error) {
      window.alert("Failed to delete tag.");
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
            <h3 className="text-base font-bold text-[#3b2a23]">Tag List</h3>
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
                  placeholder="Search tag..."
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
              <FiPlus /> Add Tag
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Tag Name</th>
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
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#7c6a5a]">
                    No tags found.
                  </td>
                </tr>
              ) : (
                tags.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">
                      <div className="font-semibold">{t.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(t.id)}
                          className="cursor-pointer w-10 h-10 rounded-md border border-[#5C3A2E] text-[#5C3A2E] hover:bg-gray-50 flex items-center justify-center transition-colors duration-150"
                          aria-label="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(t.id)}
                          disabled={isDeleting === t.id}
                          className="cursor-pointer w-10 h-10 rounded-md border border-red-500 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {isDeleting === t.id ? (
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[#ececec] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-[#7c6a5a]">
            Page <span className="font-semibold text-[#3b2a23]">{safePage}</span> of{" "}
            <span className="font-semibold text-[#3b2a23]">{totalPages}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer w-9 h-9 rounded-md bg-gray-50 text-[#3b2a23] border border-[#ececec] disabled:opacity-50"
              disabled={safePage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 8)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`cursor-pointer w-9 h-9 rounded-md border text-sm font-bold transition-colors duration-150 ${p === safePage
                    ? "bg-[#5C3A2E] text-white border-[#5C3A2E]"
                    : "bg-gray-50 text-[#3b2a23] border-[#ececec] hover:bg-gray-50"
                    }`}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer w-9 h-9 rounded-md bg-gray-50 text-[#3b2a23] border border-[#ececec] disabled:opacity-50"
              disabled={safePage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
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
                  {modalMode === "add" ? "Add Tag" : "Edit Tag"}
                </h4>
                <div className="text-xs text-[#7c6a5a] mt-1">Enter tag name and save.</div>
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
                Tag name <span className="text-[#5C3A2E]">*</span>
              </label>
              <div className="mt-2">
                <TextInput
                  id={`${formId}-name`}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter tag name"
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
