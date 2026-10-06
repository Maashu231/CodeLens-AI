export function formatIndexingStage(stage) {
    const stages = {
        queued: "Queued",
        starting: "Starting",
        files_discovered: "Discovering files",
        source_downloaded: "Source downloaded",
        reading_source: "Reading source",
        parsing: "Parsing code",
        chunking: "Creating code chunks",
        preparing_embeddings: "Preparing embeddings",
        generating_embeddings: "Generating embeddings",
        embeddings_ready: "Embeddings ready",
        updating_search_index: "Updating search index",
        complete: "Complete",
        failed: "Failed",
    };

    return stages[stage] || "Processing";
}