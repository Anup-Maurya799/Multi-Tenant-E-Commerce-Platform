import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FaDollarSign, FaShoppingBag, FaStore, FaUsers } from "react-icons/fa";
import analyticsService from "../../services/analyticsService";
import { FaIndianRupeeSign } from "react-icons/fa6";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function SuperAdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getAdminAnalytics()
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
        setStatus("succeeded");
      })
      .catch((errorMessage) => {
        if (cancelled) return;
        setError(errorMessage);
        setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading platform analytics...
      </div>
    );
  }

  if (status === "failed") {
    return (
      <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  const chartData = analytics.revenueByDay.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">
        Platform Analytics
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Marketplace-wide, across every vendor
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaIndianRupeeSign}
          label="Total revenue"
          value={`Rs.${analytics.totalRevenue.toFixed(2)}`}
        />
        <StatCard
          icon={FaShoppingBag}
          label="Paid orders"
          value={analytics.orderCount}
        />
        <StatCard icon={FaStore} label="Stores" value={analytics.storeCount} />
        <StatCard
          icon={FaUsers}
          label="Vendors / Customers"
          value={`${analytics.vendorCount} / ${analytics.customerCount}`}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Platform revenue — last 30 days
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              interval={4}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={40} />
            <Tooltip
              formatter={(value) => [
                `RS.${Number(value).toFixed(2)}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#cbd5e1",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1e293b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Top stores by revenue
        </h2>
        {analytics.topStores.length === 0 ?
          <p className="text-sm text-slate-400">No sales yet.</p>
        : <div className="divide-y divide-slate-100">
            {analytics.topStores.map((s) => (
              <div
                key={s.storeName}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-slate-700">{s.storeName}</span>
                <span className="text-slate-500">{s.orderCount} orders</span>
                <span className="font-semibold text-slate-800">
                  Rs.{s.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

export default SuperAdminAnalyticsPage;
