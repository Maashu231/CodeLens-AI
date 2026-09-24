from embedding_provider import VoyageCodeEmbeddingProvider
from embedding_text import build_embedding_text
from ingestion_service import ingest_repository
from vector_store import VectorStore


def index_repository(owner: str, repo: str) -> int:
    repository = ingest_repository(owner, repo)

    chunks = [
        chunk
        for file in repository["files"]
        for chunk in file["chunks"]
    ]

    if not chunks:
        return 0

    provider = VoyageCodeEmbeddingProvider()

    embedding_texts = [
        build_embedding_text(chunk)
        for chunk in chunks
    ]

    embeddings = provider.embed_documents(embedding_texts)

    store = VectorStore()

    try:
        store.add_chunks(chunks, embeddings)
    finally:
        store.close()

    return len(chunks)


def search_repository(query: str, limit: int = 5):
    provider = VoyageCodeEmbeddingProvider()
    query_vector = provider.embed_query(query)

    store = VectorStore()

    try:
        return store.search(query_vector, limit)
    finally:
        store.close()