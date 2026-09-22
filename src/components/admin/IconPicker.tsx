import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { inputClass } from "@/components/admin/ui";
import { commonSocialIconNames } from "@/lib/social-icons";

// Every icon renders through lucide's per-icon dynamic loader: each grid tile
// is its own tiny async import (a few hundred bytes), not the whole package.
// That's what makes it safe to offer the complete ~1,900-icon set here without
// repeating the `import * as Lucide` bundle-bloat mistake fixed elsewhere in
// this app (see src/lib/builder/icons.ts) — nothing here ships to visitors at
// all, since this component only renders inside the admin studio. The default
// (pre-search) view uses the same curated names the public footer renders
// with plain tree-shaken imports (src/lib/social-icons.ts), so what's shown
// first here is exactly what's guaranteed to render richly on the live site.
const starterIcons = commonSocialIconNames as IconName[];

const MAX_RESULTS = 60;

function isIconName(value: string): value is IconName {
  return (iconNames as string[]).includes(value);
}

export function IconPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return starterIcons;
    return (iconNames as string[])
      .filter((name) => name.includes(trimmed))
      .slice(0, MAX_RESULTS) as IconName[];
  }, [query]);

  const selected = isIconName(value) ? value : null;

  return (
    <div ref={containerRef} className="relative">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${inputClass} mt-1.5 flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <DynamicIcon name={selected} className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="truncate">{value || "Choose an icon"}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full min-w-[280px] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xl">
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[#9CA3AF]">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${iconNames.length.toLocaleString()} icons…`}
              aria-label="Search icons"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </label>
          <div
            role="listbox"
            aria-label="Icon results"
            className="mt-2 grid max-h-52 grid-cols-6 gap-1 overflow-y-auto sm:grid-cols-8"
          >
            {results.map((name) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={value === name}
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setQuery("");
                }}
                className={`grid h-9 place-items-center rounded-lg hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] ${
                  value === name ? "bg-[#ED1D2B]/10 text-[#ED1D2B]" : "text-[#4B5563]"
                }`}
              >
                <DynamicIcon name={name} className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
            {results.length === 0 ? (
              <p className="col-span-full py-4 text-center text-xs text-[#9CA3AF]">
                No icons match "{query}"
              </p>
            ) : null}
          </div>
          {!query.trim() ? (
            <p className="mt-2 text-[10px] text-[#9CA3AF]">
              Showing popular icons — search to browse all {iconNames.length.toLocaleString()}.
            </p>
          ) : results.length === MAX_RESULTS ? (
            <p className="mt-2 text-[10px] text-[#9CA3AF]">
              Showing the first {MAX_RESULTS} matches — keep typing to narrow it down.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
