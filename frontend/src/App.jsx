import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  FileCode2,
  GitBranch,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TerminalSquare,
  X,
  XCircle,
} from "lucide-react";

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [question, setQuestion] = useState("");

  const [isIndexing, setIsIndexing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [chunksIndexed, setChunksIndexed] = useState(null);
  const [answerData, setAnswerData] = useState(null);

  const [selectedSource, setSelectedSource] = useState(null);
  const [copiedSource, setCopiedSource] = useState(false);

  const [statusMessage, setStatusMessage] = useState(
    "Connect a GitHub repository to begin."
  );

  const [errorMessage, setErrorMessage] = useState("");

  const suggestedQuestions = [
    "Where is the FastAPI health endpoint?",
    "How does the API add a GitHub repository?",
    "How is the health endpoint tested?",
  ];

  async function handleIndexRepository() {
    const url = repositoryUrl.trim();

    if (!url) {
      setErrorMessage("Enter a GitHub repository URL.");
      return;
    }

    setErrorMessage("");
    setAnswerData(null);
    setSelectedSource(null);
    setIsReady(false);
    setChunksIndexed(null);
    setIsIndexing(true);

    setStatusMessage(
      "Analyzing repository and building the code index..."
    );

    try {
      const response = await fetch("/repositories/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Repository indexing failed."
        );
      }

      setChunksIndexed(data.chunks_indexed);
      setIsReady(true);

      setStatusMessage(
        `${data.chunks_indexed} code chunks are ready for questions.`
      );
    } catch (error) {
      setIsReady(false);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while indexing the repository."
      );

      setStatusMessage("Repository analysis failed.");
    } finally {
      setIsIndexing(false);
    }
  }

  async function handleAskQuestion() {
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
    setAnswerData(null);
    setSelectedSource(null);

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          repository_url: trimmedRepositoryUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to answer the question."
        );
      }

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

  function handleSuggestedQuestion(value) {
    setQuestion(value);
    setErrorMessage("");
  }

  function handleQuestionKeyDown(event) {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      handleAskQuestion();
    }
  }

  async function handleCopySource(source) {
    const text =
      `${source.file}:${source.start_line}-${source.end_line}`;

    try {
      await navigator.clipboard.writeText(text);

      setCopiedSource(true);

      setTimeout(() => {
        setCopiedSource(false);
      }, 1500);
    } catch {
      setCopiedSource(false);
    }
  }

  function closeSourceViewer() {
    setSelectedSource(null);
    setCopiedSource(false);
  }

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-10%] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1500px]">

        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-[#0b0f17]/85 p-5 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg shadow-white/5">
              <Code2 size={21} />
            </div>

            <div>
              <div className="text-sm font-semibold tracking-tight">
                CodeLens AI
              </div>

              <div className="text-xs text-slate-500">
                Codebase intelligence
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Workspace
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-500">
                  <GitBranch size={16} />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-300">
                    {repositoryUrl
                      ? repositoryUrl
                        .replace("https://github.com/", "")
                        .replace(/\/$/, "")
                      : "No repository connected"}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isReady
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                        }`}
                    />

                    {isReady ? "Indexed" : "Not indexed"}
                  </div>
                </div>
              </div>

              {chunksIndexed !== null && (
                <div className="mt-4 border-t border-white/6 pt-3 text-xs text-slate-500">
                  {chunksIndexed} chunks indexed
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Capabilities
            </div>

            <div className="space-y-1">
              {[
                ["Ask code questions", MessageSquareText],
                ["Find relevant code", Search],
                ["Grounded answers", Sparkles],
                ["Source evidence", FileCode2],
              ].map(([label, Icon]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500"
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-white/7 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <TerminalSquare size={14} />
              RAG pipeline
            </div>

            <div className="mt-3 space-y-2 text-[11px] text-slate-600">
              <div>GitHub → Parser → Chunks</div>
              <div>Voyage → Qdrant → Reranker</div>
              <div>Evidence → LLM → Answer</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">

          <header className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-semibold text-slate-200 lg:hidden">
                CodeLens AI
              </span>

              <ChevronRight
                size={15}
                className="text-slate-700 lg:hidden"
              />

              <span className="hidden sm:inline">
                Workspace
              </span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${isReady
                ? "border-emerald-400/15 bg-emerald-400/6 text-emerald-300"
                : "border-white/8 bg-white/[0.03] text-slate-500"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isReady
                  ? "bg-emerald-400"
                  : "bg-slate-600"
                  }`}
              />

              {isReady
                ? "Repository ready"
                : "No repository"}
            </div>
          </header>

          <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:py-14">

            {/* Hero */}
            <section className="mb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500">
                <Sparkles size={13} />
                Understand unfamiliar code faster
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Talk to your
                <span className="text-slate-500">
                  {" "}codebase.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Connect a GitHub repository, ask a question,
                and get answers grounded in the actual source code.
              </p>
            </section>

            {/* Repository */}
            <section className="rounded-2xl border border-white/9 bg-[#0d121b]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-5">

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <GitBranch size={16} />
                    Repository
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Use a public GitHub repository URL.
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">

                  <div className="relative flex-1">
                    <GitBranch
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      value={repositoryUrl}
                      onChange={(event) =>
                        setRepositoryUrl(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleIndexRepository();
                        }
                      }}
                      placeholder="https://github.com/owner/repository"
                      className="h-12 w-full rounded-xl border border-white/9 bg-black/20 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none transition focus:border-white/20"
                    />
                  </div>

                  <button
                    onClick={handleIndexRepository}
                    disabled={isIndexing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isIndexing ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Indexing...
                      </>
                    ) : (
                      <>
                        {isReady ? (
                          <RefreshCw size={16} />
                        ) : (
                          <Search size={16} />
                        )}

                        {isReady
                          ? "Re-index"
                          : "Analyze Repository"}
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {isReady ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-400"
                    />
                  ) : (
                    <Bot size={14} />
                  )}

                  {statusMessage}
                </div>
              </div>
            </section>

            {/* Ask */}
            <section className="mt-5 rounded-2xl border border-white/9 bg-[#0d121b]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <MessageSquareText size={16} />
                    Ask about the codebase
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Ask about functions, endpoints, architecture,
                    bugs, or code relationships.
                  </p>
                </div>

                {isReady && (
                  <div className="hidden items-center gap-1.5 text-[11px] text-emerald-400 sm:flex">
                    <CheckCircle2 size={13} />
                    Indexed
                  </div>
                )}
              </div>

              <div className="mt-5">
                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  onKeyDown={handleQuestionKeyDown}
                  disabled={!isReady || isAsking}
                  placeholder={
                    isReady
                      ? "Where is the authentication logic?"
                      : "Analyze a repository first..."
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/9 bg-black/20 p-4 text-sm leading-6 text-slate-200 placeholder:text-slate-700 outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                  <div className="text-[11px] text-slate-700">
                    Press Ctrl + Enter to ask
                  </div>

                  <button
                    onClick={handleAskQuestion}
                    disabled={!isReady || isAsking}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isAsking ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Ask CodeLens
                      </>
                    )}
                  </button>

                </div>
              </div>

              {!answerData && (
                <div className="mt-5">

                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-700">
                    Try asking
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((item) => (
                      <button
                        key={item}
                        onClick={() =>
                          handleSuggestedQuestion(item)
                        }
                        disabled={!isReady}
                        className="rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2 text-left text-xs text-slate-500 transition hover:border-white/12 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                </div>
              )}

            </section>

            {/* Error */}
            {errorMessage && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/5 p-4 text-sm text-red-300">
                <XCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{errorMessage}</span>
              </div>
            )}

            {/* Loading */}
            {isAsking && (
              <section className="mt-5 rounded-2xl border border-white/9 bg-[#0d121b]/90 p-6">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Searching the codebase and generating a grounded answer...
                </div>
              </section>
            )}

            {/* Answer */}
            {answerData && !isAsking && (
              <section className="mt-5 overflow-hidden rounded-2xl border border-white/9 bg-[#0d121b]/90 shadow-2xl shadow-black/20">

                <div className="border-b border-white/8 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Bot size={16} />
                    CodeLens Answer
                  </div>
                </div>

                <div className="p-5 sm:p-6">

                  <div className="prose prose-invert max-w-none text-sm leading-7 text-slate-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }) {
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
                              setSelectedSource(source)
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
            )}

          </div>
        </main>
      </div>

      {/* Code Viewer Modal */}
      {selectedSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeSourceViewer}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileCode2 size={16} className="text-slate-500" />

                  <span className="truncate font-mono text-sm text-slate-300">
                    {selectedSource.file}
                  </span>
                </div>

                <div className="mt-1 text-[11px] text-slate-600">
                  Lines {selectedSource.start_line}-
                  {selectedSource.end_line}

                  {selectedSource.symbol
                    ? ` • ${selectedSource.symbol}()`
                    : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={() => handleCopySource(selectedSource)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 transition hover:text-slate-200"
                >
                  <Copy size={14} />

                  {copiedSource
                    ? "Copied"
                    : "Copy location"}
                </button>

                <button
                  onClick={closeSourceViewer}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500 transition hover:text-white"
                  aria-label="Close code viewer"
                >
                  <X size={16} />
                </button>

              </div>
            </div>

            {/* Code */}
            <div className="min-h-0 flex-1 overflow-auto bg-[#070a10]">
              <div className="min-w-max p-4">

                {selectedSource.content ? (
                  selectedSource.content
                    .split("\n")
                    .map((line, index) => {
                      const lineNumber =
                        selectedSource.start_line + index;

                      return (
                        <div
                          key={`${lineNumber}-${index}`}
                          className="grid grid-cols-[64px_1fr] rounded-sm font-mono text-[13px] leading-7"
                        >
                          <div
                            className={`select-none border-r border-white/5 pr-4 text-right ${lineNumber >= selectedSource.start_line &&
                              lineNumber <= selectedSource.end_line
                              ? "text-slate-500"
                              : "text-slate-700"
                              }`}
                          >
                            {lineNumber}
                          </div>

                          <div
                            className={`pl-4 ${lineNumber >= selectedSource.start_line &&
                              lineNumber <= selectedSource.end_line
                              ? "bg-white/[0.035] text-slate-300"
                              : "text-slate-600"
                              }`}
                          >
                            {line || " "}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="p-10 text-center text-sm text-slate-600">
                    Source content is not available.
                  </div>
                )}

              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
              <div className="text-[11px] text-slate-600">
                Evidence returned by CodeLens retrieval
              </div>

              <button
                onClick={closeSourceViewer}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;