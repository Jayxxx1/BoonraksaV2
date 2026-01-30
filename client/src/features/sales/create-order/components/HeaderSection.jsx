import React from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const HeaderSection = ({ user, error }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-slate-200 h-14 sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              New Sales Order
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Sales Agent: {user?.name}
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-erp-in">
            <HiOutlineExclamationCircle className="w-4 h-4 text-rose-500" />
            <p className="text-[11px] font-bold text-rose-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderSection;
