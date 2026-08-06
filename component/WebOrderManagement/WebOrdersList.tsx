"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { getAllWebOrders, confirmWebOrder, cancelWebOrder } from "@/app/actions/webOrders";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/component/ProtectedRoute";
import {
  MdSearch,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdLocalShipping,
  MdCalendarToday,
  MdPerson,
  MdShoppingBag,
} from "react-icons/md";

interface WebOrder {
  _id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

const STATUS_OPTIONS = ["all", "pending", "confirmed", "processing", "completed", "cancelled"];

const WebOrdersList = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllWebOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (result.success && result.data) {
        setOrders(result.data.orders || []);
        if (result.data.pagination) {
          setPagination((prev) => ({ ...prev, ...result.data.pagination }));
        }
      } else {
        toast.error(result.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching web orders:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  useEffect(() => {
    if (mounted) fetchOrders();
  }, [fetchOrders, mounted]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleConfirm = async (id: string, orderNo: string) => {
    if (!confirm(`Confirm order ${orderNo}? This will deduct stock and create a sale record.`)) return;
    setActioningId(id);
    try {
      const result = await confirmWebOrder(id);
      if (result.success) {
        toast.success(result.message || "Order confirmed");
        fetchOrders();
      } else {
        toast.error(result.error || "Failed to confirm order");
      }
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (id: string, orderNo: string) => {
    if (!confirm(`Cancel order ${orderNo}? If it was already confirmed, stock will be restored.`)) return;
    setActioningId(id);
    try {
      const result = await cancelWebOrder(id);
      if (result.success) {
        toast.success(result.message || "Order cancelled");
        fetchOrders();
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    } finally {
      setActioningId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <MdSchedule className="text-amber-500" />;
      case "confirmed":
      case "processing":
        return <MdLocalShipping className="text-blue-500" />;
      case "completed":
        return <MdCheckCircle className="text-green-500" />;
      case "cancelled":
        return <MdCancel className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!mounted) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-[1920px] mx-auto animate-pulse h-96 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="canViewOrders">
      <div className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-[1920px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              Website Orders
            </h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Orders placed by customers on the pharmacy website
            </p>
          </div>

          {/* Filters */}
          <div
            className={`rounded-2xl shadow-sm border p-4 mb-6 flex flex-col sm:flex-row gap-3 ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
            }`}
          >
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by order number, customer name, or phone..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2.5 rounded-lg border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              Search
            </button>
          </div>

          {/* Table */}
          <div
            className={`rounded-2xl overflow-hidden shadow-xl border ${
              isDarkMode ? "bg-gray-800 border-gray-700 shadow-gray-900/20" : "bg-white border-gray-100 shadow-slate-200/50"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`text-left text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? "bg-gray-900/50 text-gray-400" : "bg-gray-50/80 text-gray-500"
                    }`}
                  >
                    <th className="px-6 py-4">Order No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No website orders found</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        className={`group transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30"}`}
                      >
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                            {order.orderNo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdCalendarToday className="text-gray-400" />
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdPerson className="text-gray-400" />
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{order.customerName}</span>
                          </div>
                          <span className="text-xs text-gray-500">{order.customerPhone}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <MdShoppingBag className="text-gray-400" />
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                              {order.items.length} item(s)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold text-lg ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                            ৳{order.total.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/website-orders/${order._id}`)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? "hover:bg-gray-600 text-gray-400 hover:text-blue-400"
                                  : "hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                              }`}
                              title="View"
                            >
                              <MdVisibility size={18} />
                            </button>
                            {order.status === "pending" && (
                              <button
                                onClick={() => handleConfirm(order._id, order.orderNo)}
                                disabled={actioningId === order._id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  isDarkMode
                                    ? "hover:bg-gray-600 text-gray-400 hover:text-green-400"
                                    : "hover:bg-green-50 text-gray-400 hover:text-green-600"
                                }`}
                                title="Confirm"
                              >
                                <MdCheckCircle size={18} />
                              </button>
                            )}
                            {!["completed", "cancelled"].includes(order.status) && (
                              <button
                                onClick={() => handleCancel(order._id, order.orderNo)}
                                disabled={actioningId === order._id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  isDarkMode
                                    ? "hover:bg-gray-600 text-gray-400 hover:text-red-400"
                                    : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                                }`}
                                title="Cancel"
                              >
                                <MdCancel size={18} />
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
            {pagination.totalPages > 1 && (
              <div
                className={`px-6 py-4 border-t flex items-center justify-between ${
                  isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-semibold">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-semibold">{pagination.total}</span> orders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default WebOrdersList;
