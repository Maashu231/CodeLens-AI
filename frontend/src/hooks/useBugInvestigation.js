import { useState } from "react";

import { investigateRepositoryBug } from "../services/api";


export function useBugInvestigation() {
    const [bugQuestion, setBugQuestion] =
        useState("");

    const [isInvestigating, setIsInvestigating] =
        useState(false);

    const [bugAnswerData, setBugAnswerData] =
        useState(null);

    const [bugError, setBugError] =
        useState("");


    function resetBugInvestigation() {
        setBugAnswerData(null);
        setBugError("");
    }


    async function investigateBug(
        repositoryUrl
    ) {
        const trimmedQuestion =
            bugQuestion.trim();

        const trimmedRepositoryUrl =
            repositoryUrl.trim();

        if (!trimmedRepositoryUrl) {
            setBugError(
                "Connect a GitHub repository first."
            );
            return;
        }

        if (!trimmedQuestion) {
            setBugError(
                "Describe the bug or error first."
            );
            return;
        }

        setBugError("");
        setIsInvestigating(true);
        setBugAnswerData(null);

        try {
            const data =
                await investigateRepositoryBug(
                    trimmedQuestion,
                    trimmedRepositoryUrl
                );

            setBugAnswerData(data);
        } catch (error) {
            setBugError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while investigating the bug."
            );
        } finally {
            setIsInvestigating(false);
        }
    }


    function handleBugQuestionKeyDown(
        event,
        repositoryUrl
    ) {
        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();

            investigateBug(
                repositoryUrl
            );
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