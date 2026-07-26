import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { reportDebugEvent } from "@/lib/debug-event-client";
import { installLocalApiShim } from "@/lib/local-api-shim";

const DYNAMIC_IMPORT_ERROR_RE = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const RECOVERY_KEY = "opp-dynamic-import-recovery";

function tryRecoverFromDynamicImportError(message: string): boolean {
  if (typeof window === "undefined" || !DYNAMIC_IMPORT_ERROR_RE.test(message)) {
    return false;
  }

  try {
    const missingModuleUrl = message.match(/https?:\/\/\S+?\.js\b/i)?.[0] ?? message;
    const raw = sessionStorage.getItem(RECOVERY_KEY);
    const previous = raw ? JSON.parse(raw) as { key?: string; count?: number; ts?: number } : null;
    const now = Date.now();
    const sameError = previous?.key === missingModuleUrl;
    const recent = typeof previous?.ts === "number" && now - previous.ts < 30_000;
    const count = sameError && recent ? Number(previous?.count ?? 0) : 0;

    if (count >= 1) {
      return false;
    }

    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({
      key: missingModuleUrl,
      count: count + 1,
      ts: now,
    }));

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("_v", String(now));
    window.location.replace(nextUrl.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

type RootErrorBoundaryState = {
  error: Error | null;
  eventMessage: string | null;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { error: null, eventMessage: null };

  componentDidCatch(error: Error) {
    //#region debug-point root-boundary-did-catch
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "RootErrorBoundary",
      point: "componentDidCatch",
      message: `${error.name}: ${error.message}`,
      stack: error.stack ?? null,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
      timestamp: Date.now(),
    });
    //#endregion debug-point root-boundary-did-catch
    if (tryRecoverFromDynamicImportError(`${error.name}: ${error.message}`)) {
      return;
    }
    this.setState({ error });
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  handleWindowError = (event: ErrorEvent) => {
    const message = event.error instanceof Error
      ? `${event.error.name}: ${event.error.message}`
      : String(event.message ?? "Eroare JavaScript necunoscută");
    //#region debug-point root-boundary-window-error
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "RootErrorBoundary",
      point: "window:error",
      message,
      stack: event.error instanceof Error ? event.error.stack ?? null : null,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
      timestamp: Date.now(),
    });
    //#endregion debug-point root-boundary-window-error
    if (tryRecoverFromDynamicImportError(message)) {
      return;
    }
    this.setState((current) => ({
      error: current.error,
      eventMessage: message,
    }));
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason instanceof Error
      ? `${event.reason.name}: ${event.reason.message}`
      : String(event.reason ?? "Promise rejection necunoscut");
    //#region debug-point root-boundary-unhandled-rejection
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "RootErrorBoundary",
      point: "window:unhandledrejection",
      message: reason,
      stack: event.reason instanceof Error ? event.reason.stack ?? null : null,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
      timestamp: Date.now(),
    });
    //#endregion debug-point root-boundary-unhandled-rejection
    if (tryRecoverFromDynamicImportError(reason)) {
      return;
    }
    this.setState((current) => ({
      error: current.error,
      eventMessage: reason,
    }));
  };

  render() {
    if (!this.state.error && !this.state.eventMessage) return this.props.children;
    const message = this.state.error
      ? `${this.state.error.name}: ${this.state.error.message}`
      : this.state.eventMessage ?? "Eroare necunoscută";
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">Frontend Crash</p>
          <h1 className="mt-2 text-2xl font-black text-white">Aplicația s-a oprit la bootstrap</h1>
          <p className="mt-4 text-sm text-slate-300">{message}</p>
          {this.state.error?.stack && (
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

const LOCAL_API_SHIM_ENABLED = String(import.meta.env.VITE_USE_LOCAL_API_SHIM ?? "true").trim().toLowerCase() !== "false";

if (LOCAL_API_SHIM_ENABLED) {
  installLocalApiShim();
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);
