import { useState, useEffect, useCallback } from "react";
import {
    startRepositoryIndexing,
    getIndexingJob,
} from "../services/api";
import type { IndexingJob } from "../types";

/**
 * Hook that manages repository indexing state.
 * Starts a job on the backend and polls its progress.
 */
export function useRepositoryIndexing(): {
    isIndexing: boolean;
    isReady: boolean;
    progress: number;
    chunksIndexed: number | null;
    statusMessage: string;
    errorMessage: string;
    startIndexing: (repoUrl: string) => Promise<void>;
    reset: () => void;
} {
    const [isIndexing, setIsIndexing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState("No repository connected");
    const [errorMessage, setErrorMessage] = useState("");
    const [jobId, setJobId] = useState<string | null>(null);

    const reset = useCallback(() => {
        setIsIndexing(false);
        setIsReady(false);
        setProgress(0);
        setChunksIndexed(null);
        setStatusMessage("No repository connected");
        setErrorMessage("");
        setJobId(null);
    }, []);

    const startIndexing = useCallback(
        async (repositoryUrl: string) => {
            const trimmedUrl = repositoryUrl.trim();

            if (!trimmedUrl) {
                setErrorMessage("Connect a GitHub repository first.");
                return;
            }

            reset();
            setIsIndexing(true);
            setStatusMessage("Starting indexing job...");

            try {
                const job = await startRepositoryIndexing(trimmedUrl) as IndexingJob;
                setJobId(job.id);
                setStatusMessage("Indexing repository...");
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to start indexing."
                );
                setIsIndexing(false);
            }
        },
        [reset]
    );

    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const job = await getIndexingJob(jobId) as IndexingJob;
                setProgress(job.progress);
                setStatusMessage(job.stage);

                if (job.status === "completed") {
                    setChunksIndexed(job.chunks_indexed ?? null);
                    setIsReady(true);
                    setIsIndexing(false);
                    clearInterval(interval);
                } else if (job.status === "failed") {
                    setErrorMessage(job.error || "Indexing failed.");
                    setIsIndexing(false);
                    clearInterval(interval);
                }
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to check indexing progress."
                );
                setIsIndexing(false);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [jobId]);

    return {
        isIndexing,
        isReady,
        progress,
        chunksIndexed,
        statusMessage,
        errorMessage,
        startIndexing,
        reset,
    };
}