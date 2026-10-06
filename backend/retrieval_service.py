from embedding_provider import get_embedding_provider
from embedding_text import build_embedding_text
from ingestion_service import ingest_repository
from reranker import rerank_results
from vector_store import VectorStore


def index_repository(
    owner: str,
    repo: str,
    progress_callback=None,
) -> int:
    repository = ingest_repository(
        owner,
        repo,
        progress_callback,
    )

    chunks = [
        chunk
        for file in repository["files"]
        for chunk in file["chunks"]
    ]

    if not chunks:
        if progress_callback:
            progress_callback(
                "complete",
                100,
            )

        return 0

    repository_name = f"{owner}/{repo}"

    store = VectorStore()

    try:
        existing_chunk_ids = (
            store.get_repository_chunk_ids(
                repository_name
            )
        )

        current_chunk_ids = {
            chunk.chunk_id
            for chunk in chunks
        }

        new_or_changed_chunks = [
            chunk
            for chunk in chunks
            if chunk.chunk_id
            not in existing_chunk_ids
        ]

        deleted_chunk_ids = (
            existing_chunk_ids
            - current_chunk_ids
        )

        if deleted_chunk_ids:
            store.delete_chunks(
                deleted_chunk_ids
            )

        if progress_callback:
            progress_callback(
                "preparing_embeddings",
                75,
            )

        if new_or_changed_chunks:
            provider = get_embedding_provider()

            embedding_texts = [
                build_embedding_text(chunk)
                for chunk in new_or_changed_chunks
            ]

            if progress_callback:
                progress_callback(
                    "generating_embeddings",
                    80,
                )

            embeddings = (
                provider.embed_documents(
                    embedding_texts
                )
            )

            if progress_callback:
                progress_callback(
                    "embeddings_ready",
                    92,
                )

            store.add_chunks(
                new_or_changed_chunks,
                embeddings,
            )

        if progress_callback:
            progress_callback(
                "updating_search_index",
                97,
            )

        return len(chunks)

    finally:
        store.close()


def search_repository(
    query: str,
    owner: str,
    repo: str,
    limit: int = 5,
):
    provider = get_embedding_provider()

    query_vector = provider.embed_query(
        query
    )

    repository = f"{owner}/{repo}"

    store = VectorStore()

    try:
        candidates = store.search(
            query_vector,
            limit=10,
            repository=repository,
        )

        return rerank_results(
            query,
            candidates,
            limit=limit,
        )

    finally:
        store.close()