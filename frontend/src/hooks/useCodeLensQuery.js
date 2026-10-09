import { useState } from "react";
import {
    streamRepositoryQuestion,
} from "../services/api";

export function useCodeLensQuery() {
    const [question, setQuestion] =
        useState("");

    const [isAsking, setIsAsking] =
        useState(false);

    const [answerData, setAnswerData] =
        useState(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    function resetAnswer() {
        setAnswerData(null);
        setErrorMessage("");
        setIsAsking(false);
    }

    function handleSuggestedQuestion(value) {
        setQuestion(value);
        setErrorMessage("");
    }

    async function askQuestion(repositoryUrl) {
        const trimmedQuestion =
            question.trim();

        const trimmedRepositoryUrl =
            repositoryUrl.trim();

        if (!trimmedRepositoryUrl) {
            setErrorMessage(
                "Connect a GitHub repository first."
            );
            return;
        }

        if (!trimmedQuestion) {
            setErrorMessage(
                "Enter a question about the codebase."
            );
            return;
        }

        setErrorMessage("");
        setIsAsking(true);

        setAnswerData({
            answer: "",
            sources: [],
            isStreaming: true,
        });

        try {
            await streamRepositoryQuestion(
                trimmedQuestion,
                trimmedRepositoryUrl,
                ({ event, data }) => {
                    if (event === "sources") {
                        let sources = [];

                        try {
                            sources =
                                JSON.parse(data);
                        } catch {
                            sources = [];
                        }

                        setAnswerData(
                            (previous) => ({
                                ...(previous || {}),
                                sources,
                                answer:
                                    previous?.answer ||
                                    "",
                                isStreaming: true,
                            })
                        );
                    }

                    if (event === "chunk") {
                        setAnswerData(
                            (previous) => ({
                                ...(previous || {}),
                                answer:
                                    (previous?.answer ||
                                        "") +
                                    data,
                                sources:
                                    previous?.sources ||
                                    [],
                                isStreaming: true,
                            })
                        );
                    }

                    if (event === "done") {
                        setAnswerData(
                            (previous) => ({
                                ...(previous || {}),
                                isStreaming: false,
                            })
                        );
                    }

                    if (event === "error") {
                        let message =
                            data ||
                            "Streaming failed.";

                        try {
                            const parsed =
                                JSON.parse(data);

                            message =
                                parsed?.message ||
                                message;
                        } catch {
                            // Keep original message.
                        }

                        throw new Error(message);
                    }
                }
            );

            setAnswerData(
                (previous) => ({
                    ...(previous || {}),
                    isStreaming: false,
                })
            );
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

    function handleQuestionKeyDown(
        event,
        repositoryUrl
    ) {
        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
        ) {
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