/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/config";
import { useAuth } from "./auth-store";

const MasterContext = createContext();

const statusColors = {
  PENDING_ARTWORK: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  DESIGNING: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  PENDING_DIGITIZING: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  PENDING_STOCK_CHECK: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  STOCK_ISSUE: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  STOCK_RECHECKED: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  IN_PRODUCTION: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  PRODUCTION_FINISHED: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-100",
  },
  QC_PASSED: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
  },
  READY_TO_SHIP: {
    bg: "bg-emerald-500",
    text: "text-white",
    border: "border-emerald-600",
  },
  COMPLETED: {
    bg: "bg-slate-900",
    text: "text-white",
    border: "border-slate-900",
  },
  CANCELLED: {
    bg: "bg-slate-100",
    text: "text-slate-400",
    border: "border-slate-200",
  },
};

export const MasterProvider = ({ children }) => {
  const { token } = useAuth();
  const [constants, setConstants] = useState({
    statusLabels: {},
    roleLabels: {},
    preorderLabels: {},
    loading: true,
  });

  const fetchConstants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/master/constants");
      if (res.data.success) {
        setConstants({
          ...res.data.data,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching master constants:", error);
      setConstants((prev) => ({ ...prev, loading: false }));
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConstants();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchConstants]);

  const getStatusLabel = (status) => constants.statusLabels[status] || status;
  const getRoleLabel = (role) => constants.roleLabels[role] || role;
  const getPreorderLabel = (status) =>
    constants.preorderLabels[status] || status;

  return (
    <MasterContext.Provider
      value={{
        ...constants,
        statusColors,
        getStatusLabel,
        getRoleLabel,
        getPreorderLabel,
        refreshConstants: fetchConstants,
      }}
    >
      {children}
    </MasterContext.Provider>
  );
};

export const useMaster = () => {
  const context = useContext(MasterContext);
  if (!context) {
    throw new Error("useMaster must be used within a MasterProvider");
  }
  return context;
};
