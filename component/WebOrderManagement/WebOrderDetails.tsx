"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { getWebOrderById, confirmWebOrder, cancelWebOrder, updateWebOrder } from "@/app/actions/webOrders";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/component/ProtectedRoute";
import {
  MdArrowBack,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdLocalShipping,
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdCalendarToday,
  MdReceiptLong,
} from "react-icons/md";

interface WebOrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface WebOrder {
  _id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: WebOrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  notes?: string;
  saleId?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

const STATUS_FLOW: WebOrder["status"][] = ["pending", "confirmed", "processing", "completed"];

export default function WebOrderDetails({ orderId }: { orderId: string }) {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [order, setOrder] = useState<WebOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const result = await getWebOrderById(orderId);
    if (result.success) {
      setOrder(result.data);
    } else {
      toast.error(result.error || "Failed to load order");
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleConfirm = async () => {
    if (!order) return;
    if (!confirm(`Confirm order ${order.orderNo}? This will deduct stock and create a sale record.`)) return;
    setActioning(true);
    const result = await confirmWebOrder(order._id);
    setActioning(false);
    if (result.success) {
      toast.success(result.message || "Order confirmed");
      fetchOrder();
    } else {
      toast.error(result.error || "Failed to confirm order");
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm(`Cancel order ${order.orderNo}? If it was already confirmed, stock will be restored.`)) return;
    setActioning(true);
    const result = await cancelWebOrder(order._id);
    setActioning(false);
    if (result.success) {
      toast.success(result.message || "Order cancelled");
      fetchOrder();
    } else {
      toast.error(result.error || "Failed to cancel order");
    }
  };

  const handleMoveToNextStatus = async (nextStatus: "processing" | "completed") => {
    if (!order) return;
    setActioning(true);
    const result = await updateWebOrder(order._id, { status: nextStatus });
    setActioning(false);
    if (result.success) {
      toast.success(`Order marked as ${nextStatus}`);
      fetchOrder();
    } else {
      toast.error(result.error || "Failed to update order");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <MdSchedule />;
      case "confirmed":
      case "processing":
        return <MdLocalShipping />;
      case "completed":
        return <MdCheckCircle />;
      case "cancelled":
        return <MdCancel />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-4xl mx-auto animate-pulse h-96 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Order not found</p>
        </div>
      </div>
    );
  }

  const cardClass = `rounded-2xl shadow-sm border p-6 ${
    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
  }`;

  return (
    <ProtectedRoute requiredPermission="canViewOrders">
      <div className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/website-orders")}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <MdArrowBack size={22} />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {order.orderNo}
                </h1>
                <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <MdCalendarToday size={14} />
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              {order.status.toUpperCase()}
            </span>
          </div>

          {/* Action buttons */}
          <div className={cardClass}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              {order.status === "pending" && (
                <>
                  <button
                    onClick={handleConfirm}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdCheckCircle size={18} />
                    Confirm Order
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdCancel size={18} />
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === "confirmed" && (
                <>
                  <button
                    onClick={() => handleMoveToNextStatus("processing")}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdLocalShipping size={18} />
                    Mark as Processing
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdCancel size={18} />
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === "processing" && (
                <>
                  <button
                    onClick={() => handleMoveToNextStatus("completed")}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdCheckCircle size={18} />
                    Mark as Completed
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium disabled:opacity-50 transition-colors"
                  >
                    <MdCancel size={18} />
                    Cancel Order
                  </button>
                </>
              )}
              {["completed", "cancelled"].includes(order.status) && (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No further actions available for a {order.status} order.
                </p>
              )}
            </div>
            {order.saleId && (
              <p className={`mt-3 text-xs flex items-center gap-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <MdReceiptLong size={14} />
                Linked sale created on confirmation (stock deducted, payment marked due)
              </p>
            )}
          </div>

          {/* Customer info */}
          <div className={cardClass}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Customer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MdPerson className="text-gray-400" />
                <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdPhone className="text-gray-400" />
                <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-1 col-span-1">
                <MdLocationOn className="text-gray-400 shrink-0" />
                <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>{order.customerAddress}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={cardClass}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Items
            </h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between py-2 ${
                    i !== order.items.length - 1 ? (isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100") : ""
                  }`}
                >
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ৳{item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                    ৳{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-gray-700 space-y-1">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Subtotal</span>
                <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>৳{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Discount</span>
                  <span className="text-red-500">-৳{order.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>Total</span>
                <span className={isDarkMode ? "text-green-400" : "text-green-600"}>৳{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
