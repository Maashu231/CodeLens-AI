import { useState } from "react";
import {
    Copy,
    FileCode2,
    X,
} from "lucide-react";

function CodeViewerModal({
    source,
    onClose,
}) {
    const [copied, setCopied] = useState(false);

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

    function handleClose() {
        setCopied(false);
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

                <div className="min-h-0 flex-1 overflow-auto bg-[#070a10]">
                    <div className="min-w-max p-4">
                        {source.content ? (
                            source.content
                                .split("\n")
                                .map((line, index) => {
                                    const lineNumber =
                                        source.start_line + index;

                                    const isHighlighted =
                                        lineNumber >= source.start_line &&
                                        lineNumber <= source.end_line;

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

                <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                    <div className="text-[11px] text-slate-600">
                        Evidence returned by CodeLens retrieval
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