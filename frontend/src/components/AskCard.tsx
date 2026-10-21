import {
    Bug,
    CheckCircle2,
    Loader2,
    MessageSquareText,
    Send,
} from "lucide-react";

import { SkeletonLine } from "./ui/Skeleton";

const suggestedQuestions = [
    "Where is the FastAPI health endpoint?",
    "How does the API add a GitHub repository?",
    "How is the health endpoint tested?",
];

const suggestedBugQuestions = [
    "Why is the application returning 502 Bad Gateway?",
    "Why could repository indexing fail?",
    "Why could GitHub requests be rejected?",
];

interface AskCardProps {
    mode: "ask" | "bug";
    onModeChange: (mode: "ask" | "bug") => void;

    question: string;
    setQuestion: (q: string) => void;

    bugQuestion: string;
    setBugQuestion: (q: string) => void;

    isReady: boolean;

    isAsking: boolean;
    isInvestigating: boolean;

    answerData: { answer: string; sources: any[]; is_streaming: boolean } | null;
    bugAnswerData: { answer: string; sources: any[]; is_streaming: boolean } | null;

    onAsk: () => void;
    onInvestigate: () => void;

    onSuggestedQuestion: (value: string) => void;
    onSuggestedBugQuestion: (value: string) => void;

    onQuestionKeyDown: (event: React.KeyboardEvent) => void;
    onBugQuestionKeyDown: (event: React.KeyboardEvent) => void;

    showToast?: (type: string, message: string) => void;
}

function AskCard({
    mode,
    onModeChange,

    question,
    setQuestion,

    bugQuestion,
    setBugQuestion,

    isReady,

    isAsking,
    isInvestigating,

    answerData,
    bugAnswerData,

    onAsk,
    onInvestigate,

    onSuggestedQuestion,
    onSuggestedBugQuestion,

    onQuestionKeyDown,
    onBugQuestionKeyDown,

    showToast: _showToast,
}: AskCardProps) {
    const isBugMode = mode === "bug";

    const activeQuestion = isBugMode ? bugQuestion : question;

    const hasAnswer = isBugMode ? Boolean(bugAnswerData) : Boolean(answerData);

    return (
        <section className="relative overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/80 p-5 shadow-2xl shadow-black/20 sm:p-6 glass-card-hover">

            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-pink-500/20 blur-sm" />

            <div className="relative z-10 flex flex-col gap-4">

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            {isBugMode ? (
                                <Bug size={16} className="text-red-400" />
                            ) : (
                                <MessageSquareText
                                    size={16}
                                    className="text-indigo-400"
                                />
                            )}

                            {isBugMode
                                ? "Investigate a bug"
                                : "Ask about the codebase"}
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                            {isBugMode
                                ? "Trace a reported error using repository evidence."
                                : "Ask about functions, endpoints, architecture, bugs, or code relationships."}
                        </p>
                    </div>

                    {isReady && (
                        <div className="hidden items-center gap-1.5 text-[11px] text-emerald-400 sm:flex">
                            <CheckCircle2 size={13} className="shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            Indexed & ready
                        </div>
                    )}
                </div>

                <div className="inline-flex w-fit rounded-lg border border-white/7 bg-black/20 p-1 glass-card-hover">

                    <button
                        type="button"
                        onClick={() => onModeChange("ask")}
                        className={`rounded-md px-3 py-1.5 text-xs transition-all duration-300 ${
                            mode === "ask"
                                ? "bg-white/[0.08] text-slate-200 shadow-sm shadow-white/5"
                                : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.04]"
                        }`}
                    >
                        Ask Codebase
                    </button>

                    <button
                        type="button"
                        onClick={() => onModeChange("bug")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all duration-300 ${
                            mode === "bug"
                                ? "bg-white/[0.08] text-slate-200 shadow-sm shadow-white/5"
                                : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.04]"
                        }`}
                    >
                        <Bug size={12} />
                        Investigate Bug
                    </button>
                </div>
            </div>

            <div className="relative z-10 mt-5">

                <textarea
                    value={activeQuestion}
                    onChange={(event) => {
                        if (isBugMode) {
                            setBugQuestion(event.target.value);
                        } else {
                            setQuestion(event.target.value);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (isBugMode) {
                            onBugQuestionKeyDown(event);
                        } else {
                            onQuestionKeyDown(event);
                        }
                    }}
                    disabled={
                        !isReady ||
                        isAsking ||
                        isInvestigating
                    }
                    placeholder={
                        isBugMode
                            ? isReady
                                ? "Example: Why is repository indexing failing?"
                                : "Analyze a repository first..."
                            : isReady
                                ? "Where is the authentication logic?"
                                : "Analyze a repository first..."
                    }
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/9 bg-black/20 p-4 text-sm leading-6 text-slate-200 placeholder:text-slate-700 outline-none transition-all duration-300 input-enhanced disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <div className="text-[11px] text-slate-700">
                        Press Ctrl + Enter to{" "}
                        {isBugMode
                            ? "investigate"
                            : "ask"}
                    </div>

                    <button
                        onClick={isBugMode ? onInvestigate : onAsk}
                        disabled={
                            !isReady ||
                            isAsking ||
                            isInvestigating
                        }
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition-all duration-300 ${
                            (!isReady || isAsking || isInvestigating)
                                ? "pointer-events-none opacity-50"
                                : "hover:bg-slate-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                        }`}
                    >
                        {isBugMode ? (
                            isInvestigating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Investigating...
                                </>
                            ) : (
                                <>
                                    <Bug size={16} className="text-red-400" />
                                    Investigate Bug
                                </>
                            )
                        ) : (
                            isAsking ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Ask CodeLens
                                </>
                            )
                        )}
                    </button>

                </div>
            </div>

            {!hasAnswer && (
                <div className="relative z-10 mt-5">

                    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-700">
                        Try asking
                    </div>

                    <div className="flex flex-wrap gap-2">

                        {(isBugMode
                            ? suggestedBugQuestions
                            : suggestedQuestions
                        ).map((item: string) => (
                            <button
                                key={item}
                                onClick={() =>
                                    isBugMode
                                        ? onSuggestedBugQuestion(item)
                                        : onSuggestedQuestion(item)
                                }
                                disabled={!isReady}
                                className={`rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2 text-left text-xs text-slate-500 transition-all duration-300 ${
                                    isReady
                                        ? "hover:border-white/12 hover:text-slate-300 hover:bg-white/[0.04]"
                                        : "cursor-not-allowed disabled:opacity-40"
                                }`}
                            >
                                {item}
                            </button>
                        ))}

                    </div>
                </div>
            )}

            {(isAsking || isInvestigating) && (
                <div className="relative z-10 mt-5 pt-4 border-t border-white/6">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <SkeletonLine width="60%" height="20px" />
                            <SkeletonLine width="90%" height="20px" />
                            <SkeletonLine width="45%" height="20px" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <SkeletonLine width="70%" height="16px" />
                            <SkeletonLine width="30%" height="16px" />
                            <SkeletonLine width="85%" height="16px" />
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}

export default AskCard;