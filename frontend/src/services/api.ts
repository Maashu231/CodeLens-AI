/**
 * Thin wrapper around `fetch` for all backend API calls.
 * Handles JSON parsing, error normalization, and streaming events.
 */

interface RequestOptions extends RequestInit {
    body?: string | Record<string, unknown>;
}

async function request(url: string, options: RequestOptions = {}): Promise<unknown> {
    const response = await fetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail = (data as Record<string, unknown>).detail;
        const message = (data as Record<string, unknown>).message;
        throw new Error(
            (detail as string) ||
            (message as string) ||
            "Something went wrong with the request."
        );
    }

    return data;
}

export async function getBackendHealth(): Promise<{ status: string; version: string }> {
    return request("/health") as Promise<{ status: string; version: string }>;
}

export async function startRepositoryIndexing(repositoryUrl: string): Promise<{
    job_id: string;
    repository: string;
    status: string;
}> {
    return request("/repositories/index", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: repositoryUrl,
        }),
    });
}

export async function getIndexingJob(jobId: string): Promise<{
    id: string;
    owner: string;
    repo: string;
    status: string;
    stage: string;
    progress: number;
    chunks_indexed?: number;
    error?: string;
}> {
    return request(`/repositories/jobs/${jobId}`);
}

export async function askRepositoryQuestion(
    question: string,
    repositoryUrl: string
): Promise<{
    answer: string;
    sources: Array<{
        file: string;
        start_line: number;
        end_line: number;
        symbol?: string | null;
    }>;
}> {
    return request("/ask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question,
            repository_url: repositoryUrl,
        }),
    });
}

export async function streamRepositoryQuestion(
    question: string,
    repositoryUrl: string,
    onEvent: (event: { event: string; data: string }) => void
): Promise<void> {
    const response = await fetch("/ask/stream", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        body: JSON.stringify({
            question,
            repository_url: repositoryUrl,
        }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
            (data as Record<string, unknown>)?.detail as string ||
            (data as Record<string, unknown>)?.message as string ||
            `Request failed with status ${response.status}`
        );
    }

    if (!response.body) {
        throw new Error("Streaming response is not available.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split(/\r?\n\r?\n/);

        buffer = blocks.pop() || "";

        for (const block of blocks) {
            if (!block.trim()) {
                continue;
            }

            let event = "message";
            const dataLines: string[] = [];

            for (const line of block.split(/\r?\n/)) {
                if (line.startsWith("event:")) {
                    event = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    const dataPart = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
                    dataLines.push(dataPart);
                }
            }

            onEvent({
                event,
                data: dataLines.join("\n"),
            });
        }
    }
}

export async function getRepositoryTree(repositoryUrl: string): Promise<{
    files: Array<{
        path: string;
        name: string;
        size: number;
    }>;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
    });

    return request(`/repositories/tree?${params.toString()}`);
}

export async function getRepositoryFile(repositoryUrl: string, path: string): Promise<{
    repository: string;
    owner: string;
    branch: string;
    path: string;
    content: string;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        path,
    });

    return request(`/repositories/file?${params.toString()}`);
}

export async function getRepositoryOverview(repositoryUrl: string): Promise<{
    file_count: number;
    chunk_count: number;
    function_count: number;
    symbol_count: number;
    languages: Array<{ language: string; files: number }>;
    directories: Array<{ name: string; files: number }>;
    largest_files: Array<{ path: string; size: number }>;
    total_size: number;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
    });

    return request(`/repositories/overview?${params.toString()}`);
}

export async function getRepositoryFileHistory(repositoryUrl: string, path: string): Promise<{
    commits: Array<{
        sha: string;
        short_sha: string;
        message: string;
        author: string;
        date?: string | null;
        url?: string | null;
    }>;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        path,
    });

    return request(`/repositories/history?${params.toString()}`);
}

export async function getRepositoryImpact(
    repositoryUrl: string,
    path: string,
    symbol: string | null
): Promise<{
    stats: { direct: number; indirect: number };
    impacted: Array<{
        id: string;
        name?: string | null;
        path: string;
        distance: number;
        impact: "direct" | "indirect";
        relationship: string;
    }>;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        path,
    });

    if (symbol) {
        params.set("symbol", symbol);
    }

    return request(`/repositories/impact?${params.toString()}`);
}

export async function investigateRepositoryBug(
    question: string,
    repositoryUrl: string
): Promise<{
    answer: string;
    sources: Array<{
        file: string;
        start_line: number;
        end_line: number;
        symbol?: string | null;
    }>;
}> {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        question,
    });

    return request(`/repositories/investigate?${params.toString()}`);
}