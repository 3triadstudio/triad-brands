import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowUpRight, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { services } from "@/lib/site-data";
import { submitLead } from "@/lib/leads.functions";
import { buildCartQuoteMessage, type CartItem } from "@/lib/cart";
import { useSiteSettings } from "@/lib/storefront";

type FormState = {
  service: string;
  scope: string;
  name: string;
  company: string;
  email: string;
  brief: string;
};

const empty: FormState = {
  service: "",
  scope: "",
  name: "",
  company: "",
  email: "",
  brief: "",
};

const steps = ["Project details", "Contact info"] as const;

export function StartProjectDialog({
  children,
  className,
  quoteItems = [],
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  quoteItems?: CartItem[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [sending, setSending] = useState(false);
  const submitLeadFn = useServerFn(submitLead);
  const { data: settings } = useSiteSettings();

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canContinue =
    step === 0 ? Boolean(form.service && form.scope) : Boolean(form.name && form.email);

  const reset = () => {
    setStep(0);
    setForm(empty);
  };

  const submit = async () => {
    setSending(true);
    try {
      const quoteMessage = quoteItems.length ? buildCartQuoteMessage(quoteItems) : "";
      const message = [
        "Hello Triad Brands, I'd like to request a quote.",
        `Service: ${form.service}`,
        `Starting point: ${form.scope}`,
        `Name: ${form.name}`,
        `Company: ${form.company || "Not provided"}`,
        `Email: ${form.email}`,
        `Brief: ${form.brief || "Not provided"}`,
        quoteMessage,
      ]
        .filter(Boolean)
        .join("\n");
      const result = await submitLeadFn({
        data: {
          name: form.name,
          email: form.email,
          company: form.company,
          service: form.service || (quoteItems.length ? "Product quote" : "General enquiry"),
          starting_point: form.scope,
          details: [form.brief, quoteMessage].filter(Boolean).join("\n\n"),
        },
      });
      if (!result.ok) {
        toast.error("Your message could not be saved", {
          description: "WhatsApp will still open with your request.",
        });
      }
      const number = (settings?.contacts.whatsapp ?? "254700390157").replace(/\D/g, "");
      window.location.assign(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
      setOpen(false);
      setTimeout(reset, 300);
    } catch {
      toast.error("Could not open WhatsApp", { description: "Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 300);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={className} {...buttonProps}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-background p-0 shadow-2xl sm:max-w-2xl">
        {/* Modern Header */}
        <div className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-background px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Sparkles className="h-3 w-3" />
                {step === 0 ? "Step 1 of 2" : "Step 2 of 2"}
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {step === 0 ? "Tell us about your project" : "Get in touch"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step === 0
                  ? "Help us understand what you're looking for. We'll respond within 2 hours."
                  : "Just a couple more details and we'll send your request directly to WhatsApp."}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="border-b border-border/50 px-8 py-4">
          <div className="flex items-center gap-3">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-all ${
                    i <= step
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="hidden flex-col sm:flex">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {s}
                  </p>
                </div>
                {i < steps.length - 1 && <div className="h-px flex-1 bg-border/30" />}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6 px-8 py-8">
          {step === 0 && (
            <>
              <Field label="Service" required>
                <Selector
                  value={form.service}
                  onChange={(v) => set("service", v)}
                  placeholder="Select a service"
                  options={services.map((s) => s.name)}
                />
              </Field>
              <Field label="Starting point" required>
                <Selector
                  value={form.scope}
                  onChange={(v) => set("scope", v)}
                  placeholder="Where are you in the process?"
                  options={[
                    "Brand new — nothing exists yet",
                    "Refreshing an existing brand",
                    "Production only — artwork is ready",
                    "Not sure yet",
                  ]}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your name"
                    className="rounded-lg"
                  />
                </Field>
                <Field label="Company">
                  <Input
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    placeholder="Your company (optional)"
                    className="rounded-lg"
                  />
                </Field>
              </div>
              <Field label="Email address" required>
                <Input
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  className="rounded-lg"
                />
              </Field>
              <Field label="Additional details">
                <Textarea
                  rows={4}
                  value={form.brief}
                  onChange={(e) => set("brief", e.target.value)}
                  placeholder="Timeline, budget, specific requirements, or anything else we should know..."
                  className="rounded-lg"
                />
              </Field>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border/50 bg-muted/20 px-8 py-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="label-mono inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              disabled={!canContinue || sending}
              onClick={() => (step === 1 ? void submit() : setStep((s) => s + 1))}
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {step === 1 ? (
                sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening WhatsApp
                  </>
                ) : (
                  <>
                    Send to WhatsApp
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </>
                )
              ) : (
                <>
                  Continue
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Selector({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full rounded-lg border-border/50">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
