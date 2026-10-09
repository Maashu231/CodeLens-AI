import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Bot,
    FileCode2,
} from "lucide-react";

function AnswerPanel({
    answerData,
    isAsking,
    onSelectSource,
}) {
    if (!answerData) {
        return null;
    }

    return (
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/90 shadow-2xl shadow-black/20">
            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Bot size={16} />
                    CodeLens Answer
                    {answerData.isStreaming && (
                        <span className="ml-2 text-xs text-slate-500">
                            Generating...
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5 sm:p-6">
                <div className="prose prose-invert max-w-none text-sm leading-7 text-slate-300">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({
                                inline,
                                children,
                                ...props
                            }) {
                                return inline ? (
                                    <code
                                        className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[13px] text-slate-200"
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                ) : (
                                    <pre className="my-4 overflow-x-auto rounded-xl border border-white/8 bg-[#070a10] p-4">
                                        <code
                                            className="font-mono text-[13px] leading-6 text-slate-300"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    </pre>
                                );
                            },

                            p({ children }) {
                                return (
                                    <p className="mb-4 last:mb-0">
                                        {children}
                                    </p>
                                );
                            },

                            ul({ children }) {
                                return (
                                    <ul className="mb-4 list-disc space-y-1 pl-5">
                                        {children}
                                    </ul>
                                );
                            },

                            ol({ children }) {
                                return (
                                    <ol className="mb-4 list-decimal space-y-1 pl-5">
                                        {children}
                                    </ol>
                                );
                            },

                            h1({ children }) {
                                return (
                                    <h1 className="mb-4 text-xl font-semibold text-white">
                                        {children}
                                    </h1>
                                );
                            },

                            h2({ children }) {
                                return (
                                    <h2 className="mb-3 mt-6 text-lg font-semibold text-white">
                                        {children}
                                    </h2>
                                );
                            },

                            h3({ children }) {
                                return (
                                    <h3 className="mb-2 mt-5 text-base font-semibold text-slate-200">
                                        {children}
                                    </h3>
                                );
                            },

                            blockquote({ children }) {
                                return (
                                    <blockquote className="my-4 border-l-2 border-slate-600 pl-4 text-slate-400">
                                        {children}
                                    </blockquote>
                                );
                            },

                            a({ children, href }) {
                                return (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:decoration-slate-300"
                                    >
                                        {children}
                                    </a>
                                );
                            },
                        }}
                    >
                        {answerData.answer}
                    </ReactMarkdown>
                </div>

                <div className="mt-8 border-t border-white/7 pt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <FileCode2 size={16} />
                            Sources
                        </div>

                        <span className="text-[11px] text-slate-600">
                            Click a source to inspect code
                        </span>
                    </div>

                    <div className="grid gap-3">
                        {answerData.sources?.map(
                            (source, index) => (
                                <button
                                    key={`${source.file}-${source.start_line}-${index}`}
                                    onClick={() =>
                                        onSelectSource(source)
                                    }
                                    className="group w-full rounded-xl border border-white/7 bg-black/15 p-4 text-left transition hover:border-white/15 hover:bg-white/[0.03]"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <FileCode2
                                                size={14}
                                                className="shrink-0 text-slate-600 group-hover:text-slate-400"
                                            />

                                            <span className="truncate font-mono text-xs text-slate-400 group-hover:text-slate-200">
                                                {source.file}
                                            </span>
                                        </div>

                                        <span className="rounded-md border border-white/7 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-slate-600">
                                            L{source.start_line}-
                                            {source.end_line}
                                        </span>
                                    </div>

                                    {source.symbol && (
                                        <div className="mt-2 font-mono text-[11px] text-slate-600">
                                            {source.symbol}()
                                        </div>
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AnswerPanel;