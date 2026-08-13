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
import { FaShoppingBag } from "react-icons/fa";
import analyticsService from "../../services/analyticsService";
import { FaIndianRupeeSign } from "react-icons/fa6";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 flex-shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function VendorAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getVendorAnalytics()
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
      <div className="bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
        Loading analytics...
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
      <h1 className="text-xl font-bold text-slate-800 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={FaIndianRupeeSign}
          label="Total revenue (all time, paid orders)"
          value={`Rs.${analytics.totalRevenue.toFixed(2)}`}
        />
        <StatCard
          icon={FaShoppingBag}
          label="Paid orders (all time)"
          value={analytics.orderCount}
        />
      </div>

      <div className="bg-white rounded-xl border border-sky-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Revenue — last 30 days
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f0fc" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              interval={4}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={40} />
            <Tooltip
              formatter={(value) => [
                `Rs.${Number(value).toFixed(2)}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#bae0fd",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-sky-100 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Top products
        </h2>
        {analytics.topProducts.length === 0 ?
          <p className="text-sm text-slate-400">No sales yet.</p>
        : <div className="divide-y divide-sky-50">
            {analytics.topProducts.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-slate-700">{p.name}</span>
                <span className="text-slate-500">{p.unitsSold} sold</span>
                <span className="font-semibold text-slate-800">
                  Rs.{p.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

export default VendorAnalyticsPage;
