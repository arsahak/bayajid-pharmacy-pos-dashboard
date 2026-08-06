"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const session = await auth();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };
}

/**
 * GET /api/web-orders - list website orders (search, status, pagination)
 */
export async function getAllWebOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);

    const url = `${API_URL}/api/web-orders${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await fetch(url, { headers, cache: "no-store" });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to fetch orders" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get all web orders error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * GET /api/web-orders/:id - get a single website order
 */
export async function getWebOrderById(id: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/web-orders/${id}`, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to fetch order" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get web order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * PUT /api/web-orders/:id/confirm - confirm a pending order (deducts stock, creates a Sale)
 */
export async function confirmWebOrder(id: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/web-orders/${id}/confirm`, {
      method: "PUT",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to confirm order" };
    }

    const data = await response.json();
    return { success: true, data, message: "Order confirmed successfully" };
  } catch (error) {
    console.error("Confirm web order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * PUT /api/web-orders/:id/cancel - cancel an order (restores stock if it was already confirmed)
 */
export async function cancelWebOrder(id: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/web-orders/${id}/cancel`, {
      method: "PUT",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to cancel order" };
    }

    const data = await response.json();
    return { success: true, data, message: "Order cancelled successfully" };
  } catch (error) {
    console.error("Cancel web order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * PUT /api/web-orders/:id - update notes, or move status between processing/completed
 */
export async function updateWebOrder(id: string, updates: { status?: string; notes?: string }) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/web-orders/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to update order" };
    }

    const data = await response.json();
    return { success: true, data, message: "Order updated successfully" };
  } catch (error) {
    console.error("Update web order error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
