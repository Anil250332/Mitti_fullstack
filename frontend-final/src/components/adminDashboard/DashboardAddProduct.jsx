import React, { useEffect, useId, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiImage, FiInfo } from "react-icons/fi";
import api from "../../api/axios";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB (matches backend multer limit)

function Field({ label, required, children, hint, htmlFor }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#3b2a23]">
        {label} {required ? <span className="text-[#5C3A2E]">*</span> : null}
      </label>
      {hint ? <div className="text-xs text-[#7c6a5a]">{hint}</div> : null}
      {children}
    </div>
  );
}

function TextInput({ id, value, onChange, placeholder, type = "text", required, min }) {
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
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      type={type}
      required={required}
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

function TextArea({ id, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
    />
  );
}

export default function DashboardAddProduct() {
  const { categories: categoriesProp } = useSelector(state => state.admin);
  const formId = useId();
  const [values, setValues] = useState({
    name: "",
    description: "",
    information: "",
    parentCategoryId: "",
    subcategoryId: "",
    weight: "",
    unitPrice: "",
    stockQty: "",
    minQty: "",
    discountAmount: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagInputFocused, setTagInputFocused] = useState(false);

  const normalizeListResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.data)) return resData.data;
    if (resData.success && Array.isArray(resData.data)) return resData.data;
    return [];
  };

  const mapToOption = (item, nameFallbackKeys) => {
    const id = item?.id ?? item?.Id ?? item?.ID;
    const name =
      item?.name ??
      nameFallbackKeys.map((k) => item?.[k]).find(Boolean) ??
      "";
    if (id == null) return null;
    return { id: Number(id), name: String(name ?? "").trim() };
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get("/admin/categories?page=1&limit=1000"),
          api.get("/admin/tags?page=1&limit=1000"),
        ]);

        const categoriesRaw = normalizeListResponse(categoriesRes.data);
        const tagsRaw = normalizeListResponse(tagsRes.data);

        const categoriesMapped = categoriesRaw
          .map((c) => mapToOption(c, ["category"]))
          .filter(Boolean);
        const tagsMapped = tagsRaw
          .map((t) => mapToOption(t, ["tag"]))
          .filter(Boolean);

        if (cancelled) return;
        setCategoryOptions(categoriesMapped);
        setTagOptions(tagsMapped);
      } catch (error) {
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    if (categoryOptions.length > 0) return categoryOptions;
    if (Array.isArray(categoriesProp) && categoriesProp.length > 0) {
      return categoriesProp
        .filter((c) => c?.isActive)
        .map((c) => ({ id: Number(c?.id), name: c?.name }))
        .filter((c) => Number.isFinite(c.id) && c.name);
    }
    return [];
  }, [categoryOptions, categoriesProp]);

  useEffect(() => {
    if (!values.parentCategoryId) {
      setSubcategoryOptions([]);
      setValues((prev) => ({ ...prev, subcategoryId: "" }));
      return;
    }

    let cancelled = false;

    const loadSubcategories = async () => {
      try {
        const res = await api.get(`/admin/subcategories?page=1&limit=1000&categoryId=${values.parentCategoryId}`);
        const raw = normalizeListResponse(res.data);
        const mapped = raw
          .map((s) => ({
            id: Number(s?.id ?? s?.Id ?? s?.ID),
            name: String(s?.name ?? "").trim(),
          }))
          .filter((s) => Number.isFinite(s.id) && s.name);

        if (cancelled) return;
        setSubcategoryOptions(mapped);
      } catch (error) {
      }
    };

    loadSubcategories();
    return () => {
      cancelled = true;
    };
  }, [values.parentCategoryId]);



  const update = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const name = String(values.name ?? "").trim();
    if (!name) {
      window.alert("Please enter product name.");
      return;
    }

    const subcategoryId = Number(values.subcategoryId || 0) || 0;
    const weight = Number(values.weight || 0) || 0;
    const qty = Number(values.stockQty || 0);
    const minQty = Number(values.minQty || 0) || 0;

    if (!subcategoryId) {
      window.alert("Sub Category is required.");
      return;
    }

    if (!Number.isFinite(qty) || qty < 0) {
      window.alert("Stock Quantity is required.");
      return;
    }
    if (!Number.isFinite(minQty) || minQty < 0) {
      window.alert("Min Qty is required.");
      return;
    }
    if (!additionalImages || additionalImages.length === 0) {
      window.alert("Please upload at least 1 image.");
      return;
    }

    const price = Number(values.unitPrice || 0);
    const discountAmount = Number(values.discountAmount || 0);
    const discountPrice = Math.max(0, price - discountAmount);

    if (!price) {
      window.alert("Price is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", String(values.description ?? ""));
    formData.append("information", String(values.information ?? ""));
    formData.append("rating", "0");
    formData.append("price", String(price));
    formData.append("discountPrice", String(discountPrice));
    formData.append("subcategoryId", String(subcategoryId));
    formData.append("qty", String(qty));
    formData.append("minQty", String(minQty));
    formData.append("weight", String(weight));
    formData.append("tags", JSON.stringify(Array.isArray(selectedTagIds) ? selectedTagIds : []));

    additionalImages.slice(0, MAX_IMAGES).forEach((img) => {
      if (img?.file) formData.append("images", img.file);
    });

    setIsSaving(true);
    try {
      await api.post("/admin/products/save", formData);
      window.alert("Product saved successfully.");
      setValues({
        name: "",
        description: "",
        information: "",
        parentCategoryId: "",
        subcategoryId: "",
        weight: "",
        unitPrice: "",
        stockQty: "",
        minQty: "",
        discountAmount: "",
      });
      setAdditionalImages((prev) => {
        prev.forEach((img) => {
          try {
            if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
          } catch {
            // ignore
          }
        });
        return [];
      });
      setSelectedTagIds([]);
      setTagInput("");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        "Failed to save product.";
      window.alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);

    const valid = [];
    let skipped = 0;

    for (const file of files) {
      const isImage = typeof file?.type === "string" && file.type.startsWith("image/");
      const withinSize = typeof file?.size === "number" ? file.size <= MAX_IMAGE_BYTES : true;
      if (!isImage || !withinSize) {
        skipped += 1;
        continue;
      }
      valid.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setAdditionalImages((prev) => {
      const next = [...prev, ...valid].slice(0, MAX_IMAGES);
      // if we had to drop some due to max limit, cleanup their object URLs
      if (next.length < prev.length + valid.length) {
        const dropped = [...prev, ...valid].slice(MAX_IMAGES);
        dropped.forEach((img) => {
          try {
            if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
          } catch {
            // ignore
          }
        });
      }
      return next;
    });

    // allow selecting the same file again
    input.value = "";

    if (skipped > 0) {
      window.alert(`Skipped ${skipped} file(s). Only image files up to 10MB are allowed.`);
    }
  };

  const removeImage = (index) => {
    setAdditionalImages((prev) => {
      const removed = prev[index];
      try {
        if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const addTag = (tagId) => {
    if (selectedTagIds.length >= 4) return;
    const idNum = Number(tagId);
    if (!Number.isFinite(idNum)) return;

    setSelectedTagIds((prev) => {
      if (prev.includes(idNum)) return prev;
      return [...prev, idNum];
    });
    setTagInput("");
  };

  const removeTag = (tagId) => {
    const idNum = Number(tagId);
    setSelectedTagIds((prev) => prev.filter((t) => t !== idNum));
  };

  const filteredTags = useMemo(() => {
    if (!tagInputFocused) return [];
    const q = tagInput.trim().toLowerCase();
    if (!q) {
      return tagOptions
        .filter((t) => !selectedTagIds.includes(t.id))
        .slice(0, 20);
    }
    return tagOptions
      .filter((t) => t.name.toLowerCase().includes(q) && !selectedTagIds.includes(t.id))
      .slice(0, 20);
  }, [tagInput, tagOptions, selectedTagIds, tagInputFocused]);

  const selectedTags = useMemo(() => {
    if (selectedTagIds.length === 0) return [];
    const mapById = new Map(tagOptions.map((t) => [t.id, t]));
    return selectedTagIds
      .map((id) => mapById.get(id))
      .filter(Boolean);
  }, [selectedTagIds, tagOptions]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#3b2a23]">Add New Product</h2>
        <p className="text-[#7c6a5a] mt-1 text-sm">Fill product details and upload images.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Images */}
        <div className="bg-white rounded-lg border border-[#ececec] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm font-bold text-[#3b2a23]">
              Product Images <span className="text-[#5C3A2E]">*</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1 text-xs font-semibold text-[#3b2a23]">
              Ratio 1:1 (500 x 500 px) <FiInfo className="text-[#7c6a5a]" />
            </span>
          </div>

          <input
            id={`${formId}-images`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <label
              htmlFor={`${formId}-images`}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#ececec] bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="mb-2 text-[#5C3A2E] text-2xl">
                <FiImage />
              </div>
              <div className="text-xs font-semibold text-[#3b2a23] text-center px-2">Click to upload</div>
            </label>

            {additionalImages.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-lg border border-[#ececec] overflow-hidden group">
                <img
                  src={file.previewUrl}
                  alt={`preview-${index}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold text-center py-1">
                    Thumbnail
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-[#7c6a5a]">
            The first image will be used as the product thumbnail. You can upload multiple images at once.
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg border border-[#ececec] p-5">
          <div className="text-sm font-bold text-[#3b2a23] mb-4">Product Details</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Product name" required>
              <TextInput
                id={`${formId}-name`}
                value={values.name}
                onChange={update("name")}
                placeholder="Enter product name"
                required
              />
            </Field>

            <Field label="Parent Category">
              <select
                id={`${formId}-parent-category`}
                value={values.parentCategoryId}
                onChange={update("parentCategoryId")}
                className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
              >
                <option value="">Select parent category</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sub Category" required>
              <select
                id={`${formId}-subcategory`}
                value={values.subcategoryId}
                onChange={update("subcategoryId")}
                disabled={!values.parentCategoryId}
                className="w-full rounded-lg border border-[#ececec] bg-white px-4 py-3 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E] disabled:bg-gray-50 disabled:text-[#7c6a5a]"
              >
                <option value="">Select sub category</option>
                {subcategoryOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Weight (kg)">
              <TextInput
                id={`${formId}-weight`}
                value={values.weight}
                onChange={update("weight")}
                placeholder="e.g., 100"
                type="number"
                min="0"
              />
            </Field>

            <Field label="Tags" hint="Select up to 4 tags from the list.">
              <div className="relative w-full">
                <div className="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm text-[#3b2a23] outline-none focus-within:border-[#5C3A2E]">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1 text-xs font-semibold text-[#3b2a23]"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="text-[#7c6a5a] hover:text-[#3b2a23]"
                          aria-label={`Remove ${tag.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      id={`${formId}-tags`}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onFocus={() => setTagInputFocused(true)}
                      onBlur={() => setTimeout(() => setTagInputFocused(false), 200)}
                      placeholder={selectedTagIds.length >= 4 ? "Max tags reached" : "Type to search tags..."}
                      disabled={selectedTagIds.length >= 4}
                      className="min-w-40 flex-1 bg-transparent px-2 py-1 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Dropdown */}
                {filteredTags.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-[#ececec] bg-white shadow-lg max-h-60 overflow-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag.id)}
                        className="w-full text-left px-4 py-2 text-sm text-[#3b2a23] hover:bg-gray-50 hover:text-[#5C3A2E]"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Price (₹)" required>
              <TextInput
                id={`${formId}-unitPrice`}
                value={values.unitPrice}
                onChange={update("unitPrice")}
                placeholder="0"
                type="number"
                required
                min="0"
              />
            </Field>

            <Field label="Discount Amount (₹)" required>
              <TextInput
                id={`${formId}-discountAmount`}
                value={values.discountAmount}
                onChange={update("discountAmount")}
                placeholder="0"
                type="number"
                required
                min="0"
              />
            </Field>

            <Field label="Current Stock Qty" required>
              <TextInput
                id={`${formId}-stockQty`}
                value={values.stockQty}
                onChange={update("stockQty")}
                placeholder="0"
                type="number"
                required
                min="0"
              />
            </Field>

            <Field label="Min Qty" required>
              <TextInput
                id={`${formId}-minQty`}
                value={values.minQty}
                onChange={update("minQty")}
                placeholder="e.g., 2"
                type="number"
                required
                min="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <Field label="Description">
              <TextArea
                id={`${formId}-description`}
                value={values.description}
                onChange={update("description")}
                placeholder="Write product description"
              />
            </Field>

            <Field label="Information">
              <TextArea
                id={`${formId}-information`}
                value={values.information}
                onChange={update("information")}
                placeholder="Write product information"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[#5C3A2E] hover:bg-[#7d572d] cursor-pointer px-8 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
