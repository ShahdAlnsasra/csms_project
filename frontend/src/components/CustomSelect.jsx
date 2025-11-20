import React, { useState, useRef, useEffect } from "react";

export default function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <label className="block mb-2 text-white/90 font-medium">{label}</label>

      {/* Selected Box */}
      <div
        onClick={() => setOpen(!open)}
        className="
          px-4 py-3 rounded-xl cursor-pointer
          bg-white/10 border border-white/20
          text-white backdrop-blur-xl
          flex justify-between items-center
          transition-all duration-300 hover:bg-white/20
        "
      >
        <span>{value ? options.find(o => o.value === value)?.label : `Select ${label}`}</span>
        <span className="text-white">▼</span>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div
          className="
            absolute mt-2 w-full z-50 
            bg-white/20 backdrop-blur-2xl 
            border border-white/30 rounded-xl 
            shadow-xl animate-fadeIn
          "
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="
                px-4 py-3 cursor-pointer 
                hover:bg-white/30 
                text-white transition
              "
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
