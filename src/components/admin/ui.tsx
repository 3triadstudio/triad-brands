import type { ReactNode } from "react";
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
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-7 overflow-hidden pb-10 text-[#172033]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#526079]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#172033] md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526079]">{description}</p>
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
      className={`min-w-0 rounded-xl border border-[#CBD3DF] bg-white shadow-[0_8px_24px_rgba(23,32,51,0.06)] ${className}`}
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
    <div className="flex flex-col gap-3 border-b border-[#E2E7EF] px-5 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF1E6] text-[#B54708]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#172033]">{title}</h2>
          {detail ? <p className="mt-1 text-xs text-[#526079]">{detail}</p> : null}
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

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "green" | "red" | "amber" | "blue" | "lilac" | "cream" | "dark";
}) {
  const tones = {
    green: "bg-[#DCFCE7] text-[#166534]",
    red: "bg-[#FEE2E2] text-[#991B1B]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    blue: "bg-[#DBEAFE] text-[#1E40AF]",
    lilac: "bg-[#E0E7FF] text-[#3730A3]",
    cream: "bg-[#FEF3C7] text-[#92400E]",
    dark: "bg-[#172033] text-white",
  };
  const surfaces = {
    green: "bg-[#F0FDF4]",
    red: "bg-[#FFF7F7]",
    amber: "bg-[#FFFBEB]",
    blue: "bg-[#EFF6FF]",
    lilac: "bg-[#EEF2FF]",
    cream: "bg-[#FFFBEB]",
    dark: "bg-[#172033] text-white",
  };
  return (
    <article
      className={`rounded-xl border border-[#E2E7EF] p-5 shadow-[0_6px_18px_rgba(23,32,51,0.04)] ${surfaces[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#526079]">
          {label}
        </p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={`mt-5 text-3xl font-semibold tabular-nums tracking-[-0.04em] ${tone === "dark" ? "text-white" : "text-[#172033]"}`}
      >
        {value}
      </p>
      <p className={`mt-2 text-xs ${tone === "dark" ? "text-white/70" : "text-[#526079]"}`}>
        {detail}
      </p>
    </article>
  );
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("won") ||
    normalized.includes("fulfilled") ||
    normalized.includes("active") ||
    normalized.includes("live")
      ? "bg-[#DCFCE7] text-[#166534]"
      : normalized.includes("new") ||
          normalized.includes("pending") ||
          normalized.includes("review")
        ? "bg-[#FEF3C7] text-[#92400E]"
        : normalized.includes("archived") || normalized.includes("inactive")
          ? "bg-[#F1F5F9] text-[#475569]"
          : "bg-[#FEE2E2] text-[#991B1B]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}
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
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 ${checked ? "bg-[#D94801]" : "bg-[#CBD5E1]"}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

export const adminInput =
  "min-w-0 w-full rounded-lg border border-[#CBD3DF] bg-white px-3.5 py-3 text-sm text-[#172033] outline-none transition-colors placeholder:text-[#64748B] focus-visible:border-[#D94801] focus-visible:ring-2 focus-visible:ring-[#F97316]/20";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-10 text-center">
      <div>
        <p className="text-sm font-semibold text-[#172033]">{title}</p>
        <p className="mt-2 text-xs text-[#526079]">{detail}</p>
      </div>
    </div>
  );
}

export function AdminLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-3 px-6 py-10 text-sm text-[#526079]"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-[#CBD3DF] border-t-[#D94801]"
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
      <p className="mt-2 max-w-md text-xs leading-5 text-[#526079]">{detail}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-lg border border-[#CBD3DF] bg-white px-4 py-2 text-xs font-semibold text-[#172033] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
