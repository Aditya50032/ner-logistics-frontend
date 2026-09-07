/**
 * Loading, empty and error states.
 *
 * Every backend-backed panel uses these, so a failed request always produces something
 * readable with a way forward rather than an empty box.
 */
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-navy-700/60", className)} />;
}

export function LoadingPanel({ label = "Loading", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="panel p-5" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="label-mono">{label}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn("h-9", i % 3 === 2 && "w-2/3")} />
        ))}
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
  title = "Could not load this view",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="panel border-signal-blocked/40 p-5" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-blocked" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyPanel({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel grid place-items-center p-10 text-center">
      <Inbox className="h-6 w-6 text-ink-faint" />
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Wraps the four states so a view body reads as one expression. */
export function AsyncBoundary<T>({
  state,
  loadingLabel,
  emptyWhen,
  empty,
  children,
}: {
  state: { data: T | null; loading: boolean; error: string | null; reload: () => void; settled: boolean };
  loadingLabel?: string;
  emptyWhen?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.loading && !state.settled) return <LoadingPanel label={loadingLabel} />;
  if (state.error) return <ErrorPanel message={state.error} onRetry={state.reload} />;
  if (!state.data) return <ErrorPanel message="No data was returned." onRetry={state.reload} />;
  if (emptyWhen?.(state.data)) {
    return <>{empty ?? <EmptyPanel title="Nothing to show yet" />}</>;
  }
  return <>{children(state.data)}</>;
}
