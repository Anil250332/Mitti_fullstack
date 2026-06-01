import React, { useEffect, useMemo, useState } from "react";
import {
  FiMenu, FiX, FiHome, FiBox, FiPlus, FiGrid, FiTag, FiBookmark, FiUsers, FiShoppingCart, FiSettings, FiLogOut, FiChevronDown, FiChevronRight, FiList, FiRefreshCcw, FiMail, FiShoppingBag, FiMessageSquare, FiPercent, FiMonitor
} from "react-icons/fi";
import { Link, Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { fetchAdminData } from "../../store/slices/adminSlice";
import { logout, fetchAdminMe } from "../../store/slices/authSlice";


export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { categories } = useSelector(state => state.admin);
  const { user, permissions, loading: authLoading } = useSelector(state => state.auth);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(fetchAdminMe());
    }
  }, [dispatch, user]);

  useEffect(() => {
    dispatch(fetchAdminData());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/admin-login");
    }
  }, [navigate]);

  const onLogout = () => {
    dispatch(logout());
    navigate("/admin-login");
  };

  const [productsOpen, setProductsOpen] = useState(
    location.pathname.includes("/admin/products") ||
    location.pathname.includes("/admin/add-product") ||
    location.pathname.includes("/admin/restore-products") ||
    location.pathname.includes("/admin/tags")
  );

  const [categoriesOpen, setCategoriesOpen] = useState(
    location.pathname.includes("/admin/categories") ||
    location.pathname.includes("/admin/subcategories")
  );

  // Create a map of permissions for easy lookup
  const permissionMap = useMemo(() => {
    const map = {};
    if (Array.isArray(permissions)) {
      permissions.forEach(p => {
        if (typeof p === 'string') {
          map[p] = true;
        } else if (p?.pageKey) {
          map[p.pageKey] = Boolean(p.canView);
        }
      });
    }
    return map;
  }, [permissions]);

  const allSections = useMemo(
    () => [
      { key: "home", label: "Dashboard", icon: <FiHome />, path: "/admin" },
      { key: "orders", label: "Orders", icon: <FiShoppingCart />, path: "/admin/orders" },
      { key: "products", label: "Products", icon: <FiBox />, path: "/admin/products" },
      { key: "categories", label: "Category", icon: <FiTag />, path: "/admin/categories" },
      { key: "sliders", label: "Sliders", icon: <FiMonitor />, path: "/admin/sliders" },
      { key: "tags", label: "Tags", icon: <FiTag />, path: "/admin/tags" },
      { key: "messages", label: "Messages", icon: <FiMail />, path: "/admin/messages" },
      { key: "coupons", label: "Coupons", icon: <FiTag />, path: "/admin/coupons" },
      { key: "users", label: "Users", icon: <FiUsers />, path: "/admin/users" },
      { key: "reviews", label: "Reviews", icon: <FiMessageSquare />, path: "/admin/reviews" },
      { key: "qr", label: "Payment QR", icon: <FiMonitor />, path: "/admin/qr-update" },
      { key: "settings", label: "Settings", icon: <FiSettings />, path: "/admin/settings" },
    ],
    []
  );

  // Filter sections based on permissions
  const sections = useMemo(() => {
    if (!user) return [];
    return allSections.filter(sec => {
      // If super admin (isAdmin is true) or has specific permission
      return user.isAdmin === true || permissionMap[sec.key] === true;
    });
  }, [allSections, permissionMap, user]);

  // Determine if the current route is allowed
  const isRouteAllowed = useMemo(() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    if (location.pathname === "/admin" || location.pathname === "/admin/") return permissionMap["home"] === true;

    // Check which section matches the current path
    const activeSection = allSections.find(sec => sec.path !== "/admin" && location.pathname.startsWith(sec.path));
    if (activeSection) {
      return permissionMap[activeSection.key] === true;
    }

    // Special case for sub-routes of products
    if (location.pathname.includes("/admin/add-product") ||
      location.pathname.includes("/admin/restore-products")) {
      return permissionMap["products"] === true;
    }

    if (location.pathname.includes("/admin/subcategories")) {
      return permissionMap["categories"] === true;
    }

    return true; // Allow other routes if not explicitly mapped
  }, [user, location.pathname, permissionMap, allSections]);

  // --- EARLY RETURNS (MUST BE AFTER ALL HOOKS) ---

  // 1. Handle loading state
  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brown"></div>
      </div>
    );
  }

  // 2. If not admin, show 404 or Loader if token is pending
  if (!user || user.role !== 'admin') {
    const token = localStorage.getItem('token');
    // If we have a token but user is null, it means we are still fetching or fetch just completed/failed
    if (token && !user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brown"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-9xl font-black text-brown/10 select-none">404</h1>
        <p className="text-xl font-bold text-brown -mt-8">Unauthorized Access</p>
        <p className="text-sm text-brown/60 mt-2 mb-8">This page doesn't exist or you don't have permission.</p>
        <Link to="/" className="bg-brown text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg active:scale-95">
          Go Home
        </Link>
      </div>
    );
  }


  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="bg-[#5C3A2E] z-50 md:sticky top-0 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-xl lg:ml-20 font-bold tracking-wide">Admin Panel</h1>
      </div>
      <div className="max-w-[1600px] mx-auto mt-10 px-4">
        <div className="flex flex-col md:flex-row gap-8 min-w-0">
          {/* Sidebar */}
          <aside
            data-lenis-prevent
            className="w-full md:w-64 bg-white rounded-xl shadow-sm p-4 border border-[#ececec] flex flex-col gap-1 mb-6 md:mb-0 md:sticky md:top-24 h-fit max-h-[70vh] md:max-h-[calc(100vh-110px)] overflow-y-auto admin-sidebar-scroll"
          >
            {/* 1. Sections loop */}
            {sections.map((sec) => {
              if (sec.key !== "products" && sec.key !== "categories") {
                return (
                  <NavLink
                    key={sec.key}
                    to={sec.path}
                    end={sec.key === "home"}
                    className={({ isActive }) =>
                      `flex items-center gap-2 cursor-pointer px-4 py-3 rounded font-semibold text-sm w-full md:mb-2 transition-colors duration-200
                      ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                    }
                  >
                    <span className="text-lg">{sec.icon}</span> {sec.label}
                  </NavLink>
                );
              }

              if (sec.key === "products") {
                const isProductsRoute = location.pathname.includes('/admin/products') ||
                  location.pathname.includes('/admin/add-product') ||
                  location.pathname.includes('/admin/restore-products');

                return (
                  <div key={sec.key} className="w-full md:mb-2 text-[#3b2a23]">
                    <button
                      className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded font-semibold text-sm w-full transition-colors duration-200
                        ${isProductsRoute ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`}
                      onClick={() => setProductsOpen((prev) => !prev)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{sec.icon}</span>
                        {sec.label}
                      </span>
                      <span className="text-lg">{productsOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
                    </button>

                    {productsOpen && (
                      <div className="mt-2 flex flex-col gap-2">

                        <NavLink
                          to="/admin/products"
                          className={({ isActive }) =>
                            `flex items-center gap-2 cursor-pointer px-4 py-2 rounded font-semibold text-sm w-full transition-colors duration-200
                            ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                          }
                        >
                          <span className="text-base">
                            <FiList />
                          </span>
                          Product List
                        </NavLink>

                        <NavLink
                          to="/admin/add-product"
                          className={({ isActive }) =>
                            `flex items-center gap-2 cursor-pointer px-4 py-2 rounded font-semibold text-sm w-full transition-colors duration-200
                            ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                          }
                        >
                          <span className="text-base">
                            <FiPlus />
                          </span>
                          Add New Product
                        </NavLink>

                        <NavLink
                          to="/admin/restore-products"
                          className={({ isActive }) =>
                            `flex items-center gap-2 cursor-pointer px-4 py-2 rounded font-semibold text-sm w-full transition-colors duration-200
                            ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                          }
                        >
                          <span className="text-base">
                            <FiRefreshCcw />
                          </span>
                          Restore Product List
                        </NavLink>
                      </div>
                    )}
                  </div>
                );
              }

              if (sec.key === "categories") {
                const isCategoriesRoute = location.pathname.includes('/admin/categories') ||
                  location.pathname.includes('/admin/subcategories');
                return (
                  <div key="categories-dropdown" className="w-full md:mb-2 text-[#3b2a23]">
                    <button
                      className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded font-semibold text-sm w-full transition-colors duration-200
                        ${isCategoriesRoute ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`}
                      onClick={() => setCategoriesOpen((prev) => !prev)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{sec.icon}</span>
                        {sec.label}
                      </span>
                      <span className="text-lg">{categoriesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
                    </button>

                    {categoriesOpen && (
                      <div className="mt-2 flex flex-col gap-2">
                        <NavLink
                          to="/admin/categories"
                          className={({ isActive }) =>
                            `flex items-center gap-2 cursor-pointer px-4 py-2 rounded font-semibold text-sm w-full transition-colors duration-200
                            ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                          }
                        >
                          <span className="text-base"><FiList /></span>
                          Category
                        </NavLink>

                        <NavLink
                          to="/admin/subcategories"
                          className={({ isActive }) =>
                            `flex items-center gap-2 cursor-pointer px-4 py-2 rounded font-semibold text-sm w-full transition-colors duration-200
                            ${isActive ? "bg-[#5C3A2E] text-white" : "bg-gray-50 text-[#3b2a23] hover:bg-gray-100"}`
                          }
                        >
                          <span className="text-base"><FiTag /></span>
                          Sub Category
                        </NavLink>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}


            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded font-semibold text-sm w-full md:mb-2 transition-colors duration-200 bg-red-50 text-red-600 hover:bg-red-100 mt-auto"
            >
              <span className="text-lg"><FiLogOut /></span> Logout
            </button>
          </aside>
          {/* Content */}
          <main className="flex-1 min-w-0 bg-white rounded-lg shadow p-6 border border-[#ececec] min-h-80 flex flex-col">
            {isRouteAllowed ? (
              <Outlet />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <FiX className="text-red-500 text-6xl mb-4" />
                <h4 className="text-2xl font-black text-brown uppercase tracking-tighter">Permission Denied</h4>
                <p className="text-brown/60 font-bold text-sm max-w-xs mt-2">
                  You do not have administrative clearance to access this module.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
