"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { useLanguage } from "@/lib/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { getWebOrderById, confirmWebOrder, cancelWebOrder, updateWebOrder } from "@/app/actions/webOrders";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/component/ProtectedRoute";
import WebOrderDetailsSkeleton from "./WebOrderDetailsSkeleton";
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

export default function WebOrderDetails({ orderId }: { orderId: string }) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key, language);
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

  // Which statuses can this order move to right now? Confirm/cancel go through
  // their own endpoints (stock + sale side effects) - the dropdown just routes
  // the pick to whichever handler is actually valid.
  const isValidTransition = (target: WebOrder["status"], current: WebOrder["status"]) => {
    switch (target) {
      case "confirmed":
        return current === "pending";
      case "processing":
        return current === "confirmed";
      case "completed":
        return current === "processing";
      case "cancelled":
        return !["completed", "cancelled"].includes(current);
      default:
        return false;
    }
  };

  const handleStatusChange = (target: WebOrder["status"]) => {
    if (!order || target === order.status) return;
    if (target === "confirmed") return handleConfirm();
    if (target === "cancelled") return handleCancel();
    if (target === "processing" || target === "completed") return handleMoveToNextStatus(target);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-amber-900/30 text-amber-400 border-amber-800"
          : "bg-amber-100 text-amber-700 border-amber-300";
      case "confirmed":
      case "processing":
        return isDarkMode
          ? "bg-blue-900/30 text-blue-400 border-blue-800"
          : "bg-blue-100 text-blue-700 border-blue-300";
      case "completed":
        return isDarkMode
          ? "bg-green-900/30 text-green-400 border-green-800"
          : "bg-green-100 text-green-700 border-green-300";
      case "cancelled":
        return isDarkMode
          ? "bg-red-900/30 text-red-400 border-red-800"
          : "bg-red-100 text-red-700 border-red-300";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("statusPending");
      case "confirmed":
        return t("statusConfirmed");
      case "processing":
        return t("statusProcessing");
      case "completed":
        return t("statusCompleted");
      case "cancelled":
        return t("statusCancelled");
      default:
        return status;
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
    return <WebOrderDetailsSkeleton isDarkMode={isDarkMode} />;
  }

  if (!order) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-950" : "bg-slate-50"}`}>
        <div className="max-w-[1920px] mx-auto text-center py-20">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{t("orderNotFound")}</p>
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
        <div className="max-w-[1920px] mx-auto space-y-6">
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
              {getStatusLabel(order.status).toUpperCase()}
            </span>
          </div>

          {/* Action buttons */}
          <div className={cardClass}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {t("changeStatus")}
            </h2>
            <select
              value={order.status}
              disabled={actioning || ["completed", "cancelled"].includes(order.status)}
              onChange={(e) => handleStatusChange(e.target.value as WebOrder["status"])}
              className={`w-full sm:w-64 px-4 py-2.5 rounded-lg border font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
            >
              <option value="pending" disabled={order.status !== "pending"}>
                {t("statusPending")}
              </option>
              <option value="confirmed" disabled={!isValidTransition("confirmed", order.status)}>
                {t("statusConfirmed")}
              </option>
              <option value="processing" disabled={!isValidTransition("processing", order.status)}>
                {t("statusProcessing")}
              </option>
              <option value="completed" disabled={!isValidTransition("completed", order.status)}>
                {t("statusCompleted")}
              </option>
              <option value="cancelled" disabled={!isValidTransition("cancelled", order.status)}>
                {t("statusCancelled")}
              </option>
            </select>
            {["completed", "cancelled"].includes(order.status) && (
              <p className={`mt-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {t("orderClosedNote")}
              </p>
            )}
            {order.saleId && (
              <p className={`mt-3 text-xs flex items-center gap-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <MdReceiptLong size={14} />
                {t("linkedSaleNote")}
              </p>
            )}
          </div>

          {/* Customer info */}
          <div className={cardClass}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {t("customer")}
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
              {t("items")}
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
            <div
              className={`mt-4 pt-4 border-t border-dashed space-y-1 ${
                isDarkMode ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{t("subtotal")}</span>
                <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>৳{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{t("discount")}</span>
                  <span className="text-red-500">-৳{order.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>{t("total")}</span>
                <span className={isDarkMode ? "text-green-400" : "text-green-600"}>৳{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
