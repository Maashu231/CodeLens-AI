import { useState } from "react";
import { askRepositoryQuestion } from "../services/api";

export function useCodeLensQuery() {
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [answerData, setAnswerData] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    function resetAnswer() {
        setAnswerData(null);
        setErrorMessage("");
    }

    function handleSuggestedQuestion(value) {
        setQuestion(value);
        setErrorMessage("");
    }

    async function askQuestion(repositoryUrl) {
        const trimmedQuestion = question.trim();
        const trimmedRepositoryUrl = repositoryUrl.trim();

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
        setAnswerData(null);

        try {
            const data = await askRepositoryQuestion(
                trimmedQuestion,
                trimmedRepositoryUrl
            );

            setAnswerData(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while generating the answer."
            );
        } finally {
            setIsAsking(false);
        }
    }

    function handleQuestionKeyDown(event, repositoryUrl) {
        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();
            askQuestion(repositoryUrl);
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