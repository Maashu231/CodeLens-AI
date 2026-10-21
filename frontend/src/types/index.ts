/**
 * Shared TypeScript type definitions for the CodeLens AI frontend.
 *
 * These types describe API responses, component props, and shared
 * state shapes used across the application.
 */

/** A repository fetched from GitHub via the backend. */
export interface Repository {
    name: string;
    owner: { login: string };
    default_branch: string;
}

/** Progress information for an indexing job. */
export interface IndexingJob {
    id: string;
    owner: string;
    repo: string;
    status: "queued" | "running" | "completed" | "failed";
    stage: string;
    progress: number;
    chunks_indexed?: number;
    error?: string;
}

/** A single source citation returned with an answer. */
export interface Source {
    file: string;
    start_line: number;
    end_line: number;
    symbol?: string | null;
    content?: string;
}

/** The answer payload returned by /ask or /ask/stream. */
export interface AnswerData {
    answer: string;
    sources: Source[];
    is_streaming: boolean;
}

/** Statistics for change-impact analysis. */
export interface ImpactStats {
    direct: number;
    indirect: number;
}

/** A single impacted code item in impact analysis. */
export interface ImpactItem {
    id: string;
    name?: string | null;
    path: string;
    distance: number;
    impact: "direct" | "indirect";
    relationship: string;
}

/** The full impact-analysis response. */
export interface ImpactData {
    stats: ImpactStats;
    impacted: ImpactItem[];
}

/** A commit entry in file history. */
export interface Commit {
    sha: string;
    short_sha: string;
    message: string;
    author: string;
    date?: string | null;
    url?: string | null;
}

/** Architectural overview of a repository. */
export interface LanguageItem {
    language: string;
    files: number;
}

export interface DirectoryItem {
    name: string;
    files: number;
}

export interface LargestFileItem {
    path: string;
    size: number;
}

export interface RepositoryOverview {
    file_count: number;
    chunk_count: number;
    function_count: number;
    symbol_count: number;
    languages: LanguageItem[];
    directories: DirectoryItem[];
    largest_files: LargestFileItem[];
    total_size: number;
}

/** File entry in the repository explorer tree. */
export interface RepositoryFile {
    path: string;
    name: string;
    size: number;
}

/** Suggestion metadata for quick-question chips. */
export interface SuggestedQuestion {
    id: string;
    text: string;
}

/** Backend health status. */
export interface BackendHealth {
    status: string;
    version: string | null;
}

/** Modes supported by the Q&A card. */
export type QueryMode = "ask" | "bug";

/** Status severity for toast notifications. */
export type ToastType = "success" | "error" | "info";

/** A toast notification. */
export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

/** API error shape returned by the backend. */
export interface ApiError {
    detail?: string;
    message?: string;
    status?: number;
}
