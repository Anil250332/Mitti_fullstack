import React, { useEffect, useMemo, useState } from "react";
import { FiDownload, FiSearch } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../store/slices/adminSlice";
import toast from "react-hot-toast";


function toCsv(rows) {
  const escape = (value) => {
    const str = String(value ?? "");
    if (/[\n\r,\"]/g.test(str)) return `"${str.replace(/\"/g, '""')}"`;
    return str;
  };

  const headers = ["SL", "Name", "Email", "Phone", "Role", "Orders"];
  const lines = [headers.map(escape).join(",")];
  rows.forEach((u, idx) => {
    lines.push([idx + 1, u.name, u.email, u.phone, u.role, u.orders].map(escape).join(","));
  });
  return lines.join("\n");
}

export default function DashboardUsers() {
  const dispatch = useDispatch();
  const { users: reduxUsers, pagination: reduxPagination, loading } = useSelector((state) => state.admin);
  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchUsers({ page, limit: pageSize, search: query.trim() }));
  }, [dispatch, page, pageSize, query]);

  const users = useMemo(() => {
    return (reduxUsers || []).map((u) => ({
      id: u.id,
      name: String(u.name ?? "").trim() || "—",
      email: String(u.email ?? "").trim() || "—",
      phone: String(u.phone ?? u.mobile ?? "").trim() || "—",
      orders: Number(u.orders ?? 0) || 0,
      role: String(u.role ?? "").trim() || ((Number(u.orders ?? 0) || 0) > 0 ? "Customer" : "User"),
    }));
  }, [reduxUsers]);

  const pagination = useMemo(() => {
    if (!reduxPagination) return { totalRecords: 0, currentPage: page, totalPages: 1, limit: pageSize };
    return {
      totalRecords: Number(reduxPagination.totalRecords ?? 0) || 0,
      currentPage: Number(reduxPagination.currentPage ?? page) || page,
      totalPages: Number(reduxPagination.totalPages ?? 1) || 1,
      limit: Number(reduxPagination.limit ?? pageSize) || pageSize,
    };
  }, [reduxPagination, page]);

  const totalPages = Math.max(1, Number(pagination?.totalPages ?? 1) || 1);
  const safePage = Math.min(page, totalPages);
  const pageItems = users;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const onExport = () => {
    const csv = toCsv(pageItems);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `users-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  return (
    <div className="w-full">
      <section className="bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">Users List</h3>
            <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
              {Number(pagination?.totalRecords ?? users.length) || 0}
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
                  placeholder="Search users..."
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
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-[#5C3A2E] text-[#5C3A2E] bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <FiDownload /> Export
            </button>

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf9] text-[#3b2a23]">
              <tr>
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={toggleSelectAll}
                    className="cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">SL</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Name</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Email</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Phone</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Role</th>
                <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Orders</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#7c6a5a]">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#7c6a5a]">
                    {error}
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#7c6a5a]">
                    No users found.
                  </td>
                </tr>
              ) : (
                pageItems.map((u, idx) => (
                  <tr
                    key={u.id}
                    className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-5 text-[#3b2a23]">{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-5 text-[#3b2a23]">
                      <div className="font-semibold">{u.name}</div>
                    </td>
                    <td className="px-6 py-5 text-[#7c6a5a] font-semibold whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-5 text-[#7c6a5a] font-semibold whitespace-nowrap">{u.phone}</td>
                    <td className="px-6 py-5 text-[#7c6a5a] font-semibold whitespace-nowrap">{u.role}</td>
                    <td className="px-6 py-5 text-[#3b2a23] font-semibold whitespace-nowrap">{Number(u.orders ?? 0)}</td>
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
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brown/30 mb-1">Users Page</span>
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
    </div>
  );
}
