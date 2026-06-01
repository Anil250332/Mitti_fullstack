import React, { useEffect, useMemo, useState } from "react";
import {
  FiTrendingUp,
  FiFileText,
  FiHome,
  FiBox,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiArchive,
  FiAlertCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../store/slices/adminDashboardSlice";


export default function DashboardHome() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [range, setRange] = useState("year");

  const {
    counts,
    statusCounts,
    topProducts: bestSellers,
    topCustomers,
    chartData,
    loading: loadingStats,
    error: statsError
  } = useSelector((state) => state.adminDashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats(range));
  }, [dispatch, range]);

  const loadingCounts = loadingStats;
  const loadingStatusCounts = loadingStats;
  const loadingBestSellers = loadingStats;
  const loadingTopCustomers = loadingStats;
  const countsError = statsError;
  const bestSellersError = statsError;
  const topCustomersError = statsError;

  const summaryCards = useMemo(
    () => [
      { title: "Total order", value: counts.totalOrders, icon: <FiFileText /> },
      { title: "Total categories", value: counts.totalCategories, icon: <FiHome /> },
      { title: "Total Products", value: counts.totalProducts, icon: <FiBox /> },
      { title: "Total Customers", value: counts.totalCustomers, icon: <FiUsers /> },
    ],
    [counts]
  );

  const statusCards = useMemo(
    () => [
      { title: "Pending", value: statusCounts.pending, icon: <FiClock />, tone: "neutral" },
      { title: "Confirmed", value: statusCounts.confirmed, icon: <FiCheckCircle />, tone: "ok" },
      { title: "Packaging", value: statusCounts.packaging, icon: <FiPackage />, tone: "neutral" },
      { title: "Out for delivery", value: statusCounts.outForDelivery, icon: <FiTruck />, tone: "neutral" },
      { title: "Partially delivered", value: statusCounts.partiallyDelivered, icon: <FiTruck />, tone: "neutral" },
      { title: "Delivered", value: statusCounts.delivered, icon: <FiArchive />, tone: "ok" },
    ],
    [statusCounts]
  );

  const toneClasses = {
    neutral: "bg-gray-50",
    ok: "bg-gray-50",
    bad: "bg-gray-50",
  };

  const orderStats = useMemo(() => {
    if (chartData) {
      return {
        labels: chartData.labels,
        inhouse: chartData.values,
        maxY: chartData.maxY
      };
    }

    // Default Fallback (Loading state or initial)
    return {
      labels: [],
      inhouse: [],
      maxY: 100,
    };
  }, [chartData]);

  const userOverview = useMemo(() => {
    const users = Number(counts.totalCustomers ?? 0) || 0;

    return {
      total: users,
      items: [
        { label: `Total Users (${users})`, value: users, color: "#5C3A2E" },
      ],
      gradient: `conic-gradient(#5C3A2E 0% 100%)`,
    };
  }, [counts.totalCustomers]);


  const renderLineChart = ({ labels, inhouse, maxY }) => {
    const width = 720;
    const height = 260;
    const padLeft = 85; // Increased padding for 100Cr+ labels
    const padRight = 16;
    const padTop = 12;
    const padBottom = 42;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const formatCurrencyCompact = (val) => {
      if (val === 0) return "₹0";
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)}Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
      return `₹${val}`;
    };

    const xAt = (index) => {
      if (labels.length <= 1) return padLeft;
      return padLeft + (index / (labels.length - 1)) * chartW;
    };
    const yAt = (value) => {
      const clamped = Math.max(0, Math.min(maxY, value));
      const t = maxY === 0 ? 0 : clamped / maxY;
      return padTop + (1 - t) * chartH;
    };

    const pointsFor = (values) => values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");

    // Dynamic Y-Ticks
    const yTicks = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      yTicks.push(Math.round((maxY / steps) * i));
    }
    const xTicks = labels;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[280px]">
        {/* Grid */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padLeft}
              y1={yAt(t)}
              x2={width - padRight}
              y2={yAt(t)}
              stroke="#ececec"
              strokeDasharray="6 6"
            />
            <text x={padLeft - 10} y={yAt(t) + 4} textAnchor="end" fontSize="12" fill="#7c6a5a">
              {formatCurrencyCompact(t)}
            </text>
          </g>
        ))}

        {xTicks.map((label, i) => (
          <g key={label}>
            <line
              x1={xAt(i)}
              y1={padTop}
              x2={xAt(i)}
              y2={padTop + chartH}
              stroke="#ececec"
              strokeDasharray="6 6"
            />
            <text x={xAt(i)} y={padTop + chartH + 24} textAnchor="middle" fontSize="12" fill="#3b2a23">
              {label}
            </text>
          </g>
        ))}

        {/* Baseline */}
        <line x1={padLeft} y1={padTop + chartH} x2={width - padRight} y2={padTop + chartH} stroke="#ececec" />

        {/* Lines */}
        <polyline
          points={pointsFor(inhouse)}
          fill="none"
          stroke="#5C3A2E"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {inhouse.map((v, i) => (
          <circle key={`i-${i}`} cx={xAt(i)} cy={yAt(v)} r="3" fill="#5C3A2E" />
        ))}
      </svg>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#3b2a23]">Welcome Admin</h2>
        <p className="text-[#7c6a5a] mt-1">Monitor your business analytics and statistics.</p>
      </div>

      <section className="bg-white rounded-lg shadow p-6 border border-[#ececec]">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-[#5C3A2E] text-xl">
              <FiTrendingUp />
            </span>
            <h3 className="text-base font-bold text-[#3b2a23]">Business Analytics</h3>
          </div>

        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {countsError ? (
            <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-[#f2d5d5] bg-[#fff6f6] px-4 py-3 text-sm text-[#7c6a5a] flex items-center gap-2">
              <FiAlertCircle className="text-[#c0392b]" /> {countsError}
            </div>
          ) : null}
          {summaryCards.map((card) => {
            const routeMap = {
              "Total order": "/admin/orders",
              "Total categories": "/admin/categories",
              "Total Products": "/admin/products",
              "Total Customers": "/admin/users",
            };
            const targetRoute = routeMap[card.title];

            return (
              <div
                key={card.title}
                onClick={targetRoute ? () => navigate(targetRoute) : undefined}
                className={`bg-white rounded-lg border border-[#ececec] shadow p-5 flex items-center justify-between ${targetRoute ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#3b2a23]">{card.title}</div>
                  <div className="text-2xl font-bold text-[#3b2a23] mt-2">
                    {loadingCounts ? "…" : card.value}
                  </div>
                </div>
                <div className="text-2xl text-[#5C3A2E]">{card.icon}</div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {statusCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate("/admin/orders")}
              className={`rounded-lg border border-[#ececec] ${toneClasses[card.tone]} px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[#5C3A2E] text-lg">{card.icon}</span>
                <span className="font-semibold text-[#3b2a23] text-sm">{card.title}</span>
              </div>
              <span className="font-bold text-[#3b2a23]">{loadingStatusCounts ? "…" : card.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <section className="lg:col-span-2 bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[#5C3A2E] text-xl">
                <FiTrendingUp />
              </span>
              <h3 className="text-base font-bold text-[#3b2a23]">Revenue Statistics</h3>
            </div>

            <div className="bg-white border border-[#ececec] rounded-md p-1 flex items-center gap-1">
              {["year", "month", "week"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRange(k)}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors duration-150 ${range === k ? "bg-[#5C3A2E] text-white" : "text-[#3b2a23] hover:bg-gray-50"
                    }`}
                >
                  {k === "year" ? "This Year" : k === "month" ? "This Month" : "This Week"}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="flex items-center justify-center gap-8 text-sm text-[#3b2a23] mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#5C3A2E" }} />
                <span>Total Revenue</span>
              </div>
            </div>
          </div>

          <div className="px-2 pb-4">{renderLineChart(orderStats)}</div>
        </section>

        <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ececec]">
            <h3 className="text-base font-bold text-[#3b2a23]">User Overview</h3>
          </div>

          <div className="p-6 flex flex-col items-center">
            <div
              className="w-60 h-60 rounded-full flex items-center justify-center"
              style={{ background: userOverview.gradient }}
            >
              <div className="w-36 h-36 rounded-full bg-white border border-[#ececec] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-[#3b2a23]">{userOverview.total}</div>
                <div className="text-[#7c6a5a] text-sm mt-1">Total</div>
                <div className="text-[#7c6a5a] text-sm">Users</div>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              {userOverview.items.map((it) => (
                <div key={it.label} className="flex items-center gap-3 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: it.color }} />
                  <span className="font-semibold" style={{ color: it.color }}>
                    {it.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="flex flex-wrap justify-between items-center ">
        {/* Best Selling Products */}
        <section className="bg-white rounded-lg w-[48%] shadow border border-[#ececec] overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#3b2a23]">Best Selling Products</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              Top {bestSellers.length}
            </span>
          </div>

          {bestSellersError ? (
            <div className="px-6 py-4 text-sm text-[#7c6a5a] flex items-center gap-2">
              <FiAlertCircle className="text-[#c0392b]" /> {bestSellersError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[#3b2a23]">
                <tr>
                  <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Rank</th>
                  <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Product</th>
                  <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Total Orders</th>
                </tr>
              </thead>
              <tbody>
                {loadingBestSellers ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-[#7c6a5a]">
                      Loading...
                    </td>
                  </tr>
                ) : bestSellers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-[#7c6a5a]">
                      No data.
                    </td>
                  </tr>
                ) : (
                  bestSellers.map((p, idx) => (
                    <tr key={p.id || idx} className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gray-50 border border-[#ececec] font-bold text-[#3b2a23]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-bold text-[#3b2a23]">{p.name}</div>
                            <div className="text-xs text-[#7c6a5a]">Top selling</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-bold text-[#3b2a23]">{p.orders}</span>
                          <span className="text-xs font-semibold text-[#5C3A2E]">orders</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {/* Top Customers */}
        <section className="bg-white rounded-lg  w-[48%] shadow border border-[#ececec] overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#3b2a23]">Top Customers</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              Top {topCustomers.length}
            </span>
          </div>

          {topCustomersError ? (
            <div className="px-6 py-4 text-sm text-[#7c6a5a] flex items-center gap-2">
              <FiAlertCircle className="text-[#c0392b]" /> {topCustomersError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[#3b2a23]">
                <tr>
                  <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Rank</th>
                  <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Customer</th>
                  <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Total Orders</th>
                  <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {loadingTopCustomers ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[#7c6a5a]">
                      Loading...
                    </td>
                  </tr>
                ) : topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[#7c6a5a]">
                      No data.
                    </td>
                  </tr>
                ) : (
                  topCustomers.map((c, idx) => (
                    <tr key={c.id || idx} className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gray-50 border border-[#ececec] font-bold text-[#3b2a23]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">

                          <div>
                            <div className="font-bold text-[#3b2a23]">{c.name}</div>
                            <div className="text-xs text-[#7c6a5a]">{c.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-[#3b2a23]">{Number(c.orders).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-[#3b2a23]">
                          ₹{Number(c.spent).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
