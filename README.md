# CodeLens AI

**AI-powered codebase intelligence for understanding, exploring, and debugging GitHub repositories.**

CodeLens AI helps developers understand unfamiliar codebases faster. It combines code-aware parsing, semantic retrieval, reranking, and LLM-based reasoning to answer questions using repository evidence.

Instead of searching manually through files, functions, dependencies, and Git history, developers can ask questions and investigate potential bugs from one interface.

## Key Features

- **Repository Indexing:** Index supported repository files and track indexing progress.
- **Ask Your Codebase:** Ask natural-language questions about repository implementation.
- **Streaming Answers:** View generated answers progressively as the model responds.
- **Evidence and Citations:** Inspect retrieved source files and line ranges supporting answers.
- **Repository Explorer:** Browse files and inspect source code.
- **Architecture Overview:** Explore a high-level view of repository structure.
- **Git History Intelligence:** Review commit history for individual files.
- **Change Impact Analysis:** Identify potential direct and indirect impacts using inferred dependency relationships.
- **Bug Investigation:** Investigate errors using relevant repository evidence and targeted retrieval.

## Architecture

```text
                 GitHub Repository
                         |
                         v
               Repository Ingestion
                         |
                         v
          File Filtering and Code Parsing
                         |
                         v
                  Smart Chunking
                         |
                         v
                Embedding Provider
                         |
                         v
               Local Qdrant Store
                         |
                         v
User Question -> Semantic Retrieval
                         |
                         v
                   Reranking
                         |
                         v
                Evidence Context
                         |
                         v
                    Groq LLM
                         |
                         v
            Grounded Streaming Answer
                         |
                         v
                 Sources and Citations
```

The backend exposes REST endpoints through FastAPI. The React frontend communicates with the backend through Vite's development proxy.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend API | Python, FastAPI |
| Code parsing | Tree-sitter language pack |
| Embeddings | Sentence Transformers, CodeRankEmbed |
| Vector storage | Qdrant local storage |
| LLM | Groq API |
| Optional embeddings | Voyage AI |
| Testing | Pytest, Vite production build |

The default embedding provider is local CodeRankEmbed. Voyage AI is available as an optional provider.

## Project Structure

```text
CodeLens-AI/
├── backend/
│   ├── main.py
│   ├── ingestion_service.py
│   ├── code_parser.py
│   ├── chunker.py
│   ├── embedding_provider.py
│   ├── retrieval_service.py
│   ├── reranker.py
│   ├── answer_service.py
│   ├── streaming_answer_service.py
│   ├── bug_investigation_service.py
│   ├── impact_service.py
│   ├── architecture_service.py
│   ├── github_service.py
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
├── requirements.txt
├── PROJECT.md
└── README.md
```

## Getting Started

### Prerequisites

Install Python, Node.js, and npm. You also need a Groq API key to generate answers.

### 1. Clone the repository

```powershell
git clone https://github.com/Maashu231/CodeLens-AI.git
cd CodeLens-AI
```

### 2. Create a Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The first use of CodeRankEmbed may download model files and take additional time.

### 3. Configure environment variables

Create `backend/.env`:

```dotenv
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
EMBEDDING_PROVIDER=local
```

`GROQ_API_KEY` is required for LLM-generated answers.

`GITHUB_TOKEN` is recommended for authenticated GitHub API requests. Use a token with only the permissions required for the repositories you intend to access.

`EMBEDDING_PROVIDER=local` selects CodeRankEmbed. If using Voyage AI instead, configure `EMBEDDING_PROVIDER=voyage` and `VOYAGE_API_KEY`.

**Never commit real API keys or tokens.**

### 4. Start the backend

From the project root:

```powershell
cd backend
..\ .venv\Scripts\python.exe -m uvicorn main:app --reload --env-file .env
```

If copying the command, use the path without the space after `..\`:

```powershell
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --env-file .env
```

The backend runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 5. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 6. Analyze a repository

1. Enter a GitHub repository URL.
2. Start repository indexing and wait for completion.
3. Explore files and architecture.
4. Ask a question about the codebase or investigate a bug.
5. Inspect the retrieved source evidence and citations.

## Testing

Run backend tests from the `backend` directory:

```powershell
..\.venv\Scripts\python.exe -m pytest -q
```

Build the frontend from the `frontend` directory:

```powershell
npm run build
```

## Local Data

Qdrant uses local persistent storage in the root `qdrant_data/` directory. This directory is generated at runtime and should not be committed.

The first local embedding-model load may require an internet connection to retrieve the model.

Relevant source context is sent to the configured Groq model when generating answers. Only analyze repositories you are authorized to access and process.

## Current Scope

CodeLens AI is a portfolio project focused on codebase retrieval, repository exploration, grounded question answering, and debugging assistance.

Impact analysis describes potential effects inferred from available dependency relationships; it should not be treated as a guarantee that every downstream effect has been identified.
