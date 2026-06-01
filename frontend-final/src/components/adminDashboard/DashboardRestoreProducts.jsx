import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";

export default function DashboardRestoreProducts() {
  const { categories: categoriesProp } = useSelector(state => state.admin);
  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [lowStockError, setLowStockError] = useState("");
  const [savingById, setSavingById] = useState(() => ({}));
  const [savingStatusById, setSavingStatusById] = useState(() => ({}));

  const [pagination, setPagination] = useState(() => ({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: pageSize,
  }));

  const [categoryOptions, setCategoryOptions] = useState(() => []);

  const categories = useMemo(() => {
    if (categoryOptions.length) return categoryOptions;
    if (!Array.isArray(categoriesProp)) return [];
    return categoriesProp
      .map((c) => ({
        id: c?.id,
        label: String(c?.name ?? c?.category ?? "").trim(),
      }))
      .filter((c) => c.id != null && c.label);
  }, [categoryOptions, categoriesProp]);



  const [items, setItems] = useState(() => []);
  const [lowStockItems, setLowStockItems] = useState(() => []);

  const fetchFilters = async () => {
    try {
      const [catsRes] = await Promise.all([
        api.get("/admin/categories?page=1&limit=1000"),
      ]);

      const catRows = Array.isArray(catsRes?.data?.data) ? catsRes.data.data : [];

      setCategoryOptions(
        catRows
          .map((c) => ({ id: c?.id, label: String(c?.category ?? c?.name ?? "").trim() }))
          .filter((c) => c.id != null && c.label)
      );
    } catch (e) {
      // Non-blocking: page will still work with props (if any)
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError("");
    try {
      const res = await api.get("/admin/products", {
        params: {
          page,
          limit: pageSize,
          categoryId: categoryId || undefined,
          search: searchQuery || undefined,
        },
      });

      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      setItems(
        rows.map((p) => ({
          id: p?.id,
          name: String(p?.name ?? "").trim() || "—",
          category: String(p?.Category?.category ?? "").trim() || "—",
          stockQty: Number(p?.Qty ?? 0) || 0,
          isActive: Boolean(p?.IsActive),
        }))
      );

      const pg = res?.data?.pagination;
      if (pg && typeof pg === "object") {
        setPagination({
          totalRecords: Number(pg.totalRecords ?? 0) || 0,
          currentPage: Number(pg.currentPage ?? page) || page,
          totalPages: Number(pg.totalPages ?? 1) || 1,
          limit: Number(pg.limit ?? pageSize) || pageSize,
        });
      } else {
        setPagination((prev) => ({ ...prev, currentPage: page, limit: pageSize }));
      }
    } catch (e) {
      setItems([]);
      setPagination((prev) => ({ ...prev, totalRecords: 0, totalPages: 1, currentPage: page }));
      setProductsError(e?.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchLowStock = async () => {
    setLoadingLowStock(true);
    setLowStockError("");
    try {
      const res = await api.get("/admin/products/low-stock", {
        params: { page: 1, limit: 50 },
      });
      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      setLowStockItems(
        rows
          .map((p) => ({
            id: p.id,
            name: String(p.productName ?? p.name ?? "").trim() || "—",
            category: String(p.categoryName ?? "").trim() || "—",
            stockQty: Number(p.qty ?? 0) || 0,
            isActive: Boolean(p.isActive),
          }))
          .filter((p) => p.id != null)
      );
    } catch (e) {
      setLowStockItems([]);
      setLowStockError(e?.response?.data?.message || "Failed to fetch low stock products");
    } finally {
      setLoadingLowStock(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, categoryId, searchQuery]);

  useEffect(() => {
    fetchFilters();
    fetchLowStock();
  }, []);

  const [draftQty, setDraftQty] = useState(() => ({}));

  const lowStock = useMemo(() => {
    return [...lowStockItems]
      .sort((a, b) => (a.stockQty ?? 0) - (b.stockQty ?? 0))
      .slice(0, 5);
  }, [lowStockItems]);

  const totalPages = Math.max(1, Number(pagination?.totalPages ?? 1) || 1);
  const safePage = Math.min(page, totalPages);
  const pageItems = items;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const getDraft = (id) => {
    const raw = draftQty[id];
    if (raw === undefined || raw === null) return "";
    return String(raw);
  };

  const setDraft = (id, value) => {
    setDraftQty((prev) => ({ ...prev, [id]: value }));
  };

  const bumpDelta = (id, delta) => {
    const n = Number(getDraft(id));
    const base = Number.isFinite(n) ? n : 0;
    const next = base + delta;
    setDraft(id, String(Math.max(0, next)));
  };

  const readDelta = (id) => {
    const n = Number(getDraft(id));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  const clearDraft = (id) => {
    setDraftQty((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const patchStock = async (id, action) => {
    const delta = readDelta(id);
    if (delta <= 0) return;
    if (!id) return;

    setSavingById((prev) => ({ ...prev, [id]: true }));
    setProductsError("");
    try {
      await api.patch(`/admin/products/${id}/stock`, {
        qty: delta,
        action,
      });

      setItems((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const current = Number(p.stockQty ?? 0) || 0;
          const next = action === "increase" ? current + delta : Math.max(0, current - delta);
          return { ...p, stockQty: next };
        })
      );
      setLowStockItems((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const current = Number(p.stockQty ?? 0) || 0;
          const next = action === "increase" ? current + delta : Math.max(0, current - delta);
          return { ...p, stockQty: next };
        })
      );
      clearDraft(id);

      // Keep low-stock cards accurate
      fetchLowStock();
    } catch (e) {
      setProductsError(e?.response?.data?.message || "Failed to update product stock");
    } finally {
      setSavingById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const patchStatus = async (id, nextActive) => {
    if (!id) return;
    setSavingStatusById((prev) => ({ ...prev, [id]: true }));
    setProductsError("");
    try {
      await api.patch(`/admin/products/${id}/status`, { isActive: nextActive });

      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: Boolean(nextActive) } : p)));
      setLowStockItems((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: Boolean(nextActive) } : p)));
      fetchLowStock();
    } catch (e) {
      setProductsError(e?.response?.data?.message || "Failed to update product status");
    } finally {
      setSavingStatusById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const onAddQty = (id) => patchStock(id, "increase");
  const onRemoveQty = (id) => patchStock(id, "decrease");

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#3b2a23]">Stock & Restore</h2>
        <p className="text-[#7c6a5a] mt-1 text-sm">Check remaining quantity, update stock, and restore products.</p>
      </div>

      {/* Low stock */}
      <section className="bg-white rounded-lg border border-[#ececec] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">Low Stock (Top)</h3>
            <span className="text-xs font-bold bg-[#fffaf9] border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {lowStock.length}
            </span>
          </div>
          <div className="text-xs text-[#7c6a5a]">Lowest quantity products first</div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingLowStock ? (
            <div className="col-span-full text-center text-[#7c6a5a]">Loading...</div>
          ) : lowStockError ? (
            <div className="col-span-full text-center text-[#7c6a5a]">{lowStockError}</div>
          ) : (
            lowStock.map((p) => {
              const isSaving = Boolean(savingById[p.id]);
              return (
                <div key={p.id} className="rounded-lg border border-[#ececec] bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#3b2a23]">{p.name}</div>
                      <div className="text-xs text-[#7c6a5a] mt-1">
                        {p.category}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full border ${p.stockQty <= 5 ? "bg-[#fffaf9] border-[#5C3A2E] text-[#3b2a23]" : "bg-white border-[#ececec] text-[#3b2a23]"
                        }`}
                    >
                      Qty: {p.stockQty}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-[#ececec] pt-4 flex flex-col gap-4">
                    {/* Adjust Qty */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => bumpDelta(p.id, -1)}
                          className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#3b2a23] border border-[#ececec]"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <input
                          value={getDraft(p.id)}
                          onChange={(e) => setDraft(p.id, e.target.value)}
                          inputMode="numeric"
                          className="w-16 rounded-md border border-[#ececec] bg-white px-2 py-1 text-center text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => bumpDelta(p.id, 1)}
                          className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#3b2a23] border border-[#ececec]"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAddQty(p.id)}
                          disabled={isSaving}
                          className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-md border border-[#5C3A2E] text-[#5C3A2E] bg-white px-2 py-1.5 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <span className="w-3 h-3 border-2 border-[#5C3A2E] border-t-transparent rounded-full animate-spin"></span>
                              Wait
                            </>
                          ) : (
                            "Add"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveQty(p.id)}
                          disabled={isSaving}
                          className="cursor-pointer rounded-md border border-[#ececec] text-[#3b2a23] bg-white px-2 py-1.5 text-xs font-bold hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => patchStatus(p.id, !p.isActive)}
                      disabled={Boolean(savingStatusById[p.id])}
                      className={`w-full cursor-pointer text-xs font-bold px-3 py-2 rounded-md border disabled:opacity-50 flex items-center justify-center gap-2 ${p.isActive
                        ? "bg-white border-[#ececec] text-green-700"
                        : "bg-white border-[#5C3A2E] text-red-700"
                        }`}
                    >
                      {Boolean(savingStatusById[p.id]) ? (
                        <>
                          <span className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${p.isActive ? 'border-green-700' : 'border-red-700'}`}></span>
                          Saving...
                        </>
                      ) : (
                        p.isActive ? "Active" : "Inactive"
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* List */}
      <section className="bg-white rounded-lg border border-[#ececec] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">Product Stock List</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {Number(pagination?.totalRecords ?? items.length) || 0}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-[220px] rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
            />
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-[220px] rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.label}
                </option>
              ))}
            </select>


          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Product Name</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Category</th>
                <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Remaining Qty</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap w-full flex justify-center items-center">Adjust Qty</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#7c6a5a]">
                    Loading...
                  </td>
                </tr>
              ) : productsError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#7c6a5a]">
                    {productsError}
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#7c6a5a]">
                    No products found.
                  </td>
                </tr>
              ) : (
                pageItems.map((p, idx) => {
                  const current = p.stockQty ?? 0;
                  const isLow = current <= 5;
                  const isSaving = Boolean(savingById[p.id]);
                  const isSavingStatus = Boolean(savingStatusById[p.id]);
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150 ${isLow ? "bg-[#fffaf9]" : ""
                        }`}
                    >
                      <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                      <td className="px-6 py-5 text-[#3b2a23]">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-[#7c6a5a]">ID: {p.id}</div>
                      </td>
                      <td className="px-6 py-5 text-[#7c6a5a] font-semibold whitespace-nowrap">{p.category || "—"}</td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className={`inline-flex items-center justify-center min-w-12 px-3 py-1 rounded-md border font-bold ${isLow ? "bg-white border-[#5C3A2E] text-[#3b2a23]" : "bg-gray-50 border-[#ececec] text-[#3b2a23]"
                            }`}
                        >
                          {current}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-2">

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => bumpDelta(p.id, -1)}
                              className="cursor-pointer w-9 h-9 rounded-md bg-gray-50 text-[#3b2a23] border border-[#ececec]"
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <input
                              value={getDraft(p.id)}
                              onChange={(e) => setDraft(p.id, e.target.value)}
                              inputMode="numeric"
                              className="w-24 rounded-md border border-[#ececec] bg-white px-3 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                              placeholder="0"
                              aria-label="Quantity change amount"
                            />
                            <button
                              type="button"
                              onClick={() => bumpDelta(p.id, 1)}
                              className="cursor-pointer w-9 h-9 rounded-md bg-gray-50 text-[#3b2a23] border border-[#ececec]"
                              aria-label="Increase"
                            >
                              +
                            </button>

                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => onAddQty(p.id)}
                              disabled={isSaving}
                              className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-md border border-[#5C3A2E] text-[#5C3A2E] bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 min-w-[70px]"
                            >
                              {isSaving ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-[#5C3A2E] border-t-transparent rounded-full animate-spin"></span>
                                  Adding
                                </>
                              ) : (
                                "Add"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveQty(p.id)}
                              disabled={isSaving}
                              className="cursor-pointer rounded-md border border-[#ececec] text-[#3b2a23] bg-gray-50 px-3 py-2 text-xs font-bold hover:bg-gray-50"
                            >
                              Remove
                            </button>
                          </div>

                        </div>

                      </td>
                      <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => patchStatus(p.id, !p.isActive)}
                            disabled={isSavingStatus}
                            className={`cursor-pointer text-xs font-bold px-3 py-2 rounded-md border disabled:opacity-50 flex items-center justify-center gap-2 min-w-[80px] ${p.isActive
                              ? "bg-white border-[#ececec] text-green-700"
                              : "bg-white border-[#5C3A2E] text-red-700"
                              }`}
                            aria-label="Toggle active status"
                          >
                            {isSavingStatus ? (
                              <>
                                <span className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${p.isActive ? 'border-green-700' : 'border-red-700'}`}></span>
                                Wait
                              </>
                            ) : (
                              p.isActive ? "Active" : "Inactive"
                            )}
                          </button>
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
}
