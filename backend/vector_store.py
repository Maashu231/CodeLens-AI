from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from qdrant_client import QdrantClient, models

from models import CodeChunk


COLLECTION_NAME = "codelens_chunks"
VECTOR_SIZE = 1024

PROJECT_ROOT = Path(__file__).resolve().parent.parent
QDRANT_PATH = PROJECT_ROOT / "qdrant_data"


class VectorStore:

    def __init__(self):
        self.client = QdrantClient(
            path=str(QDRANT_PATH)
        )

        if not self.client.collection_exists(
            COLLECTION_NAME
        ):
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                ),
            )

    @staticmethod
    def point_id(chunk_id: str) -> str:
        return str(
            uuid5(
                NAMESPACE_URL,
                chunk_id
            )
        )

    def add_chunks(
        self,
        chunks: list[CodeChunk],
        embeddings: list[list[float]]
    ):
        points = []

        for chunk, embedding in zip(
            chunks,
            embeddings
        ):
            point_id = self.point_id(chunk.chunk_id)

            points.append(
                models.PointStruct(
                    id=point_id,
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
                collection_name=COLLECTION_NAME,
                points=points,
            )

    def get_repository_chunk_ids(
        self,
        repository: str
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
                collection_name=COLLECTION_NAME,
                scroll_filter=repository_filter,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            for record in records:
                chunk_id = record.payload.get("chunk_id")

                if chunk_id:
                    existing_ids.add(chunk_id)

            if offset is None:
                break

        return existing_ids

    def delete_chunks(
        self,
        chunk_ids: set[str]
    ):
        if not chunk_ids:
            return

        point_ids = [
            self.point_id(chunk_id)
            for chunk_id in chunk_ids
        ]

        self.client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.PointIdsList(
                points=point_ids
            ),
            wait=True,
        )

    def search(
        self,
        query_vector: list[float],
        limit: int = 5,
        repository: str | None = None
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
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        ).points

    def close(self):
        self.client.close()