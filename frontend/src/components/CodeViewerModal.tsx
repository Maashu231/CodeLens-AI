import { useState, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    CalendarDays,
    Copy,
    ExternalLink,
    FileCode2,
    GitBranch,
    GitCommitHorizontal,
    History,
    Loader2,
    X,
} from "lucide-react";

import {
    getRepositoryFileHistory,
    getRepositoryImpact,
} from "../services/api";

import type { Source } from "../types";

function getLanguageFromPath(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase();

    const languages: Record<string, string> = {
        py: "python",
        js: "javascript",
        jsx: "jsx",
        ts: "typescript",
        tsx: "tsx",
        java: "java",
        sql: "sql",
        html: "html",
        css: "css",
        md: "markdown",
        json: "json",
        yml: "yaml",
        yaml: "yaml",
        tsconfig: "json",
    };

    return (extension && languages[extension]) || "text";
}

interface ImpactItem {
    id: string;
    name?: string | null;
    path: string;
    distance: number;
    impact: "direct" | "indirect";
    relationship: string;
}

interface ImpactData {
    stats: { direct: number; indirect: number };
    impacted: ImpactItem[];
}

interface Commit {
    sha: string;
    short_sha: string;
    message: string;
    author: string;
    date?: string | null;
    url?: string | null;
}

interface CodeViewerModalProps {
    source: Source | null;
    repositoryUrl: string;
    onClose: () => void;
    showToast?: (type: string, message: string) => void;
}

function CodeViewerModal({
    source,
    repositoryUrl,
    onClose,
}: CodeViewerModalProps) {
    const [copied, setCopied] = useState(false);

    const [showHistory, setShowHistory] =
        useState(false);

    const [history, setHistory] = useState<Commit[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] =
        useState(false);

    const [historyError, setHistoryError] =
        useState("");

    const [showImpact, setShowImpact] =
        useState(false);

    const [impactData, setImpactData] = useState<ImpactData | null>(null);

    const [isLoadingImpact, setIsLoadingImpact] =
        useState(false);

    const [impactError, setImpactError] =
        useState("");

    if (!source) {
        return null;
    }

    const language = useMemo(
        () => getLanguageFromPath(source.file),
        [source.file]
    );

    async function handleCopy() {
        if (!source) return;
        const text =
            `${source.file}:${source.start_line}-${source.end_line}`;

        try {
            await navigator.clipboard.writeText(text);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch {
            setCopied(false);
        }
    }

    async function handleHistory() {
        if (!source) return;
        if (showHistory) {
            setShowHistory(false);
            return;
        }

        setShowHistory(true);

        if (history.length > 0) {
            return;
        }

        setIsLoadingHistory(true);
        setHistoryError("");

        try {
            const data =
                await getRepositoryFileHistory(
                    repositoryUrl,
                    source.file
                );

            setHistory(data.commits || []);
        } catch (error) {
            setHistoryError(
                error instanceof Error
                    ? error.message
                    : "Unable to load file history."
            );
        } finally {
            setIsLoadingHistory(false);
        }
    }

    async function handleImpact() {
        if (!source) return;
        if (showImpact) {
            setShowImpact(false);
            return;
        }

        setShowImpact(true);

        if (impactData) {
            return;
        }

        setIsLoadingImpact(true);
        setImpactError("");

        try {
            const data =
                await getRepositoryImpact(
                    repositoryUrl,
                    source.file,
                    source.symbol || null
                );

            setImpactData(data);
        } catch (error) {
            setImpactError(
                error instanceof Error
                    ? error.message
                    : "Unable to analyze repository impact."
            );
        } finally {
            setIsLoadingImpact(false);
        }
    }

    function handleClose() {
        setCopied(false);
        setShowHistory(false);
        setShowImpact(false);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl shadow-black/50"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <FileCode2
                                size={16}
                                className="text-slate-500"
                            />

                            <span className="truncate font-mono text-sm text-slate-300">
                                {source.file}
                            </span>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-600">
                            Lines {source.start_line}-
                            {source.end_line}

                            {source.symbol
                                ? ` • ${source.symbol}()`
                                : ""}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleImpact}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-300 ${showImpact
                                ? "border-white/15 bg-white/[0.06] text-slate-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                : "border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-200"
                                }`}
                        >
                            <GitBranch size={14} />
                            Impact
                        </button>

                        <button
                            onClick={handleHistory}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-300 ${showHistory
                                ? "border-white/15 bg-white/[0.06] text-slate-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                                : "border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-200"
                                }`}
                        >
                            <History size={14} />
                            History
                        </button>

                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 transition-all hover:text-slate-200"
                        >
                            <Copy size={14} />

                            {copied
                                ? "Copied"
                                : "Copy location"}
                        </button>

                        <button
                            onClick={handleClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500 transition-all hover:text-white hover:bg-white/[0.06]"
                            aria-label="Close code viewer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {showImpact && (
                    <div className="border-b border-white/8 bg-[#0a0e15]">
                        <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                    <GitBranch
                                        size={14}
                                    />

                                    Change impact analysis
                                </div>

                                <div className="mt-1 text-[11px] text-slate-700">
                                    Code that may depend on this source
                                </div>
                            </div>

                            {impactData && (
                                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                                    <span>
                                        Direct{" "}
                                        <span className="text-slate-400">
                                            {
                                                impactData
                                                    .stats
                                                    .direct
                                            }
                                        </span>
                                    </span>

                                    <span>
                                        Indirect{" "}
                                        <span className="text-slate-400">
                                            {
                                                impactData
                                                    .stats
                                                    .indirect
                                            }
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="max-h-72 overflow-auto p-3">
                            {isLoadingImpact ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-600">
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />

                                    Analyzing dependencies...
                                </div>
                            ) : impactError ? (
                                <div className="px-3 py-6 text-center text-xs text-rose-300">
                                    {impactError}
                                </div>
                            ) : !impactData ||
                                impactData.impacted
                                    ?.length === 0 ? (
                                <div className="px-3 py-6 text-center text-xs text-slate-600">
                                    No known dependent code was found.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[
                                        ...(impactData.impacted ||
                                            []),
                                    ]
                                        .sort(
                                            (a, b) =>
                                                a.distance -
                                                b.distance
                                        )
                                        .map(
                                            (
                                                item
                                            ) => (
                                                <div
                                                    key={`${item.id}-${item.distance}`}
                                                    className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-3"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 rounded-md border border-white/7 bg-white/[0.03] p-1.5 text-slate-600">
                                                            <GitBranch
                                                                size={
                                                                    13
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-mono text-xs text-slate-300">
                                                                    {item.name
                                                                        ? `${item.name}()`
                                                                        : item.path}
                                                                </span>

                                                                <span
                                                                    className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${item.impact ===
                                                                        "direct"
                                                                        ? "border-amber-400/15 bg-amber-400/[0.04] text-amber-300"
                                                                        : "border-white/8 bg-white/[0.03] text-slate-500"
                                                                        }`}
                                                                >
                                                                    {
                                                                        item.impact
                                                                    }
                                                                </span>
                                                            </div>

                                                            <div className="mt-1 font-mono text-[10px] text-slate-600">
                                                                {
                                                                    item.path
                                                                }
                                                            </div>

                                                            <div className="mt-1 text-[10px] text-slate-700">
                                                                {item.relationship ===
                                                                    "call"
                                                                    ? `Called from dependency level ${item.distance}`
                                                                    : `Imported dependency level ${item.distance}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showHistory && (
                    <div className="border-b border-white/8 bg-[#0a0e15]">
                        <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                    <GitCommitHorizontal
                                        size={14}
                                    />

                                    Recent file history
                                </div>

                                <div className="mt-1 text-[11px] text-slate-700">
                                    Latest commits touching this file
                                </div>
                            </div>

                            <span className="text-[11px] text-slate-700">
                                {history.length} commits
                            </span>
                        </div>

                        <div className="max-h-64 overflow-auto p-3">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-600">
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />

                                    Loading history...
                                </div>
                            ) : historyError ? (
                                <div className="px-3 py-6 text-center text-xs text-rose-300">
                                    {historyError}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="px-3 py-6 text-center text-xs text-slate-600">
                                    No commit history found for this file.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {history.map(
                                        (commit: Commit) => (
                                            <div
                                                key={
                                                    commit.sha
                                                }
                                                className="rounded-lg px-3 py-3 transition-all duration-300 hover:bg-white/[0.03]"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 rounded-md border border-white/7 bg-white/[0.03] p-1.5 text-slate-600">
                                                        <GitCommitHorizontal
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs leading-5 text-slate-400">
                                                            {
                                                                commit.message
                                                            }
                                                        </div>

                                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-700">
                                                            <span className="font-mono">
                                                                {
                                                                    commit.short_sha
                                                                }
                                                            </span>

                                                            <span>
                                                                {
                                                                    commit.author
                                                                }
                                                            </span>

                                                            {commit.date && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <CalendarDays
                                                                        size={
                                                                            10
                                                                        }
                                                                    />

                                                                    {new Date(
                                                                        commit.date
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {commit.url && (
                                                        <a
                                                            href={
                                                                commit.url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="shrink-0 rounded-md border border-white/7 bg-white/[0.02] p-2 text-slate-700 transition-all hover:text-slate-300"
                                                            aria-label="Open commit on GitHub"
                                                        >
                                                            <ExternalLink
                                                                size={
                                                                    13
                                                                }
                                                            />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-auto bg-[#070a10]">
                    <div className="min-w-max p-4">
                        {source.content ? (
                            <SyntaxHighlighter
                                language={language}
                                style={vscDarkPlus}
                                showLineNumbers={false}
                                customStyle={{
                                    margin: 0,
                                    padding: 0,
                                    border: "none",
                                }}
                                codeTagProps={{
                                    className: "block overflow-x-auto",
                                }}
                            >
                                {source.content}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="p-10 text-center text-sm text-slate-600">
                                Source content is not available.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                    <div className="text-[11px] text-slate-600">
                        CodeLens repository evidence
                    </div>

                    <button
                        onClick={handleClose}
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg transition-all hover:bg-slate-200 hover:shadow-xl active:scale-[0.98]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CodeViewerModal;