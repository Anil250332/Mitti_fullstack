import React, { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiPackage,
  FiSearch,
  FiTruck,
  FiEye,
  FiX
} from "react-icons/fi";

import api, { resolveUploadUrl } from "../../api/axios";

const STATUSES = [
  "Pending",
  "Confirmed",
  "Packaging",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_TO_CODE = {
  Pending: 1,
  Confirmed: 2,
  Packaging: 3,
  "Out for Delivery": 4,
  Delivered: 6,
  Cancelled: 0,
};

const CODE_TO_STATUS = {
  1: "Pending",
  2: "Confirmed",
  3: "Packaging",
  4: "Out for Delivery",
  6: "Delivered",
  0: "Cancelled",
};

const toStatusLabel = (value) => {
  const code = Number(value);
  if (Number.isFinite(code) && CODE_TO_STATUS[code]) return CODE_TO_STATUS[code];
  const raw = String(value ?? "").trim();
  return raw || "Pending";
};

const formatOrderDate = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
};

const normalizeAdminOrder = (order) => {
  const dbId = Number(order?.id);
  const orderNo = String(order?.OrderNo ?? order?.orderNo ?? order?.id ?? "");
  const status = toStatusLabel(order?.eOrderStatus ?? order?.status);
  const rawItems = Array.isArray(order?.OrderItems)
    ? order.OrderItems
    : Array.isArray(order?.items)
      ? order.items
      : [];

  const items = rawItems.map((oi) => {
    const product = oi?.Product ?? oi?.product;
    const name = String(product?.name ?? oi?.name ?? "").trim();
    const variant = String(product?.Weight ?? product?.weight ?? oi?.variant ?? "").trim();
    const sku = String(product?.id ?? oi?.ItemId ?? oi?.sku ?? "").trim();
    const qty = Number(oi?.Qty ?? oi?.qty ?? oi?.quantity ?? 0) || 0;
    const orderItemId = Number(oi?.id);
    const itemStatus = Number(oi?.eStatus ?? 1);
    const deliveredQty = Number(oi?.DeliveredQty ?? 0);
    const stock = Number(product?.Qty ?? 0);
    return { name, variant, sku, qty, orderItemId, itemStatus, deliveredQty, stock };
  });

  const amount = Number(order?.Amount ?? order?.amount ?? 0) || 0;

  return {
    dbId: Number.isFinite(dbId) ? dbId : null,
    id: orderNo,
    date: formatOrderDate(order?.OrderDate ?? order?.createdAt ?? order?.date),
    customerName: String(order?.User?.name ?? order?.customerName ?? "").trim() || "—",
    customerPhone: String(order?.User?.mobile ?? order?.User?.phone ?? order?.customerPhone ?? "").trim() || "—",
    store: String(order?.store ?? "").trim() || "—",
    amount,
    status,
    items,
    shipmentId: order?.ShipmentId ?? order?.shipmentId ?? null,
    paymentSlip: order?.paymentSlip || null,
  };
};

const STATUS_META = {
  Pending: { icon: <FiClock /> },
  Confirmed: { icon: <FiCheckCircle /> },
  Packaging: { icon: <FiPackage /> },
  "Out for Delivery": { icon: <FiTruck /> },
  Delivered: { icon: <FiArchive /> },
  Cancelled: { icon: <FiX /> },
};

function StatusPill({ status }) {
  const base = "px-3 py-1 rounded-md text-xs font-semibold";
  switch (status) {
    case "Delivered":
      return <span className={`${base} bg-green-50 text-green-700`}>{status}</span>;
    case "Confirmed":
      return <span className={`${base} bg-green-50 text-green-700`}>{status}</span>;
    case "Pending":
      return <span className={`${base} bg-blue-50 text-blue-700`}>{status}</span>;
    case "Packaging":
      return <span className={`${base} bg-red-50 text-red-700`}>{status}</span>;
    case "Out for Delivery":
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>{status}</span>;
    case "Cancelled":
      return <span className={`${base} bg-red-50 text-red-700`}>{status}</span>;
    default:
      return <span className={`${base} bg-gray-50 text-[#3b2a23]`}>{status}</span>;
  }
}

export default function DashboardOrders() {
  const [activeStatus, setActiveStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [pagination, setPagination] = useState(() => ({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: pageSize,
  }));

  const [statusCounts, setStatusCounts] = useState(() => ({
    pending: 0,
    confirmed: 0,
    packaging: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  }));

  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingPendingProducts, setLoadingPendingProducts] = useState(false);
  const [pendingProductsError, setPendingProductsError] = useState("");

  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  const [draftStatus, setDraftStatus] = useState(() => ({}));
  const [draftShipmentId, setDraftShipmentId] = useState(() => ({}));
  const [draftPaymentStatus, setDraftPaymentStatus] = useState(() => ({}));
  const [draftPaidNow, setDraftPaidNow] = useState(() => ({}));

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOrders, setProductOrders] = useState([]);
  const [loadingProductOrders, setLoadingProductOrders] = useState(false);

  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState({}); // { dbId: bool }
  const [isApprovingOrder, setIsApprovingOrder] = useState({}); // { dbId: bool }

  const handleTrackOrder = async (dbId) => {
    setTrackingLoading(true);
    try {
      const res = await api.get(`/admin/orders/tracking/${dbId}`);
      if (res.data.success) {
        setTrackingInfo(res.data.data);
      } else {
        alert(res.data.message || "Tracking info not available");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch tracking data");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getOrderTotalQty = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.reduce((sum, item) => {
      const qty = Number(item?.qty ?? item?.quantity ?? 0) || 0;
      return qty > 0 ? sum + qty : sum;
    }, 0);
  };

  const getOrderProductsLabel = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const names = items
      .map((it) => String(it?.name ?? it?.title ?? "").trim())
      .filter(Boolean);
    if (names.length === 0) return "—";
    const uniqueNames = Array.from(new Set(names));
    return uniqueNames.join(", ");
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      setOrdersError("");
      try {
        const response = await api.get("/admin/orders/getall", {
          params: {
            page,
            limit: pageSize,
            search: query.trim(),
          },
        });

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setOrders(rows.map(normalizeAdminOrder));

        const pg = response?.data?.pagination;
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
      } catch (error) {
        setOrders([]);
        setPagination((prev) => ({ ...prev, totalRecords: 0, totalPages: 1, currentPage: page }));
        setOrdersError(error?.response?.data?.message || "Failed to fetch orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [page, pageSize, query]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get("/admin/orders/order-status-counts");
        const data = response?.data?.data;
        if (data && typeof data === "object") {
          setStatusCounts({
            pending: Number(data.pending ?? 0) || 0,
            confirmed: Number(data.confirmed ?? 0) || 0,
            packaging: Number(data.packaging ?? 0) || 0,
            outForDelivery: Number(data.outForDelivery ?? 0) || 0,
            delivered: Number(data.delivered ?? 0) || 0,
          });
        }
      } catch (error) {
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchPendingProductQty = async () => {
      setLoadingPendingProducts(true);
      setPendingProductsError("");
      try {
        const response = await api.get("/admin/orders/order-product-qty");
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setPendingProducts(rows);
      } catch (error) {
        setPendingProductsError(error?.response?.data?.message || "Failed to fetch product-wise quantity");
        setPendingProducts([]);
      } finally {
        setLoadingPendingProducts(false);
      }
    };

    fetchPendingProductQty();
  }, []);

  const getSelectedStatus = (id, fallback) => {
    const next = draftStatus?.[id];
    return next ?? fallback;
  };

  const getSelectedShipmentId = (id, fallback) => {
    const next = draftShipmentId?.[id];
    return next ?? (fallback || "");
  };

  const onChangeDraftStatus = (id, next) => {
    setDraftStatus((prev) => ({ ...prev, [id]: next }));
  };

  const onChangeDraftShipmentId = (id, next) => {
    setDraftShipmentId((prev) => ({ ...prev, [id]: next }));
  };

  const onUpdateOrder = async (dbId) => {
    const current = orders.find((o) => o.dbId === dbId);
    if (!current) return;

    if (!dbId) {
      alert("Invalid order id");
      return;
    }

    const nextStatus = getSelectedStatus(dbId, current.status);
    const nextShipmentId = getSelectedShipmentId(dbId, current.shipmentId);

    const statusChanged = Boolean(nextStatus) && nextStatus !== current.status;
    const shipmentChanged = nextShipmentId !== (current.shipmentId || "");

    if (!statusChanged && !shipmentChanged) return;

    setIsUpdatingOrder((prev) => ({ ...prev, [dbId]: true }));
    try {
      const nextCode = STATUS_TO_CODE[nextStatus];
      if (nextCode === undefined) {
        alert("Invalid status selected");
        return;
      }

      await api.post("/admin/orders/update-status", {
        orderId: dbId,
        status: nextCode,
        shipmentId: nextShipmentId
      });

      setOrders((prev) => prev.map((o) => (o.dbId === dbId ? { ...o, status: nextStatus, shipmentId: nextShipmentId } : o)));

      setDraftStatus((prev) => {
        const copy = { ...prev };
        delete copy[dbId];
        return copy;
      });

      setDraftShipmentId((prev) => {
        const copy = { ...prev };
        delete copy[dbId];
        return copy;
      });

      try {
        const response = await api.get("/admin/orders/order-status-counts");
        const data = response?.data?.data;
        if (data && typeof data === "object") {
          setStatusCounts({
            pending: Number(data.pending ?? 0) || 0,
            confirmed: Number(data.confirmed ?? 0) || 0,
            packaging: Number(data.packaging ?? 0) || 0,
            outForDelivery: Number(data.outForDelivery ?? 0) || 0,
            delivered: Number(data.delivered ?? 0) || 0,
            cancelled: Number(data.cancelled ?? 0) || 0,
          });
        }
      } catch {
        // ignore
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update order");
    } finally {
      setIsUpdatingOrder((prev) => ({ ...prev, [dbId]: false }));
    }
  };

  const onDownloadInvoice = async (order) => {
    const id = order?.dbId;
    if (!id) {
      alert("Order ID not found.");
      return;
    }

    try {
      const response = await api.get(`/admin/orders/invoice/${id}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.id || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download invoice.");
    }
  };

  const hasOrderDraftChanges = (order) => {
    if (!order) return false;
    const nextStatus = getSelectedStatus(order.dbId, order.status);
    const nextShipmentId = getSelectedShipmentId(order.dbId, order.shipmentId);
    
    const statusChanged = Boolean(nextStatus) && nextStatus !== order.status;
    const shipmentChanged = nextShipmentId !== (order.shipmentId || "");
    
    return statusChanged || shipmentChanged;
  };

  const summary = useMemo(() => {
    return {
      Pending: statusCounts.pending ?? 0,
      Confirmed: statusCounts.confirmed ?? 0,
      Packaging: statusCounts.packaging ?? 0,
      "Out for Delivery": statusCounts.outForDelivery ?? 0,
      Delivered: statusCounts.delivered ?? 0,
      Cancelled: statusCounts.cancelled ?? 0,
    };
  }, [statusCounts]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return orders.filter((o) => {
      const matchStatus = activeStatus === "All" ? true : o.status === activeStatus;
      const matchQuery = q === "" ? true : o.id.includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, activeStatus, query]);

  const productionSummary = useMemo(() => {
    const rows = (pendingProducts ?? [])
      .map((p) => {
        const name = String(p?.productName ?? "").trim() || "Unknown Product";
        const brand = String(p?.brandName ?? "").trim();
        const unitPrice = Number(p?.unitPrice ?? p?.price ?? p?.Price ?? 0) || 0;
        const totalQty = Number(p?.remainingQty ?? 0) || 0;
        const packetsPerJar = Number(p?.packetsPerJar ?? p?.PacketsPerJar ?? 0) || 0;
        const weightText = String(p?.weight ?? p?.Weight ?? "").trim();
        const weightMatch = weightText.match(/(\d+(\.\d+)?)/);
        const jarWeight = weightMatch ? parseFloat(weightMatch[1]) : 0;
        const ordersCount = Number(p?.totalOrders ?? 0) || 0;
        return {
          sku: "",
          productId: p?.productId ?? null,
          name: brand ? `${name} (${brand})` : name,
          unitPrice,
          totalQty,
          totalConfirmedQty: Number(p?.totalQty ?? 0),
          packetsPerJar,
          jarWeight,
          weightLabel: weightText,
          ordersCount,
        };
      })
      .sort((a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name));

    const totalUnits = rows.reduce((sum, r) => sum + (Number(r.totalQty) || 0), 0);
    const totalWeight = rows.reduce((sum, r) => sum + (r.totalQty * r.packetsPerJar * r.jarWeight || 0), 0);

    return {
      rows,
      totalUnits,
      totalWeight,
      distinctProducts: rows.length,
    };
  }, [pendingProducts]);

  const totalPages = Math.max(1, Number(pagination?.totalPages ?? 1) || 1);
  const safePage = Math.min(page, totalPages);
  const pageOrders = filtered;

  const totalOrdersCount = Number(pagination?.totalRecords ?? orders.length) || orders.length;
  const tableTitle = activeStatus === "All" ? "All Orders" : `${activeStatus} Orders`;

  const onPickStatus = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#3b2a23]">All Orders</h2>
        <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
          {totalOrdersCount}
        </span>
      </div>

      <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec]">
          <h3 className="text-base font-bold text-[#3b2a23]">Current Order Summary</h3>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onPickStatus(status)}
                className={`cursor-pointer text-left rounded-lg border px-5 py-4 flex items-center justify-between transition-colors duration-150 ${isActive
                  ? "border-brown bg-[#fffaf9]"
                  : "border-[#ececec] bg-gray-50 hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-brown text-lg">{meta.icon}</span>
                  <span className="font-semibold text-[#3b2a23]">{status}</span>
                </div>
                <span className="font-bold">{summary[status] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-[#ececec] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">{tableTitle}</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {filtered.length}
            </span>
          </div>

          <div className="w-full md:w-[380px]">
            <div className="flex items-stretch border border-[#ececec] rounded-md overflow-hidden bg-white focus-within:border-brown">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Order ID"
                className="flex-1 px-4 py-2 text-sm outline-none text-[#3b2a23]"
              />
              <div className="w-11 border-l border-[#ececec] flex items-center justify-center text-[#3b2a23]">
                <FiSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Order ID</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Order Date</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Customer Info</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap min-w-[250px]">Product</th>
                <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Total Qty</th>
                <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Total Amount</th>
                <th className="text-center font-bold px-6 py-4 whitespace-nowrap">View Payment</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Order Status</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-[#7c6a5a]">Loading...</td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-[#7c6a5a]">{ordersError}</td>
                </tr>
              ) : pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-[#7c6a5a]">No orders found.</td>
                </tr>
              ) : (
                pageOrders.map((o, idx) => (
                  <tr key={String(o.dbId ?? o.id)} className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-5 font-semibold text-[#3b2a23]">{o.id}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">{o.date}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">
                      <div className="font-semibold text-[#7c6a5a]">{o.customerName}</div>
                      <div className="text-[#7c6a5a]">{o.customerPhone}</div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-[#3b2a23] min-w-[250px]">{getOrderProductsLabel(o)}</td>
                    <td className="px-6 py-5 text-right text-[#3b2a23]">
                      <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-md bg-gray-50 border border-[#ececec] text-[#3b2a23] font-bold">
                        {getOrderTotalQty(o)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-[#3b2a23]">
                      <div className="font-semibold">₹{o.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        {o.paymentSlip ? (
                          <div 
                            onClick={() => { setSlipUrl(o.paymentSlip); setSlipModalOpen(true); }}
                            className="w-12 h-12 rounded-lg border border-[#ececec] overflow-hidden cursor-pointer hover:border-gold transition-all shadow-sm"
                            title="Click to view payment slip"
                          >
                            <img 
                              src={resolveUploadUrl(o.paymentSlip)} 
                              alt="Payment Proof" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {toStatusLabel(o.status) === "Pending" && getSelectedStatus(o.dbId, o.status) !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={async () => {
                              setIsApprovingOrder((prev) => ({ ...prev, [o.dbId]: true }));
                              try {
                                const nextCode = STATUS_TO_CODE["Confirmed"];
                                const res = await api.post("/admin/orders/update-status", {
                                  orderId: o.dbId,
                                  status: nextCode,
                                });

                                if (res.data?.success) {
                                  setOrders((prev) => prev.map((ord) => (ord.dbId === o.dbId ? { ...ord, status: "Confirmed" } : ord)));
                                  alert("Order Approved & Sent to NimbusPost!");
                                } else if (res.data?.reverted) {
                                  alert(res.data.message || "Order stayed in Pending due to Nimbus error.");
                                } else {
                                  alert(res.data.message || "Failed to update order status.");
                                }
                              } catch (err) {
                                alert(err.response?.data?.message || "Failed to approve order");
                              } finally {
                                setIsApprovingOrder((prev) => ({ ...prev, [o.dbId]: false }));
                              }
                            }}
                            disabled={isApprovingOrder[o.dbId]}
                            className="cursor-pointer bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center gap-1"
                          >
                            {isApprovingOrder[o.dbId] ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Processing...
                              </>
                            ) : (
                              "Approve"
                            )}
                          </button>
                        )}
                        <div className="flex flex-col gap-2">
                          <select
                            value={getSelectedStatus(o.dbId, o.status)}
                            onChange={(e) => onChangeDraftStatus(o.dbId, e.target.value)}
                            className="w-[150px] rounded-md border border-[#ececec] bg-white px-3 py-2 text-sm text-[#3b2a23] outline-none focus:border-brown"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input
                            type="text"
                            value={getSelectedShipmentId(o.dbId, o.shipmentId)}
                            onChange={(e) => onChangeDraftShipmentId(o.dbId, e.target.value)}
                            placeholder="Shipment ID"
                            className="w-[150px] rounded-md border border-[#ececec] bg-white px-3 py-2 text-xs text-[#3b2a23] outline-none focus:border-brown"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateOrder(o.dbId)}
                          disabled={!hasOrderDraftChanges(o) || isUpdatingOrder[o.dbId]}
                          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-brown px-3 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
                        >
                          {isUpdatingOrder[o.dbId] ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Wait...
                            </>
                          ) : (
                            "Update"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadInvoice(o)}
                          className="cursor-pointer w-10 h-10 rounded-md border border-brown text-brown hover:bg-gray-50 flex items-center justify-center transition-colors duration-150"
                        >
                          <FiDownload />
                        </button>
                        {o.shipmentId && (
                          <button
                            type="button"
                            onClick={() => handleTrackOrder(o.dbId)}
                            className="cursor-pointer w-10 h-10 rounded-md border border-brown text-brown hover:bg-gray-50 flex items-center justify-center transition-colors duration-150"
                            title="Track Order"
                          >
                            <FiTruck />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-[#ececec] flex items-center justify-end gap-6 bg-[#fffaf9]/30">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-10 h-10 rounded-xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform text-xl">‹</span>
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brown/30 mb-1">Orders Page</span>
              <div className="bg-brown text-white w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-brown/20 tracking-tighter">
                {safePage}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#7c6a5a] mt-1 opacity-60">of {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-10 h-10 rounded-xl border-2 border-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white group"
            >
              <span className="group-hover:translate-x-0.5 transition-transform text-xl">›</span>
            </button>
          </div>
        )}
      </section>

      {/* Tracking Modal */}
      {trackingInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setTrackingInfo(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-brown px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-white font-bold text-lg">Tracking Status</h3>
              <button onClick={() => setTrackingInfo(null)} className="text-white hover:text-white/80 text-2xl leading-none cursor-pointer">
                <FiX />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {trackingInfo.data?.tracking_data?.shipment_track?.[0] ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#fffaf9] rounded-lg border border-[#ececec]">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#7c6a5a]">Current Status</p>
                      <p className="text-lg font-bold text-[#3b2a23]">{trackingInfo.data.tracking_data.shipment_track[0].current_status}</p>
                    </div>
                    <FiTruck className="text-brown" size={24} />
                  </div>

                  <div className="space-y-4">
                    {trackingInfo.data.tracking_data.shipment_track_activities?.map((activity, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== trackingInfo.data.tracking_data.shipment_track_activities.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-[-16px] w-0.5 bg-[#ececec]" />
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 bg-white mt-1 z-10 ${i === 0 ? 'border-brown' : 'border-[#ececec]'}`} />
                        <div className="pb-4">
                          <p className="text-sm font-bold text-[#3b2a23]">{activity.activity}</p>
                          <p className="text-xs text-[#7c6a5a]">{activity.date} | {activity.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[#7c6a5a] font-medium text-center py-4">No tracking data available yet.</p>
              )}
            </div>

            <div className="border-t border-[#ececec] px-6 py-4 bg-gray-50 text-right">
              <button
                onClick={() => setTrackingInfo(null)}
                className="bg-brown text-white px-6 py-2 rounded-md font-bold text-sm hover:opacity-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Slip Modal */}
      {slipModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-brown px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="text-white font-bold text-lg">Payment Slip</h3>
              <button
                onClick={() => setSlipModalOpen(false)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                <FiX />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-gray-100">
              <img 
                src={resolveUploadUrl(slipUrl)} 
                alt="Payment Slip" 
                className="max-w-full h-auto rounded shadow-lg"
              />
            </div>
            <div className="p-4 border-t border-[#ececec] flex justify-end">
              <a 
                href={resolveUploadUrl(slipUrl)} 
                target="_blank" 
                rel="noreferrer"
                className="bg-brown text-white px-4 py-2 rounded-md text-xs font-bold hover:opacity-90"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
