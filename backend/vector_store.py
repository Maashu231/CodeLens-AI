import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from qdrant_client import QdrantClient, models

from embedding_provider import get_embedding_dimension
from models import CodeChunk


PROJECT_ROOT = Path(__file__).resolve().parent.parent
QDRANT_PATH = PROJECT_ROOT / "qdrant_data"


class VectorStore:
    def __init__(self):
        self.embedding_dimension = get_embedding_dimension()

        provider_name = os.getenv(
            "EMBEDDING_PROVIDER",
            "local",
        ).strip().lower()

        self.collection_name = (
            f"codelens_chunks_{provider_name}"
        )

        self.client = QdrantClient(
            path=str(QDRANT_PATH)
        )

        self._ensure_collection()

    def _ensure_collection(self):
        if not self.client.collection_exists(
            self.collection_name
        ):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dimension,
                    distance=models.Distance.COSINE,
                ),
            )

    @staticmethod
    def point_id(chunk_id: str) -> str:
        return str(
            uuid5(
                NAMESPACE_URL,
                chunk_id,
            )
        )

    def add_chunks(
        self,
        chunks: list[CodeChunk],
        embeddings: list[list[float]],
    ):
        points = []

        for chunk, embedding in zip(
            chunks,
            embeddings,
        ):
            points.append(
                models.PointStruct(
                    id=self.point_id(
                        chunk.chunk_id
                    ),
                    vector=embedding,
                    payload={
                        "chunk_id": chunk.chunk_id,
                        "repository": chunk.repository,
                        "file_path": chunk.file_path,
                        "file_sha": chunk.file_sha,
                        "language": chunk.language,
                        "symbol_name": chunk.symbol_name,
                        "symbol_type": chunk.symbol_type,
                        "start_line": chunk.start_line,
                        "end_line": chunk.end_line,
                        "content": chunk.content,
                    },
                )
            )

        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points,
            )

    def get_repository_chunk_ids(
        self,
        repository: str,
    ) -> set[str]:
        existing_ids = set()
        offset = None

        repository_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="repository",
                    match=models.MatchValue(
                        value=repository
                    ),
                )
            ]
        )

        while True:
            records, offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=repository_filter,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            for record in records:
                chunk_id = record.payload.get(
                    "chunk_id"
                )

                if chunk_id:
                    existing_ids.add(chunk_id)

            if offset is None:
                break

        return existing_ids

    def get_repository_payloads(
        self,
        repository: str,
    ) -> list[dict]:
        payloads = []
        offset = None

        repository_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="repository",
                    match=models.MatchValue(
                        value=repository
                    ),
                )
            ]
        )

        while True:
            records, offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=repository_filter,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            for record in records:
                if record.payload:
                    payloads.append(
                        record.payload
                    )

            if offset is None:
                break

        return payloads

    def delete_chunks(
        self,
        chunk_ids: set[str],
    ):
        if not chunk_ids:
            return

        point_ids = [
            self.point_id(chunk_id)
            for chunk_id in chunk_ids
        ]

        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.PointIdsList(
                points=point_ids
            ),
            wait=True,
        )

    def search(
        self,
        query_vector: list[float],
        limit: int = 5,
        repository: str | None = None,
    ):
        query_filter = None

        if repository:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="repository",
                        match=models.MatchValue(
                            value=repository
                        ),
                    )
                ]
            )

        return self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        ).points

    def close(self):
        self.client.close()