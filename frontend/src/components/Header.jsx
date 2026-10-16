import { ChevronRight, Server } from "lucide-react";

function Header({
    isReady,
    backendStatus = "checking",
    backendVersion = null,
    onRefreshHealth,
}) {
    const isBackendOnline = backendStatus === "connected";
    const isBackendChecking = backendStatus === "checking";

    return (
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-semibold text-slate-200 lg:hidden">
                    CodeLens AI
                </span>

                <ChevronRight
                    size={15}
                    className="text-slate-700 lg:hidden"
                />

                <span className="hidden sm:inline">
                    Workspace
                </span>
            </div>

            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={onRefreshHealth}
                    title={
                        isBackendOnline
                            ? `Backend connected${backendVersion ? ` (v${backendVersion})` : ""}. Click to re-check.`
                            : isBackendChecking
                            ? "Checking backend connection..."
                            : "Backend offline or unreachable. Click to retry."
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        isBackendOnline
                            ? "border-emerald-400/15 bg-emerald-400/6 text-emerald-300 hover:bg-emerald-400/10"
                            : isBackendChecking
                            ? "border-amber-400/15 bg-amber-400/6 text-amber-300 hover:bg-amber-400/10"
                            : "border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15"
                    }`}
                >
                    <Server size={12} className="opacity-70" />
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isBackendOnline
                                ? "bg-emerald-400"
                                : isBackendChecking
                                ? "bg-amber-400 animate-pulse"
                                : "bg-rose-400"
                        }`}
                    />
                    <span>
                        {isBackendOnline
                            ? `API ${backendVersion ? `v${backendVersion}` : "online"}`
                            : isBackendChecking
                            ? "Checking API"
                            : "API offline"}
                    </span>
                </button>

                <div
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        isReady
                            ? "border-emerald-400/15 bg-emerald-400/6 text-emerald-300"
                            : "border-white/8 bg-white/[0.03] text-slate-500"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isReady
                                ? "bg-emerald-400"
                                : "bg-slate-600"
                        }`}
                    />

                    {isReady ? "Repository ready" : "No repository"}
                </div>
            </div>
        </header>
    );
}

export default Header;