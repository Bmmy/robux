import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Search, Loader2, BadgeCheck } from "lucide-react";
import bgGrid from "@/assets/bg-grid.png";
import rivalsBundle from "@/assets/rivals-bundle.png";
import robuxLogo from "@/assets/robux.png";
import { searchRobloxUser, getRobloxAvatarFull } from "@/lib/roblox.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Get Robux — Bonus Store" },
      { name: "description", content: "Enjoy up to 25% more Robux on every package." },
    ],
  }),
  component: Index,
});

const Coin = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`inline-block ${className}`} aria-hidden>
    <defs>
      <radialGradient id="c1" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#fff7c2" />
        <stop offset="45%" stopColor="#f5c44a" />
        <stop offset="100%" stopColor="#8a5a0c" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#c1)" stroke="#3a2607" strokeWidth="0.6" />
    <path
      d="M9 7.2h4.6c2 0 3.2 1.1 3.2 2.8 0 1.3-.7 2.2-1.9 2.6l2.2 4.2H14l-1.9-3.8h-1v3.8H9V7.2zm3 4.4c.9 0 1.4-.4 1.4-1.2s-.5-1.2-1.4-1.2h-1v2.4h1z"
      fill="#3a2607"
    />
  </svg>
);

type Pkg = { amount: number; base: number; bonus: number; price: string };
const featured: Pkg[] = [
  { amount: 24000, base: 22500, bonus: 1500, price: "$199.99" },
  { amount: 11000, base: 10000, bonus: 1000, price: "$99.99" },
  { amount: 5250, base: 4500, bonus: 750, price: "$49.99" },
  { amount: 2000, base: 1700, bonus: 300, price: "$19.99" },
];
const standard: Pkg[] = [
  { amount: 1000, base: 800, bonus: 200, price: "$9.99" },
  { amount: 450, base: 400, bonus: 50, price: "$4.99" },
];

function PackageRow({ p }: { p: Pkg }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Coin className="size-6 shrink-0" />
        <span className="font-bold text-lg tabular-nums">{p.amount.toLocaleString()}</span>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground text-sm line-through">
          <Coin className="size-4 opacity-60" />
          {p.base.toLocaleString()}
        </span>
        <span className="hidden md:inline-flex text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
          + {p.bonus.toLocaleString()} more
        </span>
      </div>
      <Button className="rounded-full bg-surface-3 hover:bg-surface-3/80 text-foreground font-semibold min-w-[110px]">
        {p.price}
      </Button>
    </div>
  );
}

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type RUser = {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  created: string;
  hasVerifiedBadge?: boolean;
};

function formatJoinDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Index() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"search" | "amount" | "sending" | "done">("search");
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 350);
  const [selected, setSelected] = useState<RUser | null>(null);
  const [amount, setAmount] = useState<number>(25);

  const balance = 232581314;

  const search = useServerFn(searchRobloxUser);
  const fullAvatar = useServerFn(getRobloxAvatarFull);

  const { data, isFetching } = useQuery({
    queryKey: ["roblox-search", debounced],
    queryFn: () => search({ data: { query: debounced } }),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const { data: avatarFull } = useQuery({
    queryKey: ["roblox-avatar", selected?.id],
    queryFn: () => fullAvatar({ data: { userId: selected!.id } }),
    enabled: !!selected,
    staleTime: 5 * 60_000,
  });

  const reset = () => {
    setStep("search");
    setQuery("");
    setSelected(null);
    setAmount(25);
  };

  const users: RUser[] = useMemo(() => data?.users ?? [], [data]);

  const handleSend = () => {
    setStep("sending");
    setTimeout(() => setStep("done"), 1600);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60 bg-no-repeat bg-cover bg-top"
        style={{ backgroundImage: `url(${bgGrid})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

      <header className="relative z-10 flex justify-end px-6 pt-6">
        <div className="flex items-center gap-2 rounded-full bg-surface/80 backdrop-blur border border-border px-2 py-1.5 shadow-lg">
          <div className="flex items-center gap-2 px-3">
            <img src={robuxLogo} alt="RRobux logo" className="size-5 rounded-full object-cover" />
            <span className="font-bold tabular-nums">{balance.toLocaleString()}</span>
          </div>
          <button
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors px-3 py-1.5 text-sm font-medium"
          >
            <Upload className="size-3.5" />
            Send
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-12 pb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Enjoy up to <span className="text-primary">25%</span>
          <br />
          more Robux
        </h1>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-8">
        <p className="text-sm text-muted-foreground mb-3 px-1">Bonus item we picked for you</p>
        <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-2xl">
          <div className="relative h-24 bg-gradient-to-r from-zinc-800 to-zinc-700 overflow-hidden">
            <img src={rivalsBundle} alt="Featured bundle" className="absolute inset-0 w-full h-full object-cover object-left" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          </div>
          <div>{featured.map((p) => <PackageRow key={p.amount} p={p} />)}</div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
        <p className="text-sm text-muted-foreground mb-3 px-1">Robux packages</p>
        <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-xl">
          {standard.map((p) => <PackageRow key={p.amount} p={p} />)}
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-[400px] bg-surface border-border p-0 gap-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 font-semibold">
              <Coin className="size-5" /> Send Robux
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Coin className="size-4" />
                <span className="tabular-nums">{balance.toLocaleString()}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {step === "search" && (
            <div className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Roblox username…"
                  className="pl-9 bg-surface-2 border-primary/60 focus-visible:ring-primary"
                />
                {isFetching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
              </div>

              <p className="mt-4 mb-2 text-sm font-medium">
                {debounced.length < 2 ? "Type a username to search" : `Results (${users.length})`}
              </p>

              <div className="max-h-[280px] overflow-y-auto -mx-1 pr-1 space-y-0.5">
                {debounced.length >= 2 && !isFetching && users.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No users found.</p>
                )}
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelected(u);
                      setStep("amount");
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
                  >
                    <div className="size-9 rounded-full bg-surface-3 overflow-hidden shrink-0">
                      {u.avatarUrl && (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 font-medium truncate">
                        {u.displayName}
                        {u.hasVerifiedBadge && <BadgeCheck className="size-4 text-primary shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">@{u.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "amount" && selected && (
            <div className="p-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative size-32 rounded-2xl bg-gradient-to-b from-surface-3 to-surface-2 overflow-hidden mb-3 ring-1 ring-border">
                  {avatarFull?.url ? (
                    <img
                      src={avatarFull.url}
                      alt={selected.displayName}
                      className="w-full h-full object-contain animate-in fade-in duration-300"
                    />
                  ) : selected.avatarUrl ? (
                    <img src={selected.avatarUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 font-bold text-lg">
                  {selected.displayName}
                  {selected.hasVerifiedBadge && <BadgeCheck className="size-4 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground">@{selected.name}</div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Joined {formatJoinDate(selected.created)}</span>
                  <span className="size-1 rounded-full bg-muted-foreground/40" />
                  <span>No mutual friends</span>
                </div>

                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2">
                  <Coin className="size-4" />
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                    className="w-28 bg-transparent text-center font-semibold tabular-nums outline-none"
                  />
                </div>
              </div>

              <p className="mt-5 mb-2 text-sm font-semibold">Choose amount</p>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                      amount === v
                        ? "bg-surface-3 border-primary/60 scale-[1.02]"
                        : "bg-surface-2 border-border hover:border-primary/40"
                    }`}
                  >
                    <Coin className="size-3.5" /> {v}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSend}
                disabled={amount < 1 || amount > balance}
                className="mt-5 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              >
                Next
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Robux are sent within 1-2 days with no fees
              </p>
            </div>
          )}

          {step === "sending" && selected && (
            <div className="p-8 flex flex-col items-center text-center gap-3 min-h-[280px] justify-center">
              <Loader2 className="size-8 text-primary animate-spin" />
              <div className="font-semibold">Sending {amount.toLocaleString()} Robux</div>
              <div className="text-sm text-muted-foreground">to @{selected.name}</div>
            </div>
          )}

          {step === "done" && selected && (
            <div className="p-8 flex flex-col items-center text-center gap-3 min-h-[280px] justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl">
                ✓
              </div>
              <div className="font-bold text-lg">Sent!</div>
              <div className="text-sm text-muted-foreground">
                {amount.toLocaleString()} Robux is on the way to @{selected.name}.
              </div>
              <Button onClick={() => setOpen(false)} className="mt-2 w-full bg-primary hover:bg-primary/90">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
