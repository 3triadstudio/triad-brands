import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label-mono text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[#CBD3DF] bg-white px-4 py-3 text-sm text-[#172033] outline-none placeholder:text-[#64748B] transition-colors focus-visible:border-[#D94801] focus-visible:ring-2 focus-visible:ring-[#F97316]/20";

export function AdminModal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#172033]/60 p-3 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="mx-auto max-h-[calc(100svh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#CBD3DF] bg-[#FCFCFA] shadow-2xl sm:max-h-[92vh]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E7EF] p-4 md:p-6">
          <div className="min-w-0">
            <h2 id="admin-modal-title" className="text-xl font-semibold text-[#172033]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#526079]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid min-h-11 min-w-11 place-items-center rounded-lg p-2 text-[#526079] transition-colors hover:bg-[#E8EDF3] hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RowActions({
  onSave,
  onDelete,
  saving,
}: {
  onSave: () => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="label-mono min-h-11 rounded-lg bg-[#172033] px-5 py-2.5 text-white transition-colors hover:bg-[#2A3853] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:opacity-60"
      >
        Save
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="label-mono min-h-11 rounded-lg border border-[#FECACA] px-5 py-2.5 text-[#991B1B] transition-colors hover:bg-[#FFF1F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
        >
          Delete
        </button>
      )}
    </div>
  );
}
