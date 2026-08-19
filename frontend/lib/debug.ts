// src/lib/debug.ts
// Simple debug logger that captures console, fetch, errors, and provides a subscription API.

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
type LogSource = "CONSOLE" | "NETWORK" | "ERROR";

export interface LogEntry {
  id: string;
  timestamp: string; // formatted HH:MM:SS.mmm
  level: LogLevel;
  source: LogSource;
  message: string;
}

type Listener = (log: LogEntry) => void;

class DebugLogger {
  private logs: LogEntry[] = [];
  private listeners = new Set<Listener>();
  private maxLogs = 500;

  private now() {
    const d = new Date();
    const pad = (n: number, z = 2) => n.toString().padStart(z, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }

  private add(level: LogLevel, source: LogSource, msg: string) {
    const entry: LogEntry = { id: Math.random().toString(36).slice(2, 10), timestamp: this.now(), level, source, message: msg };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    this.listeners.forEach((l) => l(entry));
  }

  public log = this.add.bind(this);

  public getLogs() {
    return [...this.logs];
  }

  public subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const debugLogger = new DebugLogger();

// Intercept console
const original = { ...console };
["log", "info", "debug", "warn", "error"].forEach((method) => {
  // @ts-ignore
  console[method] = (...args: any[]) => {
    const levelMap: Record<string, LogLevel> = { log: "INFO", info: "INFO", debug: "DEBUG", warn: "WARN", error: "ERROR" };
    const level = levelMap[method] as LogLevel;
    const message = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    debugLogger.log(level, "CONSOLE", message);
    // @ts-ignore
    original[method](...args);
  };
});

// Intercept fetch (browser only)
if (typeof window !== "undefined" && window.fetch) {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const url = typeof input === "string" ? input : (input instanceof URL ? input.href : (input as Request).url || String(input));
    const start = Date.now();
    debugLogger.log("INFO", "NETWORK", `${method} ${url}`);
    try {
      const resp = await origFetch(input, init);
      const duration = Date.now() - start;
      debugLogger.log("INFO", "NETWORK", `${method} ${url} → ${resp.status} (${duration}ms)`);
      return resp;
    } catch (e) {
      debugLogger.log("ERROR", "NETWORK", `${method} ${url} → ${e}`);
      throw e;
    }
  };
}

// Global error handling (browser)
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => debugLogger.log("ERROR", "ERROR", e.message));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason instanceof Error ? e.reason.message : String(e.reason);
    debugLogger.log("ERROR", "ERROR", `Unhandled promise rejection: ${r}`);
  });
}
