"use client";

import { useState, useRef, useEffect } from "react";
import { getAllCountries } from "@/lib/countries";

type Country = { name: string; flag: string };

export default function CountrySelector({
  value,
  onChange,
  label,
}: {
  value: Country | null;
  onChange: (c: Country) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const countries = getAllCountries();
  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="input text-left flex items-center gap-2"
      >
        {value ? (
          <>
            <span className="text-xl">{value.flag}</span>
            <span>{value.name}</span>
          </>
        ) : (
          <span className="text-gray-500">Select country...</span>
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg max-h-60 overflow-y-auto">
          <input
            autoFocus
            placeholder="Search..."
            aria-label={`Search ${label}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="input border-0 rounded-none border-b border-border"
          />
          {filtered.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-border flex items-center gap-2"
            >
              <span className="text-xl">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-500">No countries found</div>
          )}
        </div>
      )}
    </div>
  );
}
