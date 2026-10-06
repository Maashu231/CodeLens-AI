async function request(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            "Something went wrong with the request."
        );
    }

    return data;
}

export async function startRepositoryIndexing(repositoryUrl) {
    return request("/repositories/index", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: repositoryUrl,
        }),
    });
}

export async function getIndexingJob(jobId) {
    return request(`/repositories/jobs/${jobId}`);
}

export async function askRepositoryQuestion(
    question,
    repositoryUrl
) {
    return request("/ask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question,
            repository_url: repositoryUrl,
        }),
    });
}

export async function getRepositoryTree(
    repositoryUrl
) {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
    });

    return request(
        `/repositories/tree?${params.toString()}`
    );
}

export async function getRepositoryFile(
    repositoryUrl,
    path
) {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        path,
    });

    return request(
        `/repositories/file?${params.toString()}`
    );
}
export async function getRepositoryOverview(
    repositoryUrl
) {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
    });

    return request(
        `/repositories/overview?${params.toString()}`
    );
}

export async function getRepositoryFileHistory(
    repositoryUrl,
    path
) {
    const params = new URLSearchParams({
        repository_url: repositoryUrl,
        path,
    });

    return request(
        `/repositories/history?${params.toString()}`
    );
}