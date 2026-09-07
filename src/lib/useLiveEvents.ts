/**
 * WebSocket subscription for the government dashboard.
 *
 * Reconnects with backoff and reports connection state, so the topbar can tell the
 * operator whether they are actually seeing live events or a stale snapshot.
 */
import { useEffect, useRef, useState } from "react";

export interface LiveEvent {
  event: string;
  at: string;
  data: Record<string, unknown>;
}

export type LiveStatus = "connecting" | "open" | "closed";

const WS_URL = (() => {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  if (!base) return "";
  try {
    const url = new URL(base, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/recovery";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
})();

export function useLiveEvents(onEvent?: (e: LiveEvent) => void) {
  const [status, setStatus] = useState<LiveStatus>(WS_URL ? "connecting" : "closed");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!WS_URL) return;
    let socket: WebSocket | null = null;
    let retry = 0;
    let timer: number | undefined;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus("connecting");
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        retry = 0;
        setStatus("open");
      };
      socket.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data as string) as LiveEvent;
          setEvents((prev) => [parsed, ...prev].slice(0, 40));
          handler.current?.(parsed);
        } catch {
          // A malformed frame is not worth tearing the socket down for.
        }
      };
      socket.onclose = () => {
        setStatus("closed");
        if (disposed) return;
        // Backoff to 15s so a stopped backend does not hammer the network.
        const delay = Math.min(15000, 800 * 2 ** retry++);
        timer = window.setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      socket?.close();
    };
  }, []);

  return { status, events };
}
