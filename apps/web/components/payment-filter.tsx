"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function PaymentFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("paymentFilter") || "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("paymentFilter");
    } else {
      params.set("paymentFilter", value);
    }
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <select
      value={currentFilter}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950"
    >
      <option value="all">All payments</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  );
}
