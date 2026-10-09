import { useState } from "react";
import {
  Bot,
  Loader2,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RepositoryCard from "./components/RepositoryCard";
import RepositoryExplorer from "./components/RepositoryExplorer";
import ArchitectureOverview from "./components/ArchitectureOverview";
import AskCard from "./components/AskCard";
import AnswerPanel from "./components/AnswerPanel";
import ErrorBanner from "./components/ErrorBanner";
import CodeViewerModal from "./components/CodeViewerModal";

import { useRepositoryIndexing } from "./hooks/useRepositoryIndexing";
import { useCodeLensQuery } from "./hooks/useCodeLensQuery";
import { useBugInvestigation } from "./hooks/useBugInvestigation";


function App() {
  const [repositoryUrl, setRepositoryUrl] =
    useState("");

  const [selectedSource, setSelectedSource] =
    useState(null);

  const [mode, setMode] = useState("ask");

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

  function handleModeChange(nextMode) {
    setMode(nextMode);

    resetAnswer();
    resetBugInvestigation();
    setSelectedSource(null);
  }


  function handleInvestigate() {
    setSelectedSource(null);

    investigateBug(
      repositoryUrl
    );
  }


  const errorMessage =
    queryError ||
    bugError ||
    indexingError;


  function handleRepositoryChange(value) {
    setRepositoryUrl(value);

    if (
      value.trim() !==
      repositoryUrl.trim()
    ) {
      resetIndexing();
      resetAnswer();
      setSelectedSource(null);
    }
  }


  async function handleAnalyze() {
    resetAnswer();
    setSelectedSource(null);

    await startIndexing(
      repositoryUrl
    );
  }


  async function handleAsk() {
    setSelectedSource(null);

    await askQuestion(
      repositoryUrl
    );
  }


  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-10%] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute right-[5%] top-[20%] h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>


      <div className="relative mx-auto flex min-h-screen max-w-[1500px]">

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
          />


          <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:py-14">

            {/* Hero */}
            <section className="mb-10">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500">
                <Bot size={13} />

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
            <RepositoryCard
              repositoryUrl={
                repositoryUrl
              }
              onRepositoryChange={
                handleRepositoryChange
              }
              onAnalyze={
                handleAnalyze
              }
              isIndexing={
                isIndexing
              }
              isReady={
                isReady
              }
              progress={
                progress
              }
              statusMessage={
                statusMessage
              }
            />


            {/* Repository Explorer */}
            <RepositoryExplorer
              repositoryUrl={
                repositoryUrl
              }
              isReady={
                isReady
              }
              onOpenSource={
                setSelectedSource
              }
            />


            {/* Architecture Overview */}
            <ArchitectureOverview
              repositoryUrl={
                repositoryUrl
              }
              isReady={
                isReady
              }
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

              onSuggestedQuestion={
                handleSuggestedQuestion
              }

              onSuggestedBugQuestion={(value) => {
                setBugQuestion(value);
              }}

              onQuestionKeyDown={(event) =>
                handleQuestionKeyDown(
                  event,
                  repositoryUrl
                )
              }

              onBugQuestionKeyDown={(event) =>
                handleBugQuestionKeyDown(
                  event,
                  repositoryUrl
                )
              }
            />

            {/* Error */}
            <ErrorBanner
              message={
                errorMessage
              }
            />


            {/* Answer */}
            <AnswerPanel
              answerData={
                mode === "bug"
                  ? bugAnswerData
                  : answerData
              }
              isAsking={
                isAsking ||
                isInvestigating
              }
              onSelectSource={
                setSelectedSource
              }
            />

          </div>

        </main>

      </div>


      {/* Source viewer */}
      <CodeViewerModal
        source={
          selectedSource
        }
        repositoryUrl={repositoryUrl}
        onClose={() =>
          setSelectedSource(
            null
          )
        }
      />

    </div>
  );
}


export default App;