import {
    FileCode2,
    GitBranch,
    MessageSquareText,
    Search,
    Sparkles,
    TerminalSquare,
} from "lucide-react";

interface SidebarProps {
    repositoryUrl: string;
    isReady: boolean;
    chunksIndexed: number | null;
}

function Sidebar({
    repositoryUrl,
    isReady,
    chunksIndexed,
}: SidebarProps) {
    const repositoryName = repositoryUrl
        ? repositoryUrl
            .replace("https://github.com/", "")
            .replace(/\/$/, "")
        : "No repository connected";

    const capabilities = [
        { label: "Ask code questions", icon: MessageSquareText },
        { label: "Find relevant code", icon: Search },
        { label: "Grounded answers", icon: Sparkles },
        { label: "Source evidence", icon: FileCode2 },
    ];

    return (
        <aside className="hidden z-10 w-72 shrink-0 border-r border-white/8 bg-white/[0.02] p-5 backdrop-blur-xl lg:flex lg:flex-col relative overflow-y-auto">
            <div className="absolute top-6 right-6 h-16 w-16 rounded-full bg-indigo-500/[0.12] blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/30">
                    <TerminalSquare size={21} className="text-slate-950" />
                </div>

                <div className="flex flex-col">
                    <div className="text-sm font-semibold tracking-tight text-white">
                        CodeLens AI
                    </div>

                    <div className="text-xs text-slate-500">
                        Codebase intelligence
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Workspace
                </div>

                <div className="rounded-xl border border-white/8 bg-black/20 p-3 glass-card-hover">
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
                                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                                        isReady
                                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
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

            <div className="mt-10">
                <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Capabilities
                </div>

                <div className="space-y-1">
                    {capabilities.map(({ label, icon: Icon }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 glass-card-hover"
                        >
                            <Icon size={15} className="text-slate-400 transition-colors" />
                            <span className="transition-colors">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-8 rounded-xl border border-white/7 bg-black/20 p-4 glass-card-hover">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <TerminalSquare size={14} className="text-slate-600" />
                    RAG pipeline
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        GitHub → Parser → Chunks
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        Embeddings → Qdrant → Reranker
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                        Evidence → LLM → Answer
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;