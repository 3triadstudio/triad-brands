import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Studio Access | Triad Studio" },
      { name: "description", content: "Restricted administrative access for Triad Studio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResetCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resetCooldown]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) {
      setError("Those credentials did not work. Check your email and password, then try again.");
      return;
    }
    await navigate({ to: "/admin", replace: true });
  }

  async function requestPasswordReset() {
    setError("");
    if (resetCooldown > 0) return;
    if (!email) {
      setError("Enter your email address first and we will send a secure reset link.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) {
      const isRateLimited = /rate limit|too many requests|email rate/i.test(resetError.message);
      setError(
        isRateLimited
          ? "Password recovery is temporarily rate limited. Wait a few minutes before requesting another email."
          : "We could not send a reset link right now. Please contact the studio owner.",
      );
      setResetCooldown(60);
      return;
    }
    setResetSent(true);
    setResetCooldown(60);
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-panel">
          <div className="login-brand-topline">
            <img src="/TRIAD_LOGO_ON DARK.svg" alt="Triad Studio" className="h-8 w-auto" />
            <span className="login-access-label">Studio access</span>
          </div>

          <div className="login-brand-story">
            <p className="label-mono text-white/45">Private workspace</p>
            <h2>
              A sharper point
              <br />
              of view for brands<span>.</span>
            </h2>
            <p className="login-brand-copy">
              Keep the thinking, making and making-it-work together in one considered space.
            </p>
          </div>

          <div className="login-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <p className="login-brand-footer">Brand, digital and print from Nairobi.</p>
        </div>

        <div className="login-form-panel">
          <div className="login-mobile-logo">
            <img src="/TRIAD_LOGO_ON DARK.svg" alt="Triad Studio" className="h-8 w-auto" />
            <span className="login-access-label">Studio access</span>
          </div>

          <div className="login-form-content">
            <p className="label-mono text-white/45">Welcome back</p>
            <h1
              id="login-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl"
            >
              Sign in to the studio
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
              Access your projects, pages and studio tools.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="login-field-label">Email address</span>
                <span className="login-input-wrap">
                  <Mail className="h-4 w-4 text-white/35" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@triadstudio.co.ke"
                    className="login-input"
                  />
                </span>
              </label>
              <label className="block">
                <span className="login-field-label">Password</span>
                <span className="login-input-wrap">
                  <LockKeyhole className="h-4 w-4 text-white/35" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="login-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-white/45 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error ? (
                <div role="alert" className="login-alert">
                  {error}
                </div>
              ) : null}
              {resetSent ? (
                <div role="status" className="login-success">
                  <Check className="h-4 w-4" /> Reset link sent. Check your inbox.
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={requestPasswordReset}
                  disabled={resetCooldown > 0}
                  className="text-white/55 underline decoration-white/20 underline-offset-4 transition hover:text-[#F97316] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  {resetCooldown > 0 ? `Try again in ${resetCooldown}s` : "Forgot password?"}
                </button>
              </div>

              <button type="submit" disabled={busy} className="login-submit group">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Signing in..." : "Continue to studio"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>

          <div className="login-form-footer">
            <span>Secure studio access</span>
            <span className="login-footer-dot" aria-hidden="true" />
            <a href="mailto:3.triadstudio@gmail.com">Need help?</a>
          </div>
        </div>
      </section>
      <p className="login-legal">Triad Studio · Nairobi, Kenya · © {new Date().getFullYear()}</p>
    </main>
  );
}
