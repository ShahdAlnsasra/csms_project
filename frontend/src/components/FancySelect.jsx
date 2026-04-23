import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

export default function FancySelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  icon: Icon,
  className = "",
  compact = false,
  optionsMaxHeightClass = "max-h-64",
}) {
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button
            className={`
              w-full rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50
              px-3 ${compact ? "py-2 text-xs" : "py-2.5 text-sm"} text-left shadow-sm hover:shadow
              focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
              flex items-center gap-2 min-w-0
            `}
          >
            {Icon ? <Icon className={`shrink-0 text-slate-400 ${compact ? "h-4 w-4" : "h-5 w-5"}`} /> : null}

            <span
              className={`flex-1 min-w-0 truncate text-left ${
                selected ? "text-slate-900" : "text-slate-500"
              }`}
              title={selected?.label || placeholder}
            >
              {selected?.label || placeholder}
            </span>

            <ChevronUpDownIcon className={`shrink-0 text-slate-400 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
          </Listbox.Button>

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options
              className={`
                absolute z-20 mt-2 w-full min-w-[12rem] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl
                ${optionsMaxHeightClass} p-1
              `}
            >
              {options.map((opt) => (
                <Listbox.Option
                  key={String(opt.value)}
                  value={opt.value}
                  className={({ active }) =>
                    `cursor-pointer select-none rounded-lg px-3 py-2 text-sm flex items-center gap-2
                    ${active ? "bg-indigo-50 text-indigo-800" : "text-slate-700"}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`flex-1 ${selected ? "font-semibold" : "font-medium"}`}>{opt.label}</span>
                      {selected ? <CheckIcon className="h-4 w-4 text-indigo-600" /> : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
