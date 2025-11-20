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
    STUDENT: <FaUserGraduate className="text-purple-600 text-lg" />,
    LECTURER: <FaChalkboardTeacher className="text-purple-600 text-lg" />,
    REVIEWER: <FaUserEdit className="text-purple-600 text-lg" />,
    DEPARTMENT_ADMIN: <FaUserTie className="text-purple-600 text-lg" />,
  };

  const selectedOption = options.find(
    (o) => String(o.value) === String(value)
  );

  return (
    <div className="relative w-full">
      <label className="block mb-2 text-white/90 font-semibold">{label}</label>

      <div
        ref={boxRef}
        onClick={() => setOpen(!open)}
        className="
          px-4 py-3 rounded-xl cursor-pointer
          bg-gradient-to-r from-[#c7a6ff]/40 via-[#b282f7]/40 to-[#9d4edd]/40
          border border-white/30 text-white backdrop-blur-xl
          shadow-lg shadow-purple-500/20
          flex justify-between items-center
          transition-all duration-300 hover:shadow-purple-400/40 hover:scale-[1.01]
        "
      >
        <div className="flex items-center gap-2">
          {selectedOption && icons[selectedOption.value]}
          <span>{selectedOption ? selectedOption.label : `Select ${label}`}</span>
        </div>

        <FiChevronDown
          className={`text-white text-xl transition-transform duration-300 ${
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
              bg-gradient-to-b from-[#ffffff]/95 to-[#f1e1ff]/95
              backdrop-blur-xl border border-white/40 shadow-2xl
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
                  text-gray-800 transition-all
                  hover:bg-gradient-to-r hover:from-[#c084fc]/90 hover:to-[#a855f7]/90
                  hover:text-white hover:shadow-lg hover:shadow-purple-400/30
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
