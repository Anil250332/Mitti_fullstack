import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiDownload, FiEdit2, FiSearch, FiTrash2 } from "react-icons/fi";
import ProductEditForm from "./ProductEditForm";
import api from "../../api/axios";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-label={label}
      className={`cursor-pointer inline-flex items-center h-7 w-12 rounded-full border transition-colors duration-150 ${checked ? "bg-[#5C3A2E] border-[#5C3A2E]" : "bg-gray-50 border-[#ececec]"
        }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-150 ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
}

function toCsv(rows) {
  const escape = (value) => {
    const str = String(value ?? "");
    if (/[\n\r,\"]/g.test(str)) return `"${str.replace(/\"/g, '""')}"`;
    return str;
  };

  const headers = ["SL", "Product Name", "Sub Category", "Brand", "Unit Price", "Best Seller", "Active"];
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r, idx) => {
    lines.push(
      [
        idx + 1,
        r.name,
        r.subcategory || r.category,
        r.brand,
        r.unitPrice,
        r.isBestSeller ? "Yes" : "No",
        r.isActive ? "Active" : "Inactive",
      ]
        .map(escape)
        .join(",")
    );
  });
  return lines.join("\n");
}

export default function DashboardProducts() {
  const { categories, brands, flavors } = useSelector(state => state.admin);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [processingIds, setProcessingIds] = useState({}); // { id: { bestSeller: bool, status: bool, onlinePayment: bool } }

  const normalizeListResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.data)) return resData.data;
    if (resData.success && Array.isArray(resData.data)) return resData.data;
    return [];
  };

  const getTotalFromResponse = (resData, fallbackLen) => {
    if (!resData) return fallbackLen;
    if (resData.pagination?.totalRecords != null) return Number(resData.pagination.totalRecords) || fallbackLen;
    if (resData.total != null) return Number(resData.total) || fallbackLen;
    if (resData.count != null) return Number(resData.count) || fallbackLen;
    return fallbackLen;
  };

  const mapProductRow = (p) => {
    const id = p?.id ?? p?.Id ?? p?.ID;
    const name = p?.name ?? p?.Name ?? "";

    const categoryName =
      p?.category?.name ??
      p?.category?.category ??
      p?.Category?.name ??
      p?.Category?.category ??
      p?.categoryName ??
      p?.CategoryName ??
      "";

    const subCategoryName =
      p?.subCategory?.name ??
      p?.SubCategory?.name ??
      p?.subcategory?.name ??
      p?.subCategoryName ??
      p?.SubCategoryName ??
      "";

    const brandName =
      p?.brand?.name ??
      p?.brand?.brand ??
      p?.Brand?.name ??
      p?.Brand?.brand ??
      p?.brandName ??
      p?.BrandName ??
      "";

    const price = Number(p?.price ?? p?.Price ?? p?.unitPrice ?? p?.UnitPrice ?? 0) || 0;
    const discountPrice = Number(p?.discountPrice ?? p?.DiscountPrice ?? 0) || 0;
    const discountAmount = price > 0 && discountPrice > 0 ? Math.max(0, price - discountPrice) : 0;

    const imagesRaw =
      p?.images ??
      p?.Images ??
      p?.ProductImages ??
      p?.productImages ??
      [];

    const images = Array.isArray(imagesRaw)
      ? imagesRaw
        .map((img) => ({
          guid: img?.guid ?? img?.Guid ?? img?.GUID,
          path: img?.path ?? img?.Path,
          eExtension: img?.eExtension ?? img?.EExtension ?? img?.Extension ?? img?.extension,
        }))
        .filter((img) => img.guid && img.path)
      : [];

    const tagsRaw = p?.tags ?? p?.Tags ?? [];
    const productTagsRaw = p?.ProductTags ?? p?.productTags ?? [];
    const tagIdsFromTags = Array.isArray(tagsRaw)
      ? tagsRaw
        .map((t) => Number(t?.id ?? t?.Id ?? t))
        .filter((n) => Number.isFinite(n))
      : [];
    const tagIdsFromProductTags = Array.isArray(productTagsRaw)
      ? productTagsRaw
        .map((pt) => Number(pt?.TagId ?? pt?.tagId ?? pt?.Tag?.id ?? pt?.tag?.id))
        .filter((n) => Number.isFinite(n))
      : [];
    const tagIds = [...new Set([...tagIdsFromTags, ...tagIdsFromProductTags])];

    return {
      id,
      name,
      description: p?.description ?? p?.Description ?? "",
      information: p?.information ?? p?.Information ?? "",
      category: categoryName,
      subcategory: subCategoryName,
      brand: brandName,
      unitPrice: price,
      discountAmount,
      stockQty: Number(p?.qty ?? p?.Qty ?? p?.stockQty ?? 0) || 0,
      minQty: Number(p?.minQty ?? p?.MinQty ?? 0) || 0,
      weight: Number(p?.weight ?? p?.Weight ?? 0) || 0,
      eDietType: p?.eDietType ?? p?.EDietType ?? p?.dietType ?? "",
      brandId: Number(p?.brandId ?? p?.BrandId ?? p?.brand?.id ?? p?.Brand?.id ?? 0) || 0,
      categoryId: Number(p?.categoryId ?? p?.CategoryId ?? p?.category?.id ?? p?.Category?.id ?? 0) || 0,
      subCategoryId: Number(p?.subCategoryId ?? p?.SubCategoryId ?? p?.subCategory?.id ?? p?.SubCategory?.id ?? 0) || 0,
      flavourId: Number(p?.flavourId ?? p?.FlavourId ?? p?.flavorId ?? p?.FlavorId ?? 0) || 0,
      tags: tagIds,
      images,
      isBestSeller: Boolean(p?.isBestSeller ?? p?.IsBestSeller ?? false),
      packetsPerJar: p?.packetsPerJar ?? p?.PacketsPerJar ?? "",
      subTitle: p?.subTitle ?? p?.SubTitle ?? "",
      piecesPerJar: p?.piecesPerJar ?? p?.PiecesPerJar ?? "",
      mrpPerJar: p?.mrpPerJar ?? p?.MRPPerJar ?? "",
      mrpPerPiece: p?.mrpPerPiece ?? p?.MRPPerPiece ?? "",
      piecesPerJarLabel: p?.piecesPerJarLabel ?? p?.PiecesPerJarLabel ?? "No. of Pieces/Jar",
      mrpPerJarLabel: p?.mrpPerJarLabel ?? p?.MRPPerJarLabel ?? "MRP of Jar",
      mrpPerPieceLabel: p?.mrpPerPieceLabel ?? p?.MRPPerPieceLabel ?? "Per Piece MRP",
      packetsPerJarLabel: p?.packetsPerJarLabel ?? p?.PacketsPerJarLabel ?? "CTN Size",
      isActive: Boolean(p?.isActive ?? p?.IsActive ?? true),
      position: p?.position ?? p?.Position ?? null,
      isOnlinePaymentOnly: Boolean(p?.isOnlinePaymentOnly ?? p?.IsOnlinePaymentOnly ?? false),
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/products", {
        params: {
          page,
          limit: pageSize,
          ...(query.trim() ? { search: query.trim() } : {}),
        },
      });
      const resData = response.data;

      const raw = normalizeListResponse(resData);
      const mapped = raw.map(mapProductRow);
      const total = getTotalFromResponse(resData, mapped.length);

      setProducts(mapped);
      setTotalItems(total);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages) || 1;

  const onExport = () => {
    const csv = toCsv(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `products-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const setBestSeller = async (id, next) => {
    const prev = products;
    setProducts((pList) => pList.map((p) => (p.id === id ? { ...p, isBestSeller: next } : p)));
    setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], bestSeller: true } }));
    try {
      await api.post("/admin/products/setBestSeller", { id, isBestSeller: next });
    } catch (error) {
      setProducts(prev);
      window.alert(error?.response?.data?.message || "Failed to update best seller.");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], bestSeller: false } }));
    }
  };

  const setOnlinePaymentOnly = async (id, next) => {
    const prev = products;
    setProducts((pList) => pList.map((p) => (p.id === id ? { ...p, isOnlinePaymentOnly: next } : p)));
    setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], onlinePayment: true } }));
    try {
      await api.post("/admin/products/toggleOnlinePaymentOnly", { id, isOnlinePaymentOnly: next });
    } catch (error) {
      setProducts(prev);
      window.alert(error?.response?.data?.message || "Failed to update online payment status.");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], onlinePayment: false } }));
    }
  };

  const setActive = async (id, next) => {
    const prev = products;
    setProducts((pList) => pList.map((p) => (p.id === id ? { ...p, isActive: next } : p)));
    setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], status: true } }));
    try {
      await api.post("/admin/products/changeStatus", { id, isActive: next });
    } catch (error) {
      setProducts(prev);
      window.alert(error?.response?.data?.message || "Failed to update product status.");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [id]: { ...prev[id], status: false } }));
    }
  };

  const onDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/admin/products/${id}`);
      window.alert("Product deleted successfully.");
      fetchProducts();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        "Failed to delete product.";
      window.alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const onEdit = async (id) => {
    setEditingId(id);
    setMode("edit");

    const fallback = products.find((p) => String(p.id) === String(id)) ?? null;
    setEditingProduct(fallback);

    try {
      const response = await api.get(`/admin/products/${id}`);
      const resData = response.data;
      const detail = resData?.data ?? resData;
      const mapped = mapProductRow(detail);
      setEditingProduct(mapped);
    } catch (error) {
      // If detail endpoint doesn't exist, we still allow edit with what we have.
    }
  };

  const onCancelEdit = () => {
    setMode("list");
    setEditingId(null);
    setEditingProduct(null);
  };

  const onSaveEdit = async (payload) => {
    try {
      await api.post("/admin/products/save", payload);
      window.alert("Product updated successfully.");
      setMode("list");
      setEditingId(null);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        "Failed to update product.";
      window.alert(msg);
    }
  };

  if (mode === "edit") {
    return (
      <div className="w-full">
        <ProductEditForm
          product={editingProduct}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
          categories={categories}
          brands={brands}
          flavors={flavors}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="bg-white rounded-lg  overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">Product List</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {totalItems}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-[360px]">
              <div className="flex items-stretch border border-[#ececec] rounded-md overflow-hidden bg-white focus-within:border-[#5C3A2E]">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 text-sm outline-none text-[#3b2a23]"
                />
                <div className="w-11 border-l border-[#ececec] flex items-center justify-center text-[#3b2a23]">
                  <FiSearch />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onExport}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-[#5C3A2E] text-[#5C3A2E] bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <FiDownload /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Product Name</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Sub Category</th>
                <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Unit Price</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Online Payment</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Show as best seller</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Active status</th>

                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-[#7c6a5a]">
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-[#7c6a5a]">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => (
                  <tr key={p.id} className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-[#7c6a5a]">ID: {p.id}</div>
                    </td>
                    <td className="px-6 py-5 text-[#7c6a5a] font-semibold whitespace-nowrap">{p.subcategory || "—"}</td>
                    <td className="px-6 py-5 text-right text-[#3b2a23] font-semibold whitespace-nowrap">
                      ₹{Number(p.unitPrice || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={!!p.isOnlinePaymentOnly}
                          onChange={(next) => !processingIds[p.id]?.onlinePayment && setOnlinePaymentOnly(p.id, next)}
                          label="Toggle online payment only"
                        />
                        <span className={`text-xs font-bold ${processingIds[p.id]?.onlinePayment ? 'opacity-40 animate-pulse' : 'text-[#3b2a23]'}`}>
                          {p.isOnlinePaymentOnly ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={!!p.isBestSeller}
                          onChange={(next) => !processingIds[p.id]?.bestSeller && setBestSeller(p.id, next)}
                          label="Toggle best seller"
                        />
                        <span className={`text-xs font-bold ${processingIds[p.id]?.bestSeller ? 'opacity-40 animate-pulse' : 'text-[#3b2a23]'}`}>
                          {p.isBestSeller ? "On" : "Off"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={!!p.isActive}
                          onChange={(next) => !processingIds[p.id]?.status && setActive(p.id, next)}
                          label="Toggle active"
                        />
                        <span className={`text-xs font-bold ${processingIds[p.id]?.status ? 'opacity-40 animate-pulse' : (p.isActive ? "text-green-700" : "text-red-700")}`}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(p.id)}
                          className="cursor-pointer w-10 h-10 rounded-md border border-[#5C3A2E] text-[#5C3A2E] hover:bg-gray-50 flex items-center justify-center transition-colors duration-150"
                          aria-label="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="cursor-pointer w-10 h-10 rounded-md border border-red-500 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {deletingId === p.id ? (
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
    </div>
  );
}
