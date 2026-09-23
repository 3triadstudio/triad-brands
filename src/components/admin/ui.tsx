import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function AdminPage({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6 overflow-hidden pb-10 text-[#172033]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#111827] md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">{description}</p>
        </div>
        {action ? (
          <div className="flex max-w-full flex-wrap items-center gap-2">{action}</div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeading({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] px-5 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3F4F6] text-[#4B5563]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
          {detail ? <p className="mt-0.5 text-xs text-[#6B7280]">{detail}</p> : null}
        </div>
      </div>
      {action ? (
        <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2 sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}

const metricTones = {
  ink: "bg-[#F3F4F6] text-[#111827]",
  red: "bg-[#FEEDEC] text-[#ED1D2B]",
  green: "bg-[#DCFCE7] text-[#166534]",
  amber: "bg-[#FEF3C7] text-[#92400E]",
  blue: "bg-[#DBEAFE] text-[#1E40AF]",
} as const;

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "ink",
  delta,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: keyof typeof metricTones;
  delta?: { direction: "up" | "down" | "flat"; label: string } | undefined;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${metricTones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-[#6B7280]">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <p className="text-lg font-semibold tabular-nums tracking-[-0.02em] text-[#111827]">
            {value}
          </p>
          {delta ? (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
                delta.direction === "up"
                  ? "text-[#166534]"
                  : delta.direction === "down"
                    ? "text-[#991B1B]"
                    : "text-[#6B7280]"
              }`}
            >
              {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "▬"}
              {delta.label}
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-[#9CA3AF]">{detail}</p>
      </div>
    </article>
  );
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("won") ||
    normalized.includes("fulfilled") ||
    normalized.includes("active") ||
    normalized.includes("published")
      ? "bg-[#DCFCE7] text-[#166534]"
      : normalized.includes("new") ||
          normalized.includes("pending") ||
          normalized.includes("review")
        ? "bg-[#FEF3C7] text-[#92400E]"
        : normalized.includes("archived") ||
            normalized.includes("inactive") ||
            normalized.includes("draft")
          ? "bg-[#F3F4F6] text-[#4B5563]"
          : "bg-[#FEE2E2] text-[#991B1B]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] focus-visible:ring-offset-2 ${checked ? "bg-[#ED1D2B]" : "bg-[#E5E7EB]"}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

export const inputClass =
  "min-w-0 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus-visible:border-[#ED1D2B] focus-visible:ring-2 focus-visible:ring-[#ED1D2B]/15";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-10 text-center">
      <div>
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1.5 text-xs text-[#6B7280]">{detail}</p>
      </div>
    </div>
  );
}

export function AdminLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-3 px-6 py-10 text-sm text-[#6B7280]"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#ED1D2B]"
        aria-hidden="true"
      />
      {label}…
    </div>
  );
}

export function AdminError({
  title = "Something went wrong",
  detail,
  onRetry,
}: {
  title?: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center"
      role="alert"
    >
      <p className="text-sm font-semibold text-[#991B1B]">{title}</p>
      <p className="mt-1.5 max-w-md text-xs leading-5 text-[#6B7280]">{detail}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-10 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Modal({
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
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#111827]/50 p-3 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="mx-auto max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl sm:max-h-[90vh]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] p-5 md:p-6">
          <div className="min-w-0">
            <h2 id="admin-modal-title" className="text-lg font-semibold text-[#111827]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-xl p-2 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
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

export function ModalFooter({
  onCancel,
  onSave,
  onDelete,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F3F4F6] p-5 md:p-6">
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="min-h-10 rounded-xl border border-[#FECACA] px-4 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
        >
          Delete
        </button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-xl border border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-10 rounded-xl bg-[#111827] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
