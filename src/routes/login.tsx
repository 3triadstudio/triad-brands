import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { canViewDashboard, getMyRole } from "@/lib/access";
import { work } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign In | Triad Brands" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

/**
 * Studio sign-in.
 *
 * Deliberately minimal: no password reset, no social links and no
 * self-registration. Access is invite only, so account creation and recovery
 * are handled by an administrator through Users & roles rather than here.
 */
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* ---------------------------------------------------------------- */
  /* Showcase                                                          */
  /* ---------------------------------------------------------------- */

  const [slide, setSlide] = useState(0);
  const count = work.length;
  const go = useCallback(
    (step: number) => setSlide((current) => (current + step + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setSlide((current) => (current + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [count]);

  const project = work[slide % count]!;

  /* ---------------------------------------------------------------- */
  /* Auth                                                              */
  /* ---------------------------------------------------------------- */

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setBusy(false);
      setError("Those credentials didn't work. Check your email and password and try again.");
      return;
    }

    // Studio accounts live in `user_roles`. A valid Supabase Auth session is not
    // enough on its own — the role table is the source of truth for who may
    // reach the dashboard, so anyone without a role is signed straight back out.
    let role = null;
    try {
      role = await getMyRole({ supabase, userId: data.user.id });
    } catch {
      role = null;
    }

    if (!canViewDashboard(role)) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("That account doesn't have dashboard access. Ask an administrator to grant it.");
      return;
    }

    setBusy(false);
    await navigate({ to: "/admin", replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F1F1F1] p-4 md:p-8">
      <div className="mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_-40px_rgba(14,19,49,0.45)] lg:grid-cols-2">
        {/* ------------------------- showcase ------------------------- */}
        <section
          className="relative hidden min-h-[36rem] overflow-hidden rounded-[2rem] bg-[#0E1331] lg:block"
          aria-label="Selected work"
        >
          {work.map((entry, index) => (
            <img
              key={entry.slug}
              src={entry.img}
              alt=""
              aria-hidden="true"
              {...(index === 0 ? {} : { loading: "lazy" as const })}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
                index === slide ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,19,49,0.72)_0%,rgba(14,19,49,0.30)_38%,rgba(14,19,49,0.82)_72%,rgba(14,19,49,0.95)_100%)]" />

          <div className="relative flex h-full flex-col justify-between p-10">
            <p className="text-lg font-semibold text-white">Selected Works</p>

            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60" aria-live="polite">
                  {project.label} · {project.year}
                </p>
                <p className="mt-2 max-w-sm text-balance text-xl font-semibold leading-snug text-white">
                  {project.title}
                </p>
                <p className="mt-1 text-sm text-white/60">{project.meta}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous project"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next project"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- form --------------------------- */}
        <section className="flex flex-col px-6 py-10 sm:px-10 md:px-14 md:py-12">
          <header className="flex items-center justify-between gap-4">
            <p className="text-lg font-extrabold tracking-tight text-[#0E1331]">TRIAD BRANDS</p>
            <span className="rounded-full border border-[#E5E7EB] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              Triad Brands CMS
            </span>
          </header>

          <div className="flex flex-1 flex-col justify-center py-10">
            <h1 className="text-center text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight text-[#0E1331]">
              Welcome back
            </h1>
            <p className="mt-3 text-center text-sm text-[#6B7280]">
              Sign in to manage the Triad Brands site
            </p>

            <form className="mx-auto mt-9 w-full max-w-sm" onSubmit={onSubmit}>
              <label className="block">
                <span className="sr-only">Email address</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="min-h-12 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#ED1D2B] focus:ring-2 focus:ring-[#ED1D2B]/15"
                />
              </label>

              <label className="mt-3 block">
                <span className="sr-only">Password</span>
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className="min-h-12 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 pr-11 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#ED1D2B] focus:ring-2 focus:ring-[#ED1D2B]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 grid place-items-center text-[#9CA3AF] transition-colors hover:text-[#111827]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ED1D2B] px-5 text-sm font-semibold text-white transition-colors",
                  "hover:bg-[#C81724] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]/40 focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {busy ? "Signing in…" : "Login"}
              </button>

              <p className="mt-5 text-center text-xs text-[#6B7280]">
                Access is invite only — ask an administrator to add you.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
