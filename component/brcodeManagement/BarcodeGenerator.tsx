"use client";

import { generateBarcode } from "@/app/actions/barcode";
import { getAllProducts } from "@/app/actions/product";
import { printBarcode } from "@/lib/printUtils";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiBarcodeReader } from "react-icons/bi";
import { MdCheckCircle, MdClose, MdPrint, MdSearch } from "react-icons/md";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  unit?: string;
  barcode?: string;
}

const NA = "N/A";

// Show a value, or "N/A" when it is missing
const formatPrice = (price?: number) =>
  typeof price === "number" && !Number.isNaN(price) ? `৳${price.toFixed(2)}` : NA;
const formatQuantity = (stock?: number, unit?: string) =>
  typeof stock === "number" && !Number.isNaN(stock) ? `${stock}${unit ? ` ${unit}` : ""}` : NA;

interface BarcodeGeneratorProps {
  language: "en" | "bn";
  /** Reload the barcode list after a barcode is saved */
  onSaved?: () => void;
}

const SEARCH_LIMIT = 50;

export default function BarcodeGenerator({ language, onSaved }: BarcodeGeneratorProps) {
  const { isDarkMode } = useSidebar();
  // The product the user picked from the search results
  const [selectedProductObj, setSelectedProductObj] = useState<Product | null>(null);
  const selectedProduct = selectedProductObj?._id ?? "";
  const [generatedBarcode, setGeneratedBarcode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search the whole catalogue on the server (debounced) instead of a preloaded list,
  // so every product can be found no matter how many there are.
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || selectedProduct) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await getAllProducts({ search: term, limit: SEARCH_LIMIT, view: "pos" });
      if (cancelled) return;
      const found: Product[] = result.success
        ? (result.data?.products || []).map((p: Product) => ({
            _id: p._id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            stock: p.stock,
            unit: p.unit,
            barcode: p.barcode,
          }))
        : [];
      setSearchResults(found);
      setIsSearching(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedProduct]);

  // Pick (or clear) a product; shows its existing barcode if it already has one
  const selectProduct = (product: Product | null) => {
    setSelectedProductObj(product);
    setGeneratedBarcode(product?.barcode || "");
  };

  const isExistingBarcode = selectedProductObj?.barcode === generatedBarcode && !!generatedBarcode;

  // Generate a new barcode and save it to the selected product in one step
  const handleGenerate = async () => {
    if (!selectedProductObj) {
      toast.error(getTranslation("pleaseSelectProduct", language));
      return;
    }

    const hasBarcode = !!selectedProductObj.barcode;
    if (
      hasBarcode &&
      !confirm(
        `${selectedProductObj.name} already has barcode ${selectedProductObj.barcode}.\n` +
          "Replace it with a new one? Labels printed with the old barcode will stop scanning."
      )
    ) {
      return;
    }

    setIsGenerating(true);
    const result = await generateBarcode(selectedProductObj._id, hasBarcode);

    if (result.success) {
      const newBarcode: string = result.data.barcode;
      // The backend has already saved it on the product
      setSelectedProductObj((prev) => (prev ? { ...prev, barcode: newBarcode } : prev));
      setGeneratedBarcode(newBarcode);
      toast.success(
        hasBarcode
          ? `New barcode saved to ${selectedProductObj.name}`
          : getTranslation("barcodeSavedSuccess", language)
      );
      onSaved?.();
    } else {
      toast.error(result.error || getTranslation("failedToGenerateBarcode", language));
    }
    setIsGenerating(false);
  };

  const handlePrint = () => {
    if (selectedProductObj && generatedBarcode) {
      printBarcode(generatedBarcode, selectedProductObj.name, selectedProductObj.price ?? 0);
    }
  };

  return (
    <div
      className={`rounded-lg border p-6 ${
        isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        <BiBarcodeReader className="w-5 h-5 text-blue-500" />
        {getTranslation("generateNewBarcode", language)}
      </h3>

      <div className="space-y-4">
        {/* Product Selection */}
          <div className="relative">
             <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {getTranslation("selectProduct", language)}
            </label>
            
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  selectProduct(null); // Clear selection on type
                  setIsSearching(!!e.target.value.trim());
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={getTranslation("searchByBarcode", language) || "Search product by name or SKU..."}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {selectedProduct && (
                 <button 
                   onClick={() => {
                     setSearchTerm("");
                     selectProduct(null);
                   }}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                 >
                   <MdClose />
                 </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && searchTerm && !selectedProduct && (
              <div className={`absolute z-20 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                 isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                 {isSearching && (
                    <div className="p-4 text-center text-sm text-gray-500">
                       Searching...
                    </div>
                 )}
                 {!isSearching && searchResults.map(product => (
                     <button
                       key={product._id}
                       onClick={() => {
                         selectProduct(product);
                         setSearchTerm(product.name);
                         setIsDropdownOpen(false);
                       }}
                       className={`w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b last:border-0 ${
                         isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-100 text-gray-800"
                       }`}
                     >
                       <div className="font-medium">{product.name || NA}</div>
                       <div className={`mt-1 grid grid-cols-3 gap-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                         <div>
                           <span className="block text-[10px] uppercase tracking-wide opacity-70">Quantity</span>
                           <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                             {formatQuantity(product.stock, product.unit)}
                           </span>
                         </div>
                         <div>
                           <span className="block text-[10px] uppercase tracking-wide opacity-70">Price</span>
                           <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                             {formatPrice(product.price)}
                           </span>
                         </div>
                         <div className="min-w-0">
                           <span className="block text-[10px] uppercase tracking-wide opacity-70">Barcode</span>
                           <span
                             className={`block truncate font-mono ${
                               product.barcode
                                 ? isDarkMode ? "text-green-400" : "text-green-600"
                                 : isDarkMode ? "text-gray-500" : "text-gray-400"
                             }`}
                             title={product.barcode || NA}
                           >
                             {product.barcode || NA}
                           </span>
                         </div>
                       </div>
                     </button>
                   ))}
                   {/* Empty State */}
                   {!isSearching && searchResults.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                         No products found
                      </div>
                   )}
              </div>
            )}
          </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedProduct || isGenerating}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          <BiBarcodeReader className="w-5 h-5" />
          {isGenerating ? getTranslation("generating", language) : (isExistingBarcode ? "Regenerate Barcode" : getTranslation("generateBarcode", language))}
        </button>

        {/* Generated Barcode Display */}
        {generatedBarcode && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 flex justify-between ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span>{getTranslation("generatedBarcode", language)}</span>
              {isExistingBarcode && (
                <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 rounded text-xs py-0.5">
                  <MdCheckCircle /> Saved to product
                </span>
              )}
            </p>
            <div className="flex items-center justify-center py-6 bg-white rounded-lg border">
              <div className="text-center">
                 <p className="text-xs text-gray-500 mb-1">Print to see barcode bars</p>
                 <span className="text-3xl font-mono font-bold tracking-widest text-black">
                  {generatedBarcode}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              {/* Print Button */}
              <button
                onClick={handlePrint}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                } flex items-center justify-center gap-2`}
                title={getTranslation("print", language)}
              >
                <MdPrint className="w-5 h-5" />
                {getTranslation("print", language)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div
        className={`mt-6 p-4 rounded-lg ${
          isDarkMode ? "bg-blue-900/20" : "bg-blue-50"
        }`}
      >
        <p
          className={`text-sm ${
            isDarkMode ? "text-blue-300" : "text-blue-800"
          }`}
        >
          <strong>{getTranslation("note", language) || "Note"}:</strong> {getTranslation("barcodeNote", language)}
        </p>
      </div>
    </div>
  );
}
