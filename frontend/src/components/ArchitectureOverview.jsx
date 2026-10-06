import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Box,
    FileCode2,
    FolderTree,
    FunctionSquare,
    Loader2,
} from "lucide-react";

import { getRepositoryOverview } from "../services/api";

function formatSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function languageLabel(language) {
    const labels = {
        python: "Python",
        javascript: "JavaScript",
        typescript: "TypeScript",
        java: "Java",
        sql: "SQL",
        html: "HTML",
        css: "CSS",
        markdown: "Markdown",
        json: "JSON",
        yaml: "YAML",
    };

    return labels[language] || language;
}

function ArchitectureOverview({
    repositoryUrl,
    isReady,
}) {
    const [overview, setOverview] =
        useState(null);

    const [isLoading, setIsLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadOverview() {
            if (!repositoryUrl || !isReady) {
                setOverview(null);
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const data =
                    await getRepositoryOverview(
                        repositoryUrl
                    );

                if (!cancelled) {
                    setOverview(data);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to load repository architecture."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadOverview();

        return () => {
            cancelled = true;
        };
    }, [repositoryUrl, isReady]);

    const maxLanguageFiles = useMemo(() => {
        if (!overview?.languages?.length) {
            return 1;
        }

        return Math.max(
            ...overview.languages.map(
                (item) => item.files
            )
        );
    }, [overview]);

    if (!isReady) {
        return null;
    }

    return (
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/90 shadow-2xl shadow-black/20">
            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <BarChart3 size={16} />
                    Architecture Overview
                </div>

                <p className="mt-1 text-xs text-slate-600">
                    A structural summary generated from the indexed repository.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600">
                    <Loader2
                        size={17}
                        className="animate-spin"
                    />

                    Building repository overview...
                </div>
            ) : error ? (
                <div className="p-5 text-sm text-red-300">
                    {error}
                </div>
            ) : overview ? (
                <div className="space-y-6 p-5 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 text-slate-600">
                                <FileCode2 size={15} />
                                <span className="text-[11px] uppercase tracking-wider">
                                    Files
                                </span>
                            </div>

                            <div className="mt-2 text-2xl font-semibold text-slate-200">
                                {overview.file_count}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Box size={15} />
                                <span className="text-[11px] uppercase tracking-wider">
                                    Chunks
                                </span>
                            </div>

                            <div className="mt-2 text-2xl font-semibold text-slate-200">
                                {overview.chunk_count}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 text-slate-600">
                                <FunctionSquare size={15} />
                                <span className="text-[11px] uppercase tracking-wider">
                                    Functions
                                </span>
                            </div>

                            <div className="mt-2 text-2xl font-semibold text-slate-200">
                                {overview.function_count}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 text-slate-600">
                                <FolderTree size={15} />
                                <span className="text-[11px] uppercase tracking-wider">
                                    Symbols
                                </span>
                            </div>

                            <div className="mt-2 text-2xl font-semibold text-slate-200">
                                {overview.symbol_count}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-xl border border-white/7 bg-black/10 p-4">
                            <div className="mb-4 text-xs font-medium text-slate-400">
                                Languages
                            </div>

                            <div className="space-y-4">
                                {overview.languages.map(
                                    (item) => (
                                        <div key={item.language}>
                                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                                <span className="text-slate-500">
                                                    {languageLabel(
                                                        item.language
                                                    )}
                                                </span>

                                                <span className="tabular-nums text-slate-700">
                                                    {item.files}
                                                </span>
                                            </div>

                                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                                <div
                                                    className="h-full rounded-full bg-white/40"
                                                    style={{
                                                        width: `${Math.max(
                                                            6,
                                                            (item.files /
                                                                maxLanguageFiles) *
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/7 bg-black/10 p-4">
                            <div className="mb-4 text-xs font-medium text-slate-400">
                                Top-level modules
                            </div>

                            <div className="space-y-2">
                                {overview.directories.map(
                                    (directory) => (
                                        <div
                                            key={directory.name}
                                            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <FolderTree
                                                    size={14}
                                                    className="shrink-0 text-slate-600"
                                                />

                                                <span className="truncate font-mono text-xs text-slate-500">
                                                    {directory.name}
                                                </span>
                                            </div>

                                            <span className="text-[11px] tabular-nums text-slate-700">
                                                {directory.files}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/7 bg-black/10 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-xs font-medium text-slate-400">
                                Largest files
                            </div>

                            <div className="text-[11px] text-slate-700">
                                {formatSize(
                                    overview.total_size
                                )}{" "}
                                total
                            </div>
                        </div>

                        <div className="space-y-2">
                            {overview.largest_files.map(
                                (file) => (
                                    <div
                                        key={file.path}
                                        className="flex items-center justify-between gap-4 rounded-lg px-2 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <FileCode2
                                                size={14}
                                                className="shrink-0 text-slate-700"
                                            />

                                            <span className="truncate font-mono text-xs text-slate-600">
                                                {file.path}
                                            </span>
                                        </div>

                                        <span className="shrink-0 text-[11px] tabular-nums text-slate-700">
                                            {formatSize(
                                                file.size
                                            )}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default ArchitectureOverview;