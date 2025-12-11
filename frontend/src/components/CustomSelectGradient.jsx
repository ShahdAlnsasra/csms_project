import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FiChevronDown } from "react-icons/fi";
import {
  FaUserGraduate,
  FaUserTie,
  FaUserEdit,
  FaChalkboardTeacher,
} from "react-icons/fa";

export default function CustomSelectGradient({
  label,
  value,
  onChange,
  options,
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);

  // Clicking outside closes menu
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom + window.scrollY);
      setDropdownLeft(rect.left + window.scrollX);
      setDropdownWidth(rect.width);
    }
  }, [open]);

  const icons = {
    STUDENT: <FaUserGraduate className="text-indigo-500 text-lg" />,
    LECTURER: <FaChalkboardTeacher className="text-indigo-500 text-lg" />,
    REVIEWER: <FaUserEdit className="text-indigo-500 text-lg" />,
    DEPARTMENT_ADMIN: <FaUserTie className="text-indigo-500 text-lg" />,
  };

  const selectedOption = options.find(
    (o) => String(o.value) === String(value)
  );

  return (
    <div className="relative w-full">
      <label className="block mb-2 text-slate-800 font-semibold">{label}</label>

      <div
        ref={boxRef}
        onClick={() => setOpen(!open)}
        className="
          px-4 py-3 rounded-xl cursor-pointer
          bg-gradient-to-r from-white via-indigo-50 to-sky-50
          border border-slate-200 text-slate-900 backdrop-blur-xl
          shadow-lg shadow-indigo-100
          flex justify-between items-center
          transition-all duration-300 hover:shadow-indigo-200 hover:border-indigo-200 hover:scale-[1.01]
        "
      >
        <div className="flex items-center gap-2">
          {selectedOption && icons[selectedOption.value]}
          <span className="font-medium">
            {selectedOption ? selectedOption.label : `Select ${label}`}
          </span>
        </div>

        <FiChevronDown
          className={`text-slate-700 text-xl transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* PORTAL DROPDOWN */}
      {open &&
        ReactDOM.createPortal(
          <div
            className="
              absolute z-[9999] rounded-xl
              bg-gradient-to-b from-white/95 to-indigo-50/95
              backdrop-blur-xl border border-slate-200 shadow-2xl shadow-indigo-100
              animate-slideDown max-h-56 overflow-y-auto custom-scrollbar
            "
            style={{
              top: dropdownTop,
              left: dropdownLeft,
              width: dropdownWidth,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={() => {
                  // ⬅⬅⬅ FIX: onMouseDown runs BEFORE outside click handler
                  onChange(String(opt.value));
                  setOpen(false);
                }}
                className="
                  px-4 py-3 cursor-pointer flex items-center gap-3
                  text-slate-800 transition-all
                  hover:bg-gradient-to-r hover:from-indigo-100 hover:to-sky-100
                  hover:text-slate-900 hover:shadow-lg hover:shadow-indigo-100
                "
              >
                {icons[opt.value]}
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
