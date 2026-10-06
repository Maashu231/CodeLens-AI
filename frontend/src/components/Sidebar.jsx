import {
    FileCode2,
    GitBranch,
    MessageSquareText,
    Search,
    Sparkles,
    TerminalSquare,
} from "lucide-react";

function Sidebar({
    repositoryUrl,
    isReady,
    chunksIndexed,
}) {
    const repositoryName = repositoryUrl
        ? repositoryUrl
            .replace("https://github.com/", "")
            .replace(/\/$/, "")
        : "No repository connected";

    const capabilities = [
        ["Ask code questions", MessageSquareText],
        ["Find relevant code", Search],
        ["Grounded answers", Sparkles],
        ["Source evidence", FileCode2],
    ];

    return (
        <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-[#0b0f17]/85 p-5 backdrop-blur-xl lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg shadow-white/5">
                    <TerminalSquare size={21} />
                </div>

                <div>
                    <div className="text-sm font-semibold tracking-tight">
                        CodeLens AI
                    </div>

                    <div className="text-xs text-slate-500">
                        Codebase intelligence
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Workspace
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-slate-500">
                            <GitBranch size={16} />
                        </div>

                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-300">
                                {repositoryName}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${isReady
                                        ? "bg-emerald-400"
                                        : "bg-slate-600"
                                        }`}
                                />

                                {isReady ? "Indexed" : "Not indexed"}
                            </div>
                        </div>
                    </div>

                    {chunksIndexed !== null && (
                        <div className="mt-4 border-t border-white/6 pt-3 text-xs text-slate-500">
                            {chunksIndexed} chunks indexed
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Capabilities
                </div>

                <div className="space-y-1">
                    {capabilities.map(([label, Icon]) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500"
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto rounded-xl border border-white/7 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <TerminalSquare size={14} />
                    RAG pipeline
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                    <div>GitHub → Parser → Chunks</div>
                    <div>Embeddings → Qdrant → Reranker</div>
                    <div>Evidence → LLM → Answer</div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;