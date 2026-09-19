import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/storefront";

const STORAGE_KEY = "triad-cookie-consent";

export function CookieBanner() {
  const { data: settings } = useSiteSettings();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const banner = {
    enabled: true,
    heading: "We use cookies to keep the site smooth and useful.",
    description:
      "We use essential cookies for the site to function and optional preferences to improve your experience. You can change your choice at any time.",
    acceptLabel: "Accept cookies",
    declineLabel: "Only essentials",
    policyLabel: "Cookie policy",
    ...((settings?.cookie_banner as Record<string, string | boolean> | undefined) ?? {}),
  } as {
    enabled: boolean;
    heading: string;
    description: string;
    acceptLabel: string;
    declineLabel: string;
    policyLabel: string;
  };

  useEffect(() => {
    setMounted(true);
    const consent = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!consent && Boolean(banner.enabled));
  }, [banner.enabled]);

  if (!mounted || !banner.enabled || !visible) return null;

  const saveConsent = (value: "accepted" | "essential") => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-[0_-12px_40px_rgba(15,23,42,0.14)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="label-mono text-accent">Privacy & cookies</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">{banner.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {banner.description}{" "}
            <Link
              to="/cookies"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {banner.policyLabel}
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {banner.declineLabel}
          </button>
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            {banner.acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
