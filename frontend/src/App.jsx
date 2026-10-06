import { useState } from "react";
import {
  Bot,
  Code2,
  FileCode2,
  GitBranch,
  Loader2,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RepositoryCard from "./components/RepositoryCard";
import AskCard from "./components/AskCard";
import AnswerPanel from "./components/AnswerPanel";
import ErrorBanner from "./components/ErrorBanner";
import CodeViewerModal from "./components/CodeViewerModal";

import { useRepositoryIndexing } from "./hooks/useRepositoryIndexing";
import { useCodeLensQuery } from "./hooks/useCodeLensQuery";

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selectedSource, setSelectedSource] =
    useState(null);

  const {
    isIndexing,
    isReady,
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

  const errorMessage =
    queryError || indexingError;

  function handleRepositoryChange(value) {
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
    <div className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-10%] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute right-[5%] top-[20%] h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1500px]">
        <Sidebar
          repositoryUrl={repositoryUrl}
          isReady={isReady}
          chunksIndexed={chunksIndexed}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header isReady={isReady} />

          <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:py-14">
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

            <RepositoryCard
              repositoryUrl={repositoryUrl}
              onRepositoryChange={handleRepositoryChange}
              onAnalyze={handleAnalyze}
              isIndexing={isIndexing}
              isReady={isReady}
              statusMessage={statusMessage}
            />

            <AskCard
              question={question}
              setQuestion={setQuestion}
              isReady={isReady}
              isAsking={isAsking}
              answerData={answerData}
              onAsk={handleAsk}
              onSuggestedQuestion={
                handleSuggestedQuestion
              }
              onQuestionKeyDown={(event) =>
                handleQuestionKeyDown(
                  event,
                  repositoryUrl
                )
              }
            />

            <ErrorBanner message={errorMessage} />

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

            <AnswerPanel
              answerData={answerData}
              isAsking={isAsking}
              onSelectSource={setSelectedSource}
            />
          </div>
        </main>
      </div>

      <CodeViewerModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}

export default App;