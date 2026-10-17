import { useState, useCallback } from "react";
import { investigateRepositoryBug } from "../services/api";
import type { AnswerData } from "../types";

/**
 * Hook that manages the "Investigate a bug" flow.
 * Very similar to useCodeLensQuery but for the bug investigation endpoint.
 */
export function useBugInvestigation(): {
    bugQuestion: string;
    setBugQuestion: (q: string) => void;
    isInvestigating: boolean;
    bugAnswerData: AnswerData | null;
    bugError: string;
    investigateBug: (repoUrl: string) => Promise<void>;
    resetBugInvestigation: () => void;
    handleBugQuestionKeyDown: (event: React.KeyboardEvent, repoUrl: string) => void;
} {
    const [bugQuestion, setBugQuestion] = useState("");
    const [isInvestigating, setIsInvestigating] = useState(false);
    const [bugAnswerData, setBugAnswerData] = useState<AnswerData | null>(null);
    const [bugError, setBugError] = useState("");

    function resetBugInvestigation() {
        setBugAnswerData(null);
        setBugError("");
        setIsInvestigating(false);
    }

    async function investigateBug(repositoryUrl: string) {
        const trimmedQuestion = bugQuestion.trim();
        const trimmedRepositoryUrl = repositoryUrl.trim();

        if (!trimmedRepositoryUrl) {
            setBugError("Connect a GitHub repository first.");
            return;
        }

        if (!trimmedQuestion) {
            setBugError("Enter a question about the bug.");
            return;
        }

        setBugError("");
        setIsInvestigating(true);

        setBugAnswerData({
            answer: "",
            sources: [],
            is_streaming: true,
        });

        try {
            const data = await investigateRepositoryBug(
                trimmedQuestion,
                trimmedRepositoryUrl
            );

            setBugAnswerData({
                answer: data.answer,
                sources: data.sources,
                is_streaming: false,
            });
        } catch (error) {
            setBugError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while investigating the bug."
            );
            setBugAnswerData(null);
        } finally {
            setIsInvestigating(false);
        }
    }

    function handleBugQuestionKeyDown(event: React.KeyboardEvent, repositoryUrl: string) {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (!isInvestigating) {
                investigateBug(repositoryUrl);
            }
        }
    }

    return {
        bugQuestion,
        setBugQuestion,
        isInvestigating,
        bugAnswerData,
        bugError,
        investigateBug,
        resetBugInvestigation,
        handleBugQuestionKeyDown,
    };
}