import { useState } from "react";
import { Bot } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RepositoryCard from "./components/RepositoryCard";
import RepositoryExplorer from "./components/RepositoryExplorer";
import ArchitectureOverview from "./components/ArchitectureOverview";
import AskCard from "./components/AskCard";
import AnswerPanel from "./components/AnswerPanel";
import ErrorBanner from "./components/ErrorBanner";
import CodeViewerModal from "./components/CodeViewerModal";
import Toast from "./components/Toast";

import { useRepositoryIndexing } from "./hooks/useRepositoryIndexing";
import { useCodeLensQuery } from "./hooks/useCodeLensQuery";
import { useBugInvestigation } from "./hooks/useBugInvestigation";
import { useBackendHealth } from "./hooks/useBackendHealth";

import type { Source, ToastType, QueryMode } from "./types";

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState("");

  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const [mode, setMode] = useState<QueryMode>("ask");

  const {
    status: backendStatus,
    version: backendVersion,
    checkHealth: refreshBackendHealth,
  } = useBackendHealth();

  const {
    isIndexing,
    isReady,
    progress,
    chunksIndexed,
    statusMessage,
    errorMessage: indexingError,
    startIndexing,
    reset: resetIndexing,
  } = useRepositoryIndexing();

  const {
    question,
    setQuestion,
    isAsking,
    answerData,
    errorMessage: queryError,
    askQuestion,
    resetAnswer,
    handleSuggestedQuestion,
    handleQuestionKeyDown,
  } = useCodeLensQuery();

  const {
    bugQuestion,
    setBugQuestion,
    isInvestigating,
    bugAnswerData,
    bugError,
    investigateBug,
    resetBugInvestigation,
    handleBugQuestionKeyDown,
  } = useBugInvestigation();

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  function showToast(type: string, message: string) {
    const validTypes: ToastType[] = ["success", "error", "info"];
    const toastType: ToastType = validTypes.includes(type as ToastType) ? (type as ToastType) : "info";
    setToast({ type: toastType, message });
  }

  function handleModeChange(nextMode: QueryMode) {
    setMode(nextMode);
    resetAnswer();
    resetBugInvestigation();
    setSelectedSource(null);
  }

  function handleInvestigate() {
    setSelectedSource(null);
    investigateBug(repositoryUrl);
  }

  const errorMessage = queryError || bugError || indexingError;

  function handleRepositoryChange(value: string) {
    setRepositoryUrl(value);
    if (value.trim() !== repositoryUrl.trim()) {
      resetIndexing();
      resetAnswer();
      setSelectedSource(null);
    }
  }

  async function handleAnalyze() {
    resetAnswer();
    setSelectedSource(null);
    await startIndexing(repositoryUrl);
  }

  async function handleAsk() {
    setSelectedSource(null);
    await askQuestion(repositoryUrl);
  }


  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-pink-500/[0.06] blur-[100px]" />
      </div>

      {/* Toast container */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px]">

        {/* Sidebar */}
        <Sidebar
          repositoryUrl={repositoryUrl}
          isReady={isReady}
          chunksIndexed={chunksIndexed}
        />

        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col">

          <Header
            isReady={isReady}
            backendStatus={backendStatus}
            backendVersion={backendVersion}
            onRefreshHealth={refreshBackendHealth}
          />

          <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:py-14">

            {/* Hero */}
            <section className="mb-12 fade-in-up">
              <div className="relative group">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs text-slate-400 group-hover:border-white/20 transition-colors duration-300 mb-5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Bot size={13} className="ml-1" />
                  Codebase intelligence
                </div>

                <h1 className="max-w-3xl hero-title tracking-tighter sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                  Talk to your <br />
                  <span className="hero-gradient-text">codebase.</span>
                </h1>

                <p className="mt-6 max-w-xl hero-subtitle text-lg leading-8 text-slate-400">
                  Connect any GitHub repository and ask questions in plain English.
                  Get answers with line-by-line code citations, architecture insights,
                  and bug investigation — all powered by semantic search and AI.
                </p>
              </div>
            </section>

            {/* Repository Card */}
            <RepositoryCard
              repositoryUrl={repositoryUrl}
              onRepositoryChange={handleRepositoryChange}
              onAnalyze={handleAnalyze}
              isIndexing={isIndexing}
              isReady={isReady}
              progress={progress}
              statusMessage={statusMessage}
              showToast={showToast}
            />

            {/* Repository Explorer */}
            <RepositoryExplorer
              repositoryUrl={repositoryUrl}
              isReady={isReady}
              onOpenSource={setSelectedSource}
            />

            {/* Architecture Overview */}
            <ArchitectureOverview
              repositoryUrl={repositoryUrl}
              isReady={isReady}
            />

            {/* Ask CodeLens */}
            <AskCard
              mode={mode}
              onModeChange={handleModeChange}

              question={question}
              setQuestion={setQuestion}

              bugQuestion={bugQuestion}
              setBugQuestion={setBugQuestion}

              isReady={isReady}

              isAsking={isAsking}
              isInvestigating={isInvestigating}

              answerData={answerData}
              bugAnswerData={bugAnswerData}

              onAsk={handleAsk}
              onInvestigate={handleInvestigate}

              onSuggestedQuestion={handleSuggestedQuestion}
              onSuggestedBugQuestion={(value: string) => setBugQuestion(value)}

              onQuestionKeyDown={(event: React.KeyboardEvent) =>
                handleQuestionKeyDown(event, repositoryUrl)
              }

              onBugQuestionKeyDown={(event: React.KeyboardEvent) =>
                handleBugQuestionKeyDown(event, repositoryUrl)
              }
              showToast={showToast}
            />

            {/* Error */}
            <ErrorBanner message={errorMessage} />

            {/* Answer */}
            <AnswerPanel
              answerData={mode === "bug" ? bugAnswerData : answerData}
              onSelectSource={setSelectedSource}
              showToast={showToast}
            />

          </div>
        </main>
      </div>

      {/* Source viewer */}
      <CodeViewerModal
        key={selectedSource ? `${selectedSource.file}:${selectedSource.start_line}-${selectedSource.end_line}:${selectedSource.symbol || ""}` : "no-source"}
        source={selectedSource}
        repositoryUrl={repositoryUrl}
        onClose={() => setSelectedSource(null)}
        showToast={showToast}
      />

    </div>
  );
}

export default App;
