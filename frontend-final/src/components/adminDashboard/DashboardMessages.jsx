import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiTrash2, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

export default function DashboardMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const limit = 10;

  const fetchMessages = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/contact?page=${currentPage}&limit=${limit}`);
      if (res.data.success) {
        setMessages(res.data.data);
        setPagination(res.data.pagination || {});
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    setIsDeleting(id);
    try {
      await api.delete(`/contact/${id}`);
      // Refresh current page
      fetchMessages(page);
    } catch (error) {
      alert("Failed to delete message");
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchMessages(page);
  }, [page]);

  if (loading && messages.length === 0) return <div className="p-4">Loading messages...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#3b2a23]">Contact Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed">No messages found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white border border-[#ececec] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#5C3A2E]/10 flex items-center justify-center text-[#5C3A2E] font-bold">
                      {(msg.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3b2a23] text-sm">{msg.name}</h3>
                      <div className="text-xs text-gray-500">{msg.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      disabled={isDeleting === msg.id}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                      title="Delete Message"
                    >
                      {isDeleting === msg.id ? (
                        <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin block"></span>
                      ) : (
                        <FiTrash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {msg.phone && (
                  <div className="text-xs text-gray-500 mb-2 font-mono">
                    Phone: {msg.phone}
                  </div>
                )}

                <div className="bg-gray-50 border border-[#f0e6e0] p-3 rounded text-sm text-[#5a4a3a] leading-relaxed">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simplified Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end items-center gap-6 bg-white p-6 mt-6 border-t border-[#ececec] rounded-xl shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 border-2 border-brown/10 rounded-xl flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
          >
            <FiChevronLeft size={18} />
          </button>

          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brown/30 mb-1">Messages Page</span>
            <div className="bg-brown text-white w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-brown/20 tracking-tighter">
              {page}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#7c6a5a] mt-1 opacity-60">
              of {pagination.totalPages}
            </span>
          </div>

          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="w-10 h-10 border-2 border-brown/10 rounded-xl flex items-center justify-center text-brown hover:bg-brown hover:text-white disabled:opacity-30 transition-all duration-300 shadow-sm bg-white"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
