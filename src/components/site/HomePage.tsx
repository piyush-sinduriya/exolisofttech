import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useInView, useTransform, useMotionValueEvent, type MotionValue, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight, ArrowUpRight, Sparkles, Rocket, Check, X as XIcon, Star, Phone, Mail, MapPin,
  ChevronDown, Menu, X, Clock, TrendingUp, Award, Copy, Code2, Smartphone, Bot, Megaphone,
  Search, Target, Shield, Zap, Users, Layers, Globe, MessageSquare, PenTool,
} from "lucide-react";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import heroVisual from "@/assets/hero-visual.png";
import pRestaurant from "@/assets/portfolio/restaurant.jpg";
import pRealestate from "@/assets/portfolio/realestate.jpg";
import pHealth from "@/assets/portfolio/health.jpg";
import pHotel from "@/assets/portfolio/hotel.jpg";
import pGym from "@/assets/portfolio/gym.jpg";
import pLaw from "@/assets/portfolio/law.jpg";
import pAgency from "@/assets/portfolio/agency.jpg";
import pInterior from "@/assets/portfolio/interior.jpg";
import pTravel from "@/assets/portfolio/travel.jpg";
import pEcommerce from "@/assets/portfolio/ecommerce.jpg";
import pMobile from "@/assets/portfolio/mobileapp.jpg";
import pSaas from "@/assets/portfolio/saas.jpg";
import pAradhya from "@/assets/portfolio/aradhya-placement.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitContact, subscribeNewsletter } from "@/lib/contact.functions";

/* ---------------- Utilities ---------------- */
async function copyToClipboard(text: string, label = "Copied") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    toast.success(`${label}: ${text}`);
  } catch {
    toast.error("Copy failed — please try again.");
  }
}

gsap.registerPlugin(ScrollTrigger);

function useGsapReveals() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-stagger] > *").forEach((el, i) => {
        gsap.from(el, { y: 30, opacity: 0, duration: 0.7, delay: i * 0.05, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" } });
      });
    });
    return () => ctx.revert();
  }, []);
}

/* ---------------- Cursor + Progress ---------------- */
function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let rx = 0, ry = 0, x = 0, y = 0, raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`; };
    const loop = () => { rx += (x - rx) * 0.15; ry += (y - ry) * 0.15;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop); };
    window.addEventListener("mousemove", move); loop();
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);
  return (<>
    <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block -ml-4 -mt-4 h-8 w-8 rounded-full border border-white/40 mix-blend-difference" />
    <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block -ml-1 -mt-1 h-2 w-2 rounded-full bg-white mix-blend-difference" />
  </>);
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  return <motion.div style={{ scaleX: width, transformOrigin: "0%" }} className="fixed left-0 top-0 z-[90] h-[3px] w-full bg-gradient-brand" />;
}

function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1400); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div exit={{ y: "-100%" }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6">
            <motion.img src={logo} alt="Explisoft" className="h-14 w-auto"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} />
            <div className="h-[2px] w-48 overflow-hidden rounded bg-white/10">
              <motion.div className="h-full bg-gradient-brand"
                initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Nav ---------------- */
const RING_R = 16;
const RING_C = 2 * Math.PI * RING_R;

function ScrollRing({ progress }: { progress: MotionValue<number> }) {
  const dashOffset = useTransform(progress, (v) => RING_C - Math.min(Math.max(v, 0), 1) * RING_C);
  const textRef = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(progress, "change", (v) => {
    if (textRef.current) textRef.current.textContent = String(Math.round(v * 100));
  });
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-full glass" aria-label="Scroll progress" role="progressbar">
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="scrollRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.48 0.29 268)" />
            <stop offset="60%" stopColor="oklch(0.47 0.27 293)" />
            <stop offset="100%" stopColor="oklch(0.57 0.24 320)" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r={RING_R} stroke="currentColor" strokeOpacity="0.12" strokeWidth="2.5" fill="none" />
        <motion.circle cx="20" cy="20" r={RING_R} stroke="url(#scrollRingGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"
          strokeDasharray={RING_C} style={{ strokeDashoffset: dashOffset, willChange: "stroke-dashoffset" }} />
      </svg>
      <span ref={textRef} className="text-[10px] font-semibold tabular-nums text-foreground/80">0</span>
    </div>
  );
}

const NAV = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#portfolio" },
  { label: "Process", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const { scrollYProgress } = useScroll();
  const progressSpring = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  useEffect(() => {
    const ids = NAV.map(n => n.href.replace(/^#/, ""));
    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive("#" + visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  const smoothScrollTo = (href: string) => {
    setOpen(false);
    const id = href.replace(/^#/, "");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", href); }
    }, 320);
  };
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on(); window.addEventListener("scroll", on); return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (<>
    <header className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 glass shadow-soft ${scrolled || open ? "lg:glass lg:shadow-soft" : "lg:bg-transparent lg:shadow-none"}`}>
          <a href="#top" className="flex items-center gap-2">
            <img src={logo} alt="Explisoft Technology" className="h-9 w-auto" />
          </a>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(n => (
              <a key={n.href} href={n.href}
                className={`relative rounded-full px-4 py-2 text-sm transition hover:bg-white/5 hover:text-foreground ${active === n.href ? "text-foreground" : "text-foreground/70"}`}>
                {n.label}
                {active === n.href && <motion.span layoutId="nav-active-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gradient-brand" />}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <ScrollRing progress={progressSpring} />
            <Button asChild variant="brand" size="pill">
              <a href="#contact">Free strategy call <ArrowRight className="ml-1 h-4 w-4" /></a>
            </Button>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <ScrollRing progress={progressSpring} />
            <button className="relative z-[60] grid h-11 w-11 place-items-center rounded-full glass text-foreground"
              onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </header>

    <AnimatePresence>
      {open && (
        <motion.div key="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-[55] lg:hidden">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setOpen(false)} />
          <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
          <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="relative flex h-full flex-col overflow-y-auto px-5 pb-12 pt-24 sm:px-6 sm:pt-28">
            <ul className="flex flex-1 flex-col gap-1">
              {NAV.map((n, i) => (
                <motion.li key={n.href} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-white/5">
                  <a href={n.href} onClick={(e) => { e.preventDefault(); smoothScrollTo(n.href); }}
                    className={`group flex min-h-[56px] items-center justify-between gap-3 py-4 text-2xl font-bold tracking-tight transition hover:text-foreground sm:text-3xl ${active === n.href ? "text-foreground" : "text-foreground/70"}`}>
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className={`shrink-0 text-xs font-mono ${active === n.href ? "text-[color:var(--magenta)]" : "text-foreground/40"}`}>0{i + 1}</span>
                      {active === n.href ? <span className="truncate text-gradient">{n.label}</span> : <span className="truncate">{n.label}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      {active === n.href && <motion.span layoutId="mobile-active-pill" className="h-2 w-2 rounded-full bg-gradient-brand shadow-glow" />}
                      <ArrowUpRight className={`h-5 w-5 sm:h-6 sm:w-6 transition group-hover:-translate-y-1 group-hover:translate-x-1 ${active === n.href ? "text-[color:var(--magenta)]" : "text-foreground/40 group-hover:text-[color:var(--magenta)]"}`} />
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.1 + NAV.length * 0.05, duration: 0.5 }} className="mt-6 space-y-4 pb-24 sm:pb-16">
              <Button asChild variant="brand" size="hero" className="w-full">
                <a href="#contact" onClick={(e) => { e.preventDefault(); smoothScrollTo("#contact"); }}>Book free strategy call <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <div className="flex flex-col gap-3 text-sm text-foreground/70 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
                <a href="mailto:explisoft@gmail.com" className="flex min-w-0 items-center gap-2 hover:text-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">explisoft@gmail.com</span>
                </a>
                <a href="tel:+917283038128" className="flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0" /> +91 7283038128
                </a>
                <a href="tel:+919650680558" className="flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0" /> +91 9650680558
                </a>
              </div>
            </motion.div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  </>);
}

/* ---------------- Utilities: Magnetic + Counter + SectionHeader ---------------- */
function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = "translate(0,0)"; };
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className="block w-full sm:inline-block sm:w-auto transition-transform duration-300">{children}</div>;
}

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400; const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(p * (2 - p) * to);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{decimals ? n.toFixed(decimals) : Math.floor(n)}</span>;
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div data-reveal className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/70">
        <Sparkles className="h-3 w-3 text-[color:var(--cyan)]" /> {eyebrow}
      </div>
      <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">{title}</h2>
      {sub && <p className="mt-5 text-base sm:text-lg text-foreground/60">{sub}</p>}
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgWrap = useRef<HTMLDivElement>(null);
  const yImg = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from("[data-hero-badge]", { y: 20, opacity: 0, duration: 0.6 })
        .from("[data-hero-word]", { y: 80, opacity: 0, duration: 0.9, stagger: 0.07 }, "-=0.3")
        .from("[data-hero-sub]", { y: 20, opacity: 0, duration: 0.7 }, "-=0.5")
        .from("[data-hero-bullet]", { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.4")
        .from("[data-hero-cta] > *", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.3");
      if (imgWrap.current) {
        gsap.from(imgWrap.current, { scale: 0.85, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.3 });
        gsap.to(imgWrap.current, { y: -20, duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
    }, ref);
    return () => ctx.revert();
  }, []);

  const bullets = [
    "Website delivered in 14 days",
    "AI-powered business automation",
    "Full-service digital growth partner",
    "Dedicated support",
  ];

  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] overflow-hidden pt-40 sm:pt-52 lg:pt-56">
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <motion.img src={heroBg} alt="" aria-hidden style={{ y: yImg }}
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-40 mix-blend-screen" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/40 to-background" />

      <div className="pointer-events-none absolute left-[8%] top-[30%] h-24 w-24 rounded-3xl bg-gradient-brand opacity-40 blur-2xl animate-float" />
      <div className="pointer-events-none absolute right-[10%] top-[20%] h-32 w-32 rounded-full bg-accent/50 blur-2xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div data-hero-badge className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--cyan)]" /> Websites · Apps · AI · Marketing
          </div>

          <h1 className="mt-6 text-[clamp(1.6rem,4.2vw,3.2rem)] font-bold leading-[1.1] tracking-tight">
            {"Stop losing customers to".split(" ").map((w, i) => (
              <span key={i} data-hero-word className="mr-2 sm:mr-3 inline-block">{w}</span>
            ))}
            <br />
            <span data-hero-word className="inline-block text-gradient animate-gradient">outdated websites.</span>
          </h1>

          <p data-hero-sub className="mx-auto lg:mx-0 mt-5 max-w-xl text-[15px] sm:text-lg text-foreground/70">
            We help startups, local businesses, ecommerce brands and enterprises generate more leads, increase sales and scale faster — with high-converting websites, custom mobile apps, AI automation and performance-driven digital marketing.
          </p>

          <ul className="mx-auto lg:mx-0 mt-6 grid max-w-xl grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {bullets.map(b => (
              <li key={b} data-hero-bullet className="flex items-center gap-2 text-foreground/80">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-brand text-white"><Check className="h-3 w-3" /></span>
                {b}
              </li>
            ))}
          </ul>

          <div data-hero-cta className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <MagneticButton>
              <Button asChild variant="brand" size="hero" className="w-full sm:w-auto">
                <a href="#contact">Book your free strategy call <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </MagneticButton>
            <Button asChild variant="ghostGlass" size="hero" className="w-full sm:w-auto">
              <a href="#services">Explore services</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-foreground/50 lg:text-left text-center">
            No obligation · Free consultation · Custom growth roadmap
          </p>

          <div id="trust" className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 border-t border-white/5 pt-6 sm:pt-8 sm:grid-cols-4 text-left">
            {[
              { n: 100, s: "+", l: "Projects" },
              { n: 98, s: "%", l: "Satisfaction" },
              { n: 5, s: "+ yrs", l: "Experience" },
              { n: 1000, s: "+", l: "Leads generated" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xl font-bold sm:text-3xl"><Counter to={s.n} />{s.s}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-foreground/50">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 relative flex items-center justify-center [perspective:1200px]">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
          </div>
          <div ref={imgWrap} className="relative w-full max-w-[340px] sm:max-w-[460px] lg:max-w-[560px] will-change-transform">
            <img src={heroVisual} alt="Explisoft growth dashboard" width={1024} height={1024}
              className="h-auto w-full drop-shadow-[0_30px_60px_rgba(0,50,250,0.35)]" />
            <div className="glass absolute left-3 sm:-left-8 top-6 sm:top-10 flex items-center gap-2 rounded-2xl px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs shadow-glow">
              <TrendingUp className="h-4 w-4 text-[color:var(--cyan)]" />
              <span><b>+185%</b> leads</span>
            </div>
            <div className="glass absolute right-3 sm:-right-6 top-1/3 flex items-center gap-2 rounded-2xl px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs shadow-glow">
              <Star className="h-4 w-4 text-[color:var(--magenta)]" />
              <span><b>4.9/5</b> rated</span>
            </div>
            <div className="glass absolute -bottom-2 sm:-bottom-4 left-4 sm:left-6 flex items-center gap-2 rounded-2xl px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs shadow-glow">
              <Zap className="h-4 w-4 text-[color:var(--cyan)]" />
              <span>14-day delivery</span>
            </div>
          </div>
        </div>
      </div>

      <motion.div className="absolute inset-x-0 bottom-6 flex justify-center" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
        <ChevronDown className="h-6 w-6 text-foreground/40" />
      </motion.div>
    </section>
  );
}

/* ---------------- Trust bar ---------------- */
function TrustBar() {
  const items = [
    { n: 100, s: "+", l: "Successful projects" },
    { n: 98, s: "%", l: "Client satisfaction" },
    { n: 5, s: "+", l: "Years of experience" },
    { n: 1000, s: "+", l: "Leads generated" },
  ];
  return (
    <section className="border-y border-white/5 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/40">Trusted by growing businesses</p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map(i => (
            <div key={i.l} className="text-center">
              <div className="text-3xl font-bold text-gradient sm:text-4xl"><Counter to={i.n} />{i.s}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-foreground/50">{i.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Problem ---------------- */
function Problem() {
  const pains = [
    "Visitors leaving without contacting you",
    "Low Google rankings",
    "Poor conversion rates",
    "Slow, outdated website",
    "Marketing campaigns that waste money",
    "Manual processes consuming valuable time",
  ];
  return (
    <section id="problem" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="The problem"
          title={<>Is your business <span className="text-gradient">losing customers online?</span></>}
          sub="Your business deserves more than a beautiful website. If it isn't bringing in leads and your competitors are growing faster — the problem isn't your product. It's your digital presence." />
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map(p => (
            <div key={p} className="glass flex items-start gap-3 rounded-2xl p-5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <XIcon className="h-4 w-4" />
              </span>
              <p className="text-sm text-foreground/80">{p}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-10 text-center text-base text-foreground/60">
          Every day you wait, potential customers choose <span className="text-gradient font-semibold">your competitors</span> instead.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Imagine ---------------- */
function Imagine() {
  const wins = [
    "Your website becomes your best salesperson",
    "Visitors instantly trust your brand",
    "Your business appears on Google",
    "Qualified leads arrive consistently",
    "Appointments get booked automatically",
    "Sales grow while your business runs more efficiently",
  ];
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Imagine instead"
          title={<>The digital presence <span className="text-gradient">you deserve.</span></>}
          sub="That's exactly what we build." />
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2">
          {wins.map(w => (
            <div key={w} className="glass flex items-start gap-3 rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
                <Check className="h-4 w-4" />
              </span>
              <p className="text-sm text-foreground/85">{w}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
const SERVICES = [
  {
    icon: Code2,
    t: "Website Development",
    d: "Professional, conversion-focused websites designed to attract customers and increase revenue.",
    perfect: "Perfect for businesses that want more leads and sales.",
    f: ["Custom website design", "Responsive development", "SEO optimization", "Lightning fast performance", "CMS integration", "Landing pages", "Analytics setup", "Security & maintenance"],
  },
  {
    icon: Smartphone,
    t: "Mobile App Development",
    d: "Bring your business to your customers with powerful mobile applications.",
    perfect: "Native quality on iOS & Android.",
    f: ["Android apps", "iOS apps", "Ecommerce apps", "Booking systems", "Business applications", "SaaS platforms", "Customer portals"],
  },
  {
    icon: Bot,
    t: "AI Automation",
    d: "Work smarter, not harder. Automate repetitive tasks and save hundreds of hours every month.",
    perfect: "Ideal for teams drowning in manual work.",
    f: ["Lead capture", "Customer support", "Appointment booking", "CRM automation", "Email follow-up", "Reporting", "Workflow automation"],
  },
  {
    icon: Megaphone,
    t: "Digital Marketing",
    d: "Your customers are already searching. We make sure they find you first — focused on customers, not clicks.",
    perfect: "Growth-hungry brands ready to scale.",
    f: ["Search Engine Optimization (SEO)", "Google Ads", "Facebook & Instagram Ads", "Content marketing", "Email marketing", "Conversion Rate Optimization", "Local SEO"],
  },
];
function Services() {
  return (
    <section id="services" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="What we do"
          title={<>Complete digital solutions, <span className="text-gradient">under one roof.</span></>}
          sub="Everything you need to launch, grow and dominate — from one accountable partner." />
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.t} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.08 }}
                className="group relative overflow-hidden rounded-3xl glass p-6 sm:p-8 transition hover:-translate-y-1 hover:shadow-glow">
                <div className="absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100"
                  style={{ background: "radial-gradient(500px 240px at 50% 0%, oklch(0.47 0.28 285 / 0.32), transparent 60%)" }} />
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-semibold">{s.t}</h3>
                <p className="mt-3 text-sm text-foreground/65">{s.d}</p>
                <div className="mt-6 text-[10px] uppercase tracking-[0.25em] text-foreground/40">What's included</div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {s.f.map(x => (
                    <li key={x} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--cyan)]" /> {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs italic text-foreground/50">{s.perfect}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why Choose Us (comparison) ---------------- */
function WhyUs() {
  const others = ["Generic templates", "Slow communication", "Design only", "No growth strategy", "Launch and disappear"];
  const us = ["Revenue-focused strategy", "Custom design & development", "Dedicated project manager", "Marketing expertise", "Long-term partnership", "Ongoing support"];
  return (
    <section id="why" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Why choose us"
          title={<>Most agencies build websites. <br /><span className="text-gradient">We build businesses.</span></>} />
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
            <div className="text-xs uppercase tracking-[0.25em] text-foreground/40">Other agencies</div>
            <div className="mt-2 text-xl font-semibold text-foreground/70">The typical experience</div>
            <ul className="mt-6 space-y-4">
              {others.map(o => (
                <li key={o} className="flex items-start gap-3 text-foreground/60">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
                    <XIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="line-through decoration-foreground/20">{o}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-glow"
            style={{ background: "linear-gradient(135deg, oklch(0.48 0.29 268 / 0.18), oklch(0.57 0.24 320 / 0.14))" }}>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--cyan)]">Our team</div>
            <div className="mt-2 text-xl font-semibold">The Explisoft way</div>
            <ul className="mt-6 space-y-4">
              {us.map(o => (
                <li key={o} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-glow">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium">{o}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Process (14-day) ---------------- */
const STEPS = [
  { n: "01", t: "Discovery Call", d: "We understand your business, goals and audience." },
  { n: "02", t: "Strategy & Planning", d: "We create a roadmap focused on conversions." },
  { n: "03", t: "Design", d: "Modern, premium UI/UX built around your brand." },
  { n: "04", t: "Development", d: "Fast, secure, responsive website development." },
  { n: "05", t: "Optimization", d: "SEO, speed, analytics and testing." },
  { n: "06", t: "Launch", d: "Go live with confidence and start generating leads." },
];
function Process() {
  return (
    <section id="process" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Our proven process"
          title={<>Live in <span className="text-gradient">14 days.</span></>}
          sub="Predictable, transparent, obsessed with outcomes." />
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:left-1/2" />
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className={`relative pl-12 lg:grid lg:grid-cols-2 lg:gap-16 lg:pl-0 ${i % 2 ? "lg:[&>div]:col-start-2" : ""}`}>
                <span className="absolute left-0 top-2 h-8 w-8 rounded-full border border-white/10 bg-background text-center text-sm leading-8 text-[color:var(--cyan)] lg:left-1/2 lg:-translate-x-1/2">
                  {i + 1}
                </span>
                <div className={`glass rounded-2xl p-6 ${i % 2 ? "lg:mr-auto" : "lg:ml-auto"} lg:max-w-md`}>
                  <div className="text-xs uppercase tracking-[0.25em] text-foreground/40">Step {s.n}</div>
                  <div className="mt-1 text-xl font-semibold">{s.t}</div>
                  <p className="mt-2 text-sm text-foreground/60">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Results That Matter ---------------- */
function Results() {
  const items = [
    { i: Users, t: "More qualified leads" },
    { i: Search, t: "Better Google rankings" },
    { i: Zap, t: "Faster websites" },
    { i: TrendingUp, t: "Higher conversion rates" },
    { i: Target, t: "Increased online sales" },
    { i: Sparkles, t: "Better customer experience" },
    { i: Award, t: "Stronger brand authority" },
  ];
  return (
    <section id="results" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Results that matter"
          title={<>What our clients <span className="text-gradient">experience.</span></>} />
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ i: Icon, t }) => (
            <div key={t} className="glass flex items-center gap-3 rounded-2xl p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Success Stories ---------------- */
const CASES = [
  { cat: "Local Business", brand: "Website Rebuild",
    stats: [{ v: 185, s: "%", l: "Increase in leads" }, { v: 71, s: "%", l: "Higher conversion" }, { v: 230, s: "%", l: "Organic traffic" }] },
  { cat: "Ecommerce", brand: "Growth Program",
    stats: [{ v: 4, s: "×", l: "Revenue growth" }, { v: 62, s: "%", l: "Lower CPA" }, { v: 327, s: "%", l: "Return on ad spend" }] },
  { cat: "Startup SaaS", brand: "Platform Launch",
    stats: [{ v: 50000, s: "+", l: "Users" }, { v: 100, s: "%", l: "Investor-ready" }, { v: 0, s: "days late", l: "On schedule" }] },
];
function SuccessStories() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Success stories"
          title={<>Numbers that <span className="text-gradient">move the needle.</span></>} />
        <div className="grid gap-6 lg:grid-cols-3">
          {CASES.map((c, i) => (
            <motion.div key={c.brand} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">{c.cat}</div>
              <h3 className="mt-1 text-2xl font-semibold">{c.brand}</h3>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/5 pt-6">
                {c.stats.map((s, j) => (
                  <div key={j}>
                    <div className="text-2xl font-bold text-gradient"><Counter to={s.v} />{s.s}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-foreground/50">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
const TESTS = [
  { q: "Our new website paid for itself within the first month. We immediately saw more inquiries and higher-quality leads.", n: "Business Owner", r: "Local services" },
  { q: "The communication was excellent from start to finish. They delivered exactly what they promised.", n: "Startup Founder", r: "SaaS" },
  { q: "They're more than developers — they became our growth partner.", n: "CEO", r: "Ecommerce brand" },
];
function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % TESTS.length), 6000); return () => clearInterval(t); }, []);
  const t = TESTS[i];
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeader eyebrow="What clients say" title={<>Loved by <span className="text-gradient">founders & owners.</span></>} />
        <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-14">
          <div className="mb-6 flex gap-1">
            {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-[color:var(--cyan)] text-[color:var(--cyan)]" />)}
          </div>
          <AnimatePresence mode="wait">
            <motion.blockquote key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
              className="text-2xl font-medium leading-snug sm:text-3xl">
              "{t.q}"
            </motion.blockquote>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-brand" />
              <div><div className="font-semibold">{t.n}</div><div className="text-xs text-foreground/50">{t.r}</div></div>
            </div>
            <div className="flex gap-1.5">
              {TESTS.map((_, k) => (
                <button key={k} onClick={() => setI(k)}
                  aria-label={`Show testimonial ${k + 1}`}
                  className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-gradient-brand" : "w-2 bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Included ---------------- */
function Included() {
  const items = ["Strategy workshop", "Custom design", "Responsive development", "Mobile optimization", "Basic SEO", "Speed optimization", "Analytics integration", "SSL security", "CMS training", "Launch support"];
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Every project includes"
          title={<>No surprises. <span className="text-gradient">Just outcomes.</span></>} />
        <div data-reveal-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(x => (
            <div key={x} className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
              <Check className="h-4 w-4 shrink-0 text-[color:var(--cyan)]" />
              <span className="text-sm">{x}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */
const PLAN_FEATURES: { label: string; values: (string | boolean)[] }[] = [
  { label: "Pages",                     values: ["Up to 5", "Up to 10", "Up to 20"] },
  { label: "Domain + Hosting (1 Year)", values: [true, true, true] },
  { label: "Mobile Responsive",         values: [true, true, true] },
  { label: "SSL + Business Email",      values: [true, true, true] },
  { label: "SEO + Speed Optimization",  values: [true, true, true] },
  { label: "Custom UI Design",          values: [true, true, true] },
  { label: "WhatsApp Integration",      values: [true, true, true] },
  { label: "Free Support",              values: ["30 days", "90 days", "1 Year"] },
];
const PLANS = [
  { n: "Starter",  p: "₹14,999", tag: "Launch your online presence" },
  { n: "Business", p: "₹29,999", tag: "Most popular", featured: true },
  { n: "Premium",  p: "₹49,999", tag: "Full-scale premium website" },
];
function Pricing() {
  return (
    <section id="pricing" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Pricing"
          title={<>Premium websites, <span className="text-gradient">honest pricing.</span></>}
          sub="Custom UI · Fast delivery · 1-year domain & hosting · Free support · WhatsApp integration included." />
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((pl, i) => (
            <motion.div key={pl.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition ${pl.featured ? "bg-gradient-brand text-white shadow-glow lg:scale-[1.03]" : "glass hover:-translate-y-1"}`}>
              {pl.featured && (
                <div className="absolute right-5 top-5 rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
                  Most popular
                </div>
              )}
              <div className={`text-xs uppercase tracking-widest ${pl.featured ? "opacity-80" : "text-foreground/50"}`}>{pl.tag}</div>
              <div className="mt-2 text-2xl font-semibold">{pl.n}</div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold sm:text-5xl">{pl.p}</span>
                <span className={`text-xs ${pl.featured ? "opacity-80" : "text-foreground/50"}`}>one-time</span>
              </div>
              <div className="my-6 h-px w-full bg-white/10" />
              <ul className="space-y-3 text-sm">
                {PLAN_FEATURES.map(f => {
                  const v = f.values[i];
                  return (
                    <li key={f.label} className="flex items-start justify-between gap-3">
                      <span className={`flex items-start gap-2 ${pl.featured ? "" : "text-foreground/75"}`}>
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${pl.featured ? "" : "text-[color:var(--cyan)]"}`} />
                        {f.label}
                      </span>
                      {typeof v === "string" && (
                        <span className={`shrink-0 text-xs font-semibold ${pl.featured ? "opacity-90" : "text-foreground/90"}`}>{v}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Button asChild variant={pl.featured ? "secondary" : "brand"} className="mt-8 w-full">
                <a href="#contact">Get started <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-foreground/50">
          * Prices exclude GST. Custom requirements? <a href="#contact" className="text-foreground underline underline-offset-4">Request a custom quote</a>.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Commitment ---------------- */
function Commitment() {
  const items = [
    { i: Shield, t: "No hidden fees" },
    { i: Rocket, t: "No shortcuts" },
    { i: Clock, t: "No missed deadlines" },
    { i: TrendingUp, t: "Just measurable results" },
  ];
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <div data-reveal className="mx-auto mb-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/70">
            <Sparkles className="h-3 w-3 text-[color:var(--cyan)]" /> Our commitment
          </div>
          <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            We don't disappear <span className="text-gradient">after launch.</span>
          </h2>
          <p className="mt-5 text-lg text-foreground/60">
            We partner with your business to ensure your digital presence continues to grow.
          </p>
        </div>
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ i: Icon, t }) => (
            <div key={t} className="glass flex flex-col items-center gap-3 rounded-2xl p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  { q: "How long does a website take?", a: "Most websites are completed within 14 days." },
  { q: "Can you redesign my current website?", a: "Yes. We can improve or completely rebuild your existing website." },
  { q: "Do you offer ongoing support?", a: "Absolutely. We provide maintenance, updates, SEO and marketing services." },
  { q: "Can you build custom web applications?", a: "Yes. We develop SaaS platforms, dashboards, CRMs, portals and enterprise software." },
  { q: "Will you help generate leads after launch?", a: "Yes. We offer SEO, Google Ads, Meta Ads, content marketing and conversion optimization." },
];
function FAQ() {
  return (
    <section id="faq" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader eyebrow="FAQ" title={<>Frequently asked <span className="text-gradient">questions.</span></>} />
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={"i" + i} className="glass mb-3 rounded-2xl border-white/5 px-6">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-foreground/60">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */
function Field({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label htmlFor={name} className="text-xs uppercase tracking-widest text-foreground/60">{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} maxLength={100}
        className="mt-2 h-12 rounded-xl border-white/10 bg-white/5" />
    </div>
  );
}

function Contact() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const send = useServerFn(submitContact);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const mobile = String(data.get("mobile") || "").trim();
    const company = String(data.get("company") || "").trim();
    const service = String(data.get("service") || "").trim();
    const budget = String(data.get("budget") || "").trim();
    if (!name || name.length > 100) return toast.error("Please enter a valid name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email.");
    if (message.length < 10 || message.length > 2000) return toast.error("Tell us a bit more about your project.");
    setLoading(true);
    const tid = toast.loading("Sending your message…");
    try {
      const res = await send({ data: { name, email, mobile, company, service, budget, message } });
      form.reset();
      setDone(true);
      toast.success("Thanks! We'll reply within 24 hours.", {
        id: tid,
        description: `Submission ID: ${res.submissionId} — a copy is on its way to ${email}.`,
      });
      setTimeout(() => setDone(false), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error("Couldn't send your message", { id: tid, description: msg.slice(0, 160) });
    } finally {
      setLoading(false);
    }
  };
  return (
    <section id="contact" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/70">
              <Sparkles className="h-3 w-3 text-[color:var(--cyan)]" /> Free strategy call
            </div>
            <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Ready to <span className="text-gradient">grow your business?</span>
            </h2>
            <p className="mt-5 text-foreground/60">
              Your competitors are investing every day. Don't let another customer choose them instead of you. Book your free strategy call and get a custom growth roadmap.
            </p>
            <p className="mt-4 text-xs text-foreground/50">
              Free consultation · No obligation · Custom growth plan
            </p>
            <div className="mt-8 space-y-4">
              {[
                { i: Phone, t: "Call us", v: "+91 7283038128", href: "tel:+917283038128" },
                { i: Phone, t: "Call us", v: "+91 9650680558", href: "tel:+919650680558" },
                { i: Mail, t: "Email", v: "explisoft@gmail.com", href: "mailto:explisoft@gmail.com" },
                { i: MapPin, t: "Office", v: "Laxmi Nagar, Delhi, India" },
                { i: Clock, t: "Hours", v: "Mon – Sat · 10am – 8pm IST" },
              ].map((c, i) => {
                const isEmail = c.t === "Email";
                return (
                  <div key={i} className="glass group flex items-start gap-4 rounded-2xl p-4 transition hover:border-white/20">
                    <a href={c.href} className="flex flex-1 items-start gap-4">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-white"><c.i className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-widest text-foreground/40">{c.t}</div>
                        <div className="mt-0.5 font-semibold break-all">{c.v}</div>
                      </div>
                    </a>
                    {isEmail && (
                      <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(c.v, "Email copied"); }}
                        aria-label={`Copy email ${c.v}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground/70 transition hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <form onSubmit={submit} className="glass rounded-3xl p-6 sm:p-8 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Full name" placeholder="Priya Sharma" />
              <Field name="email" type="email" label="Email" placeholder="you@company.com" />
              <Field name="mobile" label="Mobile number" placeholder="+91 " />
              <Field name="company" label="Company name" placeholder="Optional" />
              <div>
                <Label className="text-xs uppercase tracking-widest text-foreground/60">Service required</Label>
                <Select name="service">
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-white/10 bg-white/5"><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {["Website Development", "Mobile App", "AI Automation", "Digital Marketing", "Ecommerce", "Something else"].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-foreground/60">Budget</Label>
                <Select name="budget">
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-white/10 bg-white/5"><SelectValue placeholder="Select budget" /></SelectTrigger>
                  <SelectContent>
                    {["Under $1k", "$1k – $3k", "$3k – $10k", "$10k – $25k", "$25k+"].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="message" className="text-xs uppercase tracking-widest text-foreground/60">Tell us about your project</Label>
              <Textarea id="message" name="message" placeholder="A short description helps us prepare the right response." rows={5}
                className="mt-2 rounded-xl border-white/10 bg-white/5" maxLength={2000} />
            </div>
            <Button type="submit" variant="brand" size="hero" className="mt-6 w-full" disabled={loading}>
              {loading ? "Sending…" : done ? "Sent — thank you!" : <>Book my free strategy call <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-3 text-center text-xs text-foreground/40">By submitting, you agree to be contacted about your project.</p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function CTA() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-16 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-brand animate-gradient" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(600px_200px_at_50%_100%,rgba(0,0,0,0.4),transparent)]" />
          <Award className="mx-auto h-8 w-8 text-white/80" />
          <h3 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Ready to grow your business?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            Website, mobile app, AI automation or full digital marketing — book your free strategy call and discover how we help you generate more leads, increase sales and scale faster.
          </p>
          <Button asChild variant="secondary" size="hero" className="mt-8">
            <a href="#contact">Book my free strategy call <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
          <p className="mt-3 text-xs text-white/70">Free consultation · No obligation · Custom growth plan</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  const subscribe = useServerFn(subscribeNewsletter);
  const onSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email.");
    const tid = toast.loading("Subscribing…");
    try {
      await subscribe({ data: { email } });
      form.reset();
      toast.success("Subscribed!", { id: tid, description: "You're on the list — check your inbox." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again in a moment.";
      toast.error("Subscription failed", { id: tid, description: msg.slice(0, 160) });
    }
  };
  return (
    <footer className="border-t border-white/5 pt-12 sm:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <img src={logo} alt="Explisoft" className="h-10 w-auto" />
            <p className="mt-5 max-w-sm text-sm text-foreground/60">
              Websites, mobile apps, AI automation and digital marketing that grow ambitious businesses.
            </p>
            <form onSubmit={onSubscribe} className="mt-6 flex max-w-sm gap-2">
              <Input name="email" placeholder="Email for our newsletter" type="email" required maxLength={120}
                className="h-11 rounded-xl border-white/10 bg-white/5" />
              <Button variant="brand" type="submit">Join</Button>
            </form>
          </div>
          <FooterCol title="Services" links={["Website Development", "Mobile Apps", "AI Automation", "Digital Marketing"]} />
          <FooterCol title="Company" links={["Process", "Pricing", "FAQ", "Contact"]} />
          <FooterCol title="Reach us" links={["+91 7283038128", "+91 9650680558", "kamalkumarsinduriya89@gmail.com", "Laxmi Nagar, Delhi"]} />
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-xs text-foreground/50 sm:flex-row">
          <div>© {new Date().getFullYear()} Explisoft Technology. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Instagram</a>
            <a href="#" className="hover:text-foreground">LinkedIn</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
function FooterCol({ title, links }: { title: string; links: string[] }) {
  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
  const isPhone = (s: string) => /^[+\d][\d\s()-]{6,}$/.test(s);
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-foreground/40">{title}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map(l => {
          if (isEmail(l)) return (
            <li key={l} className="flex items-center gap-2">
              <a href={`mailto:${l}`} className="break-all text-foreground/70 hover:text-foreground">{l}</a>
              <button type="button" onClick={() => copyToClipboard(l, "Email copied")}
                aria-label={`Copy email ${l}`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-foreground/60 transition hover:bg-white/10 hover:text-foreground">
                <Copy className="h-3 w-3" />
              </button>
            </li>
          );
          if (isPhone(l)) return (
            <li key={l} className="flex items-center gap-2">
              <a href={`tel:${l.replace(/\s/g, "")}`} className="text-foreground/70 hover:text-foreground">{l}</a>
              <button type="button" onClick={() => copyToClipboard(l, "Phone copied")}
                aria-label={`Copy phone number ${l}`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-foreground/60 transition hover:bg-white/10 hover:text-foreground">
                <Copy className="h-3 w-3" />
              </button>
            </li>
          );
          return <li key={l}><a href="#" className="text-foreground/70 hover:text-foreground">{l}</a></li>;
        })}
      </ul>
    </div>
  );
}

/* ---------------- Floating contacts + back to top ---------------- */
function FloatingContacts() {
  const phone1 = "+917283038128";
  const phone2 = "+919650680558";
  const waMsg = encodeURIComponent("Hi Explisoft, I'd like to book a free strategy call.");
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:left-6 sm:gap-3">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
        className="group relative flex items-center">
        <a href={`https://wa.me/${phone2.replace(/\D/g, "")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="relative grid h-11 w-11 sm:h-14 sm:w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-glow transition-transform hover:scale-108 active:scale-95">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" />
          <svg className="relative h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.709 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}
        className="group relative flex items-center">
        <a href={`tel:${phone2}`} aria-label="Call us"
          className="relative grid h-11 w-11 sm:h-14 sm:w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-glow transition-transform hover:scale-108 active:scale-95">
          <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--primary)] opacity-30" />
          <Phone className="relative h-5 w-5 sm:h-6 sm:w-6" />
        </a>
      </motion.div>
    </div>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const on = () => setShow(window.scrollY > 800);
    window.addEventListener("scroll", on); return () => window.removeEventListener("scroll", on); }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow">
          <ChevronDown className="h-5 w-5 rotate-180" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Page ---------------- */
export default function HomePage() {
  return <HomePageInner />;
}

/* ---------------- Portfolio ---------------- */
type Project = { t: string; c: string; stack: string; img: string; d: string; href?: string };
const PROJECTS: Project[] = [
  { t: "Aradhya Placement Services", c: "Website", stack: "Next.js · Tailwind · CMS", img: pAradhya,
    d: "Recruitment platform with 3,000+ live jobs, category & location search, and lead capture.",
    href: "https://aradhyaplacementindia.in/" },
  { t: "Ember & Oak Restaurant", c: "Website", stack: "WordPress · WooCommerce", img: pRestaurant,
    d: "Custom WP theme with online reservations, menu builder and Woo-powered ordering." },
  { t: "Loomcraft Store", c: "Ecommerce", stack: "Shopify · Hydrogen", img: pEcommerce,
    d: "D2C store rebuild — PDP redesign, one-page checkout and shopping ads." },
  { t: "Pulse Fit App", c: "Mobile App", stack: "React Native · Figma", img: pMobile,
    d: "iOS & Android fitness app with workout flows, streaks and a live coach chat." },
  { t: "Wanderly Travel", c: "Mobile App", stack: "Figma · Design System", img: pTravel,
    d: "Travel app UX with itinerary builder, offline maps and social trip sharing." },
  { t: "Meridian Health", c: "Mobile App", stack: "Figma · UX Research", img: pHealth,
    d: "Patient app: doctor booking, prescriptions and lab reports in one flow." },
  { t: "Ironside Gym — Growth", c: "Marketing", stack: "Meta Ads · SEO", img: pGym,
    d: "3× membership signups via Meta ads, local SEO and content calendar." },
  { t: "Aurora Suites", c: "Marketing", stack: "Google Ads · SEO", img: pHotel,
    d: "Direct bookings up 62% with Google Ads, hotel SEO and lifecycle email." },
  { t: "Northstack Analytics", c: "SaaS", stack: "Next.js · tRPC · Prisma", img: pSaas,
    d: "SaaS dashboard with role-based access, billing and real-time charts." },
  { t: "Vista Lead CRM", c: "SaaS", stack: "Next.js · Postgres · Stripe", img: pRealestate,
    d: "Real-estate CRM: listings, lead scoring and WhatsApp automations." },
  { t: "Halston Docs", c: "SaaS", stack: "Next.js · MDX · Auth", img: pLaw,
    d: "Legal document automation with templates, e-sign and team workspaces." },
  { t: "Living Line Studio", c: "Branding", stack: "Figma · Brand Kit", img: pInterior,
    d: "Interior studio brand kit with print-ready portfolio and pitch deck." },
  { t: "Byline Identity", c: "Branding", stack: "Illustrator · Figma", img: pAgency,
    d: "Full identity: logo, typography, color system and social templates." },
];
function Portfolio() {
  const cats = ["All", ...Array.from(new Set(PROJECTS.map(p => p.c)))];
  const [f, setF] = useState("All");
  const shown = f === "All" ? PROJECTS : PROJECTS.filter(p => p.c === f);
  return (
    <section id="portfolio" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Selected work"
          title={<>Work we're <span className="text-gradient">proud to sign.</span></>}
          sub="A snapshot of the sites, apps and campaigns we've shipped." />
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {cats.map(c => (
            <button key={c} onClick={() => setF(c)}
              className={`rounded-full border px-4 py-1.5 text-xs transition ${
                f === c ? "border-transparent bg-gradient-brand text-white" : "border-white/10 text-foreground/60 hover:border-white/30"
              }`}>{c}</button>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <motion.article key={p.t} layout initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
              className="group relative overflow-hidden rounded-3xl glass">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={p.img} alt={`${p.t} — ${p.c} project by Explisoft`}
                  loading="lazy" width={1024} height={768}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-foreground/40">{p.c} · {p.stack}</div>
                    <div className="mt-1 text-lg font-semibold">{p.t}</div>
                  </div>
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer"
                      aria-label={`Visit ${p.t}`}
                      className="glass shrink-0 rounded-full p-2 transition hover:bg-white/10">
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="glass shrink-0 rounded-full p-2 opacity-70">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">{p.d}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePageInner() {
  useGsapReveals();
  return (
    <div className="dark relative min-h-screen bg-background text-foreground">
      <Loader />
      <Cursor />
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <Problem />
        <Services />
        <Portfolio />
        <WhyUs />
        <Process />
        <SuccessStories />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
        <CTA />
        <Footer />
      </main>
      <FloatingContacts />
      <BackToTop />
    </div>
  );
}