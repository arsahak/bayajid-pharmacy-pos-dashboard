"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAllStores } from "@/app/actions/stores";
import { getAllProducts } from "@/app/actions/product";
import { adjustInventory } from "@/app/actions/inventory";
import {
  MdArrowBack,
  MdSearch,
  MdAdd,
  MdRemove,
  MdSave,
  MdLocationOn,
  MdSettings,
  MdClose,
  MdEvent,
  MdExpandMore,
  MdTune,
} from "react-icons/md";

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  stock: number;
  price: number;
  expiryDate?: string;
  minStock?: number;
  maxStock?: number;
  location?: {
    shelf?: string;
    bin?: string;
    aisle?: string;
  } | string;
}

const COMMON_REASONS = [
  "Damaged",
  "Expired",
  "Theft",
  "Lost",
  "Count Correction",
  "Return to Supplier",
  "Customer Return",
  "Stock Transfer",
  "Initial Stock",
  "Promotion",
];

/** Today as YYYY-MM-DD (local time), for the date picker's minimum */
const todayInputValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
};

// Skeleton Component
const AdjustmentsSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const skeletonBase = `animate-pulse rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Skeleton */}
      <div className={`rounded-2xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}>
        <div className={`h-6 w-48 mb-6 ${skeletonBase}`} />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className={`h-4 w-24 mb-2 ${skeletonBase}`} />
              <div className={`h-10 w-full rounded-xl ${skeletonBase}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Info Skeleton */}
      <div className="space-y-6">
        <div className={`rounded-2xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}>
          <div className={`h-6 w-32 mb-4 ${skeletonBase}`} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className={`h-4 w-24 ${skeletonBase}`} />
                <div className={`h-3 w-full ${skeletonBase}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StockAdjustments = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  // "More options": empty = keep the product's current min/max stock
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const searchProducts = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setProducts([]);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await getAllProducts({ search: searchQuery, limit: 10 });
      if (result.success && result.data?.products) {
        setProducts(result.data.products);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchStores();
  }, []);

  // Auto-search with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setProducts([]);
    }
  }, [searchQuery, searchProducts]);

  const fetchStores = async () => {
    try {
      const result = await getAllStores({});
      if (result.success && result.data?.stores) {
        setStores(result.data.stores);
        if (result.data.stores.length > 0) {
          setSelectedStore(result.data.stores[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProducts([]);
    setSearchQuery("");

    // Set location from product.location.shelf if available
    let shelfValue = "";
    if (product.location) {
      if (typeof product.location === "string") {
        try {
          const loc = JSON.parse(product.location);
          shelfValue = loc.shelf || "";
        } catch {
          shelfValue = product.location;
        }
      } else if (typeof product.location === "object") {
        shelfValue = product.location.shelf || "";
      }
    }
    setLocation(shelfValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !selectedStore || quantity === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    if (adjustmentType === "add" && expiryDate && expiryDate < todayInputValue()) {
      toast.error("Expiry date cannot be in the past");
      return;
    }

    setLoading(true);
    try {
      const adjustmentQty = adjustmentType === "add" ? quantity : -quantity;

      const formData = new FormData();
      formData.append("productId", selectedProduct._id);
      formData.append("storeId", selectedStore);
      formData.append("adjustment", adjustmentQty.toString());
      formData.append("reason", reason);
      formData.append("location", location);
      // Expiry only when adding stock; it updates the product's expiry date
      if (adjustmentType === "add" && expiryDate) formData.append("expiryDate", expiryDate);
      // Only change min/max stock when the user filled them in
      if (minStock.trim() !== "") formData.append("minStock", minStock);
      if (maxStock.trim() !== "") formData.append("maxStock", maxStock);

      const result = await adjustInventory(formData);

      if (result.success) {
        toast.success(result.message || `Stock ${adjustmentType === "add" ? "added" : "removed"} successfully!`);

        // Reset form
        setSelectedProduct(null);
        setQuantity(0);
        setReason("");
        setLocation("");
        setExpiryDate("");
        setMinStock("");
        setMaxStock("");
        setShowMoreOptions(false);
      } else {
        toast.error(result.error || "Failed to adjust stock");
      }
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      toast.error(error?.message || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? "text-gray-300" : "text-gray-700"
  }`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border-2 transition-colors ${
    isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 hover:border-gray-500"
      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`;

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 font-sans ${
        isDarkMode ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-gray-900"
      }`}
    >
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 mb-4 transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MdArrowBack className="text-xl" />
            Back to Inventory
          </button>
          <h1
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Stock Adjustments
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Manually adjust inventory levels
          </p>
        </div>

        {initialLoading ? (
          <AdjustmentsSkeleton isDarkMode={isDarkMode} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Adjustment Form */}
            <div
              className={`rounded-2xl border p-6 shadow-xl ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
            >
              <h2
                className={`text-xl font-bold mb-6 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Create Adjustment
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Adjustment Type */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("add")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                      adjustmentType === "add"
                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30"
                        : isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <MdAdd className="text-xl" />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("remove")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                      adjustmentType === "remove"
                        ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30"
                        : isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <MdRemove className="text-xl" />
                    Remove Stock
                  </button>
                </div>

                {/* Store Selection */}
                <div className="mb-4">
                  <label className={labelClass}>Store *</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store._id} value={store._id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Search */}
                <div className="mb-4">
                  <label className={labelClass}>Search Product *</label>
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="text"
                      placeholder="Search by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchProducts())}
                      className={`${inputClass} pl-10`}
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {products.length > 0 && (
                    <div
                      className={`mt-2 border-2 rounded-xl overflow-hidden shadow-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {products.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            isDarkMode ? "hover:bg-gray-600" : "hover:bg-indigo-50"
                          }`}
                        >
                          <p
                            className={`font-semibold ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {product.sku || "N/A"} | Current Stock: {product.stock || 0}
                            {formatDate(product.expiryDate) && ` | Exp: ${formatDate(product.expiryDate)}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Product Display */}
                {selectedProduct && (
                  <div
                    className={`p-4 rounded-xl mb-4 border-2 ${
                      isDarkMode
                        ? "bg-indigo-900/20 border-indigo-600/50"
                        : "bg-indigo-50 border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
                          Selected Product
                        </p>
                        <p
                          className={`font-bold ${
                            isDarkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {selectedProduct.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {selectedProduct.sku || "N/A"} | Current Stock: {selectedProduct.stock || 0} | Expiry:{" "}
                          {formatDate(selectedProduct.expiryDate) || "N/A"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                      >
                        <MdClose size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity | Expiry (add only) | Location */}
                <div
                  className={`grid grid-cols-1 gap-3 mb-4 ${
                    adjustmentType === "add" ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  }`}
                >
                  <div>
                    <label className={labelClass}>Quantity *</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.abs(parseInt(e.target.value) || 0))}
                      min="0"
                      required
                      className={inputClass}
                    />
                  </div>

                  {adjustmentType === "add" && (
                    <div>
                      <label className={labelClass}>Expiry Date</label>
                      <div className="relative">
                        <MdEvent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
                        <input
                          type="date"
                          value={expiryDate}
                          min={todayInputValue()}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Location</label>
                    <div className="relative">
                      <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                      <input
                        type="text"
                        placeholder="e.g., Shelf A1"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                {adjustmentType === "add" && (
                  <p className={`-mt-2 mb-4 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Expiry date is optional. If set, it replaces the product&apos;s current expiry date.
                  </p>
                )}

                {/* More options */}
                <div
                  className={`mb-6 rounded-xl border-2 ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions((v) => !v)}
                    aria-expanded={showMoreOptions}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MdTune className="text-lg text-indigo-500" />
                      More options
                      <span className={`font-normal ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        (Min/Max stock, Reason)
                      </span>
                    </span>
                    <MdExpandMore
                      className={`text-xl transition-transform ${showMoreOptions ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showMoreOptions && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Min/Max Stock */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Min Stock</label>
                          <input
                            type="number"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            min="0"
                            placeholder={
                              selectedProduct?.minStock !== undefined
                                ? `Current: ${selectedProduct.minStock}`
                                : "Keep current"
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Max Stock</label>
                          <input
                            type="number"
                            value={maxStock}
                            onChange={(e) => setMaxStock(e.target.value)}
                            min="0"
                            placeholder={
                              selectedProduct?.maxStock !== undefined
                                ? `Current: ${selectedProduct.maxStock}`
                                : "Keep current"
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className={labelClass}>Reason for Adjustment</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g., Damaged goods, Theft, Count correction, Returned items"
                          rows={2}
                          className={inputClass}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {COMMON_REASONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setReason(r)}
                              className={`px-2.5 py-1 rounded-lg text-xs border font-medium transition-all ${
                                reason === r
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : isDarkMode
                                  ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !selectedProduct}
                  className={`w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    loading || !selectedProduct
                      ? "bg-gray-400 cursor-not-allowed"
                      : adjustmentType === "add"
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/30"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/30"
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <MdSave />
                      {adjustmentType === "add" ? "Save · Add Stock" : "Save · Remove Stock"}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Information Panel */}
            <div className="space-y-6">
              {/* Quick Guide */}
              <div
                className={`rounded-2xl border p-6 shadow-xl ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  <MdSettings className="text-indigo-500" />
                  Quick Guide
                </h3>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                      Add Stock
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Use when receiving new inventory, returns, or corrections for undercount.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                      Remove Stock
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      Use for damaged items, theft, spoilage, or corrections for overcount.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      Expiry Date
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-500">
                      Only when adding stock. The date you enter becomes the product&apos;s expiry date.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                      More options
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">
                      Min/Max stock levels and the reason. Leave Min/Max empty to keep the current values.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustments;
