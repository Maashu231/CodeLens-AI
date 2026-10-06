import {
    Bot,
    CheckCircle2,
    GitBranch,
    Loader2,
    RefreshCw,
    Search,
} from "lucide-react";

function RepositoryCard({
    repositoryUrl,
    onRepositoryChange,
    onAnalyze,
    isIndexing,
    isReady,
    progress,
    statusMessage,
}) {
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            onAnalyze();
        }
    }

    return (
        <section className="rounded-2xl border border-white/9 bg-[#0d121b]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-5">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <GitBranch size={16} />
                        Repository
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                        Use a public GitHub repository URL.
                    </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <GitBranch
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            value={repositoryUrl}
                            onChange={(event) =>
                                onRepositoryChange(
                                    event.target.value
                                )
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="https://github.com/owner/repository"
                            className="h-12 w-full rounded-xl border border-white/9 bg-black/20 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none transition focus:border-white/20"
                        />
                    </div>

                    <button
                        onClick={onAnalyze}
                        disabled={isIndexing}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isIndexing ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                                Indexing...
                            </>
                        ) : (
                            <>
                                {isReady ? (
                                    <RefreshCw size={16} />
                                ) : (
                                    <Search size={16} />
                                )}

                                {isReady
                                    ? "Re-index"
                                    : "Analyze Repository"}
                            </>
                        )}
                    </button>
                </div>

                {isIndexing ? (
                    <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <Loader2
                                    size={14}
                                    className="animate-spin text-slate-500"
                                />

                                {statusMessage}
                            </div>

                            <span className="text-xs font-semibold tabular-nums text-slate-400">
                                {progress}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                                className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
                                style={{
                                    width: `${Math.max(
                                        0,
                                        Math.min(progress, 100)
                                    )}%`,
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
                            <CheckCircle2
                                size={14}
                                className="text-emerald-400"
                            />
                        ) : (
                            <Bot size={14} />
                        )}

                        {statusMessage}
                    </div>
                )}
            </div>
        </section>
    );
}

export default RepositoryCard;