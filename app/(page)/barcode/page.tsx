"use client";

import { getAllBarcodes, Barcode } from "@/app/actions/barcode";
import BarcodePageContent from "@/component/brcodeManagement/BarcodePageContent";
import { BarcodePageSkeleton } from "@/component/brcodeManagement/components/BarcodePageSkeleton";
import ProtectedRoute from "@/component/ProtectedRoute";
import { useSidebar } from "@/lib/SidebarContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";

function BarcodeContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const { isDarkMode } = useSidebar();

  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // `loading` is only true for the first load; later reloads (after a save/delete or
  // page change) keep the current screen so the generator keeps its state.
  const fetchData = useCallback(async () => {
    const barcodesResult = await getAllBarcodes({ page, limit: 20 });

    setBarcodes(barcodesResult.success ? barcodesResult.data?.barcodes || [] : []);
    setTotalPages(barcodesResult.success ? barcodesResult.data?.totalPages || 1 : 1);
    setTotal(barcodesResult.success ? barcodesResult.data?.total || 0 : 0);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ProtectedRoute requiredPermission="canViewBarcodes">
      {loading ? (
        <BarcodePageSkeleton isDarkMode={isDarkMode} />
      ) : (
        <BarcodePageContent
          barcodes={barcodes}
          totalPages={totalPages}
          currentPage={page}
          total={total}
          onRefresh={handleRefresh}
        />
      )}
    </ProtectedRoute>
  );
}

export default function BarcodePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BarcodeContent />
    </Suspense>
  );
}
