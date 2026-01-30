import React, { useState, useEffect, useRef } from "react";
import { HiOutlineCalendar } from "react-icons/hi2";

/**
 * DateInput Component
 * Enforces dd/mm/yyyy display format while maintaining HTML5 date input compatibility.
 *
 * @param {string} value - Date string in 'yyyy-mm-dd' format (HTML5 standard)
 * @param {function} onChange - Callback receiving event with target.value in 'yyyy-mm-dd'
 * @param {string} className - Optional classes
 */
const DateInput = ({ value, onChange, className = "" }) => {
  // Format yyyy-mm-dd to dd/mm/yyyy for display
  const formatDateToDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  // Internal state for the text input
  const [displayValue, setDisplayValue] = useState(formatDateToDisplay(value));
  const dateInputRef = useRef(null);

  // Sync display value when prop changes
  useEffect(() => {
    const formatted = formatDateToDisplay(value);
    if (formatted !== displayValue) {
      setDisplayValue(formatted);
    }
  }, [value, displayValue]);

  const handleTextChange = (e) => {
    let text = e.target.value.replace(/[^0-9/]/g, "");

    // Auto-slash logic
    if (text.length === 2 && displayValue.length === 1) text += "/";
    if (text.length === 5 && displayValue.length === 4) text += "/";

    setDisplayValue(text);

    // If complete dd/mm/yyyy, update the actual date value
    if (text.length === 10) {
      const [day, month, year] = text.split("/");
      const isoDate = `${year}-${month}-${day}`;
      // Validate
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        onChange({ target: { value: isoDate } });
      }
    } else if (text === "") {
      onChange({ target: { value: "" } });
    }
  };

  const handleIconClick = () => {
    // Show picker
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const handleDateChange = (e) => {
    // When picker selects a date, it comes as yyyy-mm-dd
    onChange(e); // Propagate up
    // Display will update via useEffect
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder="dd/mm/yyyy"
          className={`${className} pr-10 tracking-widest`}
          maxLength={10}
        />
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute right-3 text-slate-400 hover:text-indigo-600 cursor-pointer"
        >
          <HiOutlineCalendar className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden native date input for picker functionality */}
      <input
        type="date"
        ref={dateInputRef}
        value={value || ""}
        onChange={handleDateChange}
        className="absolute inset-0 opacity-0 -z-10 w-full h-full pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};

export default DateInput;
