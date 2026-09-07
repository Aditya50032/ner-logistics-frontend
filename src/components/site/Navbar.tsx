import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Contact Us", href: "#contact" },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-navy-700 ring-1 ring-line">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M3 19l6-14 6 8 6-6" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="3.2" fill="none" stroke="#3B82F6" strokeWidth="1.6" />
          <circle cx="12" cy="11" r="1" fill="#3B82F6" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-700 text-white">NER Logistics Intelligence</span>
        {!compact && (
          <span className="block text-[11.5px] text-ink-muted">Smart Connectivity, Stronger North East</span>
        )}
      </span>
    </Link>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0.1, 0.4] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[1000] transition-colors duration-300",
        scrolled ? "border-b border-line/80 bg-navy-950/90 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className={cn(
                "relative rounded-md px-3 py-2 text-[14.5px] transition-colors",
                active === s.href ? "text-signal-open" : "text-ink-muted hover:text-ink",
              )}
            >
              {s.label}
              {active === s.href && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-signal-open" />
              )}
            </a>
          ))}
          <Link
            to="/dashboard"
            className="rounded-md px-3 py-2 text-[14.5px] text-ink-muted transition-colors hover:text-ink"
          >
            Dashboard
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="md" onClick={() => navigate("/login")}>
            <LogIn className="h-4 w-4" /> Login
          </Button>
          <Button size="md" onClick={() => navigate("/dashboard")}>
            Get Started
          </Button>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-navy-950/95 px-5 py-4 lg:hidden">
          <nav className="grid gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-[15px] text-ink-muted hover:bg-navy-700 hover:text-ink"
              >
                {s.label}
              </a>
            ))}
            <Link to="/dashboard" className="rounded-md px-3 py-2.5 text-[15px] text-ink-muted hover:bg-navy-700">
              Dashboard
            </Link>
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/dashboard")}>Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
}
