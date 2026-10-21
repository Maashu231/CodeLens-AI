import { useEffect, useMemo, useState } from "react";
import {
    ChevronRight,
    FileCode2,
    Folder,
    Loader2,
    Search,
} from "lucide-react";

import {
    getRepositoryFile,
    getRepositoryTree,
} from "../services/api";
import type { RepositoryFile } from "../types";

function getLanguage(path: string): string {
    const extension =
        path.split(".").pop()?.toLowerCase();

    const languages: Record<string, string> = {
        py: "PY",
        js: "JS",
        jsx: "JSX",
        ts: "TS",
        tsx: "TSX",
        java: "JAVA",
        sql: "SQL",
        html: "HTML",
        css: "CSS",
        md: "MD",
        json: "JSON",
        yml: "YML",
        yaml: "YAML",
    };

    return (extension && languages[extension]) || "FILE";
}

function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createTree(files: RepositoryFile[]) {
    const root = {
        folders: {} as Record<string, { folders: Record<string, any>; files: any[] }>,
        files: [] as RepositoryFile[],
    };

    for (const file of files) {
        const parts = file.path.split("/");
        const fileName = parts.pop() || file.name;

        let current = root;

        for (const folderName of parts) {
            if (!current.folders[folderName]) {
                current.folders[folderName] = {
                    folders: {},
                    files: [],
                };
            }

            current = current.folders[folderName];
        }

        current.files.push({
            ...file,
            name: fileName,
        });
    }

    return root;
}

interface TreeFolderProps {
    name: string;
    node: {
        folders: Record<string, { folders: Record<string, any>; files: any[] }>;
        files: RepositoryFile[];
    };
    depth: number;
    onOpenFile: (file: RepositoryFile) => void;
}

function TreeFolder({
    name,
    node,
    depth,
    onOpenFile,
}: TreeFolderProps) {
    const folders = Object.entries(
        node.folders
    ).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    const files = [...node.files].sort(
        (a, b) => a.name.localeCompare(b.name)
    );

    return (
        <details
            open
            className="group"
        >
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 transition-all duration-300 hover:bg-white/[0.03] hover:text-slate-300 group-hover:shadow-sm">
                <ChevronRight
                    size={13}
                    className="transition-transform duration-300 group-open:rotate-90"
                />

                <Folder
                    size={15}
                    className="text-slate-600 transition-colors group-hover:text-slate-400"
                />

                <span className="font-medium">
                    {name}
                </span>
            </summary>

            <div
                className="ml-3 border-l border-white/6 pl-2"
                style={{
                    marginLeft: `${depth * 6}px`,
                }}
            >
                {folders.map(
                    ([folderName, folderNode]) => (
                        <TreeFolder
                            key={folderName}
                            name={folderName}
                            node={folderNode}
                            depth={depth + 1}
                            onOpenFile={onOpenFile}
                        />
                    )
                )}

                {files.map((file) => (
                    <button
                        key={file.path}
                        onClick={() =>
                            onOpenFile(file)
                        }
                        className="relative z-10 group/file flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-300 hover:bg-white/[0.035] hover:shadow-md group-hover:shadow-lg"
                    >
                        <FileCode2
                            size={14}
                            className="shrink-0 text-slate-600 group-hover/text-slate-400 transition-colors"
                        />

                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-500 group-hover/text-slate-200 transition-colors">
                            {file.name}
                        </span>

                        <span className="hidden rounded border border-white/6 bg-white/[0.02] px-1.5 py-0.5 text-[9px] font-medium text-slate-700 sm:inline">
                            {getLanguage(file.path)}
                        </span>

                        <span className="hidden w-16 text-right text-[10px] text-slate-700 md:inline">
                            {formatSize(file.size)}
                        </span>
                    </button>
                ))}
            </div>
        </details>
    );
}

interface RepositoryExplorerProps {
    repositoryUrl: string;
    isReady: boolean;
    onOpenSource: (source: any) => void;
    showToast?: (type: string, message: string) => void;
}

function RepositoryExplorer({
    repositoryUrl,
    isReady,
    onOpenSource,
}: RepositoryExplorerProps) {
    const [files, setFiles] = useState<RepositoryFile[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] =
        useState(false);
    const [loadingFile, setLoadingFile] =
        useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadTree() {
            if (!repositoryUrl || !isReady) {
                setFiles([]);
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const data =
                    await getRepositoryTree(
                        repositoryUrl
                    );

                if (!cancelled) {
                    setFiles(data.files || []);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to load repository files."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadTree();

        return () => {
            cancelled = true;
        };
    }, [repositoryUrl, isReady]);

    const visibleFiles = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        if (!query) {
            return files;
        }

        return files.filter((file) =>
            file.path
                .toLowerCase()
                .includes(query)
        );
    }, [files, search]);

    const tree = useMemo(
        () => createTree(visibleFiles),
        [visibleFiles]
    );

    async function handleOpenFile(file: RepositoryFile) {
        setLoadingFile(file.path);
        setError("");

        try {
            const data =
                await getRepositoryFile(
                    repositoryUrl,
                    file.path
                );

            const lineCount = Math.max(
                1,
                (data.content || "").split("\n")
                    .length
            );

            onOpenSource({
                file: data.path,
                start_line: 1,
                end_line: lineCount,
                symbol: null,
                content: data.content,
            });
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : "Unable to open repository file."
            );
        } finally {
            setLoadingFile("");
        }
    }

    if (!isReady) {
        return null;
    }

    return (
        <section className="relative z-10 overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/80 shadow-2xl shadow-black/20 glass-card">
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500/20 blur-sm" />

            <div className="relative z-10 border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Folder size={16} />
                            Repository Explorer
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                            Browse indexed source files and inspect their code.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span>
                            {files.length} supported files
                        </span>

                        {search && (
                            <>
                                <span className="mx-1">•</span>
                                <span>
                                    {visibleFiles.length} matching
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="relative mt-4">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700"
                    />

                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search files..."
                        className="input-enhanced"
                    />
                </div>

                {error && (
                    <div className="mt-3 border-b border-rose-500/20 bg-rose-950/20 px-5 py-3 text-xs text-rose-300">
                        {error}
                    </div>
                )}

                <div className="relative z-10 max-h-[520px] overflow-auto p-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-600">
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />

                            Loading repository files...
                        </div>
                    ) : visibleFiles.length === 0 ? (
                        <div className="py-14 text-center text-sm text-slate-600">
                            No matching files found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {Object.entries(
                                tree.folders
                            )
                                .sort(([a], [b]) =>
                                    a.localeCompare(b)
                                )
                                .map(
                                    ([
                                        folderName,
                                        folderNode,
                                    ]) => (
                                        <TreeFolder
                                            key={folderName}
                                            name={folderName}
                                            node={folderNode}
                                            depth={0}
                                            onOpenFile={
                                                handleOpenFile
                                            }
                                        />
                                    )
                                )}

                            {tree.files
                                .sort((a, b) =>
                                    a.name.localeCompare(
                                        b.name
                                    )
                                )
                                .map((file) => (
                                    <button
                                        key={file.path}
                                        onClick={() =>
                                            handleOpenFile(
                                                file
                                            )
                                        }
                                        className="relative z-10 group/file flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-300 hover:bg-white/[0.035] hover:shadow-md group-hover:shadow-lg"
                                    >
                                        {loadingFile ===
                                            file.path ? (
                                            <Loader2
                                                size={14}
                                                className="shrink-0 animate-spin text-slate-500"
                                            />
                                        ) : (
                                            <FileCode2
                                                size={14}
                                                className="shrink-0 text-slate-600 group-hover/text-slate-400 transition-colors"
                                            />
                                        )}

                                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-500 group-hover/text-slate-200 transition-colors">
                                            {file.name}
                                        </span>

                                        <span className="hidden rounded border border-white/6 bg-white/[0.02] px-1.5 py-0.5 text-[9px] font-medium text-slate-700 sm:inline">
                                            {getLanguage(
                                                file.path
                                            )}
                                        </span>

                                        <span className="hidden w-16 text-right text-[10px] text-slate-700 md:inline">
                                            {formatSize(
                                                file.size
                                            )}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default RepositoryExplorer;