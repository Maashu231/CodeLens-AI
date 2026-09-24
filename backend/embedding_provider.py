import os

import httpx


class VoyageCodeEmbeddingProvider:
    MODEL = "voyage-code-4"
    API_URL = "https://api.voyageai.com/v1/embeddings"

    def __init__(self):
        self.api_key = os.getenv("VOYAGE_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "VOYAGE_API_KEY environment variable is not set"
            )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._embed(texts, "document")

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text], "query")[0]

    def _embed(
        self,
        texts: list[str],
        input_type: str
    ) -> list[list[float]]:
        response = httpx.post(
            self.API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "input": texts,
                "model": self.MODEL,
                "input_type": input_type,
                "output_dimension": 1024,
                "output_dtype": "float",
            },
            timeout=30.0,
        )

        response.raise_for_status()

        return [
            item["embedding"]
            for item in response.json()["data"]
        ]