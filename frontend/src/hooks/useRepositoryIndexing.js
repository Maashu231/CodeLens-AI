import { useRef, useState } from "react";
import {
    getIndexingJob,
    startRepositoryIndexing,
} from "../services/api";
import { formatIndexingStage } from "../utils/formatters";

function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

export function useRepositoryIndexing() {
    const [isIndexing, setIsIndexing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [chunksIndexed, setChunksIndexed] = useState(null);
    const [statusMessage, setStatusMessage] = useState(
        "Connect a GitHub repository to begin."
    );
    const [errorMessage, setErrorMessage] = useState("");

    const operationRef = useRef(0);

    function reset() {
        operationRef.current += 1;

        setIsIndexing(false);
        setIsReady(false);
        setChunksIndexed(null);
        setStatusMessage(
            "Connect a GitHub repository to begin."
        );
        setErrorMessage("");
    }

    async function startIndexing(repositoryUrl) {
        const url = repositoryUrl.trim();

        if (!url) {
            setErrorMessage("Enter a GitHub repository URL.");
            return;
        }

        const operationId = operationRef.current + 1;
        operationRef.current = operationId;

        setErrorMessage("");
        setIsIndexing(true);
        setIsReady(false);
        setChunksIndexed(null);
        setStatusMessage("Starting repository analysis...");

        try {
            const data = await startRepositoryIndexing(url);

            /*
             * Backward compatibility:
             * If the backend ever returns a completed result
             * directly, accept it.
             */
            if (
                data.status === "completed" &&
                data.chunks_indexed !== undefined
            ) {
                setChunksIndexed(data.chunks_indexed);
                setIsReady(true);
                setStatusMessage(
                    `${data.chunks_indexed} code chunks are ready for questions.`
                );
                return;
            }

            const jobId = data.job_id;

            if (!jobId) {
                throw new Error(
                    "The indexing service did not return a job ID."
                );
            }

            let completed = false;

            while (!completed) {
                await sleep(1000);

                if (operationRef.current !== operationId) {
                    return;
                }

                const job = await getIndexingJob(jobId);

                if (job.status === "failed") {
                    throw new Error(
                        job.error || "Repository indexing failed."
                    );
                }

                const progress = job.progress ?? 0;
                const stage = job.stage || "working";

                setStatusMessage(
                    `${formatIndexingStage(stage)} · ${progress}%`
                );

                if (job.status === "completed") {
                    completed = true;

                    const indexedChunks = job.chunks_indexed ?? 0;

                    setChunksIndexed(indexedChunks);
                    setIsReady(true);
                    setStatusMessage(
                        `${indexedChunks} code chunks are ready for questions.`
                    );
                }
            }
        } catch (error) {
            if (operationRef.current !== operationId) {
                return;
            }

            setIsReady(false);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while indexing the repository."
            );

            setStatusMessage("Repository analysis failed.");
        } finally {
            if (operationRef.current === operationId) {
                setIsIndexing(false);
            }
        }
    }

    return {
        isIndexing,
        isReady,
        chunksIndexed,
        statusMessage,
        errorMessage,
        startIndexing,
        reset,
    };
}