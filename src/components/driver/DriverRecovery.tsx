/**
 * Driver-side cargo relay.
 *
 * Mobile-first and deliberately plain: big targets, one decision per screen, no charts.
 * A driver reads this on a phone at the roadside in the rain.
 *
 * Every write carries an idempotency key generated once per step and reused on retry, so
 * a flaky connection cannot produce two transfers.
 */
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  Package,
  QrCode,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorPanel, LoadingPanel } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { RecoveryDetail } from "@/types";

/** One key per recovery per step, stable across retries within this session. */
function useIdempotencyKeys(recoveryId: string) {
  return useMemo(() => {
    const read = (step: string) => {
      const storageKey = `ner.idem.${recoveryId}.${step}`;
      let value = localStorage.getItem(storageKey);
      if (!value) {
        value = `${recoveryId}-${step}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(storageKey, value);
      }
      return value;
    };
    return { start: read("start"), complete: read("complete") };
  }, [recoveryId]);
}

function BigButton({
  label,
  sub,
  icon: Icon,
  tone = "default",
  pending,
  disabled,
  onClick,
}: {
  label: string;
  sub?: string;
  icon: typeof Package;
  tone?: "default" | "go" | "danger";
  pending?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition active:scale-[0.99] disabled:opacity-50",
        tone === "go" && "border-signal-open/50 bg-signal-open/10",
        tone === "danger" && "border-signal-blocked/50 bg-signal-blocked/10",
        tone === "default" && "border-line bg-navy-800",
      )}
    >
      {pending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-ink-muted" />
      ) : (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            tone === "go" ? "text-signal-open" : tone === "danger" ? "text-signal-blocked" : "text-ink-muted",
          )}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-[12.5px] text-ink-muted">{sub}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
    </button>
  );
}

export function DriverRecovery({ recoveryId }: { recoveryId: string }) {
  const state = useAsync(() => api.recovery(recoveryId), [recoveryId]);
  const keys = useIdempotencyKeys(recoveryId);
  const [scanned, setScanned] = useState("");

  const accept = useAction(() => api.acceptRecovery(recoveryId));
  const decline = useAction((reason: string) => api.declineRecovery(recoveryId, reason));
  const arrived = useAction(() => api.arrivedAtHandover(recoveryId));
  const startTransfer = useAction(() => api.startTransfer(recoveryId, keys.start));
  const verify = useAction((code: string) => api.verifyTransfer(recoveryId, code, "DESTINATION"));
  const complete = useAction(() => api.completeTransfer(recoveryId, keys.complete));

  const after = async (fn: () => Promise<unknown>) => {
    await fn();
    state.reload();
  };

  if (state.loading && !state.settled) return <LoadingPanel label="Loading your assignment" rows={4} />;
  if (state.error) return <ErrorPanel message={state.error} onRetry={state.reload} title="Assignment unavailable" />;
  if (!state.data) return null;

  const r: RecoveryDetail = state.data;
  const actionError =
    accept.error ?? decline.error ?? arrived.error ?? startTransfer.error ?? verify.error ?? complete.error;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-signal-high/40 bg-signal-high/[0.08] p-4">
        <p className="label-mono text-signal-high">Cargo relay assignment</p>
        <h2 className="mt-1 text-[17px] font-semibold text-ink">
          {r.shipment?.reference ?? "Consignment"}
        </h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {r.shipment?.commodity ?? "Cargo"} · {((r.shipment?.weight_kg ?? 0) / 1000).toFixed(1)}T ·{" "}
          {r.priority}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-navy-800 p-4">
        <dl className="space-y-3">
          {[
            ["Collect from", r.stranded_vehicle?.vehicle_number ?? "—", MapPin],
            ["Handover point", r.transfer_location?.name ?? "To be confirmed", Navigation],
            ["Deliver to", r.shipment?.destination ?? "—", Package],
          ].map(([label, value, Icon]) => {
            const IconC = Icon as typeof MapPin;
            return (
              <div key={label as string} className="flex items-start gap-3">
                <IconC className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                <div className="min-w-0">
                  <dt className="label-mono">{label as string}</dt>
                  <dd className="text-[14px] text-ink">{value as string}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      {actionError && (
        <p className="rounded-xl border border-signal-blocked/40 bg-signal-blocked/10 p-3 text-[13px] text-signal-blocked">
          {actionError}
        </p>
      )}

      <div className="space-y-2.5">
        {r.status === "DRIVER_ASSIGNED" && (
          <>
            <BigButton
              label="Accept this assignment"
              sub="You will be navigated to the handover point"
              icon={CheckCircle2}
              tone="go"
              pending={accept.pending}
              onClick={() => after(accept.run)}
            />
            <BigButton
              label="Decline"
              sub="The next best vehicle will be offered instead"
              icon={XCircle}
              tone="danger"
              pending={decline.pending}
              onClick={() => after(() => decline.run("Declined by driver"))}
            />
          </>
        )}

        {r.status === "DRIVER_EN_ROUTE" && (
          <BigButton
            label="I have arrived"
            sub={r.transfer_location?.name ?? "At the handover point"}
            icon={MapPin}
            tone="go"
            pending={arrived.pending}
            onClick={() => after(arrived.run)}
          />
        )}

        {r.status === "AT_TRANSFER_LOCATION" && (
          <BigButton
            label="Start the transfer"
            sub="Opens the handover record. Nothing moves until both drivers scan."
            icon={Package}
            tone="go"
            pending={startTransfer.pending}
            onClick={() => after(startTransfer.run)}
          />
        )}

        {r.status === "TRANSFER_IN_PROGRESS" && (
          <div className="space-y-3 rounded-xl border border-line bg-navy-800 p-4">
            <label className="block">
              <span className="label-mono">Scan or type the shipment code</span>
              <div className="mt-2 flex gap-2">
                <input
                  value={scanned}
                  onChange={(e) => setScanned(e.target.value.toUpperCase())}
                  placeholder="NER-MED-00821"
                  inputMode="text"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-navy-900 px-3 py-3 text-[15px] text-ink outline-none focus:border-signal-open/60"
                />
                <button
                  onClick={() => after(() => verify.run(scanned))}
                  disabled={!scanned || verify.pending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-signal-open/50 bg-signal-open/10 px-4 text-[13px] text-signal-open disabled:opacity-50"
                >
                  {verify.pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Verify
                </button>
              </div>
            </label>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              The code is checked against the consignment on the stranded vehicle. A code from a
              different shipment is refused.
            </p>
            <BigButton
              label="Confirm the cargo is loaded"
              sub="Both drivers must have scanned before this completes"
              icon={CheckCircle2}
              tone="go"
              pending={complete.pending}
              onClick={() => after(complete.run)}
            />
          </div>
        )}

        {r.status === "TRANSFER_COMPLETED" && (
          <div className="rounded-xl border border-signal-open/50 bg-signal-open/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-signal-open" />
            <p className="mt-2 text-[15px] font-medium text-ink">Transfer complete</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {r.shipment?.reference} is now on your vehicle. Continue to{" "}
              {r.shipment?.destination}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
