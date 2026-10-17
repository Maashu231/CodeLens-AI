import { ChevronRight, Server } from "lucide-react";

interface HeaderProps {
    isReady: boolean;
    backendStatus: string;
    backendVersion: string | null;
    onRefreshHealth: () => void;
}

function Header({
    isReady,
    backendStatus = "checking",
    backendVersion = null,
    onRefreshHealth,
}: HeaderProps) {
    const isBackendOnline = backendStatus === "connected";
    const isBackendChecking = backendStatus === "checking";

    return (
        <header className="relative z-20 flex items-center justify-between border-b border-white/8 bg-white/[0.03] backdrop-blur-xl px-5 py-4 sm:px-8 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-semibold text-slate-200 tracking-tight lg:hidden">
                    CodeLens AI
                </span>

                <ChevronRight
                    size={15}
                    className="text-slate-700 lg:hidden"
                />

                <span className="hidden sm:inline font-medium text-slate-200">
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
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-300 ${
                        isBackendOnline
                            ? "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300 hover:bg-emerald-400/[0.15] hover:border-emerald-400/30"
                            : isBackendChecking
                            ? "border-amber-400/20 bg-amber-400/[0.10] text-amber-300 hover:bg-amber-400/[0.15] hover:border-amber-400/30"
                            : "border-rose-400/20 bg-rose-400/[0.10] text-rose-300 hover:bg-rose-400/[0.15] hover:border-rose-400/30"
                    }`}
                >
                    <Server size={12} className="opacity-80" />
                    <span
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                            isBackendOnline
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
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
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all duration-300 ${
                        isReady
                            ? "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                            : "border-white/8 bg-white/[0.03] text-slate-500"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                            isReady
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                : "bg-slate-500"
                        }`}
                    />

                    {isReady ? "Repository ready" : "No repository"}
                </div>
            </div>
        </header>
    );
}

export default Header;