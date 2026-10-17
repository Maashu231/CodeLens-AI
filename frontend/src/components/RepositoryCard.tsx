import {
    Bot,
    CheckCircle2,
    GitBranch,
    Loader2,
    RefreshCw,
    Search,
} from "lucide-react";

interface RepositoryCardProps {
    repositoryUrl: string;
    onRepositoryChange: (value: string) => void;
    onAnalyze: () => void;
    isIndexing: boolean;
    isReady: boolean;
    progress: number;
    statusMessage: string;
    showToast?: (type: string, message: string) => void;
}

function RepositoryCard({
    repositoryUrl,
    onRepositoryChange,
    onAnalyze,
    isIndexing,
    isReady,
    progress,
    statusMessage,
}: RepositoryCardProps) {
    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            onAnalyze();
        }
    }

    return (
        <section className="relative overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/80 p-5 shadow-2xl shadow-black/20 sm:p-6 glass-card-hover">
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-indigo-500/20 blur-sm" />

            <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <GitBranch size={16} />
                    Repository
                </div>

                <p className="mt-1 text-xs text-slate-600">
                    Use a public GitHub repository URL.
                </p>

                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <GitBranch
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            value={repositoryUrl}
                            onChange={(event) =>
                                onRepositoryChange(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="https://github.com/owner/repository"
                            className="input-enhanced"
                        />
                    </div>

                    <button
                        onClick={onAnalyze}
                        disabled={isIndexing}
                        className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition-all duration-300 ${
                            isIndexing
                                ? "pointer-events-none opacity-50"
                                : "hover:bg-slate-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                        }`}
                    >
                        {isIndexing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Indexing...
                            </>
                        ) : (
                            <>
                                {isReady ? (
                                    <RefreshCw size={16} />
                                ) : (
                                    <Search size={16} />
                                )}

                                {isReady ? "Re-index" : "Analyze Repository"}
                            </>
                        )}
                    </button>
                </div>

                {isIndexing ? (
                    <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4 glass-card">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <Loader2 size={14} className="animate-spin text-slate-500" />
                                <span className="animate-pulse">{statusMessage}</span>
                            </div>

                            <span className="flex items-center gap-1 text-xs font-semibold tabular-nums text-emerald-400">
                                {progress}%
                                <span className="text-xs opacity-70">done</span>
                            </span>
                        </div>

                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400 transition-[width] duration-500 ease-out"
                                style={{
                                    width: `${Math.max(0, Math.min(progress, 100))}%`,
                                }}
                            />
                        </div>

                        <div className="mt-2 text-[11px] text-slate-600">
                            This runs in the background. You can wait here
                            while CodeLens builds the semantic search index.
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        {isReady ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ) : (
                            <Bot size={14} className="text-slate-500" />
                        )}

                        {statusMessage ? (
                            <span className="text-slate-400">{statusMessage}</span>
                        ) : (
                            <span className="text-slate-400">
                                {isReady ? "Ready to ask questions" : "No repository connected"}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default RepositoryCard;