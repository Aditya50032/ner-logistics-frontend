import { cn } from "@/lib/utils";

/** A status chip that carries its colour as an inline token, so map and UI agree. */
export function Chip({
  label,
  color,
  className,
  dot = true,
}: {
  label: string;
  color: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em]",
        className,
      )}
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </span>
  );
}

export function LiveDot({ label = "Live", muted = false }: { label?: string; muted?: boolean }) {
  const color = muted ? "#5E7391" : "#22C55E";
  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] text-ink-muted">
      <span className="relative flex h-2 w-2">
        {!muted && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping2"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </span>
      {label}
    </span>
  );
}
