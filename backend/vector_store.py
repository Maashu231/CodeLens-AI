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
        self.client = QdrantClient(path=str(QDRANT_PATH))

        if not self.client.collection_exists(COLLECTION_NAME):
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                ),
            )

    def add_chunks(
        self,
        chunks: list[CodeChunk],
        embeddings: list[list[float]]
    ):
        points = []

        for chunk, embedding in zip(chunks, embeddings):
            point_id = str(
                uuid5(
                    NAMESPACE_URL,
                    chunk.chunk_id
                )
            )

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

        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )

    def search(
        self,
        query_vector: list[float],
        limit: int = 5
    ):
        return self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit,
            with_payload=True,
        ).points

    def close(self):
        self.client.close()