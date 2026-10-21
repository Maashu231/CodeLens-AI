import { useState } from "react";
import { streamRepositoryQuestion } from "../services/api";
import type { AnswerData, Source } from "../types";

/**
 * Extracts plain text from a stream chunk (JSON or plain).
 */
function extractChunkText(data: string): string {
    try {
        const parsed = JSON.parse(data);
        if (typeof parsed === "string") return parsed;
        if (typeof parsed?.text === "string") return parsed.text;
        if (typeof parsed?.content === "string") return parsed.content;
    } catch {
        // Ordinary text chunks do not need JSON parsing.
    }
    return data;
}

/**
 * Hook that manages the "Ask Codebase" Q&A flow, including
 * streaming answers from the backend.
 */
export function useCodeLensQuery(): {
    question: string;
    setQuestion: (q: string) => void;
    isAsking: boolean;
    answerData: AnswerData | null;
    errorMessage: string;
    askQuestion: (repoUrl: string) => Promise<void>;
    resetAnswer: () => void;
    handleSuggestedQuestion: (value: string) => void;
    handleQuestionKeyDown: (event: React.KeyboardEvent, repoUrl: string) => void;
} {
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [answerData, setAnswerData] = useState<AnswerData | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    function resetAnswer() {
        setAnswerData(null);
        setErrorMessage("");
        setIsAsking(false);
    }

    function handleSuggestedQuestion(value: string) {
        setQuestion(value);
        setErrorMessage("");
    }

    async function askQuestion(repositoryUrl: string) {
        const trimmedQuestion = question.trim();
        const trimmedRepositoryUrl = repositoryUrl.trim();

        if (!trimmedRepositoryUrl) {
            setErrorMessage("Connect a GitHub repository first.");
            return;
        }

        if (!trimmedQuestion) {
            setErrorMessage("Enter a question about the codebase.");
            return;
        }

        setErrorMessage("");
        setIsAsking(true);

        setAnswerData({
            answer: "",
            sources: [],
            is_streaming: true,
        });

        try {
            await streamRepositoryQuestion(
                trimmedQuestion,
                trimmedRepositoryUrl,
                ({ event, data }) => {
                    if (event === "sources") {
                        let sources: Source[] = [];

                        try {
                            const parsed = JSON.parse(data);
                            if (Array.isArray(parsed)) {
                                sources = parsed;
                            } else if (Array.isArray(parsed?.sources)) {
                                sources = parsed.sources;
                            }
                        } catch {
                            sources = [];
                        }

                        setAnswerData((previous) => ({
                            ...(previous || {}),
                            sources,
                            answer: previous?.answer || "",
                            is_streaming: true,
                        }));
                    }

                    if (event === "chunk") {
                        const chunkText = extractChunkText(data);
                        setAnswerData((previous) => ({
                            ...(previous || {}),
                            answer: `${previous?.answer || ""}${chunkText}`,
                            sources: previous?.sources || [],
                            is_streaming: true,
                        }));
                    }

                    if (event === "done") {
                        setAnswerData((previous) => (previous ? { ...previous, is_streaming: false } : null));
                    }

                    if (event === "error") {
                        let message = data || "Streaming failed.";

                        try {
                            const parsed = JSON.parse(data);
                            message = parsed?.message || parsed?.detail || message;
                        } catch {
                            // Keep the original error message.
                        }

                        throw new Error(message);
                    }
                }
            );

            setAnswerData((previous) => (previous ? { ...previous, is_streaming: false } : null));
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while generating the answer."
            );
            setAnswerData(null);
        } finally {
            setIsAsking(false);
        }
    }

    function handleQuestionKeyDown(event: React.KeyboardEvent, repositoryUrl: string) {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (!isAsking) {
                askQuestion(repositoryUrl);
            }
        }
    }

    return {
        question,
        setQuestion,
        isAsking,
        answerData,
        errorMessage,
        askQuestion,
        resetAnswer,
        handleSuggestedQuestion,
        handleQuestionKeyDown,
    };
}