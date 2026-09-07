import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/site/Navbar";
import { RidgeBackdrop } from "@/components/site/RidgeBackdrop";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  ["officer@nic.in", "Government officer"],
  ["district@nic.in", "District officer"],
  ["field@nic.in", "Field officer"],
  ["driver@ner.in", "Driver"],
];

export default function Login() {
  const [email, setEmail] = useState("officer@nic.in");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const user = await api.login(email, password);
      navigate(user.role === "DRIVER" ? "/driver" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <RidgeBackdrop />

      <div className="relative w-full max-w-[420px]">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-[13px] text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <div className="panel p-7">
          <Logo compact />
          <h1 className="mt-6 font-display text-[24px] font-700 text-white">Sign in to the control room</h1>
          <p className="mt-2 text-[13.5px] text-ink-muted">
            Access is scoped to your role and district. All actions are recorded in the audit log.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <label className="label-mono" htmlFor="email">
                Official email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
                className="h-11 rounded-lg border border-line bg-navy-900/80 px-3 text-[14px] text-ink focus:border-signal-open"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="label-mono" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
                className="h-11 rounded-lg border border-line bg-navy-900/80 px-3 text-[14px] text-ink focus:border-signal-open"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-signal-blocked/40 bg-signal-blocked/10 px-3 py-2.5 text-[12.5px] text-signal-blocked">
                {error}
              </p>
            )}

            <Button onClick={signIn} disabled={busy} size="lg">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {busy ? "Signing in" : "Sign in"}
            </Button>
          </div>

          <div className="mt-6 border-t border-line/70 pt-4">
            <p className="label-mono">Demo accounts — password demo1234</p>
            <div className="mt-2.5 grid gap-1.5">
              {DEMO_ACCOUNTS.map(([addr, role]) => (
                <button
                  key={addr}
                  onClick={() => setEmail(addr)}
                  className="flex items-center justify-between rounded-md border border-line/70 px-3 py-2 text-left transition-colors hover:border-ink-faint"
                >
                  <span className="font-mono text-[12px] text-ink">{addr}</span>
                  <span className="text-[12px] text-ink-muted">{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
