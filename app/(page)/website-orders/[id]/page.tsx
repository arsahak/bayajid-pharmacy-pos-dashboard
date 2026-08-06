"use client";

import WebOrderDetails from "@/component/WebOrderManagement/WebOrderDetails";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  return <WebOrderDetails orderId={id} />;
}
