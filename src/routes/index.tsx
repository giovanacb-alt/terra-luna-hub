import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Battery, Droplets, Wind, Apple, Radio, Users,
  Thermometer, Sun, Radiation, Wrench, Package, Satellite, Moon, Gauge,
  ArrowUp, ArrowDown, Minus, Shield, CircleDot, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis,
} from "recharts";

export const Route = createFileRoute("/")({ component: Dashboard });

/* ---------- helpers ---------- */
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const fmt = (n: number, d = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });

type ResourceKey = "energy" | "water" | "oxygen" | "food";

interface Resource {
  key: ResourceKey;
  label: string;
  unit: string;
  level: number;     // % of capacity
  capacity: number;  // absolute
  consumption: number; // per sol (lunar day) absolute units
  production: number;  // per sol absolute units
  autonomyDays: number;
  trend: number;     // -1..+1
  icon: React.ComponentType<{ className?: string }>;
  accent: string;    // tailwind text color class
  bg: string;
}

/* ---------- main component ---------- */
function Dashboard() {
  const [now, setNow] = useState(() => new Date(0));
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => {
      setNow(new Date());
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // simulated live drift — only after mount to avoid SSR/CSR hydration mismatch
  const drift = (seed: number, amp = 1) =>
    mounted ? Math.sin((tick + seed) / 6) * amp + (Math.random() - 0.5) * amp * 0.4 : 0;

  const resources: Resource[] = useMemo(() => [
    {
      key: "energy", label: "Energia solar", unit: "kWh",
      level: clamp(78 + drift(1, 3)), capacity: 12000,
      consumption: 4820, production: 5240, autonomyDays: 12.4,
      trend: 0.4, icon: Zap, accent: "text-energy", bg: "from-[oklch(0.89_0.13_95/.18)] to-transparent",
    },
    {
      key: "water", label: "Água", unit: "L",
      level: clamp(64 + drift(2, 2)), capacity: 48000,
      consumption: 1180, production: 940, autonomyDays: 27.0,
      trend: -0.3, icon: Droplets, accent: "text-water", bg: "from-[oklch(0.71_0.11_240/.18)] to-transparent",
    },
    {
      key: "oxygen", label: "Oxigênio", unit: "kg",
      level: clamp(91 + drift(3, 1.5)), capacity: 3200,
      consumption: 86, production: 88, autonomyDays: 33.7,
      trend: 0.1, icon: Wind, accent: "text-oxygen", bg: "from-[oklch(0.81_0.09_180/.20)] to-transparent",
    },
    {
      key: "food", label: "Alimentos", unit: "kcal·k",
      level: clamp(42 + drift(4, 1.2)), capacity: 9600,
      consumption: 168, production: 102, autonomyDays: 22.1,
      trend: -0.6, icon: Apple, accent: "text-food", bg: "from-[oklch(0.70_0.12_140/.18)] to-transparent",
    },
  ], [tick]);

  return (
    <div className="min-h-screen text-foreground">
      <TopBar now={now} resources={resources} />
      <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 lg:px-8">
        <Hero />
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resources.map((r) => <ResourceCard key={r.key} r={r} />)}
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ConsumptionChart className="lg:col-span-2" />
          <EnvironmentPanel tick={tick} />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CrewPanel />
          <CommsPanel tick={tick} />
          <LifeSupportPanel resources={resources} />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AlertsPanel />
          <MaintenancePanel />
          <LogisticsPanel />
        </section>

        <EarthAnalogFooter />
      </main>
    </div>
  );
}

/* ---------- top bar ---------- */
function TopBar({ now, resources }: { now: Date; resources: Resource[] }) {
  const cycle = 14;
  const solarPhase = 68;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const time = mounted ? now.toLocaleTimeString("pt-BR", { hour12: false }).slice(0, 5) : "--:--";
  const critical = resources.filter((r) => r.level < 50).length;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary glow-solar">
            <Sun className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-success" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-none tracking-[0.18em]">LUMIS</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Gestão da colônia · começa nos dados, termina nas pessoas
            </p>
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-6 md:flex">
          <Stat label="CICLO" value={`#${cycle}`} mono />
          <Stat label="FASE SOLAR" value={`${solarPhase}%`} mono />
          <Stat label="HORÁRIO · UT" value={`${time} UT`} mono />
          <Stat label="HABITAT" value="Shackleton-South" />
          <div className="pill flex items-center gap-2">
            <CircleDot className={`h-3.5 w-3.5 ${critical > 0 ? "text-warning" : "text-success"} animate-pulse`} />
            <span className="text-xs font-medium">
              {critical > 0 ? `${critical} recurso(s) em atenção` : "Todos os módulos operacionais"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono-tight" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/* ---------- hero strip ---------- */
function Hero() {
  return (
    <div className="panel grid-bg relative overflow-hidden p-6 lg:p-8">
      <div className="absolute inset-y-0 right-0 w-[45%] bg-gradient-to-l from-primary/15 to-transparent" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono-tight text-xs uppercase tracking-[0.22em] text-primary">
            // Ciclo 14 · Fase solar 68% · 06:22 UT
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight md:text-[2.5rem]">
            Estar a 384 mil km da Terra exige mais do que dados —
            <span className="text-primary"> exige sentir que você pertence a algum lugar.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Lumis é construída na tensão entre dois estados: <span className="text-foreground">carga</span> e
            <span className="text-foreground"> uso</span>. Tudo depende de quanto sol captamos nas últimas horas.
            42 habitantes · 3 módulos pressurizados · 1 estufa hidropônica · 1 reator de fissão modular.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          <BigStat label="Habitantes" value="42" sub="100% saudáveis" />
          <BigStat label="Pressão" value="101.2" sub="kPa · nominal" />
          <BigStat label="Gravidade" value="0.166" sub="g lunar" />
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-l border-border pl-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-mono-tight text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ---------- resource card ---------- */
function ResourceCard({ r }: { r: Resource }) {
  const Icon = r.icon;
  const status =
    r.level < 35 ? { tone: "text-destructive", label: "CRÍTICO", dot: "bg-destructive" } :
    r.level < 55 ? { tone: "text-warning", label: "ATENÇÃO", dot: "bg-warning" } :
                   { tone: "text-success", label: "NOMINAL", dot: "bg-success" };
  const TrendIcon = r.trend > 0.15 ? ArrowUp : r.trend < -0.15 ? ArrowDown : Minus;
  const trendColor = r.trend > 0.15 ? "text-success" : r.trend < -0.15 ? "text-destructive" : "text-muted-foreground";

  // mini sparkline
  const spark = Array.from({ length: 24 }, (_, i) => ({
    x: i,
    y: clamp(r.level + Math.sin(i / 2) * 6 + (Math.random() - 0.5) * 4, 5, 99),
  }));

  return (
    <div className={`panel relative overflow-hidden p-5`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${r.bg}`} />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`grid h-9 w-9 place-items-center rounded-md border border-border bg-card/60 ${r.accent}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Recurso</p>
            <p className="text-sm font-medium">{r.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2 py-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} animate-pulse`} />
          <span className={`text-[10px] font-semibold tracking-wider ${status.tone}`}>{status.label}</span>
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono-tight text-4xl font-semibold tabular-nums">{fmt(r.level, 1)}<span className="text-base text-muted-foreground">%</span></p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {fmt((r.level / 100) * r.capacity)} / {fmt(r.capacity)} {r.unit}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-mono-tight">{r.trend > 0 ? "+" : ""}{(r.trend * 100).toFixed(1)}%/sol</span>
        </div>
      </div>

      {/* progress */}
      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className={`h-full rounded-full ${r.level < 35 ? "bg-destructive" : r.level < 55 ? "bg-warning" : "bg-success"}`}
          style={{ width: `${r.level}%` }}
        />
      </div>

      {/* spark */}
      <div className="relative mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`sp-${r.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.5} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke="currentColor" strokeWidth={1.5}
              fill={`url(#sp-${r.key})`} className={r.accent} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[11px]">
        <Mini label="Consumo" value={`${fmt(r.consumption)} ${r.unit}/sol`} />
        <Mini label="Produção" value={`${fmt(r.production)} ${r.unit}/sol`} />
        <Mini label="Autonomia" value={`${fmt(r.autonomyDays, 1)} sols`} highlight />
      </div>
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`font-mono-tight text-xs tabular-nums ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

/* ---------- consumption chart ---------- */
function ConsumptionChart({ className = "" }: { className?: string }) {
  const data = useMemo(
    () => Array.from({ length: 24 }, (_, h) => ({
      h: `${String(h).padStart(2, "0")}h`,
      energia: 60 + Math.sin(h / 3) * 18 + Math.random() * 6,
      agua: 40 + Math.cos(h / 4) * 10 + Math.random() * 4,
      oxigenio: 70 + Math.sin(h / 5 + 1) * 8 + Math.random() * 3,
      alimentos: 30 + Math.sin(h / 6 + 2) * 10 + Math.random() * 3,
    })),
    [],
  );
  return (
    <div className={`panel p-5 ${className}`}>
      <PanelHeader
        icon={Activity}
        title="Consumo de recursos · últimas 24h"
        right={<Legend />}
      />
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
            <XAxis dataKey="h" tick={{ fill: "oklch(0.72 0.025 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.72 0.025 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.028 252)", border: "1px solid oklch(0.32 0.035 255)",
                borderRadius: 8, fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.96 0.01 220)" }}
            />
            <Line type="monotone" dataKey="energia" stroke="oklch(0.89 0.13 95)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="agua" stroke="oklch(0.71 0.11 240)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="oxigenio" stroke="oklch(0.81 0.09 180)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="alimentos" stroke="oklch(0.70 0.12 140)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { c: "oklch(0.89 0.13 95)", l: "Energia" },
    { c: "oklch(0.71 0.11 240)", l: "Água" },
    { c: "oklch(0.81 0.09 180)", l: "Oxigênio" },
    { c: "oklch(0.70 0.12 140)", l: "Alimentos" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: i.c }} />
          {i.l}
        </div>
      ))}
    </div>
  );
}

/* ---------- environment ---------- */
function EnvironmentPanel({ tick }: { tick: number }) {
  const radiation = clamp(38 + Math.sin(tick / 5) * 6 + Math.sin(tick / 1.7) * 1.5, 0, 100);
  const surfaceTemp = -142 + Math.sin(tick / 8) * 6;
  const dust = clamp(12 + Math.sin(tick / 7) * 4, 0, 100);
  const solarFlux = clamp(72 + Math.sin(tick / 4) * 8, 0, 100);

  return (
    <div className="panel relative overflow-hidden p-5">
      <PanelHeader icon={Satellite} title="Ambiente externo" right={<span className="font-mono-tight text-[10px] uppercase tracking-wider text-muted-foreground">Cratera Shackleton · 89.9°S</span>} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Gauge1 label="Radiação solar" value={radiation} unit="µSv/h" icon={Radiation} threshold={70} color="oklch(0.74 0.18 320)" />
        <Gauge1 label="Fluxo solar" value={solarFlux} unit="%" icon={Sun} threshold={20} invert color="oklch(0.82 0.17 85)" />
        <Gauge1 label="Poeira regolítica" value={dust} unit="%" icon={Wind} threshold={60} color="oklch(0.82 0.16 195)" />
        <div className="rounded-md border border-border bg-background/40 p-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Thermometer className="h-3.5 w-3.5" /> Temperatura externa
          </div>
          <p className="mt-2 font-mono-tight text-2xl font-semibold tabular-nums">{surfaceTemp.toFixed(1)}°C</p>
          <p className="text-[11px] text-muted-foreground">Interior: 21.0°C · ΔT: {Math.abs(surfaceTemp - 21).toFixed(0)}°C</p>
        </div>
      </div>
    </div>
  );
}

function Gauge1({ label, value, unit, icon: Icon, threshold, color, invert }: {
  label: string; value: number; unit: string; icon: React.ComponentType<{ className?: string }>;
  threshold: number; color: string; invert?: boolean;
}) {
  const bad = invert ? value < threshold : value > threshold;
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 flex items-end gap-2">
        <p className="font-mono-tight text-2xl font-semibold tabular-nums" style={{ color }}>
          {value.toFixed(0)}<span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>
        </p>
        {bad && <span className="mb-1 rounded-sm bg-warning/20 px-1 text-[10px] font-semibold uppercase text-warning">alerta</span>}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-background/70">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------- crew ---------- */
const crew = [
  { name: "Cmd. A. Vasconcelos", role: "Comando", loc: "Centro Op.", hr: 72, status: "ok" },
  { name: "Dr. M. Okafor", role: "Médica-chefe", loc: "Med-Bay", hr: 68, status: "ok" },
  { name: "Eng. R. Tanaka", role: "Engenharia", loc: "Reator", hr: 88, status: "eva" },
  { name: "Bot. S. Lindqvist", role: "Estufa", loc: "Greenhouse", hr: 74, status: "ok" },
  { name: "Geo. L. Cardoso", role: "Geologia", loc: "EVA · Cratera", hr: 102, status: "eva" },
  { name: "Pilot J. Reyes", role: "Aviônica", loc: "Hangar", hr: 70, status: "ok" },
];

function CrewPanel() {
  return (
    <div className="panel p-5">
      <PanelHeader icon={Users} title="Tripulação ativa" right={<span className="text-[11px] text-muted-foreground">6 de 42 em turno · 2 em EVA</span>} />
      <ul className="mt-3 divide-y divide-border">
        {crew.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                {c.name.split(" ").slice(-1)[0]?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.role} · {c.loc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-mono-tight text-xs tabular-nums">{c.hr} bpm</p>
                <p className="text-[10px] text-muted-foreground">HR</p>
              </div>
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                c.status === "eva" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
              }`}>
                {c.status === "eva" ? "EVA" : "Interno"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- comms ---------- */
function CommsPanel({ tick }: { tick: number }) {
  const latency = 1.28 + Math.sin(tick / 6) * 0.04;
  const links = [
    { name: "Gateway-LOP", band: "Ka", strength: 92, kind: "Orbital" },
    { name: "Deep Space Network · Madrid", band: "X", strength: 78, kind: "Terra" },
    { name: "Constelação LunaNet", band: "S", strength: 64, kind: "Mesh" },
    { name: "Rover Selene-3 (EVA)", band: "UHF", strength: 88, kind: "Local" },
  ];
  return (
    <div className="panel p-5">
      <PanelHeader icon={Radio} title="Comunicações satelitais" right={<span className="font-mono-tight text-[11px] text-primary">RTT Terra · {latency.toFixed(2)}s</span>} />
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.name} className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{l.name}</p>
                <p className="text-[11px] text-muted-foreground">{l.kind} · Banda {l.band}</p>
              </div>
              <p className="font-mono-tight text-sm tabular-nums">{l.strength}%</p>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-background/70">
              <div className="h-full rounded-full bg-primary" style={{ width: `${l.strength}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- life support summary (radial) ---------- */
function LifeSupportPanel({ resources }: { resources: Resource[] }) {
  const data = resources.map((r) => ({
    name: r.label,
    value: r.level,
    fill:
      r.key === "energy" ? "oklch(0.89 0.13 95)" :
      r.key === "water" ? "oklch(0.71 0.11 240)" :
      r.key === "oxygen" ? "oklch(0.81 0.09 180)" :
                          "oklch(0.70 0.12 140)",
  }));
  const avg = resources.reduce((a, r) => a + r.level, 0) / resources.length;
  return (
    <div className="panel relative overflow-hidden p-5">
      <PanelHeader icon={Shield} title="Suporte à vida · síntese" right={<span className="text-[11px] text-muted-foreground">ECLSS v4.2</span>} />
      <div className="relative mt-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="62%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={10}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "oklch(1 0 0 / 5%)" }} dataKey="value" cornerRadius={999} />
            <Tooltip
              contentStyle={{ background: "oklch(0.22 0.018 258)", border: "1px solid oklch(0.47 0.045 265 / 50%)", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number, n: string) => [`${v.toFixed(1)}%`, n]}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="grid h-32 w-32 place-items-center rounded-full bg-background/85 ring-1 ring-border backdrop-blur-sm">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Índice</p>
              <p className="font-display text-3xl font-semibold tabular-nums leading-none">
                {avg.toFixed(0)}
                <span className="text-sm text-muted-foreground">/100</span>
              </p>
              <p className="mt-1 text-[10px] text-success">Sustentável</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
            <span className="truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- alerts ---------- */
const alerts = [
  { time: "06:42", level: "warn", title: "Estufa · pH solução nutritiva", text: "pH 6.8 acima do alvo (6.2). Calibrar dosador A-3.", mod: "Hidroponia" },
  { time: "05:18", level: "info", title: "Janela de comunicação · DSN", text: "Próxima janela em 02h12 (Goldstone).", mod: "Comms" },
  { time: "04:55", level: "crit", title: "Estoque alimentos < 45%", text: "Acelerar colheita de espirulina e iniciar racionamento leve.", mod: "Logística" },
  { time: "02:11", level: "warn", title: "EVA-12 · Cardoso", text: "Dosímetro 0.8mSv acumulado. Limite diário 1.2mSv.", mod: "Saúde" },
  { time: "01:30", level: "ok", title: "Reator · troca de filtros concluída", text: "Eficiência térmica restaurada para 96.3%.", mod: "Energia" },
];

function AlertsPanel() {
  const tone = (l: string) => l === "crit" ? "text-destructive bg-destructive/15" :
                              l === "warn" ? "text-warning bg-warning/15" :
                              l === "ok" ? "text-success bg-success/15" : "text-primary bg-primary/15";
  return (
    <div className="panel flex h-[300px] flex-col p-5">
      <PanelHeader icon={AlertTriangle} title="Alertas & eventos" right={<span className="text-[11px] text-muted-foreground">Últimas 8h</span>} />
      <ul className="mt-3 flex-1 space-y-2 overflow-y-auto no-scrollbar">
        {alerts.map((a) => (
          <li key={a.title} className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone(a.level)}`}>
                  {a.level === "crit" ? "Crítico" : a.level === "warn" ? "Atenção" : a.level === "ok" ? "Resolvido" : "Info"}
                </span>
                <p className="text-sm font-medium">{a.title}</p>
              </div>
              <span className="font-mono-tight text-[11px] text-muted-foreground">{a.time}</span>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">{a.text}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{a.mod}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- maintenance ---------- */
const maint = [
  { sys: "Reator modular MSR-1", next: "SOL 414", status: "agendado", owner: "Tanaka", pct: 0 },
  { sys: "Eletrolisador H₂O → O₂", next: "SOL 412", status: "em execução", owner: "Vasconcelos", pct: 62 },
  { sys: "Bomba térmica · módulo B", next: "SOL 418", status: "agendado", owner: "Tanaka", pct: 0 },
  { sys: "Painéis fotovoltaicos · array 3", next: "SOL 412", status: "atrasado", owner: "Reyes", pct: 25 },
  { sys: "Filtro CO₂ amina · ciclo 22", next: "SOL 413", status: "agendado", owner: "Okafor", pct: 0 },
];

function MaintenancePanel() {
  return (
    <div className="panel flex h-[300px] flex-col p-5">
      <PanelHeader icon={Wrench} title="Manutenção preditiva" right={<span className="text-[11px] text-muted-foreground">5 ordens ativas</span>} />
      <ul className="mt-3 flex-1 space-y-2.5 overflow-y-auto no-scrollbar">
        {maint.map((m) => (
          <li key={m.sys} className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{m.sys}</p>
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                m.status === "atrasado" ? "bg-destructive/15 text-destructive" :
                m.status === "em execução" ? "bg-primary/15 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>{m.status}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Próx.: <span className="font-mono-tight text-foreground">{m.next}</span> · {m.owner}</span>
              <span className="font-mono-tight">{m.pct}%</span>
            </div>
            {m.pct > 0 && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background/70">
                <div className="h-full rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- logistics ---------- */
const items = [
  { name: "Peças sobressalentes ECLSS", qty: 134, max: 200, unit: "un" },
  { name: "Filtros LiOH (CO₂)", qty: 18, max: 60, unit: "un" },
  { name: "Tanque LH₂", qty: 412, max: 600, unit: "kg" },
  { name: "Sementes (banco genético)", qty: 980, max: 1000, unit: "vials" },
  { name: "Suprimentos médicos críticos", qty: 72, max: 100, unit: "kits" },
  { name: "Combustível rover (LOX/RP-1)", qty: 220, max: 400, unit: "kg" },
];

function LogisticsPanel() {
  return (
    <div className="panel flex h-[300px] flex-col p-5">
      <PanelHeader icon={Package} title="Logística & suprimentos" right={<span className="text-[11px] text-muted-foreground">Próx. carga: SOL 438</span>} />
      <ul className="mt-3 flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {items.map((it) => {
          const pct = (it.qty / it.max) * 100;
          const low = pct < 35;
          return (
            <li key={it.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{it.name}</span>
                <span className={`font-mono-tight text-xs tabular-nums ${low ? "text-warning" : ""}`}>
                  {it.qty}/{it.max} {it.unit}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-background/70">
                <div className={`h-full rounded-full ${low ? "bg-warning" : "bg-primary/80"}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- footer: terrestrial analog ---------- */
function EarthAnalogFooter() {
  const items = [
    { title: "Cidades inteligentes", text: "Mesma lógica de telemetria distribuída para água, energia e mobilidade urbana." },
    { title: "Monitoramento ambiental", text: "Sensoriamento remoto satelital aplicado a desmatamento, geleiras e qualidade do ar." },
    { title: "Resposta a desastres", text: "Painel unificado de alertas para enchentes, incêndios e terremotos com priorização automática." },
    { title: "Sustentabilidade", text: "Otimização de produção vs. consumo em microrredes e agricultura de precisão." },
  ];
  return (
    <footer className="panel mt-6 p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.22em] text-primary">// Aplicação na Terra</p>
        <h3 className="text-xl font-semibold">A mesma arquitetura de decisão, em escala planetária.</h3>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Cada painel aqui se traduz diretamente em casos terrestres alimentados por dados satelitais —
          de sensoriamento remoto a constelações de comunicação.
        </p>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="rounded-md border border-border bg-background/40 p-4">
            <p className="text-sm font-semibold">{i.title}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{i.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span className="font-mono-tight">LUMIS · ciclo 14 · build {new Date().getFullYear()}</span>
        <span>FIAP Global Solution · Indústria Espacial</span>
      </div>
    </footer>
  );
}

/* ---------- shared ---------- */
function PanelHeader({ icon: Icon, title, right }: {
  icon: React.ComponentType<{ className?: string }>; title: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
      </div>
      {right}
    </div>
  );
}
