import { useEffect, useState } from "react";
import {
    CalendarDays,
    Copy,
    ExternalLink,
    FileCode2,
    GitCommitHorizontal,
    History,
    Loader2,
    X,
} from "lucide-react";

import { getRepositoryFileHistory } from "../services/api";

function CodeViewerModal({
    source,
    repositoryUrl,
    onClose,
}) {
    const [copied, setCopied] = useState(false);
    const [showHistory, setShowHistory] =
        useState(false);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] =
        useState(false);
    const [historyError, setHistoryError] =
        useState("");

    useEffect(() => {
        setShowHistory(false);
        setHistory([]);
        setHistoryError("");
        setCopied(false);
    }, [source]);

    if (!source) {
        return null;
    }

    async function handleCopy() {
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

    function handleClose() {
        setCopied(false);
        setShowHistory(false);
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
                {/* Header */}
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
                            onClick={handleHistory}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${showHistory
                                    ? "border-white/15 bg-white/[0.06] text-slate-200"
                                    : "border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-200"
                                }`}
                        >
                            <History size={14} />

                            History
                        </button>

                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 transition hover:text-slate-200"
                        >
                            <Copy size={14} />

                            {copied
                                ? "Copied"
                                : "Copy location"}
                        </button>

                        <button
                            onClick={handleClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500 transition hover:text-white"
                            aria-label="Close code viewer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {showHistory && (
                    <div className="border-b border-white/8 bg-[#0a0e15]">
                        <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                    <GitCommitHorizontal size={14} />
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
                                <div className="px-3 py-6 text-center text-xs text-red-300">
                                    {historyError}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="px-3 py-6 text-center text-xs text-slate-600">
                                    No commit history found for this file.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {history.map(
                                        (commit) => (
                                            <div
                                                key={commit.sha}
                                                className="rounded-lg px-3 py-3 transition hover:bg-white/[0.03]"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 rounded-md border border-white/7 bg-white/[0.03] p-1.5 text-slate-600">
                                                        <GitCommitHorizontal
                                                            size={13}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs leading-5 text-slate-400">
                                                            {commit.message}
                                                        </div>

                                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-700">
                                                            <span className="font-mono">
                                                                {commit.short_sha}
                                                            </span>

                                                            <span>
                                                                {commit.author}
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
                                                            className="shrink-0 rounded-md border border-white/7 bg-white/[0.02] p-2 text-slate-700 transition hover:text-slate-300"
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

                {/* Code */}
                <div className="min-h-0 flex-1 overflow-auto bg-[#070a10]">
                    <div className="min-w-max p-4">
                        {source.content ? (
                            source.content
                                .split("\n")
                                .map((line, index) => {
                                    const lineNumber =
                                        source.start_line + index;

                                    const isHighlighted =
                                        lineNumber >=
                                        source.start_line &&
                                        lineNumber <=
                                        source.end_line;

                                    return (
                                        <div
                                            key={`${lineNumber}-${index}`}
                                            className="grid grid-cols-[64px_1fr] rounded-sm font-mono text-[13px] leading-7"
                                        >
                                            <div
                                                className={`select-none border-r border-white/5 pr-4 text-right ${isHighlighted
                                                        ? "text-slate-500"
                                                        : "text-slate-700"
                                                    }`}
                                            >
                                                {lineNumber}
                                            </div>

                                            <div
                                                className={`pl-4 ${isHighlighted
                                                        ? "bg-white/[0.035] text-slate-300"
                                                        : "text-slate-600"
                                                    }`}
                                            >
                                                {line || " "}
                                            </div>
                                        </div>
                                    );
                                })
                        ) : (
                            <div className="p-10 text-center text-sm text-slate-600">
                                Source content is not available.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                    <div className="text-[11px] text-slate-600">
                        CodeLens repository evidence
                    </div>

                    <button
                        onClick={handleClose}
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CodeViewerModal;