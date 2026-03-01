import { useState, useRef, useEffect } from "react";
import {
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "เลือก...",
  displayKey = "name",
  valueKey = "id",
  imageKey = null,
  searchKeys = ["name"],
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selected = options.find((opt) => opt[valueKey] === value);

  const filtered = options.filter((opt) => {
    if (!search) return true;
    return searchKeys.some((key) =>
      String(opt[key] || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className={`relative z-[100] ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {imageKey && selected?.[imageKey] && (
            <img
              src={selected[imageKey]}
              alt=""
              className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <span
            className={`truncate ${selected ? "text-slate-800 font-medium" : "text-slate-400"}`}
          >
            {selected ? selected[displayKey] : placeholder}
          </span>
        </div>
        <HiOutlineChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[200] w-full mt-2 bg-white border border-slate-200 rounded-md shadow-2xl max-h-80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt[valueKey]}
                  type="button"
                  onClick={() => handleSelect(opt[valueKey])}
                  className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-3 ${
                    opt[valueKey] === value
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700"
                  }`}
                >
                  {imageKey && opt[imageKey] && (
                    <img
                      src={opt[imageKey]}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{opt[displayKey]}</p>
                      {/* {typeof opt.totalStock !== "undefined" && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            opt.totalStock > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          สต็อก: {opt.totalStock}
                        </span>
                      )} */}
                    </div>
                    {opt.subtitle && (
                      <p className="text-xs text-slate-500 truncate">
                        {opt.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">ไม่พบรายการที่ค้นหา</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
