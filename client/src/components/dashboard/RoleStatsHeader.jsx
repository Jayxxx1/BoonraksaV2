/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineFire,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";

export default function RoleStatsHeader() {
  const { user, token } = useAuth(); // 🆕 Get token
  const [stats, setStats] = useState({
    todayCount: 0,
    totalCount: 0,
    totalSales: 0,
    urgentCount: 0, // 🆕 Add urgentCount
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return; // 🆕 Wait for token
      try {
        const res = await axios.get(
          "http://localhost:8000/api/dashboard/stats",
          {
            headers: { Authorization: `Bearer ${token}` }, // 🆕 Add auth header
          },
        );
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse bg-slate-100 rounded-xl border border-slate-200"
          ></div>
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-6">
      <StatCard
        icon={HiOutlineFire}
        label="งานวันนี้"
        value={stats.todayCount}
        color="text-orange-600"
        bgColor="bg-orange-50"
      />
      <StatCard
        icon={HiOutlineExclamationTriangle}
        label="งานด่วน/เกินกำหนด"
        value={stats.urgentCount}
        color="text-rose-600"
        bgColor="bg-rose-50"
        isUrgent={true}
      />
      <StatCard
        icon={HiOutlineChartBar}
        label="งานทั้งหมด"
        value={stats.totalCount}
        color="text-indigo-600"
        bgColor="bg-indigo-50"
      />
      {(user?.role === "SALES" ||
        user?.role === "ADMIN" ||
        user?.role === "EXECUTIVE" ||
        user?.role === "FINANCE" ||
        user?.role === "MARKETING") && (
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="ยอดรวม (฿)"
          value={(stats.totalSales || 0).toLocaleString()}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
      )}
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color, bgColor, isUrgent }) => (
  <div
    className={`bg-white p-2.5 px-4 rounded-xl border-2 shadow-sm flex items-center gap-3 min-w-[140px] flex-1 md:flex-none transition-all ${
      isUrgent
        ? "border-rose-200 bg-rose-50/30 scale-105 shadow-rose-100 animate-pulse"
        : "border-slate-200"
    }`}
  >
    <div
      className={`w-9 h-9 ${bgColor} rounded-lg flex items-center justify-center shrink-0 ${
        isUrgent ? "ring-2 ring-rose-200 ring-offset-2" : ""
      }`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="min-w-0">
      <p
        className={`text-[10px] font-black uppercase tracking-tight leading-none mb-1 ${
          isUrgent ? "text-rose-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className={`text-[16px] font-black ${color} truncate`}>{value}</p>
    </div>
  </div>
);
